# Rosie Dazzlers 836 — Protected Event Publication, ACK/Replay & Consumer Isolation (After Contract Approval)

**Feature candidate; original source and consumer authority HOLD.** This release adds a fail-closed original-private publication contract and owner-visible readiness screen. It does **not** provision an Ed25519 source signer, an AI Data HMAC key, a Comms delivery provider, a hosted database ledger, consent, an owner role, a receiver, a durable replay store or a live connection. No original event was transmitted or acknowledged by this build.

## Master Shell role and boundaries

Rosie is `rosiedazzlers`, an independent owned-business **source shell**. AI Data Platform is the Master intelligence **consumer** of approved, read-only `master-shell.source-update` events; Rosevear Comms Hub is the separate Master operator **consumer** of independently consented routing and incidents. Neither master gets customer, booking, payment, employee, vehicle or source-write authority from a health event. YW, iCamp, Devil n Dove, Rosevear AI Hub and their child companies remain peers with **no direct Rosie grants**. Many sources may independently report to one Master only under that Master's own acceptance and authorization rules; Rosie may never impersonate those sources or fan out to an unapproved many-to-many graph.

## Build 836 software

- Authenticated, read-only `GET /api/admin/master_shell_publication_v836` for existing Rosie `admin` or `operations_manager` with `operations.assignment.manage`. All mutations return 405. Reuses existing signed staff-session check and does not query an event, owner, payroll, customer or Supabase table. No migration, new role, external send or credential exposure.
- `assets/build836-publication-readiness.mjs`: eight-stage source, owner, signer/transport, consent, atomic replay, one-attempt delivery, independent ACK and per-consumer HOLD/DLQ readiness. Both intended master consumers remain HELD, with zero events and receipts; current runtime SHA is only a claim.
- Section 15 in both mirrored authenticated field-acceptance pages: refresh-only accessible table with separate AI Data and Comms status. It cannot authorize, publish, retry, sign, upload, update connection state or inspect customer/provider data.
- `scripts/ql836_protected_event_publication.mjs`: **Node-only original private factory**, not imported into Cloudflare pages/functions. Requires seven separately implemented original authenticated callbacks: per-consumer approved grant, durable per-consumer delivery claim, genuine source signature, independent source-signature verification, single original transmit, independent original consumer ACK verification, and original protected dead-letter record. CLI exposes **`--status` only** and remains HOLD.
- Exact AI Data Build 335 V1 top-level envelope shape; `sourceId=shellId=rosiedazzlers`, `tenantId=null`, verified source revision format, UTC/freshness/expiry, source sequence, event/correlation/causation/idempotency, evidence URI and SHA-256 canonical payload digest. Local payload is intentionally minimal (`expiresAt`, `status`, `evidenceRef`) and **not a claim of consumer-normalized schema acceptance**. The original consumer grant must independently verify the actual Build 337/Comms event-specific normalized contract before any send.
- Event families proposed: AI Data source health, release, module readiness and audit evidence; Comms incident open/update; dual audience **only** for independently approved audit evidence. Unsupported families, child tenants, other source IDs, unapproved peers or duplicate recipients fail before any original callback.
- **All consumer grants must be verified before sending anything.** Each grant is bound to one event, consumer, revision, sequence, hash, idempotency key, short expiry (maximum 90 seconds), original QL-835 witnessed receipt, separate source/master approvals, signer/receiver identity, durable replay and normalized consumer contract. Comms consent/routing is independently required.
- Each original consumer gets a separate atomic replay/ordering reservation, signed envelope and independently checked receiver receipt. A duplicate, stale, out-of-order, unsigned or ambiguous result remains HELD; a best-effort protected DLQ is recorded independently without exposing payload and **without automatic replay**. A failed consumer does not silently block an unrelated independently approved recipient after the common preflight; no single ACK promotes the other recipient. One factory instance spends its attempt even on rejection, error or partial results.
- Even a verified original ACK returns `connectionState=DISCONNECTED / HOLD`. The source and master owners must separately authorize any future connection transition. A synthetic positive test is only code evidence, not actual signer enrollment, network transmission or customer consent.

