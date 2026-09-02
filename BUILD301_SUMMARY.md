# Build 301 — Finance Reconciliation Maintainability Extraction

## Scope

Build 301 is a behavior-preserving maintainability slice for the Finance / Accounting workspace. It externalizes the accepted `admin-accounting.html` classic-script runtime into `assets/admin-accounting-v301.js` so the bank, transaction and reconciliation UI runtime is no longer embedded in the HTML page.

The accepted Build 300 Accounting root and folder routes were identical. Build 301 therefore keeps `admin-accounting.html` and `admin-accounting/index.html` aligned and makes both load the same versioned runtime asset.

## Preserved authority

- bank reconciliation reads and rendering remain unchanged;
- payroll payout reconciliation remains unchanged;
- payable settlement, recurring expense, journal, remittance, document, period-close, reporting and export behavior remain unchanged;
- statement-report and tax-report behavior remain unchanged for the later Build 302/303 slices;
- server-side authorization remains authoritative;
- no matching, posting, approval, tax/accounting judgment or provider behavior is invented or changed.

The accepted source has a Bank reconciliation form in the HTML, while the accepted inline runtime provides its existing reconciliation load/render behavior. Build 301 does not add missing write behavior or reinterpret that boundary; exact reconstruction is the authority.

## Validation

- `scripts/build301_release_check.py` reconstructs the accepted Build 300 Accounting source byte-for-byte from the versioned asset and external-script tag, allowing only terminal newline normalization;
- both Accounting route copies must remain equivalent;
- migration/schema changes are rejected;
- retained Finance endpoint/runtime tokens are checked;
- `scripts/build301_http_smoke.sh` performs GET-only Development acceptance with bounded retry for Cloudflare mutable-alias convergence;
- real posting, reconciliation, approval, transaction or provider evidence is not fabricated.

The feature candidate is complete only when the Build 301 source gate succeeds on the exact feature SHA; Development and Production remain separate acceptance boundaries.

## Database / policy boundary

Build 301 introduces **no database or schema migration** and **no accounting-policy change**.

## Release boundary

Build 301 starts from accepted Build 300 Development `ed7c0c6748db6d619fb37e515057666feed1ea70`. Accepted Production remains Build 299 `ee010654aea48c12c885ea826bf7cf60f64852b7` until the separately authorized promotion after Development acceptance.

Next queued build after Build 301 is **Build 302 — Statement Import reliability**.
