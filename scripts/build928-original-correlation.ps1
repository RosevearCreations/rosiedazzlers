# Build 928 — original host diagnostic only; no task/VM/service changes, no secret reads.
# Only the documented Home Assistant hostname may be resolved/probed, and only on private IPv4.
param([switch]$ProbeOriginalMqtt)
$ErrorActionPreference='Stop'
$prior=Join-Path $PSScriptRoot 'build927-windows-guided-inventory.ps1'
$i=(& $prior | Out-String | ConvertFrom-Json)
$now=[DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
function HashText([string]$s){$h=[Security.Cryptography.SHA256]::Create();try{return ([BitConverter]::ToString($h.ComputeHash([Text.Encoding]::UTF8.GetBytes($s)))).Replace('-','').ToLowerInvariant()}finally{$h.Dispose()}}
$tasks=@()
foreach($t in @($i.registeredTasks)){
 $name=[string]$t.path;$j=$name.LastIndexOf('\');$folder=$name.Substring(0,$j+1);$leaf=$name.Substring($j+1)
 $definition=$null;$launcher=$null
 try{
  $task=Get-ScheduledTask -TaskPath $folder -TaskName $leaf
  $definition=HashText (Export-ScheduledTask -TaskPath $folder -TaskName $leaf)
  if(@($task.Actions).Count -eq 1){
   $arg=[string]$task.Actions[0].Arguments
   # Recognize only an allowlisted script basename; never emit raw arguments or paths.
   if($arg -match '(?i)(?:^|\s)-File\s+(?:"([^"]+)"|([^\s]+))'){
    $p=if($Matches[1]){$Matches[1]}else{$Matches[2]}
    $n=[IO.Path]::GetFileName($p)
    if($n -match '^(hub-recovery|start-hub|start-hub-lan|start-rosevear|restart-hub|start-caddy|hub-unattended)[a-z0-9_-]*\.ps1$'){$launcher=$n}
   }
  }
 }catch{}
 $tasks+=,[ordered]@{path=$name;state=$t.state;enabled=$t.enabled;lastRun=$t.lastRun;lastResult=$t.lastResult;launcher=$launcher;definitionSha256=$definition}
}
$procs=@{};Get-CimInstance Win32_Process | ForEach-Object {$procs[[int]$_.ProcessId]=$_}
$listeners=@()
foreach($l in @($i.listeners)){
 $chain=@()
 foreach($p in @($l.processChain)){
  $created=$null;$proc=$procs[[int]$p.pid]
  if($proc -and $proc.Name -eq $p.name -and $proc.ParentProcessId -eq $p.parentPid){try{$created=([DateTimeOffset]$proc.CreationDate).ToUnixTimeMilliseconds()}catch{}}
  $chain+=,[ordered]@{name=$p.name;pid=$p.pid;parentPid=$p.parentPid;createdAtMs=$created}
 }
 $listeners+=,[ordered]@{port=$l.port;pid=$l.pid;processChain=$chain;candidates=@($l.candidates)}
}
$broker=[ordered]@{vmName='Home Assistant';vmState='UNKNOWN';target='homeassistant.local';privateResolution=$false;mqttTcp='NOT_REQUESTED';homeAssistantTcp='NOT_REQUESTED';scope='DIAGNOSTIC_TCP_ONLY'}
# Use the installed standard VirtualBox executable, not a path supplied by inventory or web.
$vbox=Join-Path ([Environment]::GetFolderPath('ProgramFiles')) 'Oracle\VirtualBox\VBoxManage.exe'
if(Test-Path -LiteralPath $vbox -PathType Leaf){
 try{
  $vm=@(& $vbox 'showvminfo' 'Home Assistant' '--machinereadable' 2>$null)
  if($LASTEXITCODE -eq 0){
   if(@($vm|Where-Object {$_ -eq 'VMState="running"'}).Count -eq 1){$broker.vmState='RUNNING'}else{$broker.vmState='NOT_RUNNING_OR_UNKNOWN'}
  }else{$broker.vmState='NOT_FOUND_OR_UNAVAILABLE'}
 }catch{$broker.vmState='NOT_FOUND_OR_UNAVAILABLE'}
}
function IsPrivateIPv4($ip){
 if($ip.AddressFamily -ne [Net.Sockets.AddressFamily]::InterNetwork){return $false}
 $b=$ip.GetAddressBytes()
 return ($b[0] -eq 10 -or ($b[0] -eq 172 -and $b[1] -ge 16 -and $b[1] -le 31) -or ($b[0] -eq 192 -and $b[1] -eq 168))
}
function TestFixedTcp($ip,[int]$port){
 $client=New-Object Net.Sockets.TcpClient
 try{$async=$client.BeginConnect($ip,$port,$null,$null);if(-not $async.AsyncWaitHandle.WaitOne(2500)){return 'UNREACHABLE'};$client.EndConnect($async);return 'REACHABLE'}catch{return 'UNREACHABLE'}finally{$client.Close()}
}
if($ProbeOriginalMqtt){
 $broker.mqttTcp='PRIVATE_TARGET_UNVERIFIED';$broker.homeAssistantTcp='PRIVATE_TARGET_UNVERIFIED'
 try{
  $lookup=[Net.Dns]::BeginGetHostAddresses('homeassistant.local',$null,$null)
  if($lookup.AsyncWaitHandle.WaitOne(2500)){
   $addresses=@([Net.Dns]::EndGetHostAddresses($lookup)|Where-Object {$_.AddressFamily -eq [Net.Sockets.AddressFamily]::InterNetwork})
   # Refuse ambiguous or public IPv4. Connect to the validated IP, never re-resolve.
   if($addresses.Count -eq 1 -and (IsPrivateIPv4 $addresses[0])){
    $broker.privateResolution=$true
    $broker.mqttTcp=TestFixedTcp $addresses[0] 1883
    $broker.homeAssistantTcp=TestFixedTcp $addresses[0] 80
   }
  }
 }catch{}
}
[ordered]@{mode='ORIGINAL_READ_ONLY_CORRELATION_NOT_CERTIFICATION';observedAtMs=$now;bootTimeMs=$i.bootTimeMs;registeredTasks=$tasks;listeners=$listeners;taskHistoryState=$i.taskHistoryState;taskHistory=@($i.taskHistory);broker=$broker;note='No log enablement, VM changes, MQTT authentication or publish. Historical matches are diagnostic only.'}|ConvertTo-Json -Depth 12
