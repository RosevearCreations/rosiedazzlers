# Rosie Dazzlers Build 789. Read-only on-device original Comms QL-356 custody.
# Does NOT enroll, sign, update, start services, alter firewall, contact broker,
# read private keys or grant customer/source access.
[CmdletBinding()]
param([Parameter(Mandatory=$true)][string]$CommsCheckout)
$ErrorActionPreference='Stop'
$approvedCommsCommit='29d8a29e3cac8c969a83027498e3b73d0acbe58e'
$state=[ordered]@{
  schema='rosie.comms.ql789.original-field-status.v1'
  status='DISCONNECTED / HOLD'
  state='HOLD_ORIGINAL_WINDOWS_FIELD_NOT_VERIFIED'
  originalHost=$false
  independentJackHost=$false
  approvedCommsCodeVersion=$false
  issuerIndependentlyAuthenticated=$false
  fieldWitnessAuthenticated=$false
  ownersIndependentlyApproved=$false
  originalDatabaseEnrollmentVerified=$false
  firstDeviceSignedReceiptVerified=$false
  firstRosieSignedGetWitnessVerified=$false
  receiverActivated=$false
  customerCommunications=$false
  deviceActions=$false
  repositoryWrites=0
  connected=$false
}
function Write-Hold([string]$reason){
  $state.state=$reason
  $state | ConvertTo-Json -Compress -Depth 4
}
if($env:OS -ne 'Windows_NT') {Write-Hold 'HOLD_WINDOWS_ORIGINAL_OWNER_REQUIRED';exit 0}
$ree=$env:COMPUTERNAME -ieq 'DESKTOP-AE894KC' -and $env:USERNAME -ieq 'Ree'
$jack=$env:COMPUTERNAME -ieq 'Templar' -and $env:USERNAME -ieq 'jfros'
$state.originalHost=[bool]$ree
$state.independentJackHost=[bool]$jack
if(-not $ree -and -not $jack){Write-Hold 'DENY_NONORIGINAL_OWNER_COMPUTER';exit 0}
try{
  $root=(Resolve-Path -LiteralPath $CommsCheckout -ErrorAction Stop).Path
  $head=(& git -C $root rev-parse HEAD 2>$null)
  if($LASTEXITCODE -ne 0 -or $head -cne $approvedCommsCommit){
    Write-Hold 'HOLD_REVIEWED_COMMS_QL356_COMMIT_NOT_CHECKED_OUT';exit 0
  }
  $status=@(& git -C $root status --porcelain -- runtimes/hub-relay/ql356-windows-field-handoff.ps1 runtimes/hub-relay/ql356-original-field-readback.mjs 2>$null | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
  if($LASTEXITCODE -ne 0 -or $status.Count -gt 0){
    Write-Hold 'HOLD_ORIGINAL_COMMS_FIELD_SCRIPT_HAS_LOCAL_CHANGES';exit 0
  }
  $fieldScript=Join-Path $root 'runtimes\hub-relay\ql356-windows-field-handoff.ps1'
  if(-not (Test-Path -LiteralPath $fieldScript -PathType Leaf)){
    Write-Hold 'HOLD_APPROVED_ORIGINAL_FIELD_SCRIPT_NOT_PRESENT';exit 0
  }
  $state.approvedCommsCodeVersion=$true
  # This calls only QL-356's read-only -Status operation from reviewed source.
  $lines=@(& powershell.exe -NoProfile -ExecutionPolicy Bypass -File $fieldScript -Status 2>$null)
  if($LASTEXITCODE -ne 0 -or $lines.Count -ne 1){
    Write-Hold 'HOLD_ORIGINAL_QL356_STATUS_COMMAND_FAILED';exit 0
  }
  $observed=$lines[0] | ConvertFrom-Json
  if($observed.schema -cne 'rosevear.hub.ql356.windows-field-handoff.v1' -or
     $observed.connectionState -cne 'DISCONNECTED / HOLD' -or
     $observed.connected -ne $false -or
     $observed.originalReeHost -ne [bool]$ree -or
     $observed.independentJackHost -ne [bool]$jack){
    Write-Hold 'DENY_UNEXPECTED_ORIGINAL_STATUS_SCHEMA_OR_OWNER_IDENTITY';exit 0
  }
  $state.state='ORIGINAL_OWNER_READ_ONLY_CUSTODY_OBSERVED_SIGNED_ENROLLMENT_STILL_HELD'
  # QL-356 -Status deliberately does not authenticate the issuer, signers or
  # private database. Do not promote it into a successful TEST receipt.
  Write-Hold $state.state
}catch{Write-Hold 'HOLD_ORIGINAL_WINDOWS_STATUS_READBACK_EXCEPTION'}
