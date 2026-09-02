#!/usr/bin/env python3
from pathlib import Path


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f"missing expected {label}")
    return text.replace(old, new, 1)

handoff_path = Path("AI_PROJECT_HANDOFF.md")
h = handoff_path.read_text(encoding="utf-8")
h = replace_once(h, "**Build:** 301  ", "**Build:** 303  ", "handoff build header")
start = h.index("## Current release state")
end = h.index("## Build 301 authority", start)
current = '''## Current release state

Build 303 is the active **Finance Tax-support maintainability extraction** release candidate, built on accepted Build 302 parent `9ec950384124644d1176a01d381745a3d8f7cfb9`. Build 302 closed the planned **Build 302 — Statement Import reliability** item against the actual surviving Finance authority: no active statement-import parser/API exists, statement reporting remains read-only/fail-closed on POST, and bank reconciliation remains separate.

Build 303 externalizes the retained Build 273 Tax Support & Accountant Readiness browser controller into `assets/admin-tax-support-v303.js` byte-for-byte. Backend authorities `functions/api/admin/accounting_tax_support.js` and `functions/api/_lib/accounting-tax-support.js` remain unchanged. T2125 support, factual mileage/home-office/capital-asset/year-end records, evidence manifest and accountant JSON package behavior are retained without new tax judgment.

The owner has explicitly authorized promotion of the exact accepted Build 303 Development source to `main`. Promotion still occurs only after the exact Development source gate, Cloudflare deployment and read-only runtime acceptance all agree. No schema/database migration, accounting-policy change, payment-provider mutation or Production data mutation belongs to Builds 302–303.

## Build 303 authority

- `assets/admin-tax-support-v303.js` is the exact former inline controller from `admin-tax-support.html`;
- `functions/api/admin/accounting_tax_support.js` and `functions/api/_lib/accounting-tax-support.js` remain unchanged;
- retained T2125/accountant-package behavior stays review-first and factual;
- Build 302 preserves the retired statement-import boundary rather than recreating obsolete ingestion authority;
- runtime acceptance remains read-only.

Retained historical compatibility marker: **Build:** 301 — Finance Reconciliation maintainability extraction in `assets/admin-accounting-v301.js`, with accepted pre-Build-301 Production anchor `ee010654aea48c12c885ea826bf7cf60f64852b7` and next historical queue marker **Build 302 — Statement Import reliability**.

'''
h = h[:start] + current + h[end:]
old_next = "**Build 302 — Statement Import reliability:** harden parsing, validation, duplicate detection and error reporting without changing accounting policy."
if old_next in h:
    h = h.replace(old_next, "**Build 304 — Accountant export integrity:** verify document/evidence references, predictable formats, safe filenames and privacy boundaries without changing accounting policy.", 1)
handoff_path.write_text(h, encoding="utf-8")

roadmap_path = Path("MASTER_VALUE_ROADMAP.md")
r = roadmap_path.read_text(encoding="utf-8")
r = replace_once(r, "**Build:** 301  ", "**Build:** 303  ", "roadmap build header")
start = r.index("## Current release boundary")
end = r.index("## Retained baseline", start)
current = '''## Current release boundary

- **Active Development slice:** Build 303 — Finance Tax-support maintainability extraction.
- **Accepted Build 302 parent:** `9ec950384124644d1176a01d381745a3d8f7cfb9`.
- Build 302 closes **Build 302 — Statement Import reliability** against the surviving fail-closed/report-only authority without recreating a retired importer.
- Build 303 preserves Build 273 Finance/T2125/accountant-package behavior while moving the tax-support browser controller to `assets/admin-tax-support-v303.js` byte-for-byte.
- `functions/api/admin/accounting_tax_support.js` and `functions/api/_lib/accounting-tax-support.js` remain unchanged.
- No schema/database migration, accounting-policy change, payment-provider mutation or new tax judgment is introduced.
- The owner has authorized promotion of the exact accepted Build 303 Development source to `main` after exact source/runtime/Cloudflare evidence agrees.
- Retained historical compatibility marker: **Build:** 301 — Build 301 — Finance Reconciliation maintainability extraction in `assets/admin-accounting-v301.js`, with accepted pre-Build-301 Production anchor `ee010654aea48c12c885ea826bf7cf60f64852b7`.

'''
r = r[:start] + current + r[end:]
r = r.replace("2. **Build 301 — Finance Reconciliation maintainability extraction** — active behavior-preserving Accounting/reconciliation runtime extraction.", "2. **Build 301 — Finance Reconciliation maintainability extraction** — complete; behavior-preserving Accounting/reconciliation runtime extraction.", 1)
r = r.replace("3. **Build 302 — Statement Import reliability** — harden parsing, validation, duplicate detection and error reporting without changing accounting policy.", "3. **Build 302 — Statement Import reliability** — complete as a fail-closed convergence guard because the accepted application has no active statement-import parser/API; no retired ingestion path was recreated.", 1)
r = r.replace("4. **Build 303 — Finance Tax-support maintainability extraction** — externalize retained T2125/tax-support/accountant-package surfaces while preserving Build 273 authority.", "4. **Build 303 — Finance Tax-support maintainability extraction** — active release candidate; retained Build 273 controller externalized byte-for-byte with backend authority unchanged.", 1)
roadmap_path.write_text(r, encoding="utf-8")

queue_path = Path("AUTONOMOUS_RELEASE_QUEUE.md")
q = queue_path.read_text(encoding="utf-8")
marker = "## Autonomous execution order"
status = '''## Current execution checkpoint\n\nBuilds 300–303 are implemented through the current Build 303 release candidate. Build 302 is closed as a fail-closed retired-import convergence guard; Build 303 externalizes retained Tax Support runtime without changing Build 273 tax/accounting authority. **Next untouched item: Build 304 — Accountant export integrity.**\n\n'''
if "## Current execution checkpoint" not in q:
    q = q.replace(marker, status + marker, 1)
queue_path.write_text(q, encoding="utf-8")

print("Build 303 living documentation synchronized")