## Current evidence and approval gaps

| Gate | Source-side code | Real original state |
| --- | --- | --- |
| V1 envelope / exact Rosie source | Strict local validator and positive/negative tests | Consumer-normalized payload and source identity **not approved** |
| Original owner, QL-835 witness, source and consumer signer | Exact per-consumer grant predicates | No independently authenticated original owner/signer/grant supplied — **HOLD** |
| AI Data Build 290/337 webhook + accepted signed receipt | Protected HMAC transport contract and independent ACK callback | HMAC identity, current key, original receipt and accepted consumer ACK absent — **HOLD** |
| Comms QL-404 consent/incident/receiver | Separate private approved transport and per-recipient receipt | Original provider/route/consent/receiver/owner proofs absent — **HOLD** |
| Durable idempotency, ordering, replay and DLQ | Protected-only callbacks; no browser retry or public nonce store | Genuine atomic database and original DLQ readback not witnessed — **HOLD** |
| Production software deployment | Protected `dev` → `main` PR and Cloudflare exact-SHA checks required | Awaiting Build 836 release verification |

## Owner-controlled activation sequence

1. Reconcile original existing Ree/Jack source/master authority, QL-835 one-source signed receipt, actual source signer custody, receiver and approved HTTPS origin/TLS. Do not resubmit credentials through chat or trust a copied JSON flag.
2. Approve each actual consumer, minimum event fields, contract version, sensitivity, consent, retention and private transport. The AI Data accepted `master-shell.source-update` webhook and a Comms incident route are *different* permissions.
3. Have the separately authenticated original private operator verify and pin each consent/signer/consumer grant. Use a durable atomic `(source, recipient, eventId, sequence, idempotencyKey)` reservation; reject duplicates and out-of-order claims.
4. Only then authorize a single original signed event per approved recipient and independently verify the source-to-receiver receipt/hash/idempotency/sequence. On ambiguity quarantine the recipient and record a protected DLQ; do not auto-retry.
5. Independently review any verified receipt and protected STOP state. An ACK proves one bounded delivery, **not persistent CONNECTED**; an explicit later owner decision is required.

## Verification

```bash
node scripts/ql836_protected_event_publication.mjs --status
node scripts/build836_protected_event_publication_test.mjs
bash scripts/current_booking_wizard_regression.sh
python3 scripts/release_check.py
python3 scripts/release_authority_documentation_convergence_check.py
```

Tests use **synthetic** grants and ACKs only; they verify denial for wrong source, tenant, recipient, audience, schema/hash/time drift, missing grants, duplicate publisher instances, simulated replay/out-of-order, ambiguous transmissions, failed independent ACK, per-recipient DLQ isolation, role gating, read-only API and mirrored UI. They cannot substitute for authentic original private evidence or a consumer receipt.

## Next proposed build

**Rosie Dazzlers 837 — Customer Communications, Consent Journeys & Operator Incident Continuity.** Require independently approved Comms provider and consent routes; otherwise limit it to source-only reviews and HOLD.

References: [AI Data Build 335 contract](https://github.com/RosevearCreations/ai-data-platform/blob/main/docs/BUILD_335_MASTER_SHELL_CONTRACT_V1_CORRELATION_EVENT_ENVELOPE.md), [AI Data Build 337 accepted receipt and replay](https://github.com/RosevearCreations/ai-data-platform/blob/main/docs/BUILD_337_READ_ONLY_SOURCE_UPDATE_INGESTION_PROVENANCE.md), [Comms QL-404 protected original owner gate](https://github.com/RosevearCreations/rosevear-comms-hub/blob/main/docs/handoffs/QL404_PROTECTED_EVIDENCE_SIGNED_APPROVAL_SIX_APP_GREETING.md), [Rosie 835 private receipt and STOP](build835_owner_master_shell_pilot_receipt_reconciliation.md).
