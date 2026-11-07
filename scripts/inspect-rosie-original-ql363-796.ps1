# Build 796: READ-ONLY QL-363 + QL-362 original Windows status inspection.
# No signer import, source GET, database mutation, listener start or grant.
[CmdletBinding()]
param([Parameter(Mandatory=$true)][string]$CommsCheckout)
$ErrorActionPreference='Stop'
$pin='badda29755bf6a287257e778cd178de221eae237'
$ree=$env:OS -eq 'Windows_NT' -and $env:COMPUTERNAME -ieq 'DESKTOP-AE894KC' -and $env:USERNAME -ieq 'Ree'
$jack=$env:OS -eq 'Windows_NT' -and $env:COMPUTERNAME -ieq 'TEMPLAR' -and $env:USERNAME -ieq 'jfros'
$out=[ordered]@{
  schema='rosie.comms.ql796.original-ql363-windows-preflight.v1'
  state='HOLD_ORIGINAL_QL362_SIGNATURES_AND_SOURCE_SIGNED_GET_REQUIRED'
  originalReeHost=[bool]$ree
  independentJackHost=[bool]$jack
  pinnedQl363SourceVerified=$false
  originalQl362StatusRead=$false
  ownerSignaturesVerified=$false
  originalSignedReceiptVerified=$false
  independentlyRetainedReceiptVerified=$false
  connected=$false
  connectedCount=0
  connectionState='DISCONNECTED / HOLD'
  sourceTestAuthorized=$false
  customerDataAllowed=$false
  deviceActions=$false
  sourceRepositoryWrites=0
}
function Emit([string]$state){$out.state=$state;$out|ConvertTo-Json -Compress -Depth 4}
if(-not $ree -and -not $jack){Emit 'DENY_NOT_REE_OR_JACK_ORIGINAL_WINDOWS_ACCOUNT';exit 0}
try{
  $root=(Resolve-Path -LiteralPath $CommsCheckout).Path
  $head=@(& git -C $root rev-parse HEAD 2>$null)
  if($LASTEXITCODE -ne 0 -or $head.Count -ne 1 -or $head[0] -cne $pin){
    Emit 'HOLD_PINNED_ORIGINAL_COMMS_QL363_NOT_INSTALLED';exit 0
  }
  $files=@('runtimes/hub-relay/ql362-windows-source-owner-handoff.ps1',
    'runtimes/hub-relay/ql362-source-owner-first-get.mjs',
    'runtimes/hub-relay/ql363-six-source-health-adapters.mjs')
  $changed=@(& git -C $root status --porcelain -- $files 2>$null |
    Where-Object {-not [string]::IsNullOrWhiteSpace($_)})
  if($LASTEXITCODE -ne 0 -or $changed.Count -ne 0){
    Emit 'HOLD_PINNED_QL363_OR_QL362_SOURCE_FILES_MODIFIED';exit 0
  }
  foreach($file in $files){
    if(-not (Test-Path -LiteralPath (Join-Path $root $file) -PathType Leaf)){
      Emit 'HOLD_QL362_QL363_ORIGINAL_DEPENDENCY_MISSING';exit 0
    }
  }
  $out.pinnedQl363SourceVerified=$true
  $script=Join-Path $root 'runtimes/hub-relay/ql362-windows-source-owner-handoff.ps1'
  $lines=@(& powershell.exe -NoProfile -ExecutionPolicy RemoteSigned -File $script -Status 2>$null)
  if($LASTEXITCODE -ne 0 -or $lines.Count -ne 1){
    Emit 'HOLD_ORIGINAL_QL362_PRIVATE_OPERATOR_UNAVAILABLE';exit 0
  }
  # Do not echo private status, owner identifiers or hashes into the UI/log.
  $status=$lines[0] | ConvertFrom-Json
  if($status.schema -cne 'rosevear.hub.ql362.windows-source-only-handoff.v1' -or
    $status.originalReeHost -ne [bool]$ree -or
    $status.independentJackHost -ne [bool]$jack -or
    $status.connected -ne $false -or
    $status.connectionState -cne 'DISCONNECTED / HOLD' -or
    $status.singleUseGetApproved -ne $false -or
    $status.sourceOwnerSignedPermissionVerified -ne $false -or
    $status.masterOwnerSignedPermissionVerified -ne $false){
    Emit 'DENY_QL362_STATUS_UNEXPECTED_OR_UNPROVEN';exit 0
  }
  $out.originalQl362StatusRead=$true
  Emit 'ORIGINAL_QL363_PIN_READ_ONLY_QL362_STATUS_HELD_NO_SIGNED_GET'
}catch{Emit 'HOLD_PRIVATE_ORIGINAL_WINDOWS_READBACK_NOT_AVAILABLE'}
