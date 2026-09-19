#!/usr/bin/env python3
"""Build 437 Backup & Recovery Evidence Closure source authority."""
from pathlib import Path
import subprocess,sys
ROOT=Path(__file__).resolve().parents[1]; errors=[]
def read(path):
 p=ROOT/path
 if not p.is_file(): errors.append(f"missing required file: {path}"); return ""
 return p.read_text(encoding="utf-8",errors="ignore")
def require(text,needles,label):
 for needle in needles:
  if needle not in text: errors.append(f"{label} missing {needle!r}")
helper=read("functions/api/_lib/backup-recovery-evidence-closure.js"); endpoint=read("functions/api/admin/backup_recovery_evidence_closure.js"); launch=read("functions/api/admin/launch_readiness_consolidated.js"); asset=read("assets/launch-readiness-consolidation.js"); page=read("admin-launch-readiness.html"); copy=read("admin-launch-readiness/index.html"); contract=read("BUILD437_BACKUP_RECOVERY_EVIDENCE_CLOSURE.md"); blockers=read("STARTUP_GO_LIVE_BLOCKERS.md"); queue=read("AUTONOMOUS_RELEASE_QUEUE.md"); handoff=read("AI_PROJECT_HANDOFF.md"); readme=read("README.md")
require(helper,["buildBackupRecoveryEvidenceClosure","closure_candidate","observed_dated","backup_artifact","retention_location","recovery_drill","backlog_mutated:false","production_restore_performed:false","rollback_performed:false","destructive_r2_performed:false","permanent_polling:false"],"Build 437 helper")
require(endpoint,["getRecoveryExportOperationalProof","buildBackupRecoveryEvidenceClosure","build:437",'authority:"backup_recovery_evidence_closure"',"GET, HEAD, OPTIONS"],"Build 437 endpoint")
for forbidden in ["onRequestPost","onRequestPut","onRequestPatch","onRequestDelete","STAFF_SESSION_SECRET","SUPABASE_SERVICE_ROLE_KEY"]:
 if forbidden in endpoint: errors.append(f"Build 437 endpoint contains forbidden token {forbidden!r}")
require(launch,["buildBackupRecoveryEvidenceClosure","backup_recovery_evidence_closure: backupRecoveryEvidenceClosure",'current_recovery_evidence_authority: "backup_recovery_evidence_closure"'],"launch readiness composition")
require(asset,["Dated recovery evidence","Latest dated recovery evidence","closure candidate never edits the HOLD backlog automatically"],"launch readiness client")
require(page,['data-build437="backup-recovery-evidence-closure"',"Backup, export & recovery evidence closure","Loading dated recovery evidence","Current recovery evidence refresh:"],"launch readiness page")
if page!=copy: errors.append("admin-launch-readiness route copy drift")
require(contract,["# Build 437 — Backup & Recovery Evidence Closure","/api/admin/backup_recovery_evidence_closure","closure_candidate","STARTUP_GO_LIVE_BLOCKERS.md","Build 438 — Authenticated Device & Visual Acceptance"],"Build 437 contract")
require(blockers,["Recovery / backup evidence","backup_recovery_evidence_closure","closure candidate"],"canonical HOLD backlog")
require(queue,["BUILD437_BACKUP_RECOVERY_EVIDENCE_CLOSURE.md","FORWARD_BUILD_ROADMAP_436_445.md"],"release queue retained Build 437 authority")
require(handoff,["BUILD437_BACKUP_RECOVERY_EVIDENCE_CLOSURE.md",".github/workflows/backup-recovery-evidence-closure-authority.yml","scripts/backup_recovery_evidence_closure_check.py"],"project handoff retained Build 437 authority")
require(readme,["BUILD437_BACKUP_RECOVERY_EVIDENCE_CLOSURE.md","scripts/backup_recovery_evidence_closure_check.py"],"README retained Build 437 authority")
for p in ["functions/api/_lib/backup-recovery-evidence-closure.js","functions/api/admin/backup_recovery_evidence_closure.js","functions/api/admin/launch_readiness_consolidated.js","assets/launch-readiness-consolidation.js","scripts/backup_recovery_evidence_closure_test.mjs"]:
 r=subprocess.run(["node","--check",p],cwd=ROOT,text=True,capture_output=True)
 if r.returncode: errors.append(f"{p} syntax failed: {r.stderr.strip() or r.stdout.strip()}")
for cmd in [["node","scripts/backup_recovery_evidence_closure_test.mjs"],["python","scripts/recovery_export_operational_proof_check.py"],["node","scripts/recovery_export_operational_proof_test.mjs"],["python","scripts/backup_restore_release_recovery_drill_check.py"],["python","scripts/release_rollback_recovery_check.py"],["python","scripts/security_privacy_recovery_drill_check.py"],["node","scripts/security_privacy_recovery_drill_test.mjs"]]:
 r=subprocess.run(cmd,cwd=ROOT,text=True,capture_output=True)
 if r.returncode: errors.append(f"retained authority failed: {' '.join(cmd)}: {r.stderr.strip() or r.stdout.strip()}")
if errors:
 print("BACKUP & RECOVERY EVIDENCE CLOSURE AUTHORITY: FAIL")
 for e in errors: print(" -",e)
 sys.exit(1)
print("BACKUP & RECOVERY EVIDENCE CLOSURE AUTHORITY: PASS")
print(" - backup artifact, retention location and bounded drill evidence must be observed and dated")
print(" - source routes and source/runtime GREEN never substitute for observed recovery evidence")
print(" - canonical HOLD backlog is never mutated automatically")
print(" - no Production restore/rollback/DNS/secret/R2/schema/business mutation or permanent polling is introduced")
