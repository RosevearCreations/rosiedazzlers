# Build 666 — Customer Warranty, Guarantee & Claim-Safe Mobile Message Audit

## Delivered

- Added staff-authenticated, GET-only `/api/admin/warranty_claim_mobile_copy_review`, checking bundled documents and FAQ seeds; active managed public FAQs; and managed document, notification, warranty, guarantee and claim templates.
- Flags unqualified lifetime guarantees, automatic claim approvals/payouts, apparent statutory-rights disclaimers, blanket damage protection and rigid 24-hour claim restrictions for **owner/legal review**. These are wording indicators, not legal conclusions or automatic edits. Excerpts are bounded and redact contact details/links.
- Both Site Settings routes provide an owner-triggered, accessible, text-only review and a non-binding example reply.
- No changes to Terms, Waiver, existing customer rights, incidents, claim determinations, refunds, credits, consent, SMS opt-outs, outbound messages, database records or provider controls.
- Missing or inaccessible managed sources report a warning rather than a false clean result.

## Verification and release

`node scripts/build666_warranty_claim_copy_test.mjs`, current source gate and booking regression. Production promotion requires dev/main parity, protected pull-request checks, Cloudflare exact-main-SHA acceptance and live read-only smoke.

## Next expected Build 667

**Cancellation, Rescheduling & Refund Explanation Mobile Copy Audit.** Audit explanatory copy against existing approved policies without changing financial decisions, booking eligibility or consent.
