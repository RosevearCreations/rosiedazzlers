# Rosie Dazzlers Build 774 — Original-owner renewal handoff and closure witness

Build 774 extends verified Build 773 read-only source review. It **never** executes original-owner sign-off, creates real acknowledgments, resolves a dispute, updates production SQL, closes retention, archives evidence, appends a business audit receipt, or sends notifications. All operational outcomes remain **HOLD** until independently signed original sources and a separate human owner/custodian action exist. Production deployment GREEN refers only to the software release, not external business approval.

## Authenticated owner workboard

- `/admin-economic-owner-handoff-aging-v774.html` and directory alias, linked from the admin catalogue and Build 773 page.
- `GET /api/admin/economic_owner_handoff_aging_v774`: read-only configured-origin indicators under authenticated session; no credentials exposed.
- `POST` (same-origin JSON only, 160 KB maximum): exact case IDs plus eight original owner-signed envelopes (Builds 764, 765, 766, 768, 771, 772, 773, and fresh 774). Server replays all Build 773 original source validation rather than trusting a client readiness flag.
- `PUT/PATCH/DELETE`: 405 HOLD. Browser imports local JSON, shows evidence status and follow-up controls, and exports only an **unsigned review packet**.

## Original signer and issuer contract

The three **new** independent roles are:

1. `INDEPENDENT_RENEWAL_HANDOFF_WITNESS` at `/v1/economic-owner-renewal-handoff-v774`.
2. `INDEPENDENT_DISPUTE_AGING_WITNESS` at `/v1/economic-dispute-disposition-aging-v774`.
3. `INDEPENDENT_RETENTION_CLOSURE_READINESS_WITNESS` at `/v1/economic-retention-closure-readiness-v774`.

Use distinct `ROSIE_ECONOMIC_<ROLE>_PUBLIC_KEY_B64`, `ROSIE_ECONOMIC_<ROLE>_KEY_ID`, and canonical root `ROSIE_ECONOMIC_<ROLE>_BASE_URL` in the hosting configuration for each role, **not** browser inputs. All 45 independent signer identities and 36 HTTPS origin pins across the complete chain are verified on every Build 774 evidence read; absent/duplicate/malformed values stay HOLD. The site never generates a signer key or treats configured fields as live proof. External issuer responses are GET, HTTPS, same-origin root-pinned, no redirected requests and at most 16 KB; each signed Ed25519 envelope contains exact string fields and domain-separated canonical signature bytes.

Signed Build 774 input roles:

- Original owner: `rosie-original-owner-renewal-handoff-v774`, exact Build 773 owner/disposition/renewal/remediation receipt digests, case scope, original owner ID and signed manual choice (`REQUEST_SEPARATE_RENEWAL_HANDOFF`, `HOLD_EXTERNAL_DISPUTE_AGING`, or `HOLD_RETENTION_CLOSURE_WITNESS`). No site-side owner approval is inferred.
- Handoff witness: `rosie-independent-renewal-handoff-witness-v774`, exact prior signed renewal register/digest and owner review digest. Acknowledgment is a source **claim**, not a completed handoff.
- Dispute aging witness: `rosie-independent-dispute-disposition-aging-v774`, previous original disposition register, handoff receipt, source alert threshold, monotonic observed age, number of open disputes and independent signed result. Open, stale, overdue or conflicting values remain HOLD.
- Retention closure witness: `rosie-independent-retention-closure-witness-v774`, previous remediation register, original SLA policy, bound handoff and aging receipts, critical exception count, source-signed readiness expiry up to 30 days. Readiness requires zero critical exceptions, clear dispute aging and handoff acknowledgment. It does not close or delete source records.

## Control examples and acceptance

The test command `node scripts/build774_owner_handoff_aging_test.mjs` checks all 45 signer pins and 36 origin pins, canonical format, original signature impersonation, predecessor digest binding, separate independent role signatures, chronology, incomplete/aged evidence, retained critical exceptions, expiry bounds, explicit owner HOLD, non-mutating methods, admin mirrors, and unsigned exports.

Without authentic current issuer receipts and original-owner signed manual request, the workboard is expected to report HOLD. A source review packet is not an immutable production receipt and must not be represented as independent owner approval.
