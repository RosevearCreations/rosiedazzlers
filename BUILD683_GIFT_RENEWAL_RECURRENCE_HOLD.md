# Rosie Dazzlers — Build 683

## Gift Recovery Follow-Up Evidence Renewal, Recurrence Exception Reassessment & Owner HOLD Continuity Audit

### Owner and independent auditor workflow

1. A signed-in owner opens **Admin → Gift Recovery → Build 683**, refreshes the current Build 682 owner-closed follow-ups, and reviews aging (60-minute warning, two-hour expiry, 24-hour overdue, 48-hour escalation), recurrence and changed closeout source.
2. The owner may append an immutable `owner_renewal_requested` event with a database-verified reason: `owner_requested_renewal`, `followup_proof_aged`, `recurrence_reopened` or `source_superseded`. This is a request for evidence, **not a customer-facing action**.
3. The **separate assigned signed-in independent auditor** may append `independent_recurrence_reassessed` only with paid read-only Stripe evidence checked in the last five minutes, unchanged checkout payment/count/currency and source hash, intact gift certificate line and recipient/copy delivery evidence, and a matching receipt. Changed source, failed delivery, absent staff or provider outage remain held.
4. A distinct signed-in owner can append `owner_hold_continuity_acknowledged` only against that fresh independent attestation within two hours. Even when an old closeout is followed by a new recurrence, the result records **continued HOLD**—never a delivery authorization, release, refund, balance change, email or SMS.
5. An expired provider proof, newer closeout, newer Build 682 follow-up or post-request reason change blocks attestation or owner acknowledgment. Restart the owner request only after reviewing the changed source; never bypass the gate.

### Security and evidence

- Append-only `gift_issuance_hold_renewal_events` records source IDs, actor and assigned auditor, event kind, calculated reason, recurrence, evidence age, paid provider fingerprint and receipt snapshot. Replays are idempotent by event ID and conflicting same-ID requests fail.
- Database session advisory lock serializes evidence writes against the original gift session; a service-role-only SQL function verifies all privilege, source, state, age, certificate and independence checks.
- Postgres RLS is enabled with no public user policy, and only service-role `SELECT`/`INSERT` and function `EXECUTE` rights. The Cloudflare API authenticates actual signed-in staff and rejects cross-origin writes.
- This build emits **zero** provider mutations, gift-issuance changes, messages or integration events. No fake staff or automated owner approvals are generated.

### Attached Rosevear Integration Contract v1 boundary

The supplied *Rosevear Cross-Application Connection Plan v1* establishes Rosie Dazzlers as the authoritative owner of bookings, deposits and gift certificates. Build 683 intentionally makes **no connection** to the AI Data Platform and shares no customer or gift data; `gift_certificate.created` or any other future integration event must wait for an authenticated Gateway connection, capability allowlist, tenant authorization, idempotency, signed receipts and an owner-approved rollout. Never give another app Supabase credentials.

### Release acceptance

- Cumulative automated gift-regression scripts: Builds 673–683.
- Schema migration: `supabase/migrations/20261027170000_build683_gift_followup_renewal_hold_audit.sql`.
- Reason-continuity correction: `supabase/migrations/20261027170001_build683_preserve_renewal_reason_continuity.sql` pins the owner's exception reason through the auditor's refreshed paid proof and owner acknowledgment, while a newly reopened recurrence or changed source still overrides it and blocks a stale handoff.
- Transactional full-chain synthetic rollback canary: `node scripts/build683_hold_renewal_canary.mjs`. Composes the 681/682 owner→auditor evidence chain; checks idempotency, self-review/stale-proof rejection, a **new** recurrence after B682 closure and final owner HOLD acknowledgment; confirms no synthetic case, gift, staff or audit row remains.
- Release hygiene, production readiness, protected GitHub feature→`dev`, `dev`→`main` gates, then Cloudflare exact-SHA Production and live-domain smoke acceptance.

### References

- Repository: https://github.com/RosevearCreations/rosiedazzlers
- Production: https://rosiedazzlers.ca
- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Data API security](https://supabase.com/docs/guides/api/securing-your-api)
