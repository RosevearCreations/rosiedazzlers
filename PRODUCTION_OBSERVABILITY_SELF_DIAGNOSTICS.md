# Build 379 — Production Observability & Self-Diagnostics

Build 379 makes `/admin/it.html` the bounded operator view for current deployed-system health. It does not replace exact-SHA release gates and it does not convert diagnostics into a background monitor.

## Authority boundary

The I.T. page calls the authenticated, read-only `/api/admin/production_diagnostics` endpoint. The endpoint requires the existing staff authorization model with I.T. module access (Admin remains authoritative), returns `Cache-Control: no-store`, hides secret values and performs only a small fixed set of health reads.

No database migration is part of Build 379. No customer, booking, accounting, payment, refund, webhook, provider, R2 object or business-data mutation is permitted by this diagnostic surface.

## Diagnostic coverage

The operator response covers:

- **Pages deployment** — Cloudflare Pages runtime metadata and branch identity;
- **Build identity** — exact Pages commit SHA when the runtime exposes it;
- **Staff authentication** — confirms the diagnostics request passed the staff/I.T. authorization boundary;
- **Supabase** — one bounded read-only service request using existing service-role configuration;
- **R2/media** — one bounded `R2_MEDIA.list({ limit: 1 })` read without returning object names;
- **Critical API runtime** — one bounded call to the canonical `/api/health` route;
- **Payment configuration** — presence-only Stripe and PayPal readiness, including webhook authorities, without returning keys and without contacting a provider to create/capture/refund anything.

The diagnostics use a fixed timeout and manual page refresh. There is no recurring `setInterval`, permanent polling loop or open-ended retry process.

## Failure families

Every degraded/failed check is assigned to one of the release failure families:

1. `source` — missing or contradictory source authority;
2. `build` — exact build identity cannot be established;
3. `deploy` — deployment/runtime environment identity is incomplete;
4. `configuration` — a required binding or provider configuration is absent;
5. `runtime` — a configured dependency cannot complete its bounded read.

The page displays the family and corrective instruction beside the affected subsystem. A degraded state is visible rather than silently treated as GREEN.

## Sensitive-data rule

Diagnostics may report only safe presence/state values such as configured/not configured, HTTP status, payment mode (`test`, `live`, or unknown), branch, exact commit SHA, host and dependency reachability. Supabase service keys, Stripe keys/webhook secrets, PayPal client secrets, access tokens, R2 object names and customer/business records must never be returned.

## Release acceptance

Build 379 is acceptable only when all of the following are true on the exact candidate SHA:

- the focused Build 379 source authority is GREEN;
- the Current Source Gate and retained feature checks are GREEN;
- the same SHA is non-force fast-forwarded to `dev`;
- retained Development runtime acceptance is GREEN on that exact SHA;
- only then may the same SHA be non-force fast-forwarded to `main`;
- the durable Cloudflare Production exact-SHA acceptance proves that exact `main` SHA deployed successfully with Functions and passes immutable/canonical runtime smoke;
- no database migration or business/provider mutation was used to obtain acceptance.

Source GREEN alone is never Production GREEN.
