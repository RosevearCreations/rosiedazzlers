# Explicit local signer proposal. Never creates staff accounts or installs remote pins.
param([Parameter(Mandatory=$true)][ValidateSet('PHYSICAL_WITNESS','RUNTIME_INSPECTOR','CERTIFICATION_AUTHORITY')][string]$Role,[Parameter(Mandatory=$true)][string]$StaffId,[ValidateSet('Inspect','Create')][string]$Mode='Inspect',[switch]$ConfirmNewUnenrolledKey)
$ErrorActionPreference='Stop'
if($StaffId -notmatch '^[a-fA-F0-9-]{36}$'){throw 'Use your independently verified actual staff UUID.'}
$root=Join-Path $env:LOCALAPPDATA 'Rosie927-private'
$dir=Join-Path $root $Role
$user=[System.Security.Principal.WindowsIdentity]::GetCurrent().User
$system=New-Object System.Security.Principal.SecurityIdentifier('S-1-5-18')
function AssertPrivate([string]$p){
 $item=Get-Item -LiteralPath $p -Force
 if($item.Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'REPARSE_POINT_REJECTED'}
 $acl=Get-Acl -LiteralPath $p
 if($acl.GetOwner([System.Security.Principal.SecurityIdentifier]).Value -ne $user.Value){throw 'PRIVATE_OWNER_MISMATCH'}
 if(-not $acl.AreAccessRulesProtected){throw 'PRIVATE_ACL_INHERITANCE_NOT_DISABLED'}
 foreach($rule in $acl.GetAccessRules($true,$true,[System.Security.Principal.SecurityIdentifier])){
  if($rule.AccessControlType -eq 'Allow' -and $rule.IdentityReference.Value -notin @($user.Value,$system.Value)){throw 'PRIVATE_ACL_OTHER_PRINCIPAL'}
 }
}
function NewPrivateDirectory([string]$p){
 if(Test-Path -LiteralPath $p){AssertPrivate $p;return}
 [void](New-Item -ItemType Directory -Path $p)
 $acl=New-Object System.Security.AccessControl.DirectorySecurity
 $acl.SetOwner($user);$acl.SetAccessRuleProtection($true,$false)
 foreach($sid in @($user,$system)){
  $rule=New-Object System.Security.AccessControl.FileSystemAccessRule($sid,'FullControl','ContainerInherit,ObjectInherit','None','Allow')
  $acl.AddAccessRule($rule)
 }
 Set-Acl -LiteralPath $p -AclObject $acl
 AssertPrivate $p
}
if($Mode -eq 'Create'){
 if(-not $ConfirmNewUnenrolledKey){throw 'Explicit new unenrolled key confirmation required. Reuse existing pinned key instead.'}
 NewPrivateDirectory $root;NewPrivateDirectory $dir
}else{AssertPrivate $root;AssertPrivate $dir}
foreach($f in @('signer.pem','config.json')){
 $p=Join-Path $dir $f
 if(Test-Path -LiteralPath $p){
  $item=Get-Item -LiteralPath $p -Force
  if($item.Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'UNSAFE_FILE_LINK'}
  $a=Get-Acl -LiteralPath $p
  if($a.GetOwner([System.Security.Principal.SecurityIdentifier]).Value -ne $user.Value){throw 'PRIVATE_FILE_OWNER_MISMATCH'}
  foreach($r in $a.GetAccessRules($true,$true,[System.Security.Principal.SecurityIdentifier])){
   if($r.AccessControlType -eq 'Allow' -and $r.IdentityReference.Value -notin @($user.Value,$system.Value)){throw 'PRIVATE_FILE_ACL_OTHER_PRINCIPAL'}
  }
 }
}
Push-Location (Split-Path $PSScriptRoot -Parent)
try{& node (Join-Path $PSScriptRoot 'build927-local-signer.mjs') $Role $StaffId $dir $Mode;if($LASTEXITCODE -ne 0){throw 'SIGNER_PROPOSAL_FAILED'}}finally{Pop-Location}
