# Read-only original host observation. No credential reads, task/service changes or restart.
[CmdletBinding()]
param([string]$HubRoot=(Join-Path $env:USERPROFILE 'rosevearaihub'))
$ErrorActionPreference='Stop'
if([Environment]::MachineName -ine 'DESKTOP-AE894KC'){throw 'ORIGINAL_HOST_REQUIRED'}
function HashText([string]$s){$h=[Security.Cryptography.SHA256]::Create();try{return ([BitConverter]::ToString($h.ComputeHash([Text.Encoding]::UTF8.GetBytes($s)))).Replace('-','').ToLowerInvariant()}finally{$h.Dispose()}}
function FileHash([string]$p){try{$f=Get-Item -LiteralPath $p;if(-not $f.PSIsContainer -and -not ($f.Attributes -band [IO.FileAttributes]::ReparsePoint)){return (Get-FileHash -LiteralPath $p -Algorithm SHA256).Hash.ToLowerInvariant()}}catch{};return $null}
$raw=& (Join-Path $PSScriptRoot 'build929-original-guest-custody.ps1') -HubRoot $HubRoot | Out-String
$i=$raw|ConvertFrom-Json
$guest=[ordered]@{vmRunning=$i.guest.vmRunning;guestIdentitySha256=$null;guestPropertyState=$i.guest.guestPropertyState;mqttAuthentication='REQUIRES_ORIGINAL_GUEST_WITNESS'}
$vbox=Join-Path ([Environment]::GetFolderPath('ProgramFiles')) 'Oracle\VirtualBox\VBoxManage.exe'
try{
 if(Test-Path -LiteralPath $vbox -PathType Leaf){
  $vm=@(& $vbox showvminfo 'Home Assistant' --machinereadable 2>$null)
  if($LASTEXITCODE -eq 0){
   $u=@($vm|Where-Object {$_ -match '^UUID="[0-9a-fA-F-]{36}"$'})
   if($u.Count -eq 1 -and $u[0] -match '^UUID="([0-9a-fA-F-]{36})"$'){
    $guest.guestIdentitySha256=HashText ('virtualbox-uuid-v1:'+ $Matches[1].ToLowerInvariant())
   }
  }
 }
}catch{}
$rows=@()
foreach($spec in @(@{id='hub';port=8765;name='python.exe'},@{id='caddy';port=8443;name='caddy.exe'},@{id='ollama';port=11434;name='ollama.exe'})){
 $row=[ordered]@{component=$spec.id;port=$spec.port;pid=$null;startedAtMs=$null;binarySha256=$null;stableListener=$false;launchReceiptState='ORIGINAL_RETAINED_RECEIPT_REQUIRED'}
 try{
  $ids=@(Get-NetTCPConnection -State Listen -LocalPort $spec.port | Select-Object -ExpandProperty OwningProcess -Unique)
  if($ids.Count -eq 1){
   $proc=Get-CimInstance Win32_Process -Filter ('ProcessId='+[int]$ids[0])
   if($proc.Name -ieq $spec.name -and $proc.ExecutablePath){
    $stamp=([DateTimeOffset]$proc.CreationDate).ToUnixTimeMilliseconds()
    $hash=FileHash $proc.ExecutablePath
    $again=Get-CimInstance Win32_Process -Filter ('ProcessId='+[int]$ids[0])
    $after=@(Get-NetTCPConnection -State Listen -LocalPort $spec.port | Select-Object -ExpandProperty OwningProcess -Unique)
    if($after.Count -eq 1 -and $after[0] -eq $ids[0] -and $again.Name -eq $proc.Name -and $again.ExecutablePath -eq $proc.ExecutablePath -and $again.CreationDate -eq $proc.CreationDate -and $hash){
     $row.pid=[int]$ids[0];$row.startedAtMs=$stamp;$row.binarySha256=$hash;$row.stableListener=$true
    }
   }
  }
 }catch{}
 $rows+=,[pscustomobject]$row
}
$bootLogHash=$null
try{$f=Get-Item -LiteralPath (Join-Path $HubRoot 'logs\hub-unattended-boot356.log');if($f.Length -le 8388608){$bootLogHash=FileHash $f.FullName}}catch{}
[ordered]@{mode='ORIGINAL_931_UNSIGNED_CAPTURE';observedAtMs=[DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds();bootTimeMs=$i.bootTimeMs;guest=$guest;launchers=$rows;taskDefinitions=$i.launchers;bootLog=$i.bootLog;bootLogSha256=$bootLogHash;taskHistoryState=$i.taskHistoryState;fieldCertified=$false;authorizesAction=$false}|ConvertTo-Json -Depth 9
