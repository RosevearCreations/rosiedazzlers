# Build 270 — Event-driven Web Push subscription and queue foundation

**Date:** 2026-08-29

Build 270 extends the Build 269 modular/action-permission baseline without adding polling.

## Implemented

- Applied Development migration `build270_push_subscription_authority`.
- Added server-only `notification_push_subscriptions` with RLS enabled and no `anon`/`authenticated` grants.
- Added `notification_events.recipient_staff_user_id` so staff push events can use the existing queue/retry authority.
- Reused existing customer notification opt-in/event preferences instead of creating a duplicate preferences table.
- Added authenticated, owner-scoped staff push config/subscribe/unsubscribe APIs.
- Added authenticated, owner-scoped customer push config/subscribe/unsubscribe APIs.
- Customer subscription creation refuses remote push unless the existing Rosie customer notification opt-in is true.
- The shared install client creates a browser PushSubscription only after the user clicks **Enable device notifications**; nothing subscribes automatically at page load.
- Staff and Customer App use separate session-cookie endpoints so ownership cannot be confused.
- Added a fail-closed `push` provider slot to the existing provider dispatcher.
- Extended the existing notification queue processor to recognize customer/staff UUID push recipients and retain the existing retry/backoff behavior.
- Customer progress/media/comment events may enqueue one secondary push event only when an active customer subscription exists and the corresponding Rosie preference permits it.
- Staff live-interaction alerts may enqueue push for the assigned staff UUID when that staff account has an active subscription.
- `/app/`, `/app/customer/`, module resolver, service worker and cache-health identity are synchronized to Build 270.

## Security / runtime properties

- Push endpoints and browser assets never return the VAPID private key.
- Subscription endpoint/auth keys live in a server-only table accessed by the service role.
- Browser roles have no direct grants on the push-subscription table.
- One browser push endpoint can have only one active Rosie owner; re-association requires an authenticated current session.
- No notification polling loop was added.
- No per-device fan-out occurs inside booking/message requests; they enqueue a recipient-level event only.
- Heavy business modules remain out of service-worker precache.

## Still required before remote Web Push is accepted

- Configure a real VAPID key pair in a secret store; never commit the private key.
- Configure `NOTIFICATIONS_PUSH_WEBHOOK_URL` and its provider authentication token, or provide an equivalent secure sender integration.
- Prove encrypted Web Push delivery to at least one staff device and one opted-in customer device.
- Handle expired/410 subscriptions by revoking stale endpoints after provider evidence is available.
- Capture queue success/failure/retry evidence and Cloudflare CPU/error evidence.
- Complete deployed Build 270 role/module/direct-URL acceptance.

Source completion does **not** claim remote push delivery is live yet.
