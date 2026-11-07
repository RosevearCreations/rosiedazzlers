# Rosie 794: original owner QL-361 public-safe status and file digest only.
# Never signs consent, provisions credentials, grants a source, sends GET,
# starts/stops a receiver or shares private archive bytes.
[CmdletBinding(DefaultParameterSetName='Status')]
param(
  [Parameter(Mandatory=$true)][string]$CommsCheckout,
  [Parameter(ParameterSetName='Status')][switch]$Status,
  [Parameter(ParameterSetName='ArchiveDigest',Mandatory=$true)][switch]$ArchiveDigest,
  [Parameter(ParameterSetName='ArchiveDigest',Mandatory=$true)][string]$ArchiveId
)
$ErrorActionPreference='Stop'
$pin='669a9f49351258e514b7730c290b159ef5b66c52'
$ree=$env:OS -eq 'Windows_NT' -and $env:COMPUTERNAME -ieq 'DESKTOP-AE894KC' -and $env:USERNAME -ieq 'Ree'
$jack=$env:OS -eq 'Windows_NT' -and $env:COMPUTERNAME -ieq 'Templar' -and $env:USERNAME -ieq 'jfros'
$out=[ordered]@{
  schema='rosie.comms.ql794.original-ql361-candidate-status.v1'
  state='HOLD_ORIGINAL_QL361_INDEPENDENT_AUDIT_AND_OWNER_GRANT_REQUIRED'
  originalReeHost=[bool]$ree
  independentJackHost=[bool]$jack
  reviewedQl361Commit=$false
  independentAuditorVerified=$false
  originalSourceOwnerSigned=$false
  originalMasterOwnerSigned=$false
  sourceTestAuthorized=$false
  privateBrokerGetVerified=$false
  connected=$false
  connectionState='DISCONNECTED / HOLD'
  customerCommunications=$false
  deviceActions=$false
  sourceRepositoryWrites=0
}
function Emit([string]$state){$out.state=$state;$out|ConvertTo-Json -Compress -Depth 5}
if(-not $ree -and -not $jack){Emit 'DENY_NONORIGINAL_WINDOWS_ACCOUNT';exit 0}
if($jack -and $ArchiveDigest){Emit 'DENY_JACK_CANNOT_INSPECT_REE_PRIVATE_ARCHIVE';exit 0}
try{
  $root=(Resolve-Path -LiteralPath $CommsCheckout).Path
  $commit=(& git -C $root rev-parse HEAD 2>$null)
  if($LASTEXITCODE -ne 0 -or $commit -cne $pin){
    Emit 'HOLD_ORIGINAL_COMMS_QL361_REVIEWED_COMMIT_NOT_INSTALLED';exit 0
  }
  $paths=@('runtimes/hub-relay/ql361-windows-owner-audit.ps1',
    'runtimes/hub-relay/ql361-archived-chain-audit.mjs',
    'runtimes/hub-relay/ql361-windows-private-handoff.mjs',
    'runtimes/hub-relay/ql360-original-evidence-archive.mjs',
    'runtimes/hub-relay/ql359-supervised-private-closeout.mjs')
  $dirty=@(& git -C $root status --porcelain -- $paths 2>$null |
    Where-Object {-not [string]::IsNullOrWhiteSpace($_)})
  if($LASTEXITCODE -ne 0 -or $dirty.Count -ne 0){
    Emit 'HOLD_ORIGINAL_QL361_AUDIT_DEPENDENCY_FILES_CHANGED';exit 0
  }
  $script=Join-Path $root 'runtimes\hub-relay\ql361-windows-owner-audit.ps1'
  if(-not (Test-Path -LiteralPath $script -PathType Leaf)){
    Emit 'HOLD_ORIGINAL_QL361_WINDOWS_AUDITOR_MISSING';exit 0
  }
  $out.reviewedQl361Commit=$true
  $options=@('-NoProfile','-ExecutionPolicy','RemoteSigned','-File',$script)
  if($ArchiveDigest){
    if($ArchiveId -notmatch '^ql360-[0-9a-f-]{36}\.json$'){
      Emit 'DENY_INVALID_ORIGINAL_QL360_ARCHIVE_ID';exit 0
    }
    $options+=@('-ArchiveDigest','-ArchiveId',$ArchiveId)
  }else{$options+='-Status'}
  # Upstream output may include local audit hashes/identifiers. Discard it.
  $private=@(& powershell.exe @options 2>$null)
  if($LASTEXITCODE -ne 0 -or $private.Count -ne 1){
    Emit 'HOLD_ORIGINAL_QL361_AUDIT_READBACK_FAILED';exit 0
  }
  $observation=$private[0]|ConvertFrom-Json
  if($observation.schema -cne 'rosevear.hub.ql361.windows-original-archive-audit.v1' -or
    $observation.originalReeHost -ne [bool]$ree -or
    $observation.independentJackHost -ne [bool]$jack -or
    $observation.receiverActivated -ne $false -or
    $observation.connected -ne $false -or
    $observation.connectedCount -ne 0 -or
    $observation.connectionState -cne 'DISCONNECTED / HOLD'){
    Emit 'DENY_ORIGINAL_QL361_UNEXPECTED_IDENTITY_OR_CONNECTION';exit 0
  }
  if($ArchiveDigest){
    if($observation.state -cne 'ORIGINAL_ARCHIVE_FILE_DIGEST_FOR_EXTERNAL_OWNER_AUDIT_NOT_AUTHENTICATED'){
      Emit 'HOLD_GENUINE_REE_ARCHIVE_DIGEST_NOT_AVAILABLE';exit 0
    }
    Emit 'ORIGINAL_REE_PRIVATE_ARCHIVE_DIGEST_READ_ONLY_NOT_SIGNED';exit 0
  }
  if($observation.state -cne 'ORIGINAL_SIX_SOURCE_CANDIDATE_AUDIT_PENDING_INDEPENDENT_SIGNATURE'){
    Emit 'HOLD_UNEXPECTED_ORIGINAL_QL361_STATUS';exit 0
  }
  Emit 'ORIGINAL_QL361_AUDIT_STATUS_OBSERVED_SOURCE_GRANT_STILL_HELD'
}catch{Emit 'HOLD_ORIGINAL_QL361_READBACK_UNAVAILABLE'}
