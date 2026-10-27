# Rosie Dazzlers — Build 684

## Individual Verified Gift Release, Evidence Aging and Independent Recurrence Recheck

Build 684 implements the owner's choice to **remove the recovery HOLD for one specific gift certificate only after verification**. It does not erase historical HOLD audit events or switch off payment/issuance/delivery safeguards for other cases.

### Owner workflow

1. On **Admin → Gift Recovery**, enter the Stripe checkout session ID and complete the previous signed-in independent-review, renewal, and owner acknowledgment chain (through Build 683). Only the separate assigned auditor can attest paid evidence.
2. In **Build 684 — Individual verified gift release**, refresh that session. Each certificate is shown by its checkout line number rather than personal recipient details. If evidence is missing, aged, changed, reopened, already dispatched or previously released, the release button is unavailable.
3. A signed-in owner selects **one certificate** and explicitly confirms no prior send or queued delivery. Saving makes a fresh **read-only Stripe paid check**. The database locks the session, rechecks latest owner/auditor signatures, receipt totals and each line, verifies that *this certificate* is active and its recipient/purchaser delivery states are **pending / not_submitted**, and confirms no notification event for that gift.
4. On success the database stores an immutable, unique `owner_verified_release` receipt for this certificate. That owner decision **removes the recovery HOLD for manual delivery review of that one certificate**. No automated email, SMS, retry, gift creation, balance change, refund or charge follows. The actual operator delivery action remains separate and needs its own permission and fresh reconciliation.
5. Refresh before any manual operation. A new recurrence, changed source, older evidence or recorded notification means the old receipt must **not** be treated as a current release. The app never issues two release receipts for the same certificate; conflicting attempts fail closed.

### Security and evidence

- `gift_issuance_verified_release_events`: append-only, one unique `certificate_id`, source-linked case and Build 683 independent owner acknowledgment, actor, paid evidence fingerprint, issuance receipt timestamp and checkout line number. No purchaser email, recipient name or certificate code is copied into the release ledger.
- The `record_gift_verified_release` database function is `SECURITY INVOKER`; only service-role invocation is granted. There are no public RLS policies or `anon`/`authenticated` table privileges. The Cloudflare endpoint requires a real signed-in owner session and blocks cross-site mutations.
- Payment verification uses **GET-only** Stripe calls. Historical receipts and source failures remain visible for oversight, without attempting new delivery. The release state is not automatically forwarded to Comms Hub or any other company.
- **Real production data at implementation:** zero existing gift-recovery cases, zero Build 683 renewal events. No actual certificate is automatically released or sent by this build.

### Verification

- `bash scripts/current_gift_issuance_regression.sh` covers all gift builds 673–684.
- `node scripts/build684_verified_release_canary.mjs` generates a full 681→684 synthetic, transaction-rolled-back fixture with **wrong-auditor, expired-paid-proof, prior-send, duplicate-release, immutable-audit and no-dispatch** negative checks.
- `python scripts/release_hygiene_check.py` and `python scripts/production_readiness_check.py`.
- Protected feature→`dev`→`main` PR checks, exact production SHA and live Cloudflare HTTP/static smoke must pass before declaring GREEN.

### Cross-application boundary

The attached *Rosevear Integration Contract v1* still applies. Rosie Dazzlers owns its gift data; the AI Data Platform will be the sole future integration gateway. Build 684 does not activate cross-business events or any external messaging. Later authenticated health/capabilities handshakes require separate owner-approved tests and credentials.

### References

- [Repository](https://github.com/RosevearCreations/rosiedazzlers)
- [Production](https://rosiedazzlers.ca)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Database Functions](https://supabase.com/docs/guides/database/functions)
