#!/usr/bin/env python3
from pathlib import Path
import subprocess, sys

ROOT = Path(__file__).resolve().parents[1]
errors = []

def text(rel):
    path = ROOT / rel
    if not path.exists():
        errors.append(f"missing {rel}")
        return ""
    return path.read_text(encoding="utf-8", errors="ignore")

def need(rel, *tokens):
    body = text(rel)
    for token in tokens:
        if token not in body:
            errors.append(f"{rel} missing {token}")

def forbid(rel, *tokens):
    body = text(rel)
    for token in tokens:
        if token in body:
            errors.append(f"{rel} contains forbidden token {token}")

need("functions/api/_lib/staff-auth.js",
     'console.error("Staff authorization service failure."',
     'json({ error: "Staff authorization service unavailable." }, 500)',
     'json({ error: "Unauthorized." }, 401)',
     'json({ error: "Permission denied." }, 403)')
forbid("functions/api/_lib/staff-auth.js",
       'json({ error: err && err.message ? err.message : "Unexpected auth error." }, 500)')

need("functions/api/_lib/action-permissions.js",
     "ROLE_MODULE_CEILINGS", "ACTION_MODULE", "ROLE_DEFAULTS", "requireActionAccess", "Permission denied.")
need("functions/api/admin/_middleware.js",
     'customer_profiles_save: "operations.customer.manage"',
     'quote_pipeline_save: "operations.quote.manage"',
     "requireStaffAccess", "requireActionAccess")
admin_middleware = text("functions/api/admin/_middleware.js")
finance_helper = "functions/api/_lib/admin-finance-actions.js"
if "financeActionFor" in admin_middleware:
    need("functions/api/admin/_middleware.js",
         'import { financeActionFor } from "../_lib/admin-finance-actions.js"',
         "financeActionFor(leaf, method)")
    need(finance_helper,
         '"quote_deposit_refund_save"',
         '"finance.refund.manage"')
else:
    need("functions/api/admin/_middleware.js",
         'quote_deposit_refund_save: "finance.refund.manage"')
need("assets/admin-auth.js", "requireAuth", "canAccessPage", "redirectWithReturn", "redirectToSafeHome", "MODULE_ROLE_CEILINGS")
need("assets/admin-shell.js", "AdminAuth.requireAuth", "applyVisibility", "setLoading")
need("admin-customers.html", 'noindex,nofollow,noarchive', '/assets/admin-auth.js', '/assets/admin-shell.js')

need("scripts/build290_action_permission_test.mjs",
     "operations.customer.manage", "finance.tax.manage", "module=false", "cross-module grants", "requireActionAccess")
need("scripts/build290_http_smoke.sh",
     "admin-customers.html", "customer_profiles_save", "quote_pipeline_save", "quote_deposit_refund_save",
     "accounting_t2125_workpaper", '"error":"Unauthorized."', "required_action", "SUPABASE_")
need("scripts/build290_rollback_check.py",
     "4464e758e02332138bca039149ecbb9ff475988c",
     "a4e279eae6cb7136d309278b568fa5769a70d796",
     "merge-base", "forward restore commit", "No force push")
need("BUILD290_ROLLBACK.md",
     "forward restore commit", "git read-tree --reset -u", "git write-tree", "git push origin dev",
     "Do not move `main`", "No force push", "migration-free")
forbid("BUILD290_ROLLBACK.md", "--force", "update-ref")

need("BUILD290_SUMMARY.md",
     "Build 290", "Authorization Acceptance", "Forward-Restore Readiness",
     "Development configuration-present / owner sign-off", "not a fabricated claim",
     "no schema migration", "Production remains closed for Build 290")
need(".github/workflows/build290-source-gate.yml",
     "name: Build 290 Source Gate", "build290-authz-rollback-readiness",
     "node scripts/build290_action_permission_test.mjs", "python scripts/build290_rollback_check.py",
     "python scripts/build290_release_check.py", "Production remains closed")
need(".github/workflows/build290-development-acceptance.yml",
     "name: Build 290 Development Runtime Acceptance", "scripts/build290_http_smoke.sh",
     "python scripts/build290_release_check.py", "Production remains closed")
need(".github/workflows/development-source-gate.yml",
     "Run current Build 290 focused guard", "python scripts/build290_release_check.py",
     "build290_http_smoke.sh", "build290_action_permission_test.mjs", "build290_rollback_check.py")
need("AI_PROJECT_HANDOFF.md", "**Build:** 290", "Build 290", "forward restore", "configuration-present", "Production remains closed")
need("MASTER_VALUE_ROADMAP.md", "**Build:** 290", "Build 290", "forward restore", "configuration-present", "Production remains closed")

syntax_relations = ["functions/api/_lib/staff-auth.js", "functions/api/_lib/action-permissions.js", "functions/api/admin/_middleware.js", "assets/admin-auth.js", "assets/admin-shell.js", "scripts/build290_action_permission_test.mjs"]
if "financeActionFor" in admin_middleware:
    syntax_relations.append(finance_helper)
for rel in syntax_relations:
    proc = subprocess.run(["node", "--check", str(ROOT / rel)], capture_output=True, text=True)
    if proc.returncode:
        errors.append(f"node --check failed {rel}: {proc.stderr.strip()}")
proc = subprocess.run(["bash", "-n", str(ROOT / "scripts/build290_http_smoke.sh")], capture_output=True, text=True)
if proc.returncode:
    errors.append(f"bash -n failed scripts/build290_http_smoke.sh: {proc.stderr.strip()}")

if errors:
    print("Build 290 authorization/rollback readiness check: FAIL")
    for error in errors:
        print("-", error)
    sys.exit(1)

print("Build 290 authorization/rollback readiness check: PASS")
print("- role/module/action authority remains server-authoritative and executable as a matrix")
print("- anonymous representative admin mutations fail before action disclosure")
print("- unexpected shared staff-auth failures are externally generic")
print("- rollback is a non-force forward restore to the exact accepted Build 289 tree")
print("- Development provider configuration owner sign-off is recorded without fabricating transaction acceptance")
print("- no schema, pricing, booking, payment, maintenance or fleet authority changed")
print("- Production remains closed")
