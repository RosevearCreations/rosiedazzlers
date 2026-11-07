# Rosie Build 792 original QL-359 owner-supervised TEST witness helper.
# Read-only delegation only: no credential grant/store, process stop/start,
# signing key read, firewall rule, network send, DB write or auto retry.
[CmdletBinding(DefaultParameterSetName='Status')]
param(
  [Parameter(Mandatory=$true)][string]$CommsCheckout,
  [Parameter(ParameterSetName='Status')][switch]$Status,
  [Parameter(ParameterSetName='OwnerReview',Mandatory=$true)][switch]$OwnerReview,
  [Parameter(ParameterSetName='OwnerReview',Mandatory=$true)][string]$RequestPath,
  [Parameter(ParameterSetName='OwnerReview')][string]$EvidencePathsFile,
  [Parameter(ParameterSetName='CredentialReadback',Mandatory=$true)][switch]$CredentialReadback,
  [Parameter(ParameterSetName='StopWitness',Mandatory=$true)][switch]$StopWitness,
  [Parameter(ParameterSetName='ReceiptReview',Mandatory=$true)][switch]$ReceiptReview,
  [Parameter(ParameterSetName='ReceiptReview',Mandatory=$true)][string]$OriginalPacketPath,
  [Parameter(ParameterSetName='ReceiptReview',Mandatory=$true)][string]$OwnerReviewPath
)
$ErrorActionPreference='Stop'
$commit='46a3465365d2136466aa8f3d3b3297bcb467f773'
$ree=$env:OS -eq 'Windows_NT' -and $env:COMPUTERNAME -ieq 'DESKTOP-AE894KC' -and $env:USERNAME -ieq 'Ree'
$jack=$env:OS -eq 'Windows_NT' -and $env:COMPUTERNAME -ieq 'Templar' -and $env:USERNAME -ieq 'jfros'
$state=[ordered]@{
  schema='rosie.comms.ql792.original-ql359-supervised-field.v1'
  state='HOLD_ORIGINAL_WINDOWS_INDEPENDENT_AUTHORITY_REQUIRED'
  originalReeHost=[bool]$ree
  independentJackHost=[bool]$jack
  reviewedQl359Commit=$false
  issuerAuthenticated=$false
  independentWitnessAuthenticated=$false
  ownersIndependentlyApproved=$false
  signedOriginalDeviceReceiptVerified=$false
  originalReceiverStopIndependentlyVerified=$false
  rosieSourceEnrollmentVerified=$false
  firstRosieSignedGetVerified=$false
  connected=$false
  connectionState='DISCONNECTED / HOLD'
  customerCommunications=$false
  deviceActions=$false
  sourceRepositoryWrites=0
}
function Emit([string]$reason){$state.state=$reason;$state|ConvertTo-Json -Compress -Depth 5}
if(-not $ree -and -not $jack){Emit 'DENY_NONORIGINAL_WINDOWS_OWNER';exit 0}
if($jack -and ($CredentialReadback -or $StopWitness -or $ReceiptReview)){
  Emit 'DENY_JACK_NOT_ORIGINAL_REE_RECEIVER_OPERATOR';exit 0
}
if($jack -and $EvidencePathsFile){
  Emit 'DENY_JACK_CANNOT_IMPORT_REE_PRIVATE_FIELD_EVIDENCE';exit 0
}
try{
  $root=(Resolve-Path -LiteralPath $CommsCheckout).Path
  $head=(& git -C $root rev-parse HEAD 2>$null)
  if($LASTEXITCODE -ne 0 -or $head -cne $commit){
    Emit 'HOLD_QL359_REVIEWED_COMMS_COMMIT_NOT_INSTALLED';exit 0
  }
  $paths=@('runtimes/hub-relay/ql359-windows-supervised-test.ps1',
    'runtimes/hub-relay/ql359-supervised-private-closeout.mjs',
    'runtimes/hub-relay/ql358-windows-original-field.ps1',
    'runtimes/hub-relay/ql357-windows-owner-activation.ps1',
    'runtimes/hub-relay/ql340c-windows-operator.ps1')
  $dirty=@(& git -C $root status --porcelain -- $paths 2>$null |
    Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
  if($LASTEXITCODE -ne 0 -or $dirty.Count -gt 0){
    Emit 'HOLD_ORIGINAL_QL359_OR_DEPENDENCY_SCRIPT_CHANGED';exit 0
  }
  $ql359=Join-Path $root 'runtimes\hub-relay\ql359-windows-supervised-test.ps1'
  if(-not (Test-Path -LiteralPath $ql359 -PathType Leaf)){
    Emit 'HOLD_ORIGINAL_QL359_WINDOWS_OPERATOR_NOT_FOUND';exit 0
  }
  $state.reviewedQl359Commit=$true
  $args359=@('-NoProfile','-ExecutionPolicy','RemoteSigned','-File',$ql359)
  if($OwnerReview){
    if(-not (Test-Path -LiteralPath $RequestPath -PathType Leaf)){
      Emit 'HOLD_FRESH_UNSIGNED_ORIGINAL_REQUEST_FILE_REQUIRED';exit 0
    }
    $args359+=@('-OwnerReview','-RequestPath',$RequestPath)
    if($ree){
      if(-not $EvidencePathsFile -or -not (Test-Path -LiteralPath $EvidencePathsFile -PathType Leaf)){
        Emit 'HOLD_REE_FOUR_ORIGINAL_WITNESS_FILE_PATHS_REQUIRED';exit 0
      }
      $args359+=@('-EvidencePathsFile',$EvidencePathsFile)
    }
  }elseif($CredentialReadback){$args359+='-CredentialReadback'}
  elseif($StopWitness){$args359+='-StopWitness'}
  elseif($ReceiptReview){
    if(-not (Test-Path -LiteralPath $OriginalPacketPath -PathType Leaf) -or
       -not (Test-Path -LiteralPath $OwnerReviewPath -PathType Leaf)){
      Emit 'HOLD_SIGNED_ORIGINAL_PACKET_AND_OWNER_REVIEW_FILES_REQUIRED';exit 0
    }
    $args359+=@('-ReceiptReview','-OriginalPacketPath',$OriginalPacketPath,
      '-OwnerReviewPath',$OwnerReviewPath)
  }else{$args359+='-Status'}
  # Original command can emit private local file paths/receipt content.
  # Never forward it into a browser, CI artifact or chat.
  $privateResult=@(& powershell.exe @args359 2>$null)
  if($LASTEXITCODE -ne 0){Emit 'HOLD_ORIGINAL_QL359_READBACK_OR_FIELD_REVIEW_FAILED';exit 0}
  if($OwnerReview){Emit 'ORIGINAL_OWNER_PUBLIC_REQUEST_REVIEW_RAN_AUTHORIZATION_STILL_HELD';exit 0}
  if($CredentialReadback){Emit 'ORIGINAL_REE_CREDENTIAL_PREREQUISITES_READ_NO_CREDENTIAL_ACCEPTED';exit 0}
  if($StopWitness){Emit 'ORIGINAL_REE_LOCAL_STOP_READBACK_ONLY_EXTERNAL_WITNESS_REQUIRED';exit 0}
  if($ReceiptReview){Emit 'ORIGINAL_DEVICE_RECEIPT_READBACK_RAN_ROSIE_SOURCE_STILL_HELD';exit 0}
  if($privateResult.Count -ne 1){Emit 'HOLD_ORIGINAL_QL359_STATUS_NOT_UNIQUE';exit 0}
  $observation=$privateResult[0]|ConvertFrom-Json
  if($observation.schema -cne 'rosevear.hub.ql359.windows-supervised-test.v1' -or
    $observation.originalReeHost -ne [bool]$ree -or
    $observation.independentJackHost -ne [bool]$jack -or
    $observation.connected -ne $false -or
    $observation.receiverActivated -ne $false -or
    $observation.connectionState -cne 'DISCONNECTED / HOLD'){
    Emit 'DENY_ORIGINAL_QL359_STATUS_OR_OWNER_IDENTITY_CHANGED';exit 0
  }
  $state.originalPublicCandidatePresent=[bool]$observation.originalPublicCandidatePresent
  if($ree){
    $state.originalSignedEnrollmentPresent=[bool]$observation.originalSignedEnrollmentPresent
    $state.approvedPublicPinsPresent=[bool]$observation.approvedPublicPinsPresent
    $state.currentUserDpapiCredentialPresent=[bool]$observation.currentUserDpapiCredentialPresent
    $state.localReceiverListenerCount=[int]$observation.localReceiverListenerCount
    if($state.localReceiverListenerCount -ne 0){
      Emit 'STOP_UNEXPECTED_PRIVATE_RECEIVER_ALREADY_LISTENING';exit 0
    }
  }
  Emit 'ORIGINAL_QL359_OWNER_STATUS_OBSERVED_NO_EXTERNAL_SIGNATURE_PROOF'
}catch{Emit 'HOLD_ORIGINAL_QL359_WINDOWS_READBACK_EXCEPTION'}
