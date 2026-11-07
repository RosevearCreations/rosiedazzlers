# Rosie Dazzlers Build 790: original QL-357 field execution *only* on Ree's
# or Jack's independently identified Windows account. All modes are explicit.
# No receiver start, issuer/owner signature fabrication, key export, firewall
# alteration, public network activation or customer data access.
[CmdletBinding(DefaultParameterSetName='Status')]
param(
  [Parameter(Mandatory=$true)][string]$CommsCheckout,
  [Parameter(ParameterSetName='Status')][switch]$Status,
  [Parameter(ParameterSetName='ReviewSigned',Mandatory=$true)][switch]$ReviewSigned,
  [Parameter(ParameterSetName='ReviewSigned',Mandatory=$true)][string]$RequestPath,
  [Parameter(ParameterSetName='ReviewSigned',Mandatory=$true)][string]$EvidencePathsFile,
  [Parameter(ParameterSetName='PrivateReadback',Mandatory=$true)][switch]$PrivateReadback,
  [Parameter(ParameterSetName='VerifyDeviceReceipt',Mandatory=$true)][switch]$VerifyDeviceReceipt,
  [Parameter(ParameterSetName='VerifyDeviceReceipt',Mandatory=$true)][string]$OriginalPacketPath,
  [Parameter(ParameterSetName='VerifyDeviceReceipt',Mandatory=$true)][string]$OwnerReviewPath
)
$ErrorActionPreference='Stop'
$approvedCommsCommit='67759492e56443f9c70f4ed25e506a6253e2b237'
$ree=$env:OS -eq 'Windows_NT' -and $env:COMPUTERNAME -ieq 'DESKTOP-AE894KC' -and $env:USERNAME -ieq 'Ree'
$jack=$env:OS -eq 'Windows_NT' -and $env:COMPUTERNAME -ieq 'Templar' -and $env:USERNAME -ieq 'jfros'
$result=[ordered]@{
  schema='rosie.comms.ql790.original-ql357-field-execution.v1'
  state='HOLD_ORIGINAL_QL357_FIELD_EVIDENCE_REQUIRED'
  originalReeHost=[bool]$ree
  independentJackHost=[bool]$jack
  reviewedQl357Commit=$false
  originalIssuerIndependentlyAuthenticated=$false
  ownersIndependentlyApproved=$false
  originalDeviceEnrollmentVerified=$false
  originalDeviceReceiptVerified=$false
  rosieSourceEnrollmentVerified=$false
  authenticatedPrivateBroker=$false
  rosieSignedGetReceiptVerified=$false
  connected=$false
  connectionState='DISCONNECTED / HOLD'
  customerCommunications=$false
  deviceActions=$false
  sourceRepositoryWrites=0
}
function Write-Result([string]$state){
  $result.state=$state
  $result | ConvertTo-Json -Compress -Depth 5
}
if(-not $ree -and -not $jack){
  Write-Result 'DENY_NONORIGINAL_OWNER_WINDOWS_HOST';exit 0
}
if(-not $ree -and ($ReviewSigned -or $PrivateReadback -or $VerifyDeviceReceipt)){
  Write-Result 'DENY_JACK_CANNOT_RUN_REE_ORIGINAL_PRIVATE_OPERATOR';exit 0
}
try{
  $root=(Resolve-Path -LiteralPath $CommsCheckout -ErrorAction Stop).Path
  $head=(& git -C $root rev-parse HEAD 2>$null)
  if($LASTEXITCODE -ne 0 -or $head -cne $approvedCommsCommit){
    Write-Result 'HOLD_REVIEWED_COMMS_QL357_COMMIT_NOT_CHECKED_OUT';exit 0
  }
  $paths=@(
    'runtimes/hub-relay/ql357-windows-owner-activation.ps1',
    'runtimes/hub-relay/ql357-original-activation.mjs',
    'runtimes/hub-relay/ql354-windows-owner-handoff.ps1',
    'runtimes/hub-relay/ql340c-windows-operator.ps1')
  $changed=@(& git -C $root status --porcelain -- $paths 2>$null |
    Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
  if($LASTEXITCODE -ne 0 -or $changed.Count -gt 0){
    Write-Result 'HOLD_ORIGINAL_QL357_OR_DEPENDENCY_SCRIPTS_CHANGED';exit 0
  }
  $trustedScript=Join-Path $root 'runtimes\hub-relay\ql357-windows-owner-activation.ps1'
  if(-not (Test-Path -LiteralPath $trustedScript -PathType Leaf)){
    Write-Result 'HOLD_ORIGINAL_QL357_WINDOWS_SCRIPT_MISSING';exit 0
  }
  $result.reviewedQl357Commit=$true
  $params=@('-NoProfile','-ExecutionPolicy','Bypass','-File',$trustedScript)
  if($ReviewSigned){
    foreach($file in @($RequestPath,$EvidencePathsFile)){
      if(-not (Test-Path -LiteralPath $file -PathType Leaf)){
        Write-Result 'HOLD_ORIGINAL_SIGNED_REQUEST_OR_FOUR_WITNESS_PATHS_MISSING';exit 0
      }
    }
    $params+=@('-ReviewSigned','-RequestPath',$RequestPath,'-EvidencePathsFile',$EvidencePathsFile)
  }elseif($PrivateReadback){
    $params+='-PrivateReadback'
  }elseif($VerifyDeviceReceipt){
    foreach($file in @($OriginalPacketPath,$OwnerReviewPath)){
      if(-not (Test-Path -LiteralPath $file -PathType Leaf)){
        Write-Result 'HOLD_GENUINE_ORIGINAL_PACKET_OR_OWNER_REVIEW_MISSING';exit 0
      }
    }
    $params+=@('-VerifyReceipt','-OriginalPacketPath',$OriginalPacketPath,
      '-OwnerReviewPath',$OwnerReviewPath)
  }else{$params+='-Status'}
  # Original output may contain confidential paths or private receipt bytes.
  # Capture locally and emit only this sanitized summary.
  $privateOutput=@(& powershell.exe @params 2>$null)
  if($LASTEXITCODE -ne 0){
    Write-Result 'HOLD_ORIGINAL_QL357_ON_DEVICE_ACTION_FAILED';exit 0
  }
  if($ReviewSigned){
    Write-Result 'ORIGINAL_QL357_SIGNED_INTAKE_REVIEW_RAN_EXTERNAL_ISSUER_AND_DB_STILL_REQUIRED';exit 0
  }
  if($PrivateReadback){
    Write-Result 'ORIGINAL_QL357_PRIVATE_DB_READBACK_RAN_ROSIE_GET_STILL_HELD';exit 0
  }
  if($VerifyDeviceReceipt){
    Write-Result 'ORIGINAL_QL357_DEVICE_RECEIPT_READBACK_RAN_ROSIE_GET_STILL_HELD';exit 0
  }
  if($privateOutput.Count -ne 1){
    Write-Result 'HOLD_ORIGINAL_QL357_STATUS_OUTPUT_NOT_UNIQUE';exit 0
  }
  $observed=$privateOutput[0] | ConvertFrom-Json
  if($observed.schema -cne 'rosevear.hub.ql357.windows-owner-activation.v1' -or
     $observed.connectionState -cne 'DISCONNECTED / HOLD' -or
     $observed.connected -ne $false -or
     $observed.originalReeHost -ne [bool]$ree -or
     $observed.independentJackHost -ne [bool]$jack -or
     $observed.receiverActivated -ne $false){
    Write-Result 'DENY_ORIGINAL_QL357_STATUS_OR_OWNER_IDENTITY_MISMATCH';exit 0
  }
  $result.localPublicCandidatePresent=[bool]$observed.localPublicCandidatePresent
  $result.localEncryptedSigningKeyPresent=[bool]$observed.localEncryptedSigningKeyPresent
  if($ree){
    $result.signedOriginalEnrollmentFilePresent=[bool]$observed.signedOriginalEnrollmentFilePresent
    $result.approvedOriginalOwnerPinsFilePresent=[bool]$observed.approvedOriginalOwnerPinsFilePresent
    $result.privateDpapiCredentialFilePresent=[bool]$observed.privateDpapiCredentialFilePresent
    $result.privateReceiverListenerCount=[int]$observed.privateReceiverListenerCount
    if($result.privateReceiverListenerCount -ne 0){
      Write-Result 'STOP_UNEXPECTED_ORIGINAL_RECEIVER_ALREADY_LISTENING';exit 0
    }
  }
  Write-Result 'ORIGINAL_QL357_OWNER_STATUS_OBSERVED_NO_SIGNED_ENROLLMENT_OR_GET_PROVEN'
}catch{Write-Result 'HOLD_ORIGINAL_WINDOWS_QL357_READBACK_EXCEPTION'}
