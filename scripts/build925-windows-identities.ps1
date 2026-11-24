# Read-only original Windows evidence. Never launches, stops, changes or restarts tasks/services.
param([Parameter(Mandatory=$true)][string]$ConfigurationPath)
$ErrorActionPreference='Stop'
$cfg=Get-Content -LiteralPath $ConfigurationPath -Raw | ConvertFrom-Json
function SidOf([string]$name) {
 if ($name -eq 'LocalSystem' -or $name -eq 'SYSTEM') { return 'S-1-5-18' }
 if ($name -match '^S-1-[0-9-]+$') { return $name }
 return (New-Object System.Security.Principal.NTAccount($name)).Translate([System.Security.Principal.SecurityIdentifier]).Value
}
function ActualSid($process) {
 $own=Invoke-CimMethod -InputObject $process -MethodName GetOwnerSid
 if ($own.ReturnValue -ne 0 -or -not $own.Sid) { throw 'PROCESS_OWNER_UNKNOWN' }
 return [string]$own.Sid
}
$boot=(Get-CimInstance -ClassName Win32_OperatingSystem).LastBootUpTime
$bootMs=([DateTimeOffset]$boot).ToUnixTimeMilliseconds()
if ([math]::Abs($bootMs-[long]$cfg.originalBootTimeMs) -gt 2000) { throw 'ORIGINAL_BOOT_MISMATCH' }
$all=@(Get-CimInstance Win32_Process)
$results=@()
foreach ($id in @('hub','caddy','mqtt','ollama')) {
 $entry=$cfg.identities.$id
 $mode=[string]$entry.mode; $name=[string]$entry.identity
 $r=[ordered]@{component=$id;mode=$mode;identity=$name;principal='';state='UNKNOWN';processId=0;binarySha256=$null;authenticode='UNKNOWN';processCorrelation='UNKNOWN'}
 try {
  $proc=$null; $principal=''
  if ($mode -eq 'SCM') {
   if ($name -notmatch '^[A-Za-z0-9_.-]{1,80}$') { throw 'SERVICE_NAME_INVALID' }
   $svc=Get-CimInstance Win32_Service -Filter "Name='$name'"
   if ($null -eq $svc) { $r.state='MISSING'; throw 'SERVICE_MISSING' }
   if ($svc.State -ne 'Running' -or [int]$svc.ProcessId -le 0) { throw 'SERVICE_NOT_RUNNING' }
   $match=@($all | Where-Object { $_.ProcessId -eq $svc.ProcessId })
   if ($match.Count -ne 1) { throw 'SERVICE_PROCESS_UNKNOWN' }
   $proc=$match[0]; $principal=SidOf $svc.StartName
  } elseif ($mode -eq 'SCHEDULED_TASK') {
   if (-not $name.StartsWith('\') -or $name.Length -gt 260) { throw 'TASK_PATH_INVALID' }
   $index=$name.LastIndexOf('\'); $folder=$name.Substring(0,$index+1); $taskName=$name.Substring($index+1)
   if (-not $taskName) { throw 'TASK_NAME_INVALID' }
   $task=Get-ScheduledTask -TaskPath $folder -TaskName $taskName
   if ($task.State -ne 'Running' -or @($task.Actions).Count -ne 1 -or -not $task.Actions[0].Execute) { throw 'TASK_NOT_UNAMBIGUOUS' }
   $scheduler=New-Object -ComObject 'Schedule.Service'; $scheduler.Connect()
   $running=@($scheduler.GetRunningTasks(1) | Where-Object { $_.Path -eq $name })
   if ($running.Count -ne 1 -or [int]$running[0].EnginePID -le 0) { throw 'TASK_INSTANCE_UNKNOWN' }
   $exe=[Environment]::ExpandEnvironmentVariables([string]$task.Actions[0].Execute).Trim('"')
   if (-not [IO.Path]::IsPathRooted($exe)) { throw 'TASK_EXECUTABLE_NOT_ABSOLUTE' }
   $resolved=(Get-Item -LiteralPath $exe).FullName
   $engine=[int]$running[0].EnginePID
   $match=@($all | Where-Object { $_.ParentProcessId -eq $engine -and $_.ExecutablePath -and $_.ExecutablePath -eq $resolved })
   if ($match.Count -ne 1) { throw 'TASK_CHILD_PROCESS_NOT_UNIQUE' }
   $proc=$match[0]; $principal=SidOf $task.Principal.UserId
  } else { throw 'UNSUPPORTED_IDENTITY_MODE' }
  if (-not $proc.ExecutablePath -or (ActualSid $proc) -ne $principal) { throw 'PROCESS_PRINCIPAL_MISMATCH' }
  $hash=(Get-FileHash -LiteralPath $proc.ExecutablePath -Algorithm SHA256).Hash.ToLowerInvariant()
  $sig=Get-AuthenticodeSignature -LiteralPath $proc.ExecutablePath
  $current=Get-CimInstance Win32_Process -Filter "ProcessId=$($proc.ProcessId)"
  if ($null -eq $current -or $current.CreationDate -ne $proc.CreationDate -or $current.ExecutablePath -ne $proc.ExecutablePath) { throw 'PROCESS_CHANGED_DURING_INSPECTION' }
  $r.principal=$principal; $r.processId=[int]$proc.ProcessId; $r.binarySha256=$hash
  $r.authenticode=if ($sig.Status -eq 'Valid') {'VALID'} elseif ($sig.Status -eq 'NotSigned') {'UNKNOWN'} else {'INVALID'}
  $r.state='RUNNING'; $r.processCorrelation='VERIFIED'
 } catch { if ($r.state -ne 'MISSING') { $r.state='UNKNOWN' } }
 $results+=$r
}
@($results) | ConvertTo-Json -Depth 4 -Compress
