# Build 609 — Rendered Visual Audit Evidence Reconciliation

The Phase 2 browser inspector exports one local, manually initiated report per rendered screen. Build 609 adds a **local-only reconciliation command** to compare multiple such reports without uploading customer data or confusing static source coverage with live rendered verification.

Run `node scripts/reconcile_rendered_visual_audits.mjs report1.json report2.json` on approved, locally downloaded audit reports. The JSON output goes to standard output, not a network endpoint. Supply only reports reviewed for internal handling; do not commit exported Admin reports or customer content.

The reconciliation includes page paths, viewport dimensions, counts, incomplete/truncated status and exact broken **public static** paths. Protected, external, R2 and dynamic URLs, DOM selectors, alt-text content, image pixels, query strings and customer records are not carried forward. Duplicate page/viewport captures are flagged. Pending/lazy media remain distinct from broken files.

Safety boundaries: accepts a maximum of 250 files of 2 MB each; rejects malformed schemas, unsafe page paths and invalid counts; never modifies the website, bookings, images, R2, database, theme selection or approvals. The output is a **sample audit**, not complete route coverage or production acceptance. Authorized Admin browser sessions, optional process artwork, image-specific size requirements, accessibility, and Cloudflare exact-SHA checks still require separate review.

Verification: `node scripts/reconcile_rendered_visual_audits_test.mjs` and `node scripts/standard_theme_phase2_test.mjs`.

**Next proposed:** Build 610 — Approved Image Slot Size/Aspect Reconciliation & Admin Visual Exception Triage, subject to real reviewed reports and media approval boundaries.
