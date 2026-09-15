# Build 404 — Error Recovery, Weak-Connection UX & Reliability Hardening

## Goal

Keep important Rosie Dazzlers work recoverable under weak networks and partial failure without weakening server-authoritative business-state semantics.

## Runtime reliability contract

- `assets/reliability-recovery-v404.js` is a convenience layer only; it never becomes a source of accepted business state.
- Offline and weak-connection messaging explicitly states that local state is not accepted until the server confirms it.
- `safeRead` permits bounded automatic retry only for `GET` and `HEAD`. POST/PATCH/PUT/DELETE mutations are never automatically replayed by this layer.
- Protected draft convenience uses tab-scoped `sessionStorage`, a bounded expiry, and a deny pattern for password, card/CVC, payment, provider-token, authorization, cookie, secret, and file data.
- Restored draft state returns `stale_review_required: true`; it cannot claim an accepted booking or other server outcome.
- `withSubmitLock` provides duplicate-click protection around caller-owned operations but does not fabricate success or replace server-side idempotency.
- Upload state exposes progress, failure and explicit user-triggered retry. Failed uploads say that nothing has been accepted yet.
- Partial-result labeling explicitly states that incomplete evidence must not be treated as complete.
- No permanent polling or background mutation queue is introduced.

## Retained booking recovery authority

Build 380 remains authoritative for booking/payment recovery. Its tab-scoped booking draft, `client_request_id`, `/api/checkout_recovery`, stale-availability handling, provider-session recovery and no-direct-booking-mutation rules remain mandatory. Build 404 supplements that contract with honest connection-state UX and shared safe recovery primitives; it does not replace checkout or payment authority.

## Business-state boundaries

- Retry/recovery cannot create duplicate business events.
- No local/offline artifact can masquerade as accepted server state.
- Irreversible financial business actions remain server-authoritative and independently accepted.
- Restored workflows surface stale-condition review when authoritative evidence may have changed.
- No sensitive/payment-secret persistence is introduced by recovery convenience.
- Bounded/partial reads must be labeled when complete evidence is unavailable.
- No schema, Production business-data, customer, payment/provider, accounting/inventory, consent/outreach, DNS/secret, or destructive R2 mutation is authorized by this build.

## Release acceptance

The exact feature SHA must pass this focused authority, retained Build 403 and Build 380 authorities, Current Source Gate and feature-preview acceptance before `dev` moves. Development must prove the same exact SHA. Production promotion must use a protected-main pull request, and the resulting `main` head must independently pass Production deployment/runtime/business acceptance. Production deployment/runtime/business acceptance must independently prove that exact SHA.
