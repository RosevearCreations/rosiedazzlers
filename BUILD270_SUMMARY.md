# Build 270 — Event-driven Web Push subscription, Vault and sender convergence

**Date:** 2026-08-29

Build 270 extends the Build 269 modular/action-permission baseline without adding polling.

## Implemented

- Applied Development migration `build270_push_subscription_authority`.
- Added server-only `notification_push_subscriptions` with RLS enabled and no `anon`/`authenticated` grants.
- Added `notification_events.recipient_staff_user_id` so staff push events use the existing queue/retry authority.
- Reused existing customer notification opt-in/event preferences instead of creating a duplicate preferences table.
- Added authenticated, owner-scoped staff push config/subscribe/unsubscribe APIs.
- Added authenticated, owner-scoped customer push config/subscribe/unsubscribe APIs.
- Customer subscription creation refuses remote push unless existing Rosie `notification_opt_in` is true.
- The shared install client creates a browser PushSubscription only after the user clicks **Enable device notifications**; nothing subscribes automatically at page load.
- Staff and Customer App use separate session-cookie endpoints so ownership cannot be confused.
- Generated a fresh P-256 VAPID key pair and provisioned it directly into Supabase Vault; the private key is not stored in Git or browser-visible settings.
- Applied service-role-only Vault RPC authority:
  - `notification_push_public_config()`
  - `notification_push_private_config()`
- Public Pages config endpoints can call only the public-key RPC.
- Deployed Supabase Edge Function `rosie-web-push` version 1 with JWT verification enabled; current deployment status is ACTIVE.
- Versioned the deployed Edge sender source under `supabase/functions/rosie-web-push/index.ts`.
- Pinned sender dependency `npm:web-push@3.6.7`.
- The Edge sender loads private VAPID material server-side, loads active subscriptions, sends encrypted Web Push, and revokes endpoints on provider 404/410 responses.
- The existing provider dispatcher defaults push delivery to the Supabase Edge sender using the server-side Supabase credential already available to Pages Functions.
- An explicit external push webhook remains supported only when its own provider auth token is configured; Supabase service-role credentials are never sent to arbitrary override URLs.
- Extended the existing notification queue processor to recognize customer/staff UUID push recipients and retain existing retry/backoff behavior.
- Customer progress/media/comment/message events may enqueue one secondary push event only when an active customer subscription exists and the corresponding Rosie preference permits it.
- Staff live-interaction alerts may enqueue push for the assigned staff UUID when that staff account has an active subscription.
- Added an I.T.-only current-account remote push acceptance path:
  - `/api/push_test` verifies `it.notifications.process` and an active subscription;
  - `/app/it/` **Send remote push test** queues only the current staff account event and processes only that returned event id.
- `/app/`, `/app/customer/`, `/app/it/`, module resolver, service worker and cache-health identity are synchronized to Build 270.

## Security / runtime properties

- Push endpoints and browser assets never return the VAPID private key.
- Subscription endpoint/auth keys live in a server-only table accessed by service role only.
- Browser roles have no direct grants on the push-subscription table.
- Vault public/private RPCs are executable by `service_role` only.
- One browser push endpoint can have only one active Rosie owner; re-association requires an authenticated current session.
- Customer browser permission cannot override Rosie notification consent.
- No notification polling loop was added.
- No per-device fan-out occurs inside booking/message requests; they enqueue a recipient-level event only.
- Device fan-out and stale endpoint handling happen only inside the event-triggered Edge sender.
- Heavy business modules remain out of service-worker precache.

## Source / database acceptance completed

- Build 270 push database migration applied and verified.
- VAPID Vault secrets provisioned and service-role-only RPC grants verified.
- Public VAPID configuration verified without exposing the private key.
- `rosie-web-push` Edge Function verified ACTIVE, version 1.
- Development schema verified `bookings.assigned_staff_user_id` exists as UUID.
- Final reconstructed source checks passed:
  - 598 Cloudflare Functions JS files static-checked;
  - 0 broken relative imports/exports;
  - customer-profile quality PASS;
  - route-copy parity PASS;
  - global one-H1 SEO PASS;
  - push/Vault/provider architecture assertions PASS.

## Still required before remote Web Push is accepted

- Confirm the current Build 270 `dev` head is the Development Pages deployment.
- Sign in on a real staff browser/device and click **Enable device notifications**.
- Verify a staff `notification_push_subscriptions` row is created.
- Use I.T. **Send remote push test** and prove the notification reaches that device through the queue + Edge sender.
- Repeat with a signed-in, notification-opted-in customer device.
- Capture `notification_events` success/provider response and subscription `last_success_at` evidence.
- Capture representative Cloudflare CPU/script/memory evidence.
- Complete Admin and focused-role module/direct-URL/API acceptance.

Remote sender infrastructure is complete; **real-device delivery evidence is still open**.
