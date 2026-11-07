# Rosie 795: read-only original QL-362 role/candidate status. No signing,
# enrollment, database writes, source permission, HTTP GET or receiver restart.
[CmdletBinding(DefaultParameterSetName='Status')]
param(
  [Parameter(Mandatory=$true)][string]$CommsCheckout,
  [Parameter(ParameterSetName='Status')][switch]$Status,
  [Parameter(ParameterSetName='CandidateReadback',Mandatory=$true)][switch]$CandidateReadback,
  [Parameter(ParameterSetName='CandidateReadback',Mandatory=$true)][string]$HandoffId
)
$ErrorActionPreference='Stop'
$pin='f23c2ddc6b1159efd95f67b6ae7f47ff672b006a'
$ree=$env:OS -eq 'Windows_NT' -and $env:COMPUTERNAME -ieq 'DESKTOP-AE894KC' -and $env:USERNAME -ieq 'Ree'
$jack=$env:OS -eq 'Windows_NT' -and $env:COMPUTERNAME -ieq 'TEMPLAR' -and $env:USERNAME -ieq 'jfros'
$out=[ordered]@{
  schema='rosie.comms.ql795.original-ql362-private-status.v1'
  state='HOLD_ORIGINAL_SOURCE_AND_MASTER_SIGNED_ONE_GET_STILL_REQUIRED'
  originalReeHost=[bool]$ree
  independentJackHost=[bool]$jack
  reviewedQl362Commit=$false
  sourceOwnerSignatureVerified=$false
  masterOwnerSignatureVerified=$false
  originalOneUseClaimVerified=$false
  signedSourceGetVerified=$false
  independentWitnessVerified=$false
  signedClosureExportVerified=$false
  connected=$false
  connectionState='DISCONNECTED / HOLD'
  customerCommunications=$false
  deviceActions=$false
  sourceRepositoryWrites=0
}
function Emit([string]$state){$out.state=$state;$out|ConvertTo-Json -Compress -Depth 5}
if(-not $ree -and -not $jack){Emit 'DENY_NONORIGINAL_WINDOWS_ACCOUNT';exit 0}
if($jack -and $CandidateReadback){Emit 'DENY_JACK_CANNOT_READ_REE_PRIVATE_HANDOFF';exit 0}
try{
  $root=(Resolve-Path -LiteralPath $CommsCheckout).Path
  $sha=(& git -C $root rev-parse HEAD 2>$null)
  if($LASTEXITCODE -ne 0 -or $sha -cne $pin){
    Emit 'HOLD_ORIGINAL_COMMS_QL362_PINNED_MAIN_NOT_INSTALLED';exit 0
  }
  $paths=@('runtimes/hub-relay/ql362-windows-source-owner-handoff.ps1',
    'runtimes/hub-relay/ql362-source-owner-first-get.mjs',
    'runtimes/hub-relay/ql361-archived-chain-audit.mjs',
    'runtimes/hub-relay/ql360-original-evidence-archive.mjs')
  $changed=@(& git -C $root status --porcelain -- $paths 2>$null |
    Where-Object {-not [string]::IsNullOrWhiteSpace($_)})
  if($LASTEXITCODE -ne 0 -or $changed.Count -ne 0){
    Emit 'HOLD_ORIGINAL_COMMS_QL362_TRUST_DEPENDENCIES_MODIFIED';exit 0
  }
  $script=Join-Path $root 'runtimes\hub-relay\ql362-windows-source-owner-handoff.ps1'
  if(-not (Test-Path -LiteralPath $script -PathType Leaf)){
    Emit 'HOLD_ORIGINAL_COMMS_QL362_WINDOWS_OPERATOR_MISSING';exit 0
  }
  $out.reviewedQl362Commit=$true
  $options=@('-NoProfile','-ExecutionPolicy','RemoteSigned','-File',$script)
  if($CandidateReadback){
    if($HandoffId -notmatch '^ql361-[0-9a-f-]{36}\.json$'){
      Emit 'DENY_UNREVIEWED_PRIVATE_HANDOFF_ID';exit 0
    }
    $options+=@('-CandidateReadback','-HandoffId',$HandoffId,
      '-SourceId','rosiedazzlers')
  }else{$options+='-Status'}
  # The original helper can include owner-only hashes. Never reprint them.
  $private=@(& powershell.exe @options 2>$null)
  if($LASTEXITCODE -ne 0 -or $private.Count -ne 1){
    Emit 'HOLD_ORIGINAL_PRIVATE_QL362_INSPECTION_UNAVAILABLE';exit 0
  }
  $obs=$private[0]|ConvertFrom-Json
  if($obs.schema -cne 'rosevear.hub.ql362.windows-source-only-handoff.v1' -or
    $obs.originalReeHost -ne [bool]$ree -or
    $obs.independentJackHost -ne [bool]$jack -or
    $obs.connected -ne $false -or
    $obs.connectionState -cne 'DISCONNECTED / HOLD' -or
    $obs.sourceOwnerSignedPermissionVerified -ne $false -or
    $obs.masterOwnerSignedPermissionVerified -ne $false -or
    $obs.singleUseGetApproved -ne $false){
    Emit 'DENY_ORIGINAL_QL362_UNEXPECTED_CONNECTION_OR_APPROVAL';exit 0
  }
  if($CandidateReadback){
    if($obs.state -cne 'ORIGINAL_ONE_SOURCE_CANDIDATE_LOCAL_READ_ONLY_FOR_SEPARATE_OWNER_SIGNATURES' -or
      $obs.sourceId -cne 'rosiedazzlers'){
      Emit 'HOLD_ORIGINAL_ROSIE_SOURCE_CANDIDATE_NOT_AVAILABLE';exit 0
    }
    Emit 'ORIGINAL_ROSIE_CANDIDATE_READ_ONLY_NOT_SIGNED_OR_GRANTED';exit 0
  }
  if($obs.state -cne 'ORIGINAL_SOURCE_OWNER_AND_MASTER_OWNER_OFFLINE_TEST_SIGNATURES_REQUIRED'){
    Emit 'HOLD_ORIGINAL_SOURCE_OWNER_STATUS_NOT_EXPECTED';exit 0
  }
  Emit 'ORIGINAL_QL362_OFFLINE_ROSIE_TEST_STATUS_OBSERVED_NO_GRANT'
}catch{Emit 'HOLD_ORIGINAL_QL362_OPERATOR_READBACK_FAILED'}
