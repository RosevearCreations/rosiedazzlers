#!/usr/bin/env python3
"""Build 551 read-only commercial pilot and private DAIP editor acceptance."""
from pathlib import Path
import subprocess,sys
root=Path(__file__).resolve().parents[1];errors=[]
def read(path):
 p=root/path
 if not p.is_file():errors.append("missing "+path);return ""
 return p.read_text(encoding="utf-8",errors="replace")
rules={
 "functions/api/_lib/maintenance-fleet-commercial-decision-551.js":["build551MaintenanceFleetCommercialDecision","retain_commercial_pilot_hold","no_recurring_billing:true","no_capacity_reservation:true"],
 "functions/api/admin/maintenance_fleet_pilot_continuation_decision.js":["build551MaintenanceFleetCommercialDecision","maintenance_fleet_commercial_pilot_decision_551"],
 "assets/build439-maintenance-fleet-owner-approval.js":["renderPilotCommercial551","maintenance_fleet_commercial_pilot_decision_551"],
 "admin-maintenance-fleet-owner-approval.html":['data-build551="maintenance-fleet-commercial-pilot-decision"','id="maintenanceFleetCommercial551"'],
 "assets/daip-private-video-editor-551.js":["build551DaipPrivateEditWorkspace","public_export_authorized:false","media_rendered:false","privacy_redaction_verified:false"],
 "admin-daip-media.html":['data-build551="private-video-edit-workspace"','id="daipEditReview551"','id="daipEditVideo551"','id="daipEditLocalFile551"',"build551DaipPrivateEditWorkspace","URL.createObjectURL(file)","URL.revokeObjectURL"],
 "BUILD551_MAINTENANCE_FLEET_DAIP_PRIVATE_EDITOR.md":["Build 551","Build 552","Cloudflare"],
 "scripts/maintenance_fleet_daip_private_editor_test.mjs":["private_cut_list_ready_for_render_authorization","retain_commercial_pilot_hold"]
}
for p,strings in rules.items():
 t=read(p)
 for s in strings:
  if s not in t:errors.append(p+" missing "+repr(s))
for a,b in [("admin-daip-media.html","admin-daip-media/index.html"),("admin-maintenance-fleet-owner-approval.html","admin-maintenance-fleet-owner-approval/index.html")]:
 if read(a)!=read(b):errors.append("protected admin route mirrors differ: "+a)
for p in [".github/workflows/development-source-gate.yml",".github/workflows/production-business-acceptance-authority.yml"]:
 t=read(p)
 for s in ["Validate pilot commercial source and private editor","python scripts/maintenance_fleet_daip_private_editor_check.py","node scripts/maintenance_fleet_daip_private_editor_test.mjs"]:
  if s not in t:errors.append(p+" missing "+repr(s))
for p in ["functions/api/_lib/maintenance-fleet-commercial-decision-551.js","functions/api/admin/maintenance_fleet_pilot_continuation_decision.js","assets/build439-maintenance-fleet-owner-approval.js","assets/daip-private-video-editor-551.js","scripts/maintenance_fleet_daip_private_editor_test.mjs"]:
 r=subprocess.run(["node","--check",p],cwd=root,capture_output=True,text=True)
 if r.returncode:errors.append("JS syntax failed "+p+": "+r.stderr.strip())
if errors:
 print("BUILD 551 SOURCE ACCEPTANCE: FAIL")
 for e in errors:print(" - "+e)
 sys.exit(1)
r=subprocess.run(["node","scripts/maintenance_fleet_daip_private_editor_test.mjs"],cwd=root,capture_output=True,text=True)
if r.returncode:
 print("BUILD 551 REGRESSION FAIL",r.stderr or r.stdout)
 sys.exit(1)
print("BUILD 551 SOURCE ACCEPTANCE: PASS. Manual commercial decisions and private media exports remain separate approval boundaries.")
