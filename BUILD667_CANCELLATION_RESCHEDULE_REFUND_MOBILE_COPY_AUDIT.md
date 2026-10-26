# Build 667 — Cancellation, Rescheduling & Refund Explanation Mobile Copy Audit

## Delivered

- Staff-authorized, GET-only `/api/admin/cancellation_reschedule_refund_mobile_copy_review` reviews bundled policies, document templates and FAQ seeds; managed public FAQs; and managed policy, notification, document and refund templates.
- Reads the public `/terms` route on owner request and flags categorical no-refund claims, automatic refund promises, free rescheduling assurances, fee-waiver promises, absolute short cutoffs, refund-status overstatements and consumer-rights exclusions. Findings are **advisory copy signals**, not legal findings.
- Explicitly identifies the existing **deposit-policy mismatch**: `/terms` says a deposit *is required* while bundled `data/site_policies.json` says deposits *may be requested*. This discrepancy is left for the owner to reconcile with approved policies, not silently corrected.
- Owner-triggered mobile-friendly display in both Site Settings route variants uses safe text nodes, redacted excerpts, source warnings and status messages.
- Reviews up to 100 active managed FAQ entries and a bounded subset of each template object; does not imply exhaustive legal verification.
- No booking/status changes, slot holds, cancellation decisions, payment refunds, fee waivers, policy rewrites, outbound messages, consent or customer records are touched.

## Verification and release

Run `node scripts/build667_cancellation_reschedule_refund_copy_test.mjs`, `bash scripts/current_source_gate_contracts.sh`, and `bash scripts/current_booking_wizard_regression.sh`. Promote through `dev` and a protected PR to `main`; require the exact-SHA production and current-source checks and read-only public smoke to finish GREEN.

## Next expected Build 668

**Gift Card, Voucher & Store Credit Mobile Terms Clarity Audit** — owner review of redemption and refund-related copy without modifying financial obligations.
