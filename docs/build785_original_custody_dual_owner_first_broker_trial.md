# Rosie Dazzlers Build 785 — Original custody, dual-owner authority and first broker GET trial

## Result and trust boundary

**Code-ready, original TEST activation: HOLD.** Rosie source endpoints still return HTTP **503 HOLD**. Build 785 introduces offline reconciliation of two signed source-owned GET / broker receipt candidates plus **seven signed independent denial receipts**, but **does not** claim a real TEST was attempted. The Comms Hub `main` QL-354 original-device record still requires genuine original-issuer custody, distinct owner decisions, private enrollment and its original device receipt. QL-354 device approval does not itself authorize Rosie's source GET.

Reference: [Comms Hub QL-354 original issuer / first TEST ceremony](https://github.com/RosevearCreations/rosevear-comms-hub/blob/main/docs/build-records/QL-354_ORIGINAL_CUSTODY_SIGNED_ENROLLMENT_AND_FIRST_TEST_CHALLENGE.md); [Rosie Build 784 source contract](build784_source_signed_get_broker_owner_renewal.md).

## Original-system handoff — what we must do separately

### Ree — original Windows source/device custody

1. On **Ree's original Windows machine**, use the trusted original Comms QL-354/355 operator tool and verify the actual device/receiver-OFF state, not a simulated report. Do **not** export private signer keys, encrypted credentials, auth cookies, nonce or customer details to Rosie, Jack's laptop or a web form.
2. Independently verify the issuer identity and source public SPKI SHA-256 fingerprint by a trusted second channel; check original issued/revoked/enrollment state and a fresh timestamp.
3. The original private operator must confirm that **Rosie as `rosiedazzlers` source** and its **`rosie-dazzlers` child tenant** are separately enrolled for **TEST-only GET**. An enrolled **Windows device** is not an enrolled **Rosie source**. If source enrollment is absent, STOP.
4. Review an exact expiring TEST request: only `/api/integration/v1/shell/health` and `/api/integration/v1/shell/capabilities`, audience `rosevear-comms-hub:nonproduction`, nine total attempts, 15-minute owner window, max 90-second signed GET lifetime and no customer bytes. Sign the *original* `APPROVE_TEST_ONLY` request as source owner only when we truly approve that exact request.

### Jack — independent master-owner decision

1. On **Jack's separate laptop**, obtain the original public issuer/source and private broker pin through a separate trusted channel and compare with the exact payload and SHA-256 digest reviewed by Ree.
2. Independently decide whether to approve **the same exact** TEST-only scope and freshness window. Sign with the separate master-owner key only if Jack approves. Do not substitute QL-345 **review-only** signatures for original enrollment/TEST authorization.
3. Either owner can HOLD or REJECT. Any expired window, digest difference, unavailable original key or inconsistent issuer identity requires a new exact ceremony — no silent renewal.

### Independent original broker operator

1. Authenticate privately and check original device **and Rosie source enrollment**, issuer and broker pin custody, current dual-owner signatures, source key status, permitted tenant/audience and nonproduction isolation. **Do not activate from this page.**
2. If all genuinely verified, request at most **two** scoped signed GETs (shell health and capabilities) in a controlled 15-minute window, with max 90-second request lifetime; record independent signed broker receipts bound to request digests and distinct nonce digests.
3. Collect seven independently signed denial observations: missing authentication (401), invalid credential (401), expired credential (401), wrong tenant (403), wrong audience (403), replayed first nonce (409), and untrusted source signer (403). An existing 503 HOLD is not a successful signed GET.
4. Match all nine original broker receipts with original source key, master/source owner decisions, original enrollment and private broker operator audit, then make a separate explicit connected/hold decision in the original private control plane. No automatic grant.

**Current status:** No such original nine-receipt acceptance is available in this checkout. The scripts have no network path and will never perform the actual GET trial. Owner actions and original private credentials cannot be inferred from CI or automatically invented.

## Local verification, never a live test

Run in Rosie checkout:

```bash
node scripts/build785_original_custody_trial_receipts_test.mjs
bash scripts/current_booking_wizard_regression.sh
```

`inspectBrokerTrial785` in `scripts/ql785_broker_trial_receipts_offline.mjs` checks two candidate source-signed GET/broker receipt pairs using the Build 784 verifier, both owners' exact digest and Ed25519 mechanics, and seven signed broker denial candidates with distinct case/order/status, request and nonce digests, bounded observation and same authorization. Public broker pin must be provided **independently** of any candidate packet. It rejects corrupt, expired, wrong tenant/audience, untrusted broker, repeated requests and nonce replay inconsistencies. The synthetic test fixtures are generated in-memory, never persisted.

Even when `ok:true` for *offline signature mechanics*, the returned original custody and human authority indicators remain false, `liveTrialExecuted:false`, `connected:false`, `networkRequests:0`, and connection `DISCONNECTED / HOLD`. A nine-slot *template* is available at Rosie Admin → I.T. Connections → Build 785; it contains **zero** original receipts and conveys **zero** authority.

Do not paste original receipts, private nonce, keys or credentials into the public browser. Perform genuine original-system checks only under the separate secure owner/operator procedure. No production booking, payment, staff, device, SMS, customer or database operation is authorized by this build.
