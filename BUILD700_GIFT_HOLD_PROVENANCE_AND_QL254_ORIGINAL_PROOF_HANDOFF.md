# Build 700 — Gift HOLD Snapshot Provenance Review & QL-254 Original Signed Proof Retrieval Watch (HELD)

**Application:** Rosie Dazzlers. **Deployment:** feature → `dev` → protected `main`, exact production SHA and Cloudflare verification required. **Integration:** `DISCONNECTED / HOLD`; neither application GREEN nor GitHub identity equals owner TEST authorization.

## Owner-only gift HOLD snapshot provenance review

The new browser-only Build 700 review accepts one local, pseudonymous, self-contained Build 699 snapshot. It revalidates the bounded-case schema and its SHA-256 self-integrity; classifies a capture as local-only, older than 24 hours, or more than 5 minutes ahead of the review clock. It can download an optional **non-secret provenance review request** showing snapshot/checksum digests, capture time, sample scope, age, truncation and every missing independent provenance gate, with **no raw case identifiers, customer information or private receipts**. No upload, localStorage, authenticated history creation, gift resend/closure or server write occurs. A matching local hash **does not** prove the original event was captured by the owner or independently witnessed. Missing gift cases never imply delivery or release.

## QL-254 immutable proof retrieval watch

`GET /api/admin/integration_v1_ql254_original_proof_watch` reports owner-only readiness with no network calls. A same-origin, explicit JSON `POST` probes only public GitHub `main` and the raw immutable proof URL; with a genuine public candidate, it checks proof-only A→B ancestry, raw bytes and exact source CI as **untrusted public consistency**, then leaves signer/witness/owner flags false. HTTP 404 or any conflict stays HOLD. The original Ed25519 signing key, independently authenticated private custodian and separate witness, private registry, owner TEST decision, durable seven-denial receipts and original gateway calls remain **NOT_AVAILABLE / NOT_GIVEN / NOT_RUN**. The AI Hub Windows mini-server remains unconfigured. See [QL-254 original proof/witness handoff](docs/integration/ql254-rosie-original-proof-witness-relay-handoff.md).

## Regression and promotion checks

- `node scripts/build700_gift_hold_provenance_test.mjs`: good/stale/future local snapshot, tampering, privacy, non-secret packet and no release.
- `node scripts/build700_ql254_original_proof_watch_test.mjs`: **synthetic only** 404, fake public candidate shape, exact A/B and CI, main drift, owner-only access and no gateway calls; fake test signature is never committed as source proof.
- Full gift contract suite Builds 673–700, current source A–D aggregate contracts, guarded production promotion regression, Supabase owner auth/RLS safety, feature preview, dev, main source/business gates, exact Cloudflare deployment, release health and live HTTP smoke all required.

**Next queued:** Build 701 — Gift HOLD Witness Provenance Exception Aging & QL-255 Verified Proof Publication Disposition Readiness (HELD).
