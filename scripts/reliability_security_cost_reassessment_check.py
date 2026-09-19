#!/usr/bin/env python3
"""Build 434 source authority for Reliability, Security & Cost Reassessment."""
from pathlib import Path
import re
import subprocess
import sys

ROOT=Path(__file__).resolve().parents[1]
errors=[]

def read(path):
    p=ROOT/path
    if not p.is_file():
        errors.append(f"missing required file: {path}")
        return ""
    return p.read_text(encoding="utf-8",errors="ignore")

def require(text,needles,label):
    for needle in needles:
        if needle not in text:
            errors.append(f"{label} missing {needle!r}")

helper=read("functions/api/_lib/reliability-security-cost-reassessment.js")
endpoint=read("functions/api/admin/reliability_security_cost_reassessment.js")
page=read("admin-reliability-reassessment.html")
copy=read("admin-reliability-reassessment/index.html")
client=read("assets/build434-reliability-reassessment.js")
auth=read("assets/admin-auth.js")
nav=read("assets/app-core/module-navigation.js")
contract=read("BUILD434_RELIABILITY_SECURITY_COST_REASSESSMENT.md")
readme=read("README.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
workflow=read(".github/workflows/reliability-security-cost-reassessment-authority.yml")
test=read("scripts/reliability_security_cost_reassessment_test.mjs")

if page != copy:
    errors.append("reassessment .html and folder-index routes must remain byte-identical")
if len(re.findall(r"<h1\b",page,re.I)) != 1:
    errors.append("reassessment page must contain exactly one H1")

require(helper,[
    "build: 434",
    'authority: "reliability_security_cost_reassessment"',
    "green_retained_controls",
    "operational_pressure",
    "stale_evidence",
    "owner_action",
    "provider_dependency",
    "unavailable_evidence",
    "cloudflare_billing_or_cpu_usage_measured: false",
    "cloudflare_cost_amount_inferred: false",
    "future_capacity_guaranteed: false",
    "attack_likelihood_inferred: false",
    "recovery_success_inferred: false",
    "read_only: true",
    "manual_refresh_only: true",
    "permanent_polling: false",
    "automatic_scaling_allowed: false",
    "automatic_retry_expansion_allowed: false",
    "cache_policy_mutation_allowed: false",
    "secret_rotation_allowed: false",
    "production_restore_allowed: false",
    "dns_mutation_allowed: false",
    "destructive_r2_allowed: false",
    "provider_mutation_allowed: false",
    "schema_migration_allowed: false"
],"Build 434 helper")

require(endpoint,[
    'requireActionAccess(access.actor, "it.runtime.view")',
    "getReliabilityCapacity",
    "getSecurityRecovery",
    "getGoLiveReadiness",
    "buildReliabilitySecurityCostReassessment",
    'X-Rosie-Reassessment',
    '"GET,HEAD,OPTIONS"'
],"Build 434 endpoint")
for forbidden in ["onRequestPost","onRequestPut","onRequestPatch","onRequestDelete",'method: "POST"','method: "PUT"','method: "PATCH"','method: "DELETE"',"setInterval("]:
    if forbidden in endpoint:
        errors.append(f"Build 434 endpoint must not contain {forbidden!r}")

require(page,[
    'data-build434="reliability-security-cost-reassessment"',
    "Reliability, Security &amp; Cost Reassessment",
    'id="refreshReassessment"',
    "GREEN retained controls",
    "Emerging operational pressure",
    "Stale evidence",
    "Owner action",
    "Provider dependency",
    "Unavailable evidence",
    "Cloudflare billing, CPU consumption, future capacity, attack likelihood and recovery success are not inferred"
],"Build 434 page")
require(client,[
    'pageKey:"admin-reliability-reassessment"',
    'fetch("/api/admin/reliability_security_cost_reassessment"',
    'method:"GET"',
    "No automatic refresh is running."
],"Build 434 client")
for forbidden in ["setInterval(","localStorage","sessionStorage",'method:"POST"','method:"PATCH"','method:"DELETE"']:
    if forbidden in client:
        errors.append(f"Build 434 client must not contain {forbidden!r}")

require(auth,['case "admin-reliability-reassessment"'],"admin auth route ceiling")
require(nav,[
    '"/admin-reliability-reassessment.html"',
    '"page_key":"admin-reliability-reassessment"',
    '"label":"Reliability Reassessment"'
],"module navigation")
require(contract,[
    "# Build 434 — Reliability, Security & Cost Reassessment",
    "GREEN retained controls",
    "current first-party traffic",
    "Cloudflare billing",
    "Build 435 — Production Learning & Roadmap Renewal"
],"Build 434 contract")
require(readme,[
    "Current source direction: **Build 434 — Reliability, Security & Cost Reassessment**",
    "scripts/reliability_security_cost_reassessment_check.py",
    "**Build 435 — Production Learning & Roadmap Renewal**"
],"README")
require(queue,[
    "**Build 434 — Reliability, Security & Cost Reassessment** is the active bounded release.",
    "**Build 435 — Production Learning & Roadmap Renewal**"
],"release queue")
require(handoff,[
    "**Build 434 — Reliability, Security & Cost Reassessment** is the active bounded release.",
    ".github/workflows/reliability-security-cost-reassessment-authority.yml",
    "scripts/reliability_security_cost_reassessment_check.py"
],"handoff")
require(workflow,[
    "Build 434 — Reliability, Security & Cost Reassessment Authority",
    "python scripts/reliability_security_cost_reassessment_check.py",
    "node scripts/reliability_security_cost_reassessment_test.mjs"
],"workflow")
if "BUILD 434 RELIABILITY / SECURITY / COST REASSESSMENT TEST: PASS" not in test:
    errors.append("Build 434 executable test is missing PASS authority")

migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])434(?:[^0-9]|$)",p.name)]
if migrations:
    errors.append("Build 434 must not introduce a schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))

if errors:
    print("BUILD 434 RELIABILITY / SECURITY / COST REASSESSMENT AUTHORITY: FAIL")
    for error in errors:
        print(" -",error)
    sys.exit(1)

for cmd in (
    [sys.executable,"scripts/reliability_performance_cost_capacity_check.py"],
    [sys.executable,"scripts/security_privacy_recovery_drill_check.py"],
    [sys.executable,"scripts/support_automation_exception_handling_check.py"],
    ["node","--check","functions/api/_lib/reliability-security-cost-reassessment.js"],
    ["node","--check","functions/api/admin/reliability_security_cost_reassessment.js"],
    ["node","--check","assets/build434-reliability-reassessment.js"],
    ["node","scripts/reliability_security_cost_reassessment_test.mjs"],
):
    proc=subprocess.run(cmd,cwd=ROOT,text=True,capture_output=True)
    if proc.returncode:
        print("BUILD 434 RELIABILITY / SECURITY / COST REASSESSMENT AUTHORITY: FAIL")
        print(f" - {' '.join(cmd)} failed: {proc.stderr.strip() or proc.stdout.strip()}")
        sys.exit(proc.returncode)

print("BUILD 434 RELIABILITY / SECURITY / COST REASSESSMENT AUTHORITY: PASS")
print(" - current reliability/traffic/security/privacy/session/recovery authorities are composed read-only")
print(" - GREEN, pressure, stale, owner, provider and unavailable evidence remain separate")
print(" - Cloudflare billing/CPU/future capacity and recovery success are never inferred")
print(" - no scaling/retry/cache/secret/restore/DNS/R2/provider/schema mutation or permanent polling")
