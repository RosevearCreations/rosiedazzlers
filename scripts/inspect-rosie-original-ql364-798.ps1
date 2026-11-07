# Build 798 original-device read-only QL-364 evidence status.
# Supersedes inspect-rosie-original-ql363-797.ps1: that old verifier is pinned
# to QL-363 and cannot verify a newer, otherwise legitimate QL-364 checkout.
# Does not enroll an issuer, witness or owner, sign or import a receipt,
# open the receiver, perform HTTP, or update a database.
[CmdletBinding()]
param([Parameter(Mandatory=$true)][string]$CommsCheckout)
$ErrorActionPreference='Stop'
$ree=$env:OS -eq 'Windows_NT' -and $env:COMPUTERNAME -ieq 'DESKTOP-AE894KC' -and $env:USERNAME -ieq 'Ree'
$jack=$env:OS -eq 'Windows_NT' -and $env:COMPUTERNAME -ieq 'TEMPLAR' -and $env:USERNAME -ieq 'jfros'
$out=[ordered]@{
  schema='rosie.comms.ql798.original-ql364-read-only-preflight.v1'
  state='HOLD_ORIGINAL_CUSTODIAN_RENEWAL_AND_OWNER_REVIEW_REQUIRED'
  originalReeHost=[bool]$ree
  independentJackHost=[bool]$jack
  ql364ReviewedBaselineFound=$false
  originalQl362StatusRead=$false
  originalSourceReceiptImported=$false
  independentCustodiansRenewed=0
  separateOwnerConflictDecisionsVerified=$false
  originalReceiverEnrolled=$false
  connected=$false
  connectionState='DISCONNECTED / HOLD'
  sourceTestAuthorized=$false
  customerCommunications=$false
  deviceActions=$false
  sourceRepositoryWrites=0
}
function Emit([string]$state){$out.state=$state;$out|ConvertTo-Json -Compress -Depth 4}
if(-not $ree -and -not $jack){Emit 'DENY_NONORIGINAL_WINDOWS_ACCOUNT';exit 0}
try{
  $root=(Resolve-Path -LiteralPath $CommsCheckout).Path
  if(-not (Test-Path -LiteralPath (Join-Path $root '.git')) -and
    -not (Test-Path -LiteralPath (Join-Path $root 'runtimes/hub-relay/ql362-windows-source-owner-handoff.ps1'))){
    Emit 'HOLD_COMMS_REPOSITORY_NOT_FOUND';exit 0
  }
  $known='8544be0fddeed71aaa1ef676eb692fe66d8d432e'
  & git -C $root cat-file -e ($known+'^{commit}') 2>$null
  if($LASTEXITCODE -ne 0){Emit 'HOLD_QL364_REVIEWED_BASELINE_NOT_INSTALLED';exit 0}
  & git -C $root merge-base --is-ancestor $known HEAD 2>$null
  if($LASTEXITCODE -ne 0){Emit 'HOLD_QL364_REVIEWED_BASELINE_NOT_ANCESTOR';exit 0}
  foreach($file in @('runtimes/hub-relay/ql362-windows-source-owner-handoff.ps1',
    'runtimes/hub-relay/ql364-distributed-source-health.mjs',
    'runtimes/hub-relay/ql363-six-source-health-adapters.mjs')){
    if(-not (Test-Path -LiteralPath (Join-Path $root $file) -PathType Leaf)){
      Emit 'HOLD_QL364_SOURCE_FILE_MISSING';exit 0
    }
  }
  $out.ql364ReviewedBaselineFound=$true
  $script=Join-Path $root 'runtimes/hub-relay/ql362-windows-source-owner-handoff.ps1'
  $raw=@(& powershell.exe -NoProfile -ExecutionPolicy RemoteSigned -File $script -Status 2>$null)
  if($LASTEXITCODE -ne 0 -or $raw.Count -ne 1){Emit 'HOLD_QL362_ORIGINAL_STATUS_UNAVAILABLE';exit 0}
  $status=$raw[0]|ConvertFrom-Json
  if($status.sourceTestAuthorized -eq $true -or $status.connected -eq $true -or
    $status.originalReeHost -ne [bool]$ree -or
    $status.independentJackHost -ne [bool]$jack){
    Emit 'HOLD_QL362_READBACK_INCONSISTENT';exit 0
  }
  $out.originalQl362StatusRead=$true
  Emit 'QL364_ORIGINAL_STATUS_READ_ONLY_CUSTODIAN_AND_OWNER_EVIDENCE_STILL_REQUIRED'
}catch{Emit 'HOLD_QL364_ORIGINAL_READ_ONLY_INSPECTION_UNAVAILABLE'}
