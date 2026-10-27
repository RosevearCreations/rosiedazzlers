# Build 678 — Gift Recovery Recurrence Recheck Assignment, Refreshed Handoff Evidence & Owner Closeout Oversight

## Owner and independent reviewer workflow

1. The owner first opens a **recurrence** and records a `recurrence_followup_recorded / recheck_requested` in the existing Build 677 ledger. The new Build 678 section will not assign a recheck without that exact current evidence.
2. A signed-in owner selects the case, a different active independent staff reviewer and a deadline from 1 hour to 14 days in the future. Assignment atomically reopens even a previously ready case, resets it to `assigned`, increments its version, and creates an immutable `recheck_assigned` receipt. The new reviewer cannot be the current reviewer, assigning owner or original Build 675 decision author.
3. The newly assigned reviewer signs in with their own account, inspects the current Build 676 case and records a new independent decision. A ready handoff requires current paid-verified issuance and delivery evidence; an aged/missing/contradictory decision remains held.
4. The owner refreshes the Build 678 evidence. `handoff_refreshed` must reference that newly recorded ready-review event (after the recheck assignment), the same active reviewer and current case version. At that moment it rechecks the latest paid decision, gift issuance receipt, certificate line count/uniqueness, payment intent, currency, held webhook events, delivery exceptions, due time and 24-hour evidence age.
5. `owner_closeout_recorded` must reference the immediately previous `handoff_refreshed` event, and performs the live issuance and delivery cross-check **again**. The owner explicitly acknowledges that closeout is an internal audit outcome, not a customer delivery action.

If any new recurrence supersedes the selected one, if the reviewer evidence changes, if the case version advances, or if a recheck is duplicated, the transaction is refused and the owner hold remains. Event ID reuse is idempotent only with identical prior evidence. The transaction uses the same Stripe-session advisory lock as Builds 674–677.

**Operational owner prerequisite:** The production roster currently has one admin and one other active reviewer. When that reviewer is already assigned, no distinct reviewer is available for a genuine independent recheck. The interface must say **HOLD — no different active independent reviewer**, and must not invent or activate a second staff identity. Owner staff setup and an actual second reviewer sign-in are prerequisites to performing this workflow with real cases. The rollback-only acceptance trial creates a passwordless synthetic identity inside a subtransaction and proves it does not persist.

## Access and preservation

- The `/api/admin/gift_recheck_closeout` endpoint requires a real signed-in, active owner/admin staff identity for every GET/POST. It never accepts password-bridge or staff-header impersonation as authority. It rejects cross-origin and cross-site actions and validates UUIDs, structured reasons, version, due time, references and explicit no-dispatch acknowledgement.
- The dedicated `gift_issuance_review_recheck_events` table has RLS enabled, no anon/authenticated grants, service-role SELECT/INSERT only, an append-only UPDATE/DELETE rejection trigger, independent uniqueness guards and a service-role-only SECURITY INVOKER RPC. It records structured evidence, not customer emails, certificate codes, card data or recipient messages.
- Assignment changes only the independent review **case** assignment/version/status. Fresh handoff and closeout only append immutable evidence. No Stripe charges, gift issuance, balances, refunds, email, SMS, provider sends, delivery queue, customer consent, public API or stored customer data are changed.
- The previous Build 677 handoff receipt is never reused as new authority after a recurrence. Owners must await new reviewer evidence and record the new handoff and closeout explicitly.

## Exact Production SHA gate repair

The production business workflow now runs its existing **read-only** exact-SHA Cloudflare metadata and runtime smoke job on explicit `workflow_dispatch` from protected `main`, as well as `push` to `main`. This closes the Build 677 case where manually run production business suites passed but the exact deployment job was silently skipped. It cannot execute against `dev`, a feature branch or a PR.

## Verification and release boundaries

- `bash scripts/current_gift_issuance_regression.sh` includes retained Builds 673–677 plus Build 678 owner-session, recurrence chain, reassignment, fresh reviewer, no-dispatch acknowledgement, closeout and stale/cross-origin denial tests.
- Database acceptance includes `20261027025205_build678_gift_recheck_rollback_canary.sql`: an end-to-end assignment, blocked original reviewer, blocked premature handoff, independent refreshed reviewer decision, handoff replay, closeout and duplicate-closeout rejection. All synthetic records (including the temporary third staff row) are rolled back and confirmed absent. The `20261027025206` follow-up guards evidence ordering by the incremented case version, not comparisons between `now()` and `clock_timestamp()` from different ledger functions.
- Main Production GREEN requires the exact deployed main commit's Cloudflare Pages success, source gate, production business A–D/aggregate and **non-skipped exact-SHA Production runtime** job all passing. No action here authorizes live customer dispatch.

## Next expected

Build 679 — Gift Recovery Closeout Recurrence Watch, Evidence Freshness Renewal & Independent Customer-Safe Audit.
