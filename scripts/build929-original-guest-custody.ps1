# Build 929: local read-only evidence, no secrets, no service/task/VM changes.
[CmdletBinding()]
param([string]$HubRoot=(Join-Path $env:USERPROFILE 'rosevearaihub'),[switch]$ProbeGuest,[string]$GuestIPv4)
$ErrorActionPreference='Stop'
if([Environment]::MachineName -ine 'DESKTOP-AE894KC'){throw 'ORIGINAL_HOST_REQUIRED'}
function PrivateIP([string]$v){
 $ip=$null
 if($v -notmatch '^\d{1,3}(\.\d{1,3}){3}$' -or -not [Net.IPAddress]::TryParse($v,[ref]$ip) -or $ip.AddressFamily -ne [Net.Sockets.AddressFamily]::InterNetwork){return $null}
 $b=$ip.GetAddressBytes()
 if($b[0] -eq 10 -or ($b[0] -eq 172 -and $b[1] -ge 16 -and $b[1] -le 31) -or ($b[0] -eq 192 -and $b[1] -eq 168)){return $ip}
 return $null
}
function TcpState($ip,[int]$port){
 $c=New-Object Net.Sockets.TcpClient
 try{$a=$c.BeginConnect($ip,$port,$null,$null);if(-not $a.AsyncWaitHandle.WaitOne(2000)){return 'UNREACHABLE'};$c.EndConnect($a);return 'REACHABLE'}catch{return 'UNREACHABLE'}finally{$c.Dispose()}
}
function FileHash([string]$p){try{if(Test-Path -LiteralPath $p -PathType Leaf){$f=Get-Item -LiteralPath $p;if(-not ($f.Attributes -band [IO.FileAttributes]::ReparsePoint)){return (Get-FileHash -LiteralPath $p -Algorithm SHA256).Hash.ToLowerInvariant()}}}catch{};return $null}
$prior=(& (Join-Path $PSScriptRoot 'build928-original-correlation.ps1') | Out-String | ConvertFrom-Json)
$root= (Get-Item -LiteralPath $HubRoot -ErrorAction Stop).FullName
$launchers=@()
$known=@('Rosevear AI Hub Unattended Boot','Rosevear AI Hub Unattended Recovery','Rosevear AI Hub Recovery','Rosevear AI Hub Startup','Rosevear AI Hub LAN Gateway')
$allow=@('boot-hub-unattended356.ps1','hub-recovery.ps1','start-hub-lan-gateway.ps1')
foreach($n in $known){
 $x=[ordered]@{task=$n;state='UNAVAILABLE';launcher=$null;scriptSha256=$null;definitionSha256=$null;actionMatchesHubRoot=$false;passwordLogon=$false;lastResult=$null;lastRun=$null}
 try{
  $t=Get-ScheduledTask -TaskPath '\' -TaskName $n
  $inf=Get-ScheduledTaskInfo -TaskPath '\' -TaskName $n
  $x.state=[string]$t.State;$x.lastResult=[long]$inf.LastTaskResult;$x.lastRun=$inf.LastRunTime.ToString('o')
  $x.passwordLogon=([string]$t.Principal.LogonType -eq 'Password')
  $p=@($prior.registeredTasks | Where-Object {$_.path -eq ('\'+$n)})
  if($p.Count -eq 1){$x.definitionSha256=$p[0].definitionSha256}
  if(@($t.Actions).Count -eq 1){
   $act=$t.Actions[0];$arg=[string]$act.Arguments
   if([IO.Path]::GetFileName([string]$act.Execute) -ieq 'powershell.exe' -and $arg -match '(?i)(?:^|\s)-File\s+(?:"([^"]+)"|([^\s]+))'){
    $candidate=if($Matches[1]){$Matches[1]}else{$Matches[2]}
    $leaf=[IO.Path]::GetFileName($candidate)
    if($leaf -in $allow -and [IO.Path]::IsPathRooted($candidate)){
     $expected=Join-Path (Join-Path $root 'scripts') $leaf
     $x.launcher=$leaf
     $x.actionMatchesHubRoot=([IO.Path]::GetFullPath($candidate) -ieq $expected)
     if($x.actionMatchesHubRoot){$x.scriptSha256=FileHash $expected}
    }
   }
  }
 }catch{}
 $launchers+=,[pscustomobject]$x
}
$boot=@($launchers | Where-Object {$_.task -eq 'Rosevear AI Hub Unattended Boot'})[0]
$log=[ordered]@{state='NO_MATCHING_BOOT_LOG';reasonCodes=@();matchedPassCount=0}
try{
 $path=Join-Path $root 'logs\hub-unattended-boot356.log'
 $f=Get-Item -LiteralPath $path
 if($f.Length -le 8388608 -and -not ($f.Attributes -band [IO.FileAttributes]::ReparsePoint) -and $boot.lastRun){
  $when=[datetimeoffset]::Parse($boot.lastRun)
  $codes=@('VM_LAUNCH_HOLD','OLLAMA_PORT_OWNERSHIP_HOLD','OLLAMA_START_HOLD','HUB_RECOVERY_HOLD','GATEWAY_HOLD')
  $passes=@()
  foreach($line in (Get-Content -LiteralPath $path)){
   if($line -match '^(\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d) Boot pass completed with bounded holds: ([A-Z_,]+)$'){
    $stamp=[datetimeoffset]::Parse($Matches[1]);$list=@($Matches[2].Split(','))
    if($stamp -ge $when -and $stamp -le $when.AddMinutes(3) -and @($list|Where-Object {$_ -cnotin $codes}).Count -eq 0){$passes+=,([pscustomobject]@{codes=$list})}
   }
  }
  $log.matchedPassCount=$passes.Count
  if($passes.Count -eq 1){$log.state='TIME_ALIGNED_LOG_ONLY';$log.reasonCodes=@($passes[0].codes)}
  elseif($passes.Count -gt 1){$log.state='AMBIGUOUS_BOOT_LOG'}
 }else{$log.state='LOG_UNAVAILABLE_OR_UNBOUNDED'}
}catch{$log.state='LOG_UNAVAILABLE_OR_UNBOUNDED'}
$guest=[ordered]@{vmRunning=($prior.broker.vmState -eq 'RUNNING');guestPropertyState='UNAVAILABLE';addressSource='NONE';mqttTcp='NOT_REQUESTED';haTcp='NOT_REQUESTED'}
$vbox=Join-Path ([Environment]::GetFolderPath('ProgramFiles')) 'Oracle\VirtualBox\VBoxManage.exe'
$propertyIP=$null
if($guest.vmRunning -and (Test-Path -LiteralPath $vbox -PathType Leaf)){
 try{
  $raw=@(& $vbox guestproperty get 'Home Assistant' '/VirtualBox/GuestInfo/Net/0/V4/IP' 2>$null)
  if($LASTEXITCODE -eq 0 -and $raw.Count -eq 1 -and $raw[0] -match '^Value: ([0-9.]+)$'){$propertyIP=PrivateIP $Matches[1]}
  if($propertyIP){$guest.guestPropertyState='PRIVATE_IPV4_REPORTED'}else{$guest.guestPropertyState='NO_PRIVATE_GUEST_PROPERTY'}
 }catch{}
}
$target=$null
if($GuestIPv4){
 $explicit=PrivateIP $GuestIPv4
 if(-not $explicit){throw 'PRIVATE_GUEST_IPV4_REQUIRED'}
 if($propertyIP -and -not $propertyIP.Equals($explicit)){throw 'GUEST_ADDRESS_CONFLICT'}
 $target=$explicit;$guest.addressSource=if($propertyIP){'OWNER_AND_VM_PROPERTY_AGREE'}else{'OWNER_REPORTED_GUEST_ADDRESS'}
}elseif($propertyIP){$target=$propertyIP;$guest.addressSource='VM_PROPERTY_ONLY'}
if($ProbeGuest){
 if($target -and $guest.vmRunning -and $GuestIPv4){$guest.mqttTcp=TcpState $target 1883;$guest.haTcp=TcpState $target 80}
 else{$guest.mqttTcp='OWNER_GUEST_ADDRESS_REQUIRED';$guest.haTcp='OWNER_GUEST_ADDRESS_REQUIRED'}
}
[ordered]@{mode='ORIGINAL_GUEST_LAUNCHER_DIAGNOSTIC_NOT_CERTIFICATION';observedAtMs=[DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds();bootTimeMs=$prior.bootTimeMs;taskHistoryState=$prior.taskHistoryState;launchers=$launchers;bootLog=$log;listeners=@($prior.listeners | Where-Object {$_.port -in @(8765,8443,11434,5173)} | ForEach-Object {[ordered]@{port=$_.port;pid=$_.pid;processChain=@($_.processChain)}});guest=$guest;authentication='USE_EXISTING_HUB_MQTT_STATUS';fieldCertified=$false;authorizesAction=$false}|ConvertTo-Json -Depth 9
