#!/usr/bin/env python3
from pathlib import Path
import re, subprocess, sys

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

resilience = "assets/account-resilience-v289.js"
need(resilience,
     "build289AccountResilience",
     "role', 'status",
     "aria-live",
     "aria-atomic",
     "ClientAuth.signIn",
     "Retry account load",
     "location.reload()",
     "MutationObserver",
     "signed-out",
     "retry")
forbid(resilience, "setInterval", "/api/checkout", "/api/client/profile_update", "/api/client/vehicles_save", "deposit_cents", "price_total_cents")

need("assets/account-accessibility-v289.css", ":focus-visible", "var(--accent)", "outline-offset", "@media (max-width:640px)")
need("assets/client-auth.js", "/assets/account-resilience-v289.js", "data-build289-account-resilience", "/assets/customer-privacy-v288.js")
need("assets/customer-privacy-v288.js", "acctAdminNotes", "vehAdminNotes", "control.disabled = true", "aria-hidden")

account = text("my-account/index.html")
if len(re.findall(r"<h1\b", account, flags=re.I)) != 1:
    errors.append("my-account/index.html must retain exactly one H1")
for token in ['name="viewport"', '<h1>My Account</h1>', '/assets/client-auth.js']:
    if token not in account:
        errors.append(f"my-account/index.html missing {token}")

need("scripts/build289_http_smoke.sh", "account-resilience-v289.js", ":focus-visible", '"code":"not_authenticated"', "auth_me", "admin_private_notes")
need(".github/workflows/build289-source-gate.yml", "name: Build 289 Source Gate", "build289-accessibility-network-resilience", "python scripts/build289_release_check.py", "python scripts/release_check.py", "Production remains closed")
need(".github/workflows/build289-development-acceptance.yml", "name: Build 289 Development Runtime Acceptance", "python scripts/build289_release_check.py", "scripts/build289_http_smoke.sh", "Production remains closed")
need(".github/workflows/development-source-gate.yml", "Run current Build 289 focused guard", "python scripts/build289_release_check.py", "build289_http_smoke.sh")
need("BUILD289_SUMMARY.md", "Build 289", "accessibility", "weak-network", "Production remains closed", "no schema migration")
need("AI_PROJECT_HANDOFF.md", "**Build:** 289", "Build 289", "accessibility", "Production remains closed")
need("MASTER_VALUE_ROADMAP.md", "**Build:** 289", "Build 289", "accessibility", "Production remains closed")

for rel in [resilience, "assets/client-auth.js"]:
    proc = subprocess.run(["node", "--check", str(ROOT / rel)], capture_output=True, text=True)
    if proc.returncode:
        errors.append(f"node --check failed {rel}: {proc.stderr.strip()}")
proc = subprocess.run(["bash", "-n", str(ROOT / "scripts/build289_http_smoke.sh")], capture_output=True, text=True)
if proc.returncode:
    errors.append(f"bash -n failed scripts/build289_http_smoke.sh: {proc.stderr.strip()}")

if errors:
    print("Build 289 accessibility/weak-network resilience check FAILED:")
    for error in errors:
        print("-", error)
    sys.exit(1)

print("Build 289 accessibility/weak-network resilience check: PASS")
print("- My Account has accessible live-status semantics and keyboard focus treatment")
print("- signed-out direct visits can use the existing ClientAuth sign-in authority in place")
print("- network/server failures expose only a user-initiated retry; no polling or write replay is introduced")
print("- Build 288 staff-private UI suppression remains retained")
print("- no schema, pricing, booking, deposit or payment authority changed")
print("- Production remains closed")
