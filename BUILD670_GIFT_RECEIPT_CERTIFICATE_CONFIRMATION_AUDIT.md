# Build 670 — Gift Receipt, Certificate & Redemption Confirmation Mobile Readability Audit

## Delivered

- Staff-only, GET-only `/api/admin/gift_receipt_certificate_confirmation_mobile_review` reports receipt, certificate, booking-document and e-gift wording risks without fetching any real customer receipt, gift code, Stripe session or booking token.
- The mobile-friendly review card is available in both Admin Site Settings routes with keyboard-operable buttons, `aria-live` status and bounded, redacted source summaries.
- Compares static public `/gifts`, `/gift-cards`, `/gift-certificate-print`, `/order-confirmation` and `/order-confirmation.html`; bundled policy/FAQ/document templates; and managed FAQ, notification, policy, document and gift-delivery settings. Missing/unavailable sources are explicit, not treated as pass.
- Separates **purchasing a gift**, **looking up a gift receipt**, **presenting a printable certificate**, **applying eligible gift value during checkout**, and **confirming a paid or approved gift-covered appointment**. It flags misleading claims that one proves another, guarantees complete payment or guarantees live remaining value.
- Corrects an observed zero-balance display bug in both printable gift-certificate page variants and e-gift delivery rendering: use nullish fallback (`remaining_cents ?? face_value_cents ?? 0`) so a genuine zero is shown as zero, not the original gift face value. No amount in Supabase is changed and no email is sent by this release.
- Retains owner findings for the pre-existing `/order-confirmation` versus `.html` variant drift and the ambiguous **Deposit due / paid** label. These require payment-evidence-aware copy decisions, not a blanket payment-status change.
- The one-year gift-validity/non-refund wording is still subject to Build 668 owner/legal review; this build does not approve or amend those terms.

## Verification and promotion

Run `node scripts/build670_gift_receipt_certificate_confirmation_test.mjs`, `bash scripts/current_source_gate_contracts.sh`, `bash scripts/current_booking_wizard_regression.sh`, and `git diff --check`.

Promote `dev` through protected PR to `main`; verify the Current Source Gate and Production Business Acceptance A–D plus aggregates, exact deployed production SHA and read-only public smoke. No issuance, redemption, payment, booking, email or stored customer record mutation is required.

## Next expected Build 671

**Gift Delivery Status, Failed Delivery & Owner Resend Guidance Mobile Copy Audit** — review scheduled delivery, failure and owner-resend explanations without triggering messages.
