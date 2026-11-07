# Build 791: reviewed QL-358 original Windows field handoff. An on-device
# operator runs a single explicitly selected reviewed command. No private keys,
# DB credentials or receipt payloads are printed. No unattended enrollment,
# signer action, receiver start, service restart or TEST packet transmission.
[CmdletBinding(DefaultParameterSetName='Status')]
param(
  [Parameter(Mandatory=$true)][string]$CommsCheckout,
  [Parameter(ParameterSetName='Status')][switch]$Status,
  [Parameter(ParameterSetName='ReviewRequest',Mandatory=$true)][switch]$ReviewRequest,
  [Parameter(ParameterSetName='ReviewRequest',Mandatory=$true)][string]$RequestPath,
  [Parameter(ParameterSetName='ReviewRequest')][string]$EvidencePathsFile,
  [Parameter(ParameterSetName='ReviewSigned',Mandatory=$true)][switch]$ReviewSigned,
  [Parameter(ParameterSetName='ReviewSigned',Mandatory=$true)][string]$SignedRequestPath,
  [Parameter(ParameterSetName='ReviewSigned',Mandatory=$true)][string]$SignedEvidencePathsFile,
  [Parameter(ParameterSetName='CredentialHandoff',Mandatory=$true)][switch]$CredentialHandoff,
  [Parameter(ParameterSetName='ReceiverReadback',Mandatory=$true)][switch]$ReceiverReadback,
  [Parameter(ParameterSetName='VerifyDeviceReceipt',Mandatory=$true)][switch]$VerifyDeviceReceipt,
  [Parameter(ParameterSetName='VerifyDeviceReceipt',Mandatory=$true)][string]$OriginalPacketPath,
  [Parameter(ParameterSetName='VerifyDeviceReceipt',Mandatory=$true)][string]$OwnerReviewPath
)
$ErrorActionPreference='Stop'
$pin='88ceba4fdcf0115b48d3f510159682c8d530d6e8'
$ree=$env:OS -eq 'Windows_NT' -and $env:COMPUTERNAME -ieq 'DESKTOP-AE894KC' -and $env:USERNAME -ieq 'Ree'
$jack=$env:OS -eq 'Windows_NT' -and $env:COMPUTERNAME -ieq 'Templar' -and $env:USERNAME -ieq 'jfros'
$record=[ordered]@{
  schema='rosie.comms.ql791.original-ql358-windows-field.v1'
  state='HOLD_ORIGINAL_REE_JACK_SIGNED_FIELD_EVIDENCE_REQUIRED'
  originalReeHost=[bool]$ree
  independentJackHost=[bool]$jack
  reviewedQl358Commit=$false
  originalIssuerAuthenticated=$false
  independentWitnessAuthenticated=$false
  ownersIndependentlyApproved=$false
  databaseEnrollmentVerified=$false
  dedicatedReceiverCredentialVerified=$false
  firstDeviceTestReceiptVerified=$false
  rosieSourceEnrollmentVerified=$false
  firstRosieBrokerGetVerified=$false
  connected=$false
  connectionState='DISCONNECTED / HOLD'
  customerCommunications=$false
  deviceActions=$false
  sourceRepositoryWrites=0
}
function Result([string]$s){$record.state=$s;$record|ConvertTo-Json -Compress -Depth 5}
if(-not $ree -and -not $jack){Result 'DENY_NONORIGINAL_REE_JACK_WINDOWS_ACCOUNT';exit 0}
if($jack -and ($ReviewSigned -or $CredentialHandoff -or $ReceiverReadback -or $VerifyDeviceReceipt)){
  Result 'DENY_JACK_CANNOT_RUN_REE_PRIVATE_FIELD_OPERATOR';exit 0
}
if($jack -and $ReviewRequest -and $EvidencePathsFile){
  Result 'DENY_JACK_MUST_NOT_RECEIVE_REE_PRIVATE_WITNESS_PATHS';exit 0
}
try{
  $root=(Resolve-Path -LiteralPath $CommsCheckout).Path
  $head=(& git -C $root rev-parse HEAD 2>$null)
  if($LASTEXITCODE -ne 0 -or $head -cne $pin){
    Result 'HOLD_REVIEWED_ORIGINAL_QL358_RELEASE_NOT_INSTALLED';exit 0
  }
  $dependencies=@('runtimes/hub-relay/ql358-windows-original-field.ps1',
    'runtimes/hub-relay/ql358-field-credential-reconciliation.mjs',
    'runtimes/hub-relay/ql357-windows-owner-activation.ps1',
    'runtimes/hub-relay/ql356-original-field-readback.mjs',
    'runtimes/hub-relay/ql340c-windows-operator.ps1')
  $modified=@(& git -C $root status --porcelain -- $dependencies 2>$null |
    Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
  if($LASTEXITCODE -ne 0 -or $modified.Count -gt 0){
    Result 'HOLD_ORIGINAL_QL358_OPERATOR_DEPENDENCIES_MODIFIED';exit 0
  }
  $script=Join-Path $root 'runtimes\hub-relay\ql358-windows-original-field.ps1'
  if(-not (Test-Path -LiteralPath $script -PathType Leaf)){
    Result 'HOLD_REVIEWED_ORIGINAL_QL358_OPERATOR_SCRIPT_MISSING';exit 0
  }
  $record.reviewedQl358Commit=$true
  $params=@('-NoProfile','-ExecutionPolicy','Bypass','-File',$script)
  if($ReviewRequest){
    if(-not (Test-Path -LiteralPath $RequestPath -PathType Leaf)){
      Result 'HOLD_FRESH_UNSIGNED_ORIGINAL_REQUEST_NOT_FOUND';exit 0
    }
    $params+=@('-ReviewRequest','-RequestPath',$RequestPath)
    if($ree){
      if(-not $EvidencePathsFile -or -not (Test-Path -LiteralPath $EvidencePathsFile -PathType Leaf)){
        Result 'HOLD_REE_ORIGINAL_FOUR_WITNESS_PATHS_NOT_FOUND';exit 0
      }
      $params+=@('-EvidencePathsFile',$EvidencePathsFile)
    }
  }elseif($ReviewSigned){
    if(-not (Test-Path -LiteralPath $SignedRequestPath -PathType Leaf) -or
      -not (Test-Path -LiteralPath $SignedEvidencePathsFile -PathType Leaf)){
      Result 'HOLD_REE_SIGNED_REQUEST_OR_ORIGINAL_FIELD_FILES_MISSING';exit 0
    }
    $params+=@('-ReviewSigned','-SignedRequestPath',$SignedRequestPath,
      '-SignedEvidencePathsFile',$SignedEvidencePathsFile)
  }elseif($CredentialHandoff){$params+='-CredentialHandoff'}
  elseif($ReceiverReadback){$params+='-ReceiverReadback'}
  elseif($VerifyDeviceReceipt){
    if(-not (Test-Path -LiteralPath $OriginalPacketPath -PathType Leaf) -or
      -not (Test-Path -LiteralPath $OwnerReviewPath -PathType Leaf)){
      Result 'HOLD_GENUINE_DEVICE_PACKET_OR_OWNER_REVIEW_FILE_NOT_FOUND';exit 0
    }
    $params+=@('-VerifyReceipt','-OriginalPacketPath',$OriginalPacketPath,
      '-OwnerReviewPath',$OwnerReviewPath)
  }else{$params+='-Status'}
  $privateLines=@(& powershell.exe @params 2>$null)
  if($LASTEXITCODE -ne 0){Result 'HOLD_ORIGINAL_QL358_PRIVATE_FIELD_ACTION_REJECTED';exit 0}
  if($ReviewRequest){Result 'ORIGINAL_QL358_REQUEST_DIGEST_REVIEW_RAN_SIGNING_STILL_HELD';exit 0}
  if($ReviewSigned){Result 'ORIGINAL_QL358_SIGNED_OWNER_REVIEW_RAN_ISSUER_DB_STILL_REQUIRED';exit 0}
  if($CredentialHandoff){Result 'ORIGINAL_QL358_CREDENTIAL_PREREQUISITES_REVIEWED_NO_SECRET_INSTALLED';exit 0}
  if($ReceiverReadback){Result 'ORIGINAL_QL358_RECEIVER_READBACK_RAN_ROSIE_SOURCE_STILL_HELD';exit 0}
  if($VerifyDeviceReceipt){Result 'ORIGINAL_QL358_DEVICE_RECEIPT_REVIEW_RAN_ROSIE_GET_STILL_HELD';exit 0}
  if($privateLines.Count -ne 1){Result 'HOLD_ORIGINAL_QL358_STATUS_OUTPUT_UNEXPECTED';exit 0}
  $s=$privateLines[0]|ConvertFrom-Json
  if($s.schema -cne 'rosevear.hub.ql358.windows-original-field.v1' -or
     $s.connectionState -cne 'DISCONNECTED / HOLD' -or $s.connected -ne $false -or
     $s.originalReeHost -ne [bool]$ree -or $s.independentJackHost -ne [bool]$jack -or
     $s.receiverActivated -ne $false){
    Result 'DENY_ORIGINAL_QL358_FIELD_IDENTITY_OR_SCHEMA_DRIFT';exit 0
  }
  $record.localPublicCandidatePresent=[bool]$s.localPublicCandidatePresent
  $record.localEncryptedSigningKeyPresent=[bool]$s.localEncryptedSigningKeyPresent
  if($ree){
    $record.originalSignedEnrollmentPresent=[bool]$s.originalSignedEnrollmentPresent
    $record.approvedOwnerPinsPresent=[bool]$s.approvedOwnerPinsPresent
    $record.dedicatedDpapiCredentialPresent=[bool]$s.dedicatedDpapiCredentialPresent
    $record.privateReceiverListenerCount=[int]$s.originalPrivateReceiverListenerCount
    if($record.privateReceiverListenerCount -ne 0){
      Result 'STOP_UNEXPECTED_PRIVATE_RECEIVER_LISTENER';exit 0
    }
  }
  Result 'ORIGINAL_QL358_STATUS_OBSERVED_EXTERNAL_ISSUER_AND_BROKER_STILL_HELD'
}catch{Result 'HOLD_ORIGINAL_QL358_WINDOWS_OPERATOR_EXCEPTION'}
