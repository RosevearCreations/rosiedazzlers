# Build 424 — Security, Privacy & Recovery Drill

Build 424 revalidates Rosie Dazzlers security, session, privacy/consent and recovery boundaries without turning source checks into fabricated Production recovery evidence.

## Security evidence

The staff-only `/api/admin/security_privacy_recovery_drill` endpoint composes the retained protected security-posture report into aggregate counts only:

- browser-access risk rows;
- public-schema tables with RLS disabled;
- direct browser grants.

The Build 424 view does not return table rows, credentials, customer records or secret values.

## Session boundary

Staff and customer sessions remain opaque-token sessions with only token hashes persisted server-side. Source authority requires:

- `HttpOnly`, `Secure`, `SameSite=Lax` cookies;
- bounded session lifetime and rotation;
- revocation/expiry handling;
- dedicated staff/customer session-secret configuration reported only as present/absent;
- legacy admin fallback reported as a compatibility risk when enabled.

Build 424 does not rotate a secret, revoke a real session, change a role or expose any secret value.

## Privacy and consent boundary

The retained customer communication gate remains authoritative:

- current explicit consent is checked at dispatch time;
- customer channel/recipient changes fail closed;
- consent is never inferred;
- provider acceptance is not definitive delivery;
- definitive delivery requires explicit provider-delivery evidence.

Build 424 does not opt a customer in/out, change a communication preference, send a message or expose a customer record.

## Recovery drill boundary

The focused Build 424 authority re-runs the retained observation-only backup/restore/release recovery checks and rollback/recovery source authorities.

That source drill proves the recovery mechanics are still fail-closed. It does **not** prove that a real Production restore, secret rotation, DNS change, R2 recovery or provider recovery was executed.

A real recovery drill remains separately observed and explicitly authorized. Any real recovery must be followed by exact Production SHA re-acceptance.

## Prohibited mutation

Build 424 introduces:

- no schema migration;
- no Production restore;
- no Git ref rewrite;
- no secret rotation;
- no DNS mutation;
- no destructive R2 operation;
- no payment/provider mutation;
- no customer, consent or staff-role mutation;
- no permanent polling.

## Release acceptance

The focused Build 424 authority, Current Source Gate and exact feature-preview acceptance must pass before Development advances.

Development must independently pass exact-SHA deployment/runtime acceptance.

Production promotion remains a protected-`main` pull request. The resulting Production SHA must independently pass exact Cloudflare Production deployment/runtime/business acceptance.

Source/Production GREEN means the security/privacy/recovery authority is safely deployed. It does not mean a real recovery drill or secret rotation occurred.

## Next bounded release

Build 425 — Production Learning & Roadmap Renewal begins only after Build 424 is independently GREEN on protected `main`.
