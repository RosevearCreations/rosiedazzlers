#!/usr/bin/env python3
from pathlib import Path
import subprocess,sys
root=Path(__file__).resolve().parents[1];bad=[]
def read(p):
 f=root/p
 if not f.is_file():bad.append('missing '+p);return ''
 return f.read_text(encoding='utf8')
need={'functions/api/admin/daip_media_artifact_acceptance.js':['requireStaffAccess','bucket.head(asset.object_key)','asset.project_id!==p','public_export_allowed:false','Cache-Control'],
'assets/daip-real-artifact-consent-558.js':['build558PrivateArtifactConsentReview','public_release_allowed:false','canonical_hold_closed:false'],
'admin-daip-media.html':['data-build558="daip-real-artifact-consent"','daipArtifactCheck558','build558PrivateArtifactConsentReview'],
'scripts/daip_real_artifact_consent_558_test.mjs':['private_raw_verified','declined_or_expired_consent'],
'BUILD558_REAL_MEDIA_ARTIFACT_CONSENT_ACCEPTANCE.md':['Build 558','Build 559','R2']}
for p,terms in need.items():
 content=read(p)
 for t in terms:
  if t not in content:bad.append(p+' missing '+t)
if read('admin-daip-media.html')!=read('admin-daip-media/index.html'):bad.append('DAIP mirror mismatch')
for p in ['.github/workflows/development-source-gate.yml','.github/workflows/production-business-acceptance-authority.yml']:
 s=read(p)
 for t in ['Validate DAIP private artifact and consent reconciliation','python scripts/daip_real_artifact_consent_558_check.py','node scripts/daip_real_artifact_consent_558_test.mjs']:
  if t not in s:bad.append(p+' missing '+t)
for p in ['functions/api/admin/daip_media_artifact_acceptance.js','assets/daip-real-artifact-consent-558.js','scripts/daip_real_artifact_consent_558_test.mjs']:
 a=subprocess.run(['node','--check',p],cwd=root,capture_output=True,text=True)
 if a.returncode:bad.append(a.stderr)
if bad:print('BUILD 558 GUARD FAIL\n'+'\n'.join(bad));sys.exit(1)
a=subprocess.run(['node','scripts/daip_real_artifact_consent_558_test.mjs'],cwd=root,capture_output=True,text=True)
if a.returncode:print(a.stdout,a.stderr);sys.exit(1)
print('BUILD 558 GUARD PASS')
