# Build 797: purely read-only original Ree/Jack status and QL-363 custody
# prerequisites. Never imports an object, touches a DB, signs or starts a GET.
[CmdletBinding()]
param([Parameter(Mandatory=$true)][string]$CommsCheckout)
$ErrorActionPreference='Stop'
$ree=$env:OS -eq 'Windows_NT' -and $env:COMPUTERNAME -ieq 'DESKTOP-AE894KC' -and $env:USERNAME -ieq 'Ree'
$jack=$env:OS -eq 'Windows_NT' -and $env:COMPUTERNAME -ieq 'TEMPLAR' -and $env:USERNAME -ieq 'jfros'
$out=[ordered]@{
  schema='rosie.comms.ql797.original-ql363-custody-windows-status.v1'
  state='HOLD_ORIGINAL_INDEPENDENT_CUSTODY_AND_OWNER_AUDIT_NOT_INSTALLED'
  originalReeHost=[bool]$ree
  independentJackHost=[bool]$jack
  ql796ReadOnlyStatusObserved=$false
  originalSignedQl363ReceiptImported=$false
  independentCustodyWitnessVerified=$false
  originalOwnersSignedSameHoldDecision=$false
  independentlyAnchoredOwnerAudit=$false
  connected=$false
  connectedCount=0
  connectionState='DISCONNECTED / HOLD'
  sourceTestAuthorized=$false
  customerCommunications=$false
  deviceActions=$false
  sourceRepositoryWrites=0
}
function Emit([string]$state){$out.state=$state;$out|ConvertTo-Json -Compress -Depth 4}
if(-not $ree -and -not $jack){Emit 'DENY_NONORIGINAL_WINDOWS_ACCOUNT';exit 0}
try{
  $base=Join-Path $PSScriptRoot 'inspect-rosie-original-ql363-796.ps1'
  if(-not (Test-Path -LiteralPath $base -PathType Leaf)){
    Emit 'HOLD_PRIOR_ORIGINAL_QL363_INSPECTOR_MISSING';exit 0
  }
  $result=@(& powershell.exe -NoProfile -ExecutionPolicy RemoteSigned -File $base `
    -CommsCheckout $CommsCheckout 2>$null)
  if($LASTEXITCODE -ne 0 -or $result.Count -ne 1){
    Emit 'HOLD_ORIGINAL_QL363_STATUS_UNAVAILABLE';exit 0
  }
  # Existing private original status is deliberately not printed or saved.
  $status=$result[0]|ConvertFrom-Json
  if($status.schema -cne 'rosie.comms.ql796.original-ql363-windows-preflight.v1' -or
    $status.originalReeHost -ne [bool]$ree -or
    $status.independentJackHost -ne [bool]$jack -or
    $status.pinnedQl363SourceVerified -ne $true -or
    $status.originalQl362StatusRead -ne $true -or
    $status.connected -ne $false -or
    $status.connectionState -cne 'DISCONNECTED / HOLD' -or
    $status.sourceTestAuthorized -ne $false){
    Emit 'HOLD_PRIOR_ORIGINAL_QL363_SOURCE_OR_STATUS_NOT_VERIFIED';exit 0
  }
  $out.ql796ReadOnlyStatusObserved=$true
  Emit 'ORIGINAL_QL363_STATUS_READ_ONLY_CUSTODY_IMPORT_NOT_AUTHORIZED'
}catch{Emit 'HOLD_ORIGINAL_QL363_DEVICE_OR_READBACK_ERROR'}
