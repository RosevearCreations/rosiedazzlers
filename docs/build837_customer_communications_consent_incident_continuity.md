# Rosie Dazzlers 837 — Customer Communications, Consent Journeys & Operator Incident Continuity

**Software Production GREEN (November 10, 2026):** [protected dev #922](https://github.com/RosevearCreations/rosiedazzlers/pull/922), [main #923](https://github.com/RosevearCreations/rosiedazzlers/pull/923), six successful [Cloudflare exact-SHA Production jobs #42764694803](https://github.com/RosevearCreations/rosiedazzlers/actions/runs/42764694803) at feature `main` `7d35fb7f7801fb37843ddc4c1962953dde9b04f2`. **Original consent/provider/owner evidence HOLD.** No outbound message, Comms incident/task, original receipt or persistent Master connection was created. This docs-only closure is separately gated by protected release checks.

## Scope and boundaries

Rosie is the **owned-business source shell**. AI Data Platform is the Master intelligence/read-only monitor; Rosevear Comms Hub is the independent Master operator/communications plane. Neither receives customer, employee, payment, booking or incident payloads from this source-health review. Yard Workers, iCamp, Devil n Dove and Rosevear AI Hub are peers, not implied children/recipients of Rosie's data. No shared tenant or many-to-many grant is created.

## Build 837 controls

1. **Private source status:** `/api/admin/comms_consent_incident_continuity_v837` accepts GET only for authenticated existing Rosie `admin`/`operations_manager` with `operations.assignment.manage`. Reuses the established staff-session lookup, makes no new Supabase table reads, provider calls, Comms calls or database writes. All mutation verbs return 405. Fields are aggregate gates, no customer or issue data.
2. **Consent journeys:** service, marketing and internal worksite incident are separately scoped. Current recipient/purpose/channel, time validity, revocation and independent delivery provider proof must be checked from original protected records. An opt-in for service is not marketing permission; staff notes or historical contact are not current opt-in. Each journey remains HOLD in the web preview.
3. **Incident continuity:** Original Rosie source issue, booking reference, one named assignee, acknowledgement chronology and response SLA are separate from Master incident routing. Overdue work needs an independently verified escalation owner. Acknowledging or archiving an alert is never original issue resolution, and closure requires an independent original source resolution reference and Comms approval.
4. **Original-only private reviewer:** `scripts/ql837_original_consent_incident_handoff.mjs` is Node-only (not a web route). A distinct, separately authorized original operator must supply independently authenticated current-consent, delivery-receipt and source-incident readers and atomic durable one-time review reservation. It validates source/revision/event/recipient/purpose/channel binding, current consent (five-minute check freshness), expiry/revocation, signed provider delivery receipt, incident chronology, SLA and distinct resolution evidence. No send, remote task write, closure, automatic retry or connection transition exists, **even when a test fixture passes**. An uncertain original read or duplicate review fails closed; private input is not echoed.
5. **Accessible supervisor UX:** Section 16 in both identical `/admin-handoff-acceptance` routes, with keyboard focus, status announcements, safe DOM text and manual refresh. No approval buttons, customer details, message sender, incident editor or live connection claim.

## What independent activation still requires

- Actual current customer consent and original channel/recipient records, including a fresh withdrawal recheck immediately before any separately approved send.
- Original provider contract and independently signed per-recipient delivery receipt. Provider submission/acceptance by itself does not prove delivery.
- Approved Comms QL-404 incident taxonomy, least-privilege audience, privacy/retention, original source/owner signatures and independently enrolled receiver.
- Original Rosie issue/booking/assignee lineage, time and SLA, acknowledgment, separate escalation owner, independent source resolution and Comms closure approval.
- Original durable once-only idempotency/order claims and source/master per-recipient ACK. A verified isolated receipt alone never changes `DISCONNECTED / HOLD` to `CONNECTED`.

**No real original operator, consent, provider or signer was supplied.** Node tests use synthetic positive and negative fixtures; they are software checks only.

## Verification

```bash
node scripts/ql837_original_consent_incident_handoff.mjs --status
node scripts/build837_consent_incident_continuity_test.mjs
bash scripts/current_booking_wizard_regression.sh
python3 scripts/release_check.py
python3 scripts/release_authority_documentation_convergence_check.py
```

Tests cover revoked/stale/wrong-purpose consent, channel/recipient drift, provider receipt mismatch, missing booking/assignee, acknowledgement before opening, overdue incident without escalation owner, archive vs source resolution, one-time review/replay, original read failure, unauthenticated/underprivileged staff, no-write 405, source redaction and mirrored UI.

**Next proposed Build 838 — Operations, Security & I.T. Health Dashboard Reconciliation.** Separate software Production GREEN from real original field acceptance.

References: [Rosie Build 833 Comms boundary](build833_comms_shell_boundary_consent_incident_route_review.md), [Rosie Build 836 protected event/ACK boundaries](build836_protected_event_publication_ack_replay_isolation.md), [Comms QL-404 source/owner evidence gate](https://github.com/RosevearCreations/rosevear-comms-hub/blob/main/docs/handoffs/QL404_PROTECTED_EVIDENCE_SIGNED_APPROVAL_SIX_APP_GREETING.md), [Supabase Auth](https://supabase.com/docs/guides/auth).
