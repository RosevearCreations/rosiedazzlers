# Build 697 — Gift HOLD Escalation Outcome Audit & QL-250 Independent Source/CI Pin Custody Reconciliation (HELD)

**App:** `RosevearCreations/rosiedazzlers` · **Production route:** feature → `dev` → protected `main` → exact SHA Cloudflare Pages and release-health verification.

## Gift HOLD outcome audit (owner-only)

- `GET /api/admin/gift_hold_escalation_outcome_audit` reuses the Build 696 signed-owner latest-100 escalation runbook. It adds no new SQL, writes, public grants or database migration.
- Classifies the seven documented escalation attention cases as missing original owner HOLD acknowledgment, overdue witness owner acknowledgment, expired sixth review, overdue sixth witness, overdue assignment, recorded-but-unresolved HOLD, or manual monitoring.
- Returns explicit owner-follow-up counts, `historical_audit_complete=false`, bounded-sample/truncation flags, and **zero** authorized delivery/closure count. Even a recorded HOLD acknowledgment does not prove original recipient delivery.
- Owner UI uses `textContent` and provides no action to reassign a reviewer, resend, contact a recipient, charge/refund, release a hold or call an external gateway.

## QL-252 immutable public proof recheck and QL-250 custody gaps

The supplied QL-252 action sheet reported six public proof 404s. We independently verified the Rosie path at the exact prior `main` SHA `901b01e9c01cbbeac190ae9793b0b5aa29a7c4dd` returned HTTP **404**. Public CI GREEN and Cloudflare deployment GREEN do **not** create the required proof.

- `GET /api/admin/integration_v1_ql250_custody_reconciliation` is owner-only, offline readiness. It reports `NOT_AVAILABLE` for absent original evidence, `owner_test_decision=NOT_GIVEN` and `connection_state=DISCONNECTED`.
- Owner-only explicit `POST {"action":"public_proof_recheck"}` makes at most **three unauthenticated read-only public GitHub API GETs**, all hardcoded to Rosie: exact public `main` ref, exact pinned SHA contents path, and source CI run metadata only if a strictly bounded candidate proof has the expected public CI URL form.
- A real 404 is reported **as 404**, not a mock success. Public 200 is `HTTP_200_UNTRUSTED_CANDIDATE`, with exact raw bytes SHA-256 and at most a *public* source CI/head match; it is neither the original proof-bearing B commit nor independent signer trust. No untrusted user URL, signer private key, token, gateway host, data write or customer operation is accepted.
- Missing authentic short-lived Ed25519 signer/custodian, 5-minute QL-250 challenge, distinct QL-251 witness signature, independently authenticated original provenance receipt, truthful seven-denial test metadata, approved private owner TEST-only decision and first-hand gateway audit remain **NOT_AVAILABLE**. The public proof is **not** published by this build: creating one without those original inputs would be fabricated evidence.

### Trust boundary before proof publication

1. Choose a tested **source A** commit and independently check a successful GitHub CI run with `head_sha === A`.
2. Have the independently authenticated *real* signer/custodian create the QL-248 canonical payload and Ed25519 signature **outside GitHub**, with a genuine nonproduction ≤1-hour challenge, truthful required negative-test metadata, and separate out-of-band public key fingerprint.
3. Confirm a different human witness and custody attestation outside GitHub, fresh 5-minute nonce and exact A/B binding; do not put original private receipts in the repository.
4. Publish the genuine signed JSON *only* at `docs/integration/ql246-source-proof.json` in a later proof commit **B** referencing A. Promote B to `dev` and `main`, then independently verify immutable raw URL HTTP 200, raw SHA-256 and source-A ancestry/CI.
5. A separately authenticated owner must approve a named **nonproduction** tenant/business, future ≤30-minute UTC window, GET-only health/capabilities. No live GET before authorization. A later independent pilot release remains separate.

Current truthful public return: `proof_commit_sha_B=NOT_AVAILABLE`, `immutable_public_proof_url=NOT_AVAILABLE`, `exact_proof_bytes_sha256=NOT_AVAILABLE`, `public_spki_sha256=NOT_AVAILABLE`, `out_of_band_custody_receipt_id=NOT_AVAILABLE`, `distinct_witness_receipt_id=NOT_AVAILABLE`, `owner_test_decision=NOT_GIVEN`, `actual_gateway_test=NOT_RUN`, `connection_state=DISCONNECTED`.

## Verification

- `scripts/build697_gift_hold_outcome_audit_test.mjs` exercises all seven outcome categories, independent auth and guaranteed permanent HOLD/no-resend/closure.
- `scripts/build697_ql250_custody_reconciliation_test.mjs` exercises actual public 404 versus a strictly synthetic **offline test-only** candidate, public CI/source head match, no arbitrary network or gateway, and no false signer/witness/owner acknowledgment.
- `scripts/current_gift_issuance_regression.sh`, `scripts/current_source_gate_contracts.sh`, `scripts/guarded_production_promotion_test.mjs` and exact GitHub/Cloudflare release gates must pass. No Supabase migration or permission expansion.

**Operational connection:** DISCONNECTED / HELD, no owner test authorization. **Next queued after exact Production GREEN:** **Build 698 — Gift HOLD Outcome Recurrence Follow-Up & QL-252 Authentic Proof Publication Evidence Handoff (HELD)**.
