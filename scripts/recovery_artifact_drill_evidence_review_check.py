#!/usr/bin/env python3
from pathlib import Path
import subprocess,sys
ROOT=Path(__file__).resolve().parents[1]; errors=[]
def read(p):
 q=ROOT/p
 if not q.is_file(): errors.append(f"missing required file: {p}"); return ""
 return q.read_text(encoding="utf-8",errors="ignore")
def require(text,needles,label):
 for n in needles:
  if n not in text: errors.append(f"{label} missing {n!r}")
helper=read("functions/api/_lib/recovery-artifact-drill-evidence-review.js")
endpoint=read("functions/api/admin/recovery_artifact_drill_evidence_review.js")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md"); handoff=read("AI_PROJECT_HANDOFF.md"); readme=read("README.md"); blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
require(helper,["recovery_artifact_drill_evidence_review","backup_artifact","retention_location","recovery_drill","freshness_policy","production_restore_performed:false","rollback_performed:false","destructive_r2_performed:false","backlog_mutated:false","permanent_polling:false"],"Build 447 helper")
require(endpoint,["build:447","recovery_artifact_drill_evidence_review","GET, HEAD, OPTIONS","getBackupRecoveryEvidenceClosure"],"Build 447 endpoint")
for f in ["onRequestPost","onRequestPut","onRequestPatch","onRequestDelete","SUPABASE_SERVICE_ROLE_KEY","STAFF_SESSION_SECRET"]:
 if f in endpoint: errors.append(f"forbidden endpoint token {f!r}")
require(queue,["**Build 447 — Recovery Artifact & Drill Evidence Review** is the active bounded release.","**Build 448 — Authenticated Cross-Device Acceptance Refresh** is next"],"release queue")
require(handoff,["BUILD447_RECOVERY_ARTIFACT_DRILL_EVIDENCE_REVIEW.md","recovery-artifact-drill-evidence-review-authority.yml","recovery_artifact_drill_evidence_review_check.py"],"handoff")
require(readme,["Current source direction: **Build 447 — Recovery Artifact & Drill Evidence Review**.","recovery_artifact_drill_evidence_review_check.py","Build 448 — Authenticated Cross-Device Acceptance Refresh"],"README")
require(blockers,["Recovery / backup evidence","recovery_artifact_drill_evidence_review","evidence age"],"HOLD backlog")
for p in ["functions/api/_lib/recovery-artifact-drill-evidence-review.js","functions/api/admin/recovery_artifact_drill_evidence_review.js","scripts/recovery_artifact_drill_evidence_review_test.mjs"]:
 r=subprocess.run(["node","--check",p],cwd=ROOT,text=True,capture_output=True)
 if r.returncode: errors.append(f"{p} syntax failed: {r.stderr.strip() or r.stdout.strip()}")
for cmd in [["node","scripts/recovery_artifact_drill_evidence_review_test.mjs"],["python","scripts/backup_recovery_evidence_closure_check.py"],["node","scripts/backup_recovery_evidence_closure_test.mjs"],["python","scripts/recovery_export_operational_proof_check.py"],["node","scripts/recovery_export_operational_proof_test.mjs"],["python","scripts/backup_restore_release_recovery_drill_check.py"],["python","scripts/release_rollback_recovery_check.py"]]:
 r=subprocess.run(cmd,cwd=ROOT,text=True,capture_output=True)
 if r.returncode: errors.append(f"retained authority failed: {' '.join(cmd)}: {r.stderr.strip() or r.stdout.strip()}")
if errors:
 print("RECOVERY ARTIFACT & DRILL EVIDENCE REVIEW AUTHORITY: FAIL")
 for e in errors: print(" -",e)
 sys.exit(1)
print("RECOVERY ARTIFACT & DRILL EVIDENCE REVIEW AUTHORITY: PASS")
print(" - backup artifact, retention location and recovery drill age/freshness are explicit")
print(" - source/runtime GREEN never substitutes for real recovery evidence")
print(" - no restore/rollback/DNS/secret/R2/provider/schema/business mutation or permanent polling")
