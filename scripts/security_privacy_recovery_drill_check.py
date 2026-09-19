#!/usr/bin/env python3
from pathlib import Path
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
errors = []

def read(rel):
    path = ROOT / rel
    if not path.exists():
        errors.append(f"missing {rel}")
        return ""
    return path.read_text(encoding="utf-8", errors="ignore")

helper = read("functions/api/_lib/security-privacy-recovery-drill.js")
endpoint = read("functions/api/admin/security_privacy_recovery_drill.js")
staff_auth = read("functions/api/_lib/staff-auth.js")
staff_session = read("functions/api/_lib/staff-session.js")
customer_session = read("functions/api/_lib/customer-session.js")
consent = read("functions/api/_lib/customer-communication-consent.js")
recovery = read("scripts/backup_restore_release_recovery_drill_check.py")
rollback = read("scripts/release_rollback_recovery_check.py")
hardening = read("scripts/performance_accessibility_security_check.py")
policy = read("BUILD424_SECURITY_PRIVACY_RECOVERY_DRILL.md").lower()
workflow = read(".github/workflows/security-privacy-recovery-drill-authority.yml")
page = read("admin/security-recovery.html")
test = read("scripts/security_privacy_recovery_drill_test.mjs")

for token in (
    "build: 424",
    'mode: "security_privacy_recovery_drill"',
    "secret_values_returned: false",
    "customer_records_returned: false",
    "consent_inferred: false",
    "recovery_source_readiness_is_real_restore_evidence: false",
    "source_green_is_secret_rotation_evidence: false",
    "source_green_is_production_recovery_evidence: false",
    "read_only: true",
    "manual_refresh_only: true",
    "secret_rotation_allowed: false",
    "production_restore_allowed: false",
    "destructive_storage_action_allowed: false",
    "consent_mutation_allowed: false",
    "staff_role_mutation_allowed: false",
    "provider_mutation_allowed: false",
    "permanent_polling: false",
):
    if token not in helper:
        errors.append(f"Build 424 helper missing {token}")

for token in (
    "requireStaffAccess",
    'capability: "it_diagnostics"',
    "getSecurityPosture",
    "STAFF_SESSION_SECRET",
    "CUSTOMER_SESSION_SECRET",
    "ALLOW_LEGACY_ADMIN_FALLBACK",
    "observed_drill: false",
    "production_mutation_performed: false",
    "methodNotAllowed",
    '"GET", "HEAD", "OPTIONS"',
    '"Cache-Control": "no-store"',
):
    if token not in endpoint:
        errors.append(f"Build 424 endpoint missing {token}")

for rel, body in (("staff session", staff_session), ("customer session", customer_session)):
    for token in ("token_hash", "revoked_at", "SESSION_ROTATE_AFTER_HOURS = 24", "HttpOnly", "SameSite=Lax", "Secure"):
        if token not in body:
            errors.append(f"{rel} authority missing {token}")

for token in (
    "requireStaffAccess",
    "BUILD267_ROLE_MODULE_CEILINGS",
    "ALLOW_LEGACY_ADMIN_FALLBACK",
    'return "it"',
):
    if token not in staff_auth:
        errors.append(f"staff role/API authority missing {token}")

for token in (
    'reason: "current_explicit_consent"',
    "inferred_consent: false",
    'blocked("customer_opted_out"',
    'blocked("channel_preference_changed"',
    'blocked("recipient_changed"',
    "provider_delivery_verified === true",
):
    if token not in consent:
        errors.append(f"privacy/consent authority missing {token}")

for token in (
    "BUILD 385 BACKUP / RESTORE / RELEASE RECOVERY DRILL: PASS",
    "observation-only",
    "explicit authorization",
):
    if token.lower() not in recovery.lower():
        errors.append(f"retained recovery authority missing {token}")

for token in (
    "ROLLBACK / RECOVERY ACCEPTANCE: PASS",
    "Production mutation remains forbidden",
):
    if token not in rollback:
        errors.append(f"retained rollback authority missing {token}")

if "Build 376 performance/accessibility/security source authority: GREEN" not in hardening:
    errors.append("retained response hardening authority is missing")

for token in (
    "aggregate counts only",
    "token hashes",
    "current explicit consent",
    "real production restore",
    "explicitly authorized",
    "no secret rotation",
    "no production restore",
    "no schema migration",
):
    if token not in policy:
        errors.append(f"Build 424 policy missing {token}")

for token in (
    "Security, privacy &amp; recovery drill",
    "/api/admin/security_privacy_recovery_drill",
    "Refresh Security Snapshot",
    "Real recovery drill observed",
):
    if token not in page:
        errors.append(f"Build 424 operator page missing {token}")

for token in (
    "Build 424 — Security, Privacy & Recovery Drill Authority",
    "python scripts/security_privacy_recovery_drill_check.py",
    "node scripts/security_privacy_recovery_drill_test.mjs",
    "python scripts/backup_restore_release_recovery_drill_check.py",
    "python scripts/release_rollback_recovery_check.py",
    "python scripts/performance_accessibility_security_check.py",
):
    if token not in workflow:
        errors.append(f"Build 424 workflow missing {token}")

if "SECURITY / PRIVACY / RECOVERY DRILL TEST: PASS" not in test:
    errors.append("Build 424 executable test is missing PASS authority")

if "setInterval(" in endpoint or "setInterval(" in helper or "setInterval(" in page:
    errors.append("Build 424 must not introduce permanent interval polling")

if re.search(r'method\s*:\s*["\'](?:POST|PUT|PATCH|DELETE)["\']', endpoint, re.I):
    errors.append("Build 424 read-only endpoint contains a mutating fetch method")

migrations = [p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])424(?:[^0-9]|$)", p.name)]
if migrations:
    errors.append("Build 424 must not introduce a schema migration: " + ", ".join(str(p.relative_to(ROOT)) for p in migrations))

commands = (
    ["node", "--check", "functions/api/_lib/security-privacy-recovery-drill.js"],
    ["node", "--check", "functions/api/admin/security_privacy_recovery_drill.js"],
    ["node", "--check", "scripts/security_privacy_recovery_drill_test.mjs"],
    ["node", "scripts/security_privacy_recovery_drill_test.mjs"],
)
for command in commands:
    proc = subprocess.run(command, cwd=ROOT, text=True, capture_output=True)
    if proc.returncode != 0:
        errors.append(f"{' '.join(command)} failed: {proc.stderr.strip() or proc.stdout.strip()}")

if errors:
    print("BUILD 424 SECURITY / PRIVACY / RECOVERY DRILL AUTHORITY: FAIL")
    for error in errors:
        print(" -", error)
    sys.exit(1)

print("BUILD 424 SECURITY / PRIVACY / RECOVERY DRILL AUTHORITY: PASS")
print(" - role/API, session-cookie and consent boundaries remain fail-closed")
print(" - security posture is reduced to safe aggregate evidence")
print(" - recovery mechanics remain observation-only and explicitly authorized")
print(" - source GREEN never becomes fabricated secret-rotation or Production-restore evidence")
print(" - no Build 424 schema, customer, consent, provider or destructive-storage mutation")
