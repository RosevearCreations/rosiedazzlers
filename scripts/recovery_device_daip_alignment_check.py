#!/usr/bin/env python3
"""Build 550 fail-closed recovery/device and private multicamera source acceptance."""
from pathlib import Path
import subprocess,sys
root=Path(__file__).resolve().parents[1];errors=[]
def read(path):
 f=root/path
 if not f.is_file():errors.append("missing "+path);return ""
 return f.read_text(encoding="utf-8",errors="replace")
rules={
 "functions/api/_lib/recovery-authenticated-device-field-closure-550.js":["build550RecoveryDeviceFieldClosure","retain_recovery_hold","retain_device_hold","automatic_hold_change:false","live_restore_performed:false"],
 "functions/api/admin/recovery_authenticated_device_closure_review.js":["build550RecoveryDeviceFieldClosure","recovery_authenticated_device_field_closure_550"],
 "functions/api/admin/launch_readiness_consolidated.js":["build550RecoveryDeviceFieldClosure","recovery_authenticated_device_field_closure_550"],
 "assets/launch-readiness-consolidation.js":["renderRecoveryDeviceField550","recoveryDeviceField550"],
 "admin-launch-readiness.html":['data-build550="recovery-authenticated-device-field-closure"','id="recoveryDeviceField550"'],
 "assets/daip-scene-alignment-550.js":["build550DaipSceneAlignment","editor_confirmed_camera_clock_offset_required","valid_editor_in_out_timecodes_required","publishing_authorized:false"],
 "admin-daip-media.html":['data-build550="private-multicamera-scene-alignment"','id="daipSceneEditor550"',"build550DaipSceneAlignment"],
 "scripts/recovery_device_daip_alignment_test.mjs":["manual_alignment_review_required","retain_recovery_hold"],
 "BUILD550_RECOVERY_DEVICE_FIELD_DAIP_SCENE_ALIGNMENT.md":["Build 550","Build 551","Cloudflare","DAIP"]
}
for p,words in rules.items():
 t=read(p)
 for x in words:
  if x not in t:errors.append(p+" missing "+x)
for a,b in [("admin-daip-media.html","admin-daip-media/index.html"),("admin-launch-readiness.html","admin-launch-readiness/index.html")]:
 if read(a)!=read(b):errors.append("protected route mirrors differ: "+a)
for p in [".github/workflows/development-source-gate.yml",".github/workflows/production-business-acceptance-authority.yml"]:
 t=read(p)
 for x in ["Validate recovery device field and private camera alignment","python scripts/recovery_device_daip_alignment_check.py","node scripts/recovery_device_daip_alignment_test.mjs"]:
  if x not in t:errors.append(p+" missing "+x)
for p in ["functions/api/_lib/recovery-authenticated-device-field-closure-550.js","assets/daip-scene-alignment-550.js","scripts/recovery_device_daip_alignment_test.mjs","functions/api/admin/recovery_authenticated_device_closure_review.js","functions/api/admin/launch_readiness_consolidated.js","assets/launch-readiness-consolidation.js"]:
 r=subprocess.run(["node","--check",p],cwd=root,capture_output=True,text=True)
 if r.returncode:errors.append("syntax "+p+": "+r.stderr.strip())
if errors:
 print("BUILD 550 RECOVERY, DEVICE AND DAIP SOURCE GATE: FAIL")
 for e in errors:print(" - "+e)
 sys.exit(1)
r=subprocess.run(["node","scripts/recovery_device_daip_alignment_test.mjs"],cwd=root,text=True,capture_output=True)
if r.returncode:
 print("BUILD 550 SOURCE REGRESSION FAIL",r.stderr or r.stdout)
 sys.exit(1)
print("BUILD 550 RECOVERY DEVICE AND DAIP SOURCE GATE: PASS — operator evidence and media privacy remain HOLD until verified")
