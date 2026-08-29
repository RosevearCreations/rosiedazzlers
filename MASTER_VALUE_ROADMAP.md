# Rosie Dazzlers — Master Value Roadmap

**Living authority 2 of 2**  
**Build:** 270  
**Updated:** 2026-08-29

## North star

Build a professional mobile-first detailing platform that connects:

`lead / quote → booking → assigned work → live customer/detailer interaction → proof → payment → review/public proof → repeat maintenance`

while dormant modules remain asleep and server work is driven by real events rather than polling.

## P0 — accept the current Development baseline

1. Confirm the current Build 270 `dev` head is the Development Pages deployment only; keep live `main` untouched.
2. Confirm `/app/`, `/app/customer/`, service worker, module resolver and cache-health identity are all Build 270.
3. Confirm `/app/` is the Staff App Launcher, `/app/admin/` is Administration, and launcher/protected pages can return to the Public Site.
4. Admin: verify all seven internal staff module cards and direct module entry.
5. Detailer: Detailer only; direct Operations/Finance/Admin/I.T./DAIP/Socials access denied.
6. Senior Detailer / Operations Manager: Detailer + Operations only.
7. Accountant: Finance only; Finance work must not require broad staff administration.
8. I.T. Specialist: I.T. only; notification/runtime actions must not grant business/payment mutation authority.
9. Promoter: Socials/Marketing/Content/SEO integrations only.
10. DAIP Manager: DAIP only and existing privacy gates remain authoritative.
11. Prove launcher/module homes create no business-data polling and no-open-job Detailer remains asleep.
12. Capture representative Cloudflare evidence: exceeded CPU = 0, script exceptions = 0, memory exceeded = 0.

## Build 269 foundation retained

Build 269 established:

- schema-tolerant TEXT/JSONB staff permission profiles;
- explicit action-permission vocabulary layered under role/module ceilings;
- notification administration scoped to `it.notifications.view` / `it.notifications.process`;
- selected `/api/admin/` duplicate handlers consolidated into canonical wrappers;
- Staff App Launcher/Public Site navigation clarity;
- no new polling.

Continue replacing broad legacy capabilities with explicit actions in this order:

1. Operations assignment/schedule/customer/quote mutations.
2. Finance read/post/reconcile/refund/close.
3. I.T. diagnostics/test/runtime/module settings.
4. Administration staff/catalog/inventory configuration.
5. Socials review/edit/publish/provider integrations.
6. DAIP intake/review/promote only behind privacy gates.

## Build 270 — event-driven Web Push foundation

### Applied database authority

Development migration `build270_push_subscription_authority` is applied and canonicalized as:

`sql/2026-08-29_build270_push_subscription_authority.sql`

It adds:

- `notification_events.recipient_staff_user_id`;
- server-only `notification_push_subscriptions`;
- exact staff/customer owner constraint;
- unique browser endpoint;
- active-recipient indexes;
- RLS enabled;
- no direct `anon` / `authenticated` grants;
- service-role CRUD only.

Reuse existing customer notification preferences. Do not create another customer preference system.

### Subscription/API boundary

Staff endpoints:

- `/api/push_config`
- `/api/push_subscribe`
- `/api/push_unsubscribe`

Customer endpoints:

- `/api/customer_push_config`
- `/api/customer_push_subscribe`
- `/api/customer_push_unsubscribe`

Rules:

- subscription begins only from an explicit user click;
- staff/customer session ownership is separate;
- customer remote push additionally requires existing `notification_opt_in=true`;
- VAPID private key never enters source/browser responses;
- no push polling/timers.

### Queue/event integration

The existing `notification_events` retry/backoff queue remains the single delivery authority.

- `channel='push'` uses staff/customer UUID recipient authority.
- Customer live progress/media/comment/message events may enqueue one secondary push record only if opted in, event preference allows it, and an active customer subscription exists.
- Assigned-staff live alerts may enqueue one push record for `bookings.assigned_staff_user_id` when that staff account has an active subscription.
- Device fan-out belongs in the sender/provider, not in booking/message request handling.
- `provider-dispatch.js` has a fail-closed push webhook slot; missing provider configuration must produce a clear failure, never a false `sent` state.

### Build 270 acceptance still open

