# Rosie 924: local Windows SCM identity collection only. No service actions or remote connections.
# Invocation is restricted by the Node 24 owner-run launcher; keep this script read-only.
param([Parameter(Mandatory=$true)][string]$ConfigurationPath)
$ErrorActionPreference = 'Stop'
$cfg = Get-Content -LiteralPath $ConfigurationPath -Raw | ConvertFrom-Json
$keys = @('hub','caddy','mqtt','ollama')
$result = @()
foreach ($key in $keys) {
  $name = [string]$cfg.serviceNames.$key
  if ($name -notmatch '^[A-Za-z0-9_.-]{1,80}$') { throw "INVALID_ORIGINAL_SERVICE_NAME" }
  $state = 'UNKNOWN'; $pidValue = 0; $digest = $null; $auth = 'UNKNOWN'; $account = ''
  try {
    $svc = Get-CimInstance -ClassName Win32_Service -Filter "Name='$name'" -ErrorAction Stop
    if ($null -eq $svc) { $state = 'MISSING' }
    elseif ($svc.State -eq 'Running' -and [int]$svc.ProcessId -gt 0) {
      $pidValue = [int]$svc.ProcessId
      $account = [string]$svc.StartName
      $proc = Get-CimInstance -ClassName Win32_Process -Filter "ProcessId=$pidValue" -ErrorAction Stop
      if ($null -ne $proc -and -not [string]::IsNullOrWhiteSpace($proc.ExecutablePath)) {
        $binary = [string]$proc.ExecutablePath
        $digest = (Get-FileHash -LiteralPath $binary -Algorithm SHA256 -ErrorAction Stop).Hash.ToLowerInvariant()
        $signed = Get-AuthenticodeSignature -LiteralPath $binary -ErrorAction Stop
        $auth = if ($signed.Status -eq 'Valid') { 'VALID' } elseif ($signed.Status -eq 'NotSigned') { 'UNKNOWN' } else { 'INVALID' }
        $state = 'RUNNING'
      }
    }
  } catch { $state = 'UNKNOWN'; $pidValue = 0; $digest = $null; $auth = 'UNKNOWN'; $account = '' }
  if ($state -ne 'RUNNING') { $pidValue = 0; $digest = $null; $auth = 'UNKNOWN' }
  $result += [ordered]@{ service=$key; serviceName=$name; state=$state; processId=$pidValue; binarySha256=$digest; authenticode=$auth; account=$account }
}
@($result) | ConvertTo-Json -Compress -Depth 3
