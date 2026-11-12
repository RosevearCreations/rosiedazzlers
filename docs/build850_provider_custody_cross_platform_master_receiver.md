# Rosie Dazzlers Build 850 — Evidence-Custodied Provider Recovery, Cross-Platform Social Recall & Master Receiver Pilot Decision

## Implemented source feature
- `GET /api/admin/jobday_custody_850?booking_id=<uuid>` requires signed-in original Rosie owner role, verified original booking, exactly one linked DAIP project, private service store, and bounded post/receipt windows. No legacy password or unsigned bridge.
- Review engine `functions/api/_lib/jobday-custody-850.js` correlates per-post independent signed removal, CDN purge, scoped closure, repeat-episode integrity, and recall exception priority. Missing evidence, broken custody chronology, incomplete windows or open recall remains HOLD.
- A cross-platform manifest checks for missing or unexpected social accounts; it never converts a local scoped closure into a claim that all third-party mirrored copies are removed.
- Master receiver pilot uses exact SHA/contract/audience/case/freshness and requires independent transport, signature and replay verification. A browser-supplied assertion alone can **never** authorize the receiver. Until an independent server-side verifier and durable receiver ACK exist, decision is explicitly `HOLD`, `master_runtime_ack=false`, `master_connection=HOLD`, and zero Master events.
- No social provider deletion/posting, CDN purge, or AI Data transport occurs in this build. Receipt identifiers and private witness details remain in Rosie custody and are not exposed in aggregate review.
- Run: `node scripts/build850_custody_receiver_test.mjs`. Full booking regressions and protected `dev`/`main` checks remain required before GREEN.

## AI Data Platform direct handoff
Controller `ai-data-platform`: please independently enroll and pin the receiving Ed25519 public identity, verify source production revision and exact contract `rosie.ai-data.social-recall.pilot.v850`, verify source audience, signature, freshness, nonce replay ledger, original receiver transport and durable ACK, and return a sanitized signed decision with distinct verifier identity. Do not send private signing keys, customer identities, photos or provider tokens to Rosie. Until that independent acceptance exists, source code GREEN does **not** mean Master receiver CONNECTED or original provider recall complete.

## Next proposed Build 851
Original-Device Provider Recovery Witness Acceptance, Durable Master Receiver ACK Correlation & Consent-Safe Social Exception Closure.