- current `dev` SHA deployed to Development Pages;
- launcher/cache identity acceptance;
- Admin + all focused-role direct URL/API acceptance;
- staff save/edit against historical TEXT profile column;
- real Web Push sender/VAPID secrets configured in a secret store;
- one staff and one opted-in customer remote Web Push accepted;
- expired/410 endpoint revocation behavior;
- queue retry/failure audit evidence;
- representative Cloudflare CPU/error evidence.

## Next release — Build 271: communication acceptance + explicit actions

After remote push sender acceptance:

1. Complete Customer ↔ Detailer/Operations unread/message delivery state.
2. Deep-link push into the exact active job/message/quote/payment context.
3. Archive/sleep completed-job messaging cleanly.
4. Convert Operations high-value writes to explicit actions.
5. Convert Finance high-value reads/writes/refunds/reconciliation/close to explicit actions.
6. Add notification preference/quiet-hours editing UI only where the stored authority is already present.
7. Keep event creation bounded; never add an “anything changed?” client poll.

## Build 272 — native mobile packaging

After the web/PWA event model is proven, package the same codebase with Capacitor for Android/iOS.

Priorities:

- native push;
- camera/photo/video capture;
- weak-network awareness and safe retry/cancel;
- deep links to assigned job/message/payment;
- background behavior only where the OS and business case require it;
- real Wi-Fi/cellular acceptance.

Do not fork business logic into a second mobile application.

## Build 273 — desktop/tray only if justified

Use a thin Tauri wrapper only if true Windows/macOS tray/startup/background notifications create clear value. A minimized desktop shell must not keep Detailer/Finance/DAIP subsystems awake.

## Continue module extraction

The module card hierarchy owns 60+ existing workflows, but some still open compatibility pages. Migrate high-use workflows into lazy module components in this order:

1. Operations customer/booking/quote support.
2. Finance accounting/payments/payroll/close.
3. I.T. Startup/Test/Runtime health.
4. Administration Staff/Inventory/Catalog.
5. Socials Content/Photo/SEO/Integrations.
6. DAIP only as privacy/cost/processing gates permit.

Retire a compatibility route only after authorization, mobile/desktop behavior and server-load evidence are clean.

## Go-live evidence still open

- Stripe test deposit/final-balance/refund/webhook settlement.
- PayPal sandbox parity decision if PayPal remains in scope.
- actual email/SMS/Web Push provider delivery, retry and failure evidence.
- transactional inventory posting/reversal/idempotency/shortage acceptance.
- Supabase restore rehearsal and Cloudflare deployment rollback.
- real-device CSS, keyboard/focus/contrast/reduced-motion/accessibility acceptance.
- Search Console, sitemap/canonical/schema and Google Business Profile evidence.
- controlled invite-only soft launch with monitoring.

## DAIP direction

DAIP remains private/governed and independently switchable:

1. private ingestion/storage authorization;
2. proxy/thumbnail/contact-sheet processing outside ordinary Pages request paths;
3. retry/cancel/dead-letter and usage/cost recording;
4. privacy/consent review;
5. evidence/lesson/content-package review;
6. approved-only Gallery/Social handoff;
7. never automatic public publishing.

## Public/business work after reliability

- replace remaining visual placeholders with approved Rosie-owned proof;
- improve Gallery Evidence/Technique/Efficiency proof;
- continue service-cost/minimum-price authority so labour/consumables/overhead protect margins;
- measure quote-to-booking and repeat-maintenance conversion before adding more marketing integrations;
- keep Oxford/Norfolk local pages genuinely useful and distinct.

## Permanent guardrails

- one meaningful H1 per public/indexable page;
- crawlable static-first service/local pages;
- no public R2 bucket enumeration on normal requests;
- no subsystem polling merely because a module/app is installed or authorized;
- optional refresh pauses while hidden and should be event/manual first;
- heavy aggregation/filtering belongs in Postgres, not Worker JavaScript;
- no automatic replay of ambiguous non-idempotent writes;
- server authorization is authoritative; hidden navigation is not security;
- customer/private DAIP media never becomes public without explicit consent/review;
- secrets never belong in browser code or Git;
- `main`/live Production is promoted only deliberately from an accepted Development release.
