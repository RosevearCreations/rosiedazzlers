# Original Windows guided discovery. Read-only: no task/service changes, no log enablement, no network probes.
param()
$ErrorActionPreference='Stop'
$prior=Join-Path $PSScriptRoot 'build926-windows-runtime.ps1'
$original=(& $prior -Mode Inventory | Out-String | ConvertFrom-Json)
$pattern='Rosevear|Caddy|Mosquitto|MQTT|Ollama|Home.?Assistant'
$taskItems=@()
try{
 foreach($t in @(Get-ScheduledTask | Where-Object {($_.TaskPath+$_.TaskName) -match $pattern})){
  $info=$null;try{$info=Get-ScheduledTaskInfo -TaskName $t.TaskName -TaskPath $t.TaskPath}catch{}
  $taskItems+=,[ordered]@{path=$t.TaskPath+$t.TaskName;state=[string]$t.State;enabled=[bool]$t.Settings.Enabled;lastRun=if($info){$info.LastRunTime.ToString('o')}else{$null};lastResult=if($info){$info.LastTaskResult}else{$null};actionCount=@($t.Actions).Count;actionNames=@($t.Actions | ForEach-Object {if($_.Execute){[IO.Path]::GetFileName([string]$_.Execute)}})}
 }
 $taskState='READ'
}catch{$taskState='UNAVAILABLE'}
$svc=@()
try{
 $svc=@(Get-CimInstance Win32_Service | Where-Object {($_.Name+' '+$_.DisplayName) -match $pattern} | ForEach-Object {[ordered]@{name=$_.Name;state=$_.State;startMode=$_.StartMode;pid=$_.ProcessId}})
 $svcState='READ'
}catch{$svcState='UNAVAILABLE'}
$events=@();$logState='UNKNOWN'
try{
 $log=Get-WinEvent -ListLog 'Microsoft-Windows-TaskScheduler/Operational'
 if(-not $log.IsEnabled){$logState='DISABLED_NOT_CHANGED'}
 else{
  $logState='ENABLED'
  try{
   $records=Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-TaskScheduler/Operational';Id=@(100,102,129,200,201);StartTime=(Get-Date).AddDays(-14)} -MaxEvents 1500 -ErrorAction Stop
   foreach($e in $records){
    $xml=[xml]$e.ToXml();$data=@{}
    foreach($d in $xml.Event.EventData.Data){if($d.Name){$data[[string]$d.Name]=[string]$d.'#text'}}
    $name=[string]$data['TaskName']
    if($name -and $name -match $pattern){
     $idValue=0;$value=[string]$data['ProcessID'];if(-not $value){$value=[string]$data['ProcessId']}
     [void][int]::TryParse($value,[ref]$idValue)
     $events+=,[ordered]@{task=$name;eventId=$e.Id;recordId=$e.RecordId;time=$e.TimeCreated.ToString('o');processId=$idValue}
     if($events.Count -ge 60){break}
    }
   }
  }catch{$logState='ENABLED_NO_MATCH_OR_QUERY_UNAVAILABLE'}
 }
}catch{$logState='UNAVAILABLE'}
$processes=@(Get-CimInstance Win32_Process)
$procMap=@{};foreach($p in $processes){$procMap[[int]$p.ProcessId]=$p}
$hints=@($processes|Where-Object {$_.Name -match '^(mosquitto|emqx|docker|com\.docker\.backend|wsl|wslhost|vmwp|vmcompute|VirtualBoxVM|VBoxHeadless|vmmem|vmmemWSL)\.exe$'} | Select-Object -First 40 | ForEach-Object {[ordered]@{name=$_.Name;pid=$_.ProcessId}})
$listenerState='READ';$extra=@()
try{
 $all=@(Get-NetTCPConnection -State Listen)
 foreach($g in @($all|Where-Object {$_.LocalPort -in @(8883,9001) -or ($procMap.ContainsKey([int]$_.OwningProcess) -and $procMap[[int]$_.OwningProcess].Name -match '^(mosquitto|emqx)\.exe$')}|Group-Object LocalPort,OwningProcess)){
  $l=$g.Group[0];if(@($original.listeners|Where-Object {$_.port -eq $l.LocalPort -and $_.pid -eq $l.OwningProcess}).Count -eq 0){
   $p=$procMap[[int]$l.OwningProcess]
   $chain=@();if($p){$chain+=,[ordered]@{name=$p.Name;pid=$p.ProcessId;parentPid=$p.ParentProcessId}}
   $extra+=,[ordered]@{port=$l.LocalPort;pid=$l.OwningProcess;processChain=$chain;candidates=@()}
  }
 }
}catch{$listenerState='PARTIAL_OR_UNAVAILABLE'}
[ordered]@{mode='GUIDED_READ_ONLY_INVENTORY_NOT_CERTIFICATION';windowsHostName=$original.windowsHostName;bootTimeMs=$original.bootTimeMs;listeners=@($original.listeners)+@($extra);runningTasks=@($original.runningTasks);registeredTaskState=$taskState;registeredTasks=$taskItems;serviceInventoryState=$svcState;registeredServices=$svc;taskHistoryState=$logState;taskHistory=$events;mqttDiscoveryState=$listenerState;virtualizationOrBrokerHints=$hints;note='Task history and process hints are diagnostic only; detached processes are not certified. No broker absence outside Windows is inferred.'}|ConvertTo-Json -Depth 10
