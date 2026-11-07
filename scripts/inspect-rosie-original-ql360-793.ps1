# Rosie Build 793: original Comms QL-360 read-only on-device evidence check.
# Never reads signing keys, accepts an uploaded grant, creates an archive,
# starts/stops any process, signs owner consent, or changes connected state.
[CmdletBinding(DefaultParameterSetName='Status')]
param(
  [Parameter(Mandatory=$true)][string]$CommsCheckout,
  [Parameter(ParameterSetName='Status')][switch]$Status,
  [Parameter(ParameterSetName='ShutdownReadback',Mandatory=$true)][switch]$ShutdownReadback,
  [Parameter(ParameterSetName='ShutdownReadback',Mandatory=$true)][string]$StopReceiptPath
)
$ErrorActionPreference='Stop'
$reviewedCommit='da204096d362bf1b3f17c5dc243440fb7800f7e1'
$originalRee=$env:OS -eq 'Windows_NT' -and $env:COMPUTERNAME -ieq 'DESKTOP-AE894KC' -and $env:USERNAME -ieq 'Ree'
$independentJack=$env:OS -eq 'Windows_NT' -and $env:COMPUTERNAME -ieq 'Templar' -and $env:USERNAME -ieq 'jfros'
$result=[ordered]@{
  schema='rosie.comms.ql793.original-windows-ql360-archive-check.v1'
  state='HOLD_GENUINE_ORIGINAL_PRIVATE_ARCHIVE_SOURCE_RECEIPT_REQUIRED'
  originalReeHost=[bool]$originalRee
  independentJackHost=[bool]$independentJack
  reviewedQl360Commit=$false
  originalExternalIssuerAuthenticated=$false
  originalIndependentWitnessAuthenticated=$false
  ownersIndependentlyApproved=$false
  archivedOriginalDeviceReceiptVerified=$false
  authenticatedRosieSourceReceiptVerified=$false
  authorizedSourceGrant=$false
  connected=$false
  connectionState='DISCONNECTED / HOLD'
  customerCommunications=$false
  deviceActions=$false
  sourceRepositoryWrites=0
}
function Emit([string]$reason){$result.state=$reason;$result|ConvertTo-Json -Compress -Depth 5}
if(-not $originalRee -and -not $independentJack){Emit 'DENY_NONORIGINAL_REE_OR_JACK_WINDOWS_ACCOUNT';exit 0}
if($independentJack -and $ShutdownReadback){Emit 'DENY_ONLY_ORIGINAL_REE_MAY_REVIEW_LOCAL_SHUTDOWN';exit 0}
try{
  $root=(Resolve-Path -LiteralPath $CommsCheckout).Path
  $commit=(& git -C $root rev-parse HEAD 2>$null)
  if($LASTEXITCODE -ne 0 -or $commit -cne $reviewedCommit){
    Emit 'HOLD_REVIEWED_QL360_COMMS_COMMIT_NOT_ON_ORIGINAL_DEVICE';exit 0
  }
  $scripts=@('runtimes/hub-relay/ql360-windows-evidence-export.ps1',
    'runtimes/hub-relay/ql360-original-evidence-archive.mjs',
    'runtimes/hub-relay/ql360-windows-private-storage.mjs',
    'runtimes/hub-relay/ql359-windows-supervised-test.ps1',
    'runtimes/hub-relay/ql358-windows-original-field.ps1',
    'runtimes/hub-relay/ql340c-windows-operator.ps1',
    'runtimes/hub-relay/ql341-private-readback.mjs')
  $changed=@(& git -C $root status --porcelain -- $scripts 2>$null |
    Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
  if($LASTEXITCODE -ne 0 -or $changed.Count -ne 0){
    Emit 'HOLD_ORIGINAL_QL360_OR_DEPENDENCY_FILE_CHANGED';exit 0
  }
  $operator=Join-Path $root 'runtimes\hub-relay\ql360-windows-evidence-export.ps1'
  if(-not (Test-Path -LiteralPath $operator -PathType Leaf)){
    Emit 'HOLD_ORIGINAL_QL360_WINDOWS_SCRIPT_NOT_FOUND';exit 0
  }
  $result.reviewedQl360Commit=$true
  $options=@('-NoProfile','-ExecutionPolicy','RemoteSigned','-File',$operator)
  if($ShutdownReadback){
    if(-not (Test-Path -LiteralPath $StopReceiptPath -PathType Leaf)){
      Emit 'HOLD_ORIGINAL_REE_REAL_STOP_RECEIPT_NOT_FOUND';exit 0
    }
    $options+=@('-ShutdownReadback','-StopReceiptPath',$StopReceiptPath)
  }else{$options+='-Status'}
  # The actual original script output may include local paths or process IDs.
  # Never forward that output to a public API, CI artifact or chat session.
  $private=@(& powershell.exe @options 2>$null)
  if($LASTEXITCODE -ne 0 -or $private.Count -ne 1){
    Emit 'HOLD_ORIGINAL_QL360_PRIVATE_READBACK_REJECTED';exit 0
  }
  $observation=$private[0]|ConvertFrom-Json
  if($observation.schema -cne 'rosevear.hub.ql360.windows-private-export.v1' -or
    $observation.originalReeHost -ne [bool]$originalRee -or
    $observation.independentJackHost -ne [bool]$independentJack -or
    $observation.receiverActivated -ne $false -or
    $observation.connected -ne $false -or
    $observation.connectionState -cne 'DISCONNECTED / HOLD'){
    Emit 'DENY_ORIGINAL_QL360_HOST_OR_CONNECTED_STATE_CHANGED';exit 0
  }
  if($ShutdownReadback){
    if($observation.state -cne 'ORIGINAL_REE_FRESH_STOP_FILE_AND_ZERO_LISTENERS_OBSERVED_INDEPENDENT_TRUST_STILL_REQUIRED' -or
      $observation.localListenerCount -ne 0 -or
      $observation.tailnetGatewayListenerCount -ne 0){
      Emit 'HOLD_NOT_AN_ORIGINAL_STOP_AND_ZERO_LISTENER_OBSERVATION';exit 0
    }
    Emit 'REVIEWED_ORIGINAL_STOP_OBSERVATION_ONLY_INDEPENDENT_SIGNATURE_STILL_REQUIRED';exit 0
  }
  if($observation.state -cne 'ORIGINAL_PRIVATE_ARCHIVE_READINESS_HOLD'){
    Emit 'HOLD_UNEXPECTED_ORIGINAL_QL360_STATUS_STATE';exit 0
  }
  $result.receiverListenerCount=[int]$observation.originalPrivateReceiverListenerCount
  $result.tailnetGatewayListenerCount=[int]$observation.originalTailnetGatewayListenerCount
  Emit 'ORIGINAL_QL360_WINDOWS_STATUS_OBSERVED_ARCHIVE_AND_SOURCE_STILL_HELD'
}catch{Emit 'HOLD_ORIGINAL_QL360_PRIVATE_FIELD_READBACK_UNAVAILABLE'}
