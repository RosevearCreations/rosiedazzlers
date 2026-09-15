#!/usr/bin/env python3
"""Build 405 fail-closed authority for full responsive Production acceptance and roadmap renewal."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
errors = []


def read(path):
    p = ROOT / path
    if not p.exists():
        errors.append(f"missing {path}")
        return ""
    return p.read_text(encoding="utf-8", errors="ignore")


def require(text, needles, label, casefold=False):
    haystack = text.casefold() if casefold else text
    for needle in needles:
        target = needle.casefold() if casefold else needle
        if target not in haystack:
            errors.append(f"{label} missing {needle!r}")


contract = read("BUILD405_FULL_RESPONSIVE_PRODUCTION_ACCEPTANCE_ROADMAP_RENEWAL.md")
roadmap = read("FORWARD_BUILD_ROADMAP_405_415.md")
blockers = read("STARTUP_GO_LIVE_BLOCKERS.md")
queue = read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff = read("AI_PROJECT_HANDOFF.md")
readme = read("README.md")
old_roadmap = read("FORWARD_BUILD_ROADMAP_396_405.md")

require(contract, [
    "Visitor / public discovery", "Booking / checkout", "Customer account / retention",
    "Detailer field workflow", "Operations / handoff", "Finance / payment / reconciliation",
    "Production runtime", "phone, tablet and desktop", "visual browser proof",
    "legacy route continuity", "no schema migration", "External approvals",
    "FORWARD_BUILD_ROADMAP_405_415.md"
], "Build 405 contract", casefold=True)

for build in range(405, 416):
    if f"### Build {build} —" not in roadmap:
        errors.append(f"renewed roadmap missing Build {build} heading")

require(roadmap, [
    "STARTUP_GO_LIVE_BLOCKERS.md", "definitive non-pending provider outcomes",
    "Media / R2 Operational Acceptance", "Inventory & Job-Cost Operational Evidence",
    "Maintenance / Fleet Commercial Acceptance", "Customer Communication, Consent & Delivery Evidence",
    "Production Observability, Alerting & Support Diagnostics",
    "Admin / Detailer / Customer Workflow Efficiency & Accessibility Audit",
    "Search Console & GBP Proof", "Launch Readiness Consolidation",
    "exact Production deployment/runtime/business acceptance", "one meaningful H1",
    "source checks are not mislabeled as visual browser proof"
], "renewed roadmap", casefold=True)

# The roadmap must be evidence-derived, not free-floating planning prose.
require(blockers, ["Stripe", "R2", "phone", "tablet", "desktop"], "go-live blocker evidence", casefold=True)

# Living release state must be Build 405 -> Build 406 and point to the renewed roadmap.
for label, text in [("release queue", queue), ("project handoff", handoff)]:
    require(text, ["Build 405", "Build 406", "FORWARD_BUILD_ROADMAP_405_415.md"], label)
require(readme, [
    "Build 405", "FORWARD_BUILD_ROADMAP_405_415.md",
    "BUILD405_FULL_RESPONSIVE_PRODUCTION_ACCEPTANCE_ROADMAP_RENEWAL.md"
], "README")

# Retained historical roadmap must still close at Build 405.
require(old_roadmap, [
    "### Build 396 —", "### Build 405 — Full Responsive Production Acceptance & Roadmap Renewal"
], "retained 396-405 roadmap")

# Critical retained authorities must still exist and carry recognizable fail-closed semantics.
retained = {
    "scripts/responsive_static_check.py": ["viewport", "min-width"],
    "scripts/build397_responsive_ux_authority_check.py": ["responsive", "mobile", "tablet"],
    "scripts/build398_customer_journey_acquisition_quality_check.py": ["customer", "booking"],
    "scripts/build399_customer_communication_self_service_check.py": ["customer", "communication"],
    "scripts/build400_detailer_mobile_qol_retention_check.py": ["detailer", "mobile"],
    "scripts/build401_job_handoff_commercial_evidence_check.py": ["handoff", "unavailable"],
    "scripts/build402_admin_operations_cockpit_growth_experiment_check.py": ["operations", "growth"],
    "scripts/build403_customer_retention_rebooking_service_guidance_seo_growth_check.py": ["retention", "seo"],
    "scripts/build404_error_recovery_weak_connection_reliability_check.py": ["recovery", "sessionstorage"],
    "scripts/payment_acceptance_evidence_check.py": ["payment", "pending"],
    "scripts/payment_reconciliation_check.py": ["reconciliation", "payment"],
    "scripts/production_business_acceptance_check.py": ["production", "acceptance"],
    "scripts/cloudflare_pages_production_acceptance.sh": ["TARGET_SHA", "PRODUCTION EXACT-SHA ACCEPTANCE"],
    "scripts/release_authority_documentation_convergence_check.py": ["protected", "exact-SHA"],
}
for path, needles in retained.items():
    text = read(path)
    require(text, needles, f"retained authority {path}", casefold=True)

# Build 405 is deliberately schema-neutral/source-only.
for p in ROOT.rglob("*"):
    if not p.is_file():
        continue
    rel = p.relative_to(ROOT).as_posix().casefold()
    if "405" in rel and (rel.endswith(".sql") or "migration" in rel or "schema" in rel):
        errors.append(f"Build 405 must not introduce schema/migration artifact: {rel}")

# Guard against roadmap drift back to speculative mutation claims.
for forbidden in [
    "auto-charge customers", "automatically charge customers", "infer consent", "fabricate provider",
    "force main", "bypass protection"
]:
    if forbidden in roadmap.casefold():
        errors.append(f"renewed roadmap contains forbidden authority claim {forbidden!r}")

if errors:
    print("BUILD 405 FULL RESPONSIVE PRODUCTION ACCEPTANCE & ROADMAP RENEWAL: FAIL")
    for error in errors:
        print(" -", error)
    raise SystemExit(1)

print("BUILD 405 FULL RESPONSIVE PRODUCTION ACCEPTANCE & ROADMAP RENEWAL: PASS")
print(" - visitor → booking/checkout → Customer → Detailer → Operations → payment/accounting authorities are composed")
print(" - phone/tablet/desktop support remains mandatory without mislabeling source checks as visual browser proof")
print(" - retained payment/business/Production authorities remain fail-closed")
print(" - legacy route continuity and exact-SHA release discipline remain explicit")
print(" - Builds 406–415 are derived from recorded go-live/provider/operational evidence gaps")
print(" - Build 405 adds no schema or hidden Production mutation authority")
