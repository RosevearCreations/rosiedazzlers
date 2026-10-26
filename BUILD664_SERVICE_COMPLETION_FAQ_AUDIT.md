# Build 664 — Service Completion & Customer Care FAQ Mobile Wording Consistency Audit

## Delivered

- Added staff-only read-only `GET /api/admin/service_completion_faq_copy_review` comparing bundled public FAQs and document templates with active database-managed `public_faq_entries` and independently managed document, notification, FAQ, aftercare and completion templates.
- Flags customer-supplied water/power instructions, blanket instant drying/curing claims, unsupported permanent results and premature payment settlement statements. Findings have bounded, redacted excerpts.
- Both Site Settings routes offer an owner-triggered review with safe text rendering. The endpoint reports inaccessible sources as warnings instead of assuming alignment.
- No completion events, invoices, balances, refunds, notification queues, consent, legal notices or owner-managed content is automatically changed.

## Verification

`node scripts/build664_service_completion_faq_test.mjs`, source gate and booking regression. Production acceptance still requires dev/main release reconciliation, GitHub required checks, Cloudflare deployment and exact-main-SHA smoke.

## Next expected Build 665

**Customer Feedback & Service Recovery Mobile Copy Consistency Review.** Audit issue-resolution and feedback wording without making service guarantees or creating unsolicited contact.
