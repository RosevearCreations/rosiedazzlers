# Build 676 — Gift Recovery Independent Reviewer Assignment, Decision Evidence Aging & Safe Delivery Handoff

## What changes

- A dedicated **Independent Gift Recovery Review** page (`/admin-gift-recovery-review.html`) allows an authenticated owner to choose an existing Build 675 decision, select an active *different* staff reviewer, and assign a due date between 1 hour and 14 days ahead. The same decision may be reassigned only through an audited event while not in final ready state.
- The assigned reviewer signs in with their **own** staff session. Their case list is filtered to their identity. They can record an evidence hold, delivery-specific hold, stale-evidence recheck or a **ready for owner delivery review** disposition. The owner cannot substitute a header-based staff identity or record the reviewer outcome unless genuinely assigned with separate credentials and not the original decision maker/assigner.
- The register displays decision evidence age in hours, a 24-hour freshness warning, overdue status and overdue hours, case status and version, and immutable assignment/review event history. Overdue outcomes are still recordable as holds; an overdue decision is never automatically released.
- The ready handoff is gated in one Postgres transaction on an existing *latest* Build 675 verified no-action closeout, a valid independent reviewer and case version, evidence age ≤24 hours, a consistent atomic issuance receipt, all certificate lines/amount references matching, no held webhook events, and no unresolved recipient or purchaser-copy delivery review statuses.

## Customer and permission boundaries

- The new cases and events tables use RLS, revoke public/anon/authenticated access, and restrict service-role operations. Event history is append-only with a trigger denying UPDATE/DELETE. Two service-only SECURITY INVOKER RPCs serialize under the same checkout-session advisory lock used by Builds 674–675.
- No new API creates gift certificates, changes credit, refunds a Stripe payment, sends or retries an email/SMS, or marks external delivery completed. A ready handoff means **only** that a separate owner delivery review can proceed; it is not consent to dispatch a notification.
- No customer email, gift code, provider key, raw webhook, gift message or free-text customer note enters the review event ledger. Only narrow identifiers, preset reason/outcome codes, reference counts and evidence age are persisted.
- An active reviewer must be different from both the owner assigning the case and the Build 675 decision author. The actual connected Rosie database has two active staff profiles as of rollout review (one admin); no additional staff account is fabricated by this build.

## Verification

- `bash scripts/current_gift_issuance_regression.sh` runs the retained 673–675 gift regressions plus Build 676 tests for owner-only assignment, bridge-auth rejection, reviewer-scoped views, independent signed sessions, reason/acknowledgement gates, due/age checks and no-dispatch contracts.
- The migration must be applied and checked with security/grant probes and a deliberately rolled-back synthetic independent reviewer assignment/outcome trial. Existing customer records must remain unchanged. Development and Production must pass exact-SHA Cloudflare deployment and source/acceptance gates separately.
- Connected Rosie Dazzlers Supabase verification: Build 676 registry migration applied; both tables have RLS enabled, `anon`/`authenticated` cannot SELECT, and service role cannot UPDATE the append-only events table. One active blocking trigger was verified. A separate successful rollback-only migration used the two pre-existing active staff accounts (without creating or altering either), created a purely synthetic paid issuance, confirmed self-review refusal, assignment, held-webhook handoff refusal, separately signed-off handoff readiness and replay idempotency, then rolled back all synthetic rows. An independent follow-up query returned **0 certificates, 0 receipts, 0 webhook events, 0 owner decisions, 0 reviewer cases and 0 reviewer events** for the canary IDs. This does not constitute a live customer email or payment trial.

## Next expected

Build 677 — Gift Recovery Overdue Reviewer Escalation, Handoff Receipt Confirmation & Recurrence Follow-Up.
