# Build 610 — Approved Image Slot Size/Aspect Reconciliation & Admin Visual Exception Triage

Build 610 continues the manually initiated Build 608/609 visual audit. It **does not automatically approve artwork**: Standard theme dimensions are design recommendations, while `data/media_requirements.json` remains the separate minimum threshold authority for real R2 assets. A rendered browser sample cannot validate private R2 keys, permissions or consent.

Run from repository root with authorized, manually exported redacted reports:

`node scripts/triage_visual_image_slots.mjs rosie-visual-services.json rosie-visual-admin-media-health.json`

The tool compares loaded public-static Standard files, with exact basename matches only, against the registered recommended dimensions and a 3% relative aspect variance review threshold. It flags departures for **manual** review, never automatically marks them broken or approved. It also classifies known Admin source routes as needing an authorized rendered capture, having a visible exception, or having a measured sample with no flagged issue. Five reserved internal artwork proposals remain unuploaded and are not fabricated. The output contains whitelisted paths, dimensions and issue categories only; it excludes private image URLs, alt-text content, DOM selectors and customer values.

Safeguards: strict Build 609 input validation, read-only local processing, no network, maximum 250 two-megabyte reports, no dynamic media replacement, no Photo Studio/R2 writes, no changes to bookings, pricing, consent, Admin access or themes. Reports are local and should **not** be committed to GitHub. Pending/lazy images require re-observation; an unobserved route is not evidence that its images are missing.

Verification: `node scripts/triage_visual_image_slots_test.mjs` and `node scripts/standard_theme_phase2_test.mjs`.

Next proposed Build 611 — Operator-Reviewed Rendered Audit Evidence Matrix & Visual Remediation Acceptance, pending real authorized browser captures and approved artwork.
