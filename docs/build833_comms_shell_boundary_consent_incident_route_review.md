# Rosie Dazzlers 833 — Comms Hub Shell Boundary, Consent & Incident Route Contract Review

**Verified software release GREEN on November 9, 2026:** [protected dev #902](https://github.com/RosevearCreations/rosiedazzlers/pull/902), [protected main #903](https://github.com/RosevearCreations/rosiedazzlers/pull/903), [six-job exact-SHA Cloudflare Production #42738310953](https://github.com/RosevearCreations/rosiedazzlers/actions/runs/42738310953), feature `main` commit `037d160a707e97dd2f0c85e4a1b03f6570deb081`. Original signer/owner/receiver consent and live incident/messaging/connection approvals remain **DISCONNECTED / HOLD**. This docs-only closure will have its own protected deployment evidence.

**Scope:** A private, read-only source-owner contract review. **Not** a Comms route deployment, signer ceremony, permission grant, message send or incident publication.

## Source identity and actual authority

- `sourceId: rosiedazzlers`; `shellId: rosiedazzlers`; owned-business shell; repository `RosevearCreations/rosiedazzlers`. The legacy manifest boundary remains `owned_business_legacy`. Bookings, customers, workers, devices, processors and individual jobs do **not** become shell identities.
- Existing [QL-365D six-source handoff](https://github.com/RosevearCreations/rosevear-comms-hub/blob/main/docs/handoffs/QL365D_SIX_APP_COMMS_ATTACHMENT_VALIDATION_HANDOFF.md) allows a separately authorized **one-use TEST `GET /api/integration/v1/shell/health`** with source-owned signed receipt, 4096-byte ceiling, no redirect and no customer/device payload. It grants no permanent connection or incident/messaging route.
- Source-owned path `functions/api/_lib/ql364-source-health.mjs` and `.well-known/rosevear-integration-manifest.json` remain unchanged. Manifest is unsigned discovery, **not authentication**.
- Review uses existing original-session `staffAccess811` and `operations.assignment.manage`, allowing only signed-in Rosie `admin` or `operations_manager`. No legacy admin header fallback. Private server-only GET selects two bounded, PII-excluding source windows; no new SQL migration, database grant, service role in the browser, outbound request or write.

## Proposed source/Comms ownership split

| Review category | Original Rosie source / local route | Comms contract approval still required |
| --- | --- | --- |
| Shell health | QL-364 original source handler; private QL-781 owner gates | Original source signer, QL-362/363 one-use claim, pinned origin, separately signed owner consent, independent receiver STOP/witness and signed receipt. **Not a live connection.** |
| Customer booking/service notice | Current Rosie customer profile, booking, purpose/channel consent and canonical recipient | Explicit approved individual recipient/audience, event category, source/consumer signing, delivery receipts, suppression, duplicate/replay and retention rules. **No automatic send.** |
| Worksite incident | `customer_worksite_issues_v811` and local supervisor follow-up | Agreed cross-source incident ID, original case owner, minimal permitted payload, correlation/causation, idempotency, source consent, reopen/closure authority, privacy and audit retention. **A local close is not a Comms close.** |
| Deposit/payment exception | Booking/payment records, provider and finance review | Separately scoped finance incident taxonomy and audience, independently signed provider proof, no payment data/processor keys in health or informal messages. **No payment action.** |
| Staff/assignment escalation | Rosie staff/assignment private source and reviewer action | Signed audience role, worker consent/authority, staff identity redaction, cross-tenant denial, idempotent task routing and independent owner/witness verification. **No remote task.** |

One-to-one and proposed fan-out are **not authorized** by this review. No many-to-many grant exists. There is no source-produced incident event or common approved incident contract to install. External Comms owners must review any contract or schema change before it is implemented.

## Current source projection and privacy

- `GET /api/admin/comms_boundary_review_v833` requires original authenticated staff session, `operations.customer.manage`, `operations.assignment.manage`, admin or operations-manager role. All other methods return 405. A missing/malformed source returns 503 without a report.
- Reads at most 100 issue `{id,category,status,submitted_at}` records and 100 historical contact audit `{id,channel,purpose,outcome,recorded_at,staff_report_unverified,provider_delivery_verified,outbound_dispatched}` records, server-only. IDs are validated for uniqueness but **never returned**. Only aggregate category/status/purpose/channel/outcome counts leave the server. No PII, customer contact, issue narrative, provider token, worker name or source UUID in the response.
- Historical staff reports always remain **unverified** and **not delivered**. They cannot prove present-time consent, channel preference, approved recipient, provider delivery, signed receipt or an original field event. Missing history and capped windows remain explicit.
- `assets/build833-comms-boundary.mjs` returns five source-owned **HOLD** route drafts, current source bounds and separate external gates; `assets/build833-comms-ui.mjs` displays them only in authenticated admin field-acceptance screen section 12 using safe text nodes and local manual-review links.

## Proof required before any future live routing

1. Original owner+source signer, approved exact `rosiedazzlers` boundary/commit and private one-use QL-365D independent receipt. Existing `DISCONNECTED / HOLD` does not change.
2. Comms Hub separately approves an incident, task and notification **schema**, minimal fields, exact authorized audience, a signed source/consumer exchange, version/expiry and source/tenant isolation.
3. Record genuine customer contact and staff consents at decision time, current purpose/channel/recipient and an opt-out/suppression path. Do not infer consent from historical delivery or preference counts.
4. Independently test duplicate, replay, expiry, revoked signer, cross-source access, unavailable provider, cancellation, lost receipt, out-of-order handoff and incident closure ownership. No automatic replay or resend on failed delivery.
5. Readback actual approved receipt, permission and audit chain, then obtain separate source owner and Comms operator signoff; a green software deployment cannot substitute for these proofs.

**Release track:** code, regression and Cloudflare exact-SHA acceptance will be linked from the release-closure update when independently confirmed. **Business/integration track:** 0 approved routes, 0 remote incidents, 0 sent customer/staff messages, 0 remote health GETs, 0 connection change, all external contract/consent/signer gates **HOLD**.

**Next proposed build 834 — Source Health, Release Provenance & Verified Master Status Envelope.** Stage local source/CI/deployment evidence as separately labeled claims, without converting self-report into independent approval or sending an event before the shared schema and owner contract exist.
