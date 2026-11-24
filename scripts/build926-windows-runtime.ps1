# Build 926: read-only Windows inspection. No startup, stop, restart, task registration or network calls.
param([ValidateSet('Inventory','Attest')][string]$Mode='Inventory',[string]$ConfigurationPath)
$ErrorActionPreference='Stop'
function HashText([string]$value) {
 $sha=[Security.Cryptography.SHA256]::Create()
 try { return ([BitConverter]::ToString($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($value)))).Replace('-','').ToLowerInvariant() } finally {$sha.Dispose()}
}
function SidOf([string]$name) {
 if($name -in @('LocalSystem','SYSTEM','NT AUTHORITY\SYSTEM')) {return 'S-1-5-18'}
 if($name -match '^S-1-[0-9-]+$'){return $name}
 return (New-Object System.Security.Principal.NTAccount($name)).Translate([System.Security.Principal.SecurityIdentifier]).Value
}
function OwnerSid($p) {
 $r=Invoke-CimMethod -InputObject $p -MethodName GetOwnerSid
 if($r.ReturnValue -ne 0 -or -not $r.Sid){throw 'OWNER_SID_UNKNOWN'}
 return [string]$r.Sid
}
$bootMs=([DateTimeOffset](Get-CimInstance Win32_OperatingSystem).LastBootUpTime).ToUnixTimeMilliseconds()
$procs=@{}; Get-CimInstance Win32_Process | ForEach-Object {$procs[[int]$_.ProcessId]=$_}
$listeners=@(Get-NetTCPConnection -State Listen)
$services=@(Get-CimInstance Win32_Service | Where-Object {$_.State -eq 'Running' -and $_.ProcessId -gt 0})
$scheduler=New-Object -ComObject 'Schedule.Service'; $scheduler.Connect()
$running=@($scheduler.GetRunningTasks(1) | ForEach-Object { [pscustomobject]@{Path=[string]$_.Path;EnginePID=[int]$_.EnginePID;InstanceGuid=[string]$_.InstanceGuid} })
function Chain([int]$start) {
 $chain=@();$seen=@{};$n=$start
 for($i=0;$i -lt 10 -and $n -gt 0;$i++){
  if($seen.ContainsKey($n)-or -not $procs.ContainsKey($n)){break}
  $seen[$n]=$true;$p=$procs[$n];$chain+=,$p
  $n=[int]$p.ParentProcessId
 }
 return $chain
}
function Describe($p) {
 if(-not $p.ExecutablePath -or -not $p.CommandLine){throw 'RUNTIME_METADATA_UNKNOWN'}
 return [ordered]@{principalSid=(OwnerSid $p);runtimeSha256=(Get-FileHash -LiteralPath $p.ExecutablePath -Algorithm SHA256).Hash.ToLowerInvariant();commandSha256=(HashText $p.CommandLine)}
}
function TaskInfo([string]$name) {
 if(-not $name.StartsWith('\') -or $name.Length -gt 260){throw 'TASK_PATH_INVALID'}
 $i=$name.LastIndexOf('\');$folder=$name.Substring(0,$i+1);$leaf=$name.Substring($i+1)
 $t=Get-ScheduledTask -TaskPath $folder -TaskName $leaf
 if($t.State -ne 'Running' -or @($t.Actions).Count -ne 1 -or -not $t.Actions[0].Execute){throw 'TASK_NOT_SINGLE_RUNNING_ACTION'}
 $instances=@($running | Where-Object {$_.Path -eq $name})
 if($instances.Count -ne 1 -or $instances[0].EnginePID -le 0){throw 'TASK_INSTANCE_AMBIGUOUS'}
 $engine=$instances[0].EnginePID
 if(@($running | Where-Object {$_.EnginePID -eq $engine}).Count -ne 1){throw 'SHARED_TASK_ENGINE'}
 $exe=[Environment]::ExpandEnvironmentVariables([string]$t.Actions[0].Execute).Trim('"')
 if(-not [IO.Path]::IsPathRooted($exe)){throw 'TASK_ACTION_PATH_NOT_ABSOLUTE'}
 $exe=(Get-Item -LiteralPath $exe).FullName
 $xml=Export-ScheduledTask -TaskPath $folder -TaskName $leaf
 return @{engine=$engine;instance=$instances[0].InstanceGuid;exe=$exe;principal=(SidOf $t.Principal.UserId);definition=(HashText $xml);folder=$folder;leaf=$leaf}
}
function Observe([string]$component,$entry) {
 $identity=[string]$entry.identity;$mode=[string]$entry.mode;$port=[int]$entry.port
 $o=[ordered]@{component=$component;mode=$mode;identity=$identity;principalSid='';definitionSha256=$null;runtimeSha256=$null;commandSha256=$null;port=$port;runtimePid=0;lineage='UNKNOWN';listener='UNKNOWN';stable=$false;state='UNKNOWN'}
 try {
  $pids=@($listeners | Where-Object {$_.LocalPort -eq $port} | Select-Object -ExpandProperty OwningProcess -Unique)
  if($pids.Count -ne 1 -or -not $procs.ContainsKey([int]$pids[0])){throw 'LISTENER_AMBIGUOUS'}
  $p=$procs[[int]$pids[0]];$line=@(Chain $p.ProcessId);$rootIndex=-1;$definition='';$principal=''
  if($mode -eq 'SCM'){
   if($identity -notmatch '^[A-Za-z0-9_.-]{1,80}$'){throw 'SCM_NAME_INVALID'}
   $s=@($services | Where-Object {$_.Name -eq $identity})
   if($s.Count -ne 1){throw 'SCM_NOT_RUNNING'}
   for($j=0;$j -lt $line.Count;$j++){if($line[$j].ProcessId -eq $s[0].ProcessId){$rootIndex=$j;break}}
   $principal=SidOf $s[0].StartName;$definition=HashText ($s[0].Name+"|"+$s[0].StartName+"|"+$s[0].PathName)
  }elseif($mode -eq 'SCHEDULED_TASK'){
   $t=TaskInfo $identity
   for($j=0;$j -lt $line.Count;$j++){if($line[$j].ParentProcessId -eq $t.engine -and $line[$j].ExecutablePath -eq $t.exe){$rootIndex=$j;break}}
   $principal=$t.principal;$definition=$t.definition
  }else{throw 'MODE_INVALID'}
  if($rootIndex -lt 0){throw 'NO_ROOT_LINEAGE'}
  for($j=0;$j -le $rootIndex;$j++){
   $q=$line[$j];if((OwnerSid $q) -ne $principal){throw 'PRINCIPAL_MISMATCH'}
   if($j -lt $rootIndex -and ($q.CreationDate -lt $line[$j+1].CreationDate -or $q.ParentProcessId -ne $line[$j+1].ProcessId)){throw 'PID_REUSE_OR_PARENT_MISMATCH'}
   $current=Get-CimInstance Win32_Process -Filter "ProcessId=$($q.ProcessId)"
   if(-not $current -or $current.CreationDate -ne $q.CreationDate -or $current.ParentProcessId -ne $q.ParentProcessId -or $current.CommandLine -ne $q.CommandLine){throw 'PROCESS_CHANGED'}
  }
  if($mode -eq 'SCHEDULED_TASK'){
   $again=@($scheduler.GetRunningTasks(1) | Where-Object {$_.Path -eq $identity})
   if($again.Count -ne 1 -or [int]$again[0].EnginePID -ne $t.engine -or [string]$again[0].InstanceGuid -ne $t.instance){throw 'TASK_CHANGED'}
   $engineProc=$procs[$t.engine];$engineNow=Get-CimInstance Win32_Process -Filter "ProcessId=$($t.engine)"
   if(-not $engineProc -or -not $engineNow -or $engineNow.CreationDate -ne $engineProc.CreationDate -or $line[$rootIndex].CreationDate -lt $engineProc.CreationDate){throw 'ENGINE_PID_REUSED'}
   if((HashText (Export-ScheduledTask -TaskPath $t.folder -TaskName $t.leaf)) -ne $definition){throw 'TASK_DEFINITION_CHANGED'}
  }else{
   $again=Get-CimInstance Win32_Service -Filter "Name='$identity'"
   if(-not $again -or $again.State -ne 'Running' -or $again.ProcessId -ne $s[0].ProcessId -or (HashText ($again.Name+"|"+$again.StartName+"|"+$again.PathName)) -ne $definition){throw 'SERVICE_CHANGED'}
  }
  $d=Describe $p
  $verify=@(Get-NetTCPConnection -State Listen -LocalPort $port | Select-Object -ExpandProperty OwningProcess -Unique)
  if($verify.Count -ne 1 -or $verify[0] -ne $p.ProcessId){throw 'LISTENER_CHANGED'}
  $o.principalSid=$d.principalSid;$o.definitionSha256=$definition;$o.runtimeSha256=$d.runtimeSha256;$o.commandSha256=$d.commandSha256;$o.runtimePid=[int]$p.ProcessId
  $o.lineage='VERIFIED';$o.listener='OWNED';$o.stable=$true;$o.state='RUNNING'
 }catch{}
 return $o
}
if($Mode -eq 'Attest'){
 if(-not $ConfigurationPath){throw 'PRIVATE_CONFIG_REQUIRED'}
 $cfg=Get-Content -LiteralPath $ConfigurationPath -Raw | ConvertFrom-Json
 if([math]::Abs($bootMs-[long]$cfg.originalBootTimeMs) -gt 2000){throw 'ORIGINAL_BOOT_MISMATCH'}
 $results=@();foreach($component in @('hub','caddy','mqtt','ollama')){$results+=,(Observe $component $cfg.identities.$component)}
 @($results)|ConvertTo-Json -Depth 5 -Compress
}else{
 $ports=@(8765,8443,1883,11434,5173)
 $out=@()
 foreach($port in $ports){
  $ids=@($listeners|Where-Object {$_.LocalPort -eq $port}|Select-Object -ExpandProperty OwningProcess -Unique)
  foreach($pidValue in $ids){
   $line=@(Chain $pidValue);$names=@($line | ForEach-Object {[ordered]@{name=$_.Name;pid=$_.ProcessId;parentPid=$_.ParentProcessId}})
   $candidates=@()
   foreach($s in $services){if($line.ProcessId -contains $s.ProcessId){$candidates+=,(Observe 'inventory' @{mode='SCM';identity=$s.Name;port=$port})}}
   foreach($t in $running){if($line.ParentProcessId -contains $t.EnginePID){$candidates+=,(Observe 'inventory' @{mode='SCHEDULED_TASK';identity=$t.Path;port=$port})}}
   $out+=,[ordered]@{port=$port;pid=$pidValue;processChain=$names;candidates=$candidates}
  }
 }
 [ordered]@{mode='READ_ONLY_INVENTORY_NOT_CERTIFICATION';windowsHostName=$env:COMPUTERNAME;bootTimeMs=$bootMs;listeners=$out;runningTasks=@($running | Where-Object {$_.Path -match 'Rosevear|Caddy|Mosquitto|Ollama'} | Select-Object Path,EnginePID)}|ConvertTo-Json -Depth 8
}
