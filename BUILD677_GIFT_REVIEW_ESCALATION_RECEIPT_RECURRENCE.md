# Build 677 — Gift Recovery Overdue Reviewer Escalation, Handoff Receipt Confirmation & Recurrence Follow-Up

## Operator flow

The existing `/admin-gift-recovery-review.html` workspace now includes a Build 677 owner-only ledger. An owner with a **real signed-in admin staff session** can:

1. **Escalate a missed reviewer deadline** only after the case's due time passes, while the case is still assigned/held. The same case version cannot be escalated twice.
2. **Confirm an internal handoff receipt** only after Build 676's independent reviewer marked a case ready and the latest Build 675 owner decision remains paid-verified and fresh (≤24 hours). At the instant of confirmation the transaction rechecks the certificate count, distinct line positions, payment intent, currency, issuance receipt, held events, delivery errors and the unexpired reviewer due time. Exactly one receipt may reference a given independent ready-review event.
3. **Open a recurring exception** against the latest independent-review/owner-follow-up event and record a structured follow-up finding (continue hold, request independent recheck or close follow-up with **no dispatch**). A recurrence opened after receipt permanently invalidates that earlier receipt as delivery authority.

Every action requires the current case version, signed-in owner UUID, unique evidence event UUID, preset reason and appropriate exact predecessor. Replay of the same evidence event and payload is idempotent; mismatched replays, stale cases, wrong users, out-of-order follow-ups and duplicate escalation/receipt events are rejected.

## Security and customer boundary

- The new `gift_issuance_review_followup_events` register is append-only by trigger, row-level security is on, public/anonymous/authenticated grants are revoked, and service role is limited to SELECT/INSERT. The SECURITY INVOKER RPC is service-role-only and uses the same per-Stripe-session transaction lock as Builds 674–676.
- The API endpoint `/api/admin/gift_review_followup` rejects unsigned header-based staff impersonation, password-bridge access, non-owner staff, cross-origin decisions, invalid identifiers and missing receipt no-dispatch acknowledgments.
- This build does **not** contact Stripe, issue/reissue gift certificates, alter balances, refund, enqueue delivery, retry sending or email/SMS anyone. Receipt confirmation is a staff acknowledgment of internal evidence, never customer confirmation.
- No certificate codes, customer emails, payment secrets, gift messages or free-form customer notes are stored in the ledger. Session identifiers and structured reason codes remain in the owner-only view.
- Old receipt acknowledgments are historical facts only. A recurrence after receipt puts the handoff back on hold.

## Acceptance

`bash scripts/current_gift_issuance_regression.sh` now includes Build 677 owner permissions, action/reason/reference validation, replay-safe model, overdue and recurrence status, CSRF defense and no-delivery contract, alongside retained 673–676 regressions. Supabase migrations include a transaction-rolled-back synthetic exercise so no lasting customer or test certificate is created. Protected PR acceptance, dev exact-SHA deployment and main exact-SHA Production authority must all pass separately before the release is GREEN.

Connected Rosie Supabase acceptance completed: the Build 677 registry and event-clock correction applied, and the rollback-only canary passed overdue escalation, identical replay, duplicate rejection, independent handoff, single owner receipt, recurrence hold, and structured follow-up. A subsequent read found **0** synthetic certificates, cases, decisions and follow-up events. RLS was enabled; neither `anon` nor `authenticated` could SELECT, the service role could not UPDATE events, and the append-only trigger existed. Existing cross-application informational Supabase RLS/no-policy advisories remain, reflecting service-only tables; this build does not open their access.

## Next expected

Build 678 — Gift Recovery Recurrence Recheck Assignment, Refreshed Handoff Evidence & Owner Closeout Oversight.
