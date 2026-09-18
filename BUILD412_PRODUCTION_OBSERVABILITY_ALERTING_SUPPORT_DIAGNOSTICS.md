# Build 412 — Production Observability, Alerting & Support Diagnostics

Build 412 converges the retained Production readiness and self-diagnostics authorities into one operator-readable support workflow without creating a third competing source of truth.

This release is schema-neutral. It performs no Production business-data mutation, provider mutation, payment test transaction, R2 mutation, deployment mutation, secret rotation or automatic alert delivery.

## Exact release identity

The support snapshot retains exact release identity only from already-observed runtime evidence. A 40-character Cloudflare Pages commit SHA, branch and runtime host may be included in the support packet. Missing exact identity remains a runtime alert; it is never inferred from a branch label or successful page load.

GitHub/Cloudflare exact-SHA release acceptance remains the promotion authority. The I.T. screen does not self-certify Production GREEN.

## Bounded failure evidence

The new support layer composes:

- authenticated Build 406 go-live readiness evidence; and
- retained Build 379 Production diagnostics.

It does not duplicate their Supabase, R2, health, authentication or provider checks.

Runtime evidence is reduced into bounded operator alerts:

- `critical` — required runtime evidence is unavailable or a diagnostic failed;
- `warning` — degraded runtime/configuration evidence or optional evidence is unavailable;
- `hold` — external provider evidence is still provider-dependent;
- `action` — explicit owner/operator evidence is still required.

Unavailable evidence is not automatically fabricated into failure, and provider HOLDs are not mislabeled as runtime outages.

## Provider HOLDs and corrective mechanics

Stripe, PayPal, email/SMS/push delivery and other external provider outcomes remain HOLD/provider-dependent until independently observed by their existing authorities.

Every support alert carries a corrective action. Corrective mechanics are instructions only: the diagnostic snapshot does not perform the correction, send a message, create a payment, replay a webhook, alter a secret, modify storage or mutate business state merely to test it.

## Support-safe packet

The operator may explicitly copy a support packet after manually refreshing the support snapshot.

The packet is deliberately whitelisted to contain:

- generated timestamp;
- exact runtime commit SHA when observed;
- branch and host when safely formatted;
- readiness decision and classification counts;
- diagnostics overall state and duration;
- severity-ranked alert identifiers, states, families, labels and corrective actions;
- explicit safety flags.

It excludes arbitrary evidence objects, secret values, customer records, message contents and provider credentials. The source test intentionally injects secret-like values into raw diagnostic evidence and proves they do not reach the support packet.

## Alerting boundary

Build 412 alerting is an operator-facing on-screen classification layer. There is **no automatic alert delivery** to email, SMS, push, Slack or any external provider.

Refresh is manual and bounded. There is no permanent polling, no background monitoring loop and no diagnostic traffic storm.

Future automatic alert delivery, if desired, must be separately authorized with rate limits, deduplication, recipient ownership, consent and provider evidence.

## I.T. operator workflow

The I.T. page keeps the retained readiness and diagnostics panels and adds a Production support diagnostics panel above them.

The operator can:

1. select **Refresh Support Snapshot**;
2. review overall state, exact release identity and severity counts;
3. inspect alert family/state and corrective action;
4. copy the whitelisted **Support packet** when needed for troubleshooting;
5. independently refresh the retained detailed readiness/diagnostics panels when deeper evidence is required.

No diagnostic screen mutates business state merely to test it.

## Acceptance boundary

A GREEN Build 412 source release means the support workflow truthfully converges current readiness/diagnostic evidence and is safe for operator troubleshooting.

It does not mean every provider HOLD is cleared, every owner action is complete, or a real Production incident occurred. Exact Production GREEN still requires the normal protected-main and exact Cloudflare Production acceptance sequence.
