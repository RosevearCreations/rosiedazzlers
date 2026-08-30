# Rosie Dazzlers — Master Value Roadmap

**Living authority 2 of 2**  
**Build:** 271  
**Updated:** 2026-08-29

## North star

Build a professional mobile-first detailing platform connecting:

`lead / quote → booking → assigned work → live customer/detailer interaction → proof → payment → review/public proof → repeat maintenance`

while dormant modules stay asleep and server work is driven by real business events rather than polling.

## Current Development baseline — Build 271

### Platform / navigation

- `/app/` = Staff App Launcher, not Administration.
- `/app/admin/` = Business Administration.
- Protected navigation can return to Public Site / All Staff Apps / Module Home / Account.
- Eight independently loadable modules: Customer, Detailer, Operations, Administration, I.T., Finance, DAIP, Socials.
- Public discovery remains static-first and SEO-first.

### Role ceilings

- Detailer → Detailer.
- Senior Detailer / Operations Manager → Detailer + Operations.
- Accountant → Finance.
- I.T. Specialist → I.T.
- Promoter → Socials.
- DAIP Manager → DAIP.
- Admin → all seven internal modules and all actions.

Server authorization is authoritative. Hidden cards/links are not security.

### Permission architecture

Layered evaluation:

1. role/module ceiling;
2. per-user `permissions_profile.module_access` narrowing;
3. global module runtime availability;
4. explicit action permission;
5. workflow/business-state checks.

Per-user action overrides use `permissions_profile.action_access`. Build 271 makes real staff sessions and transition bridge-header auth normalize the historical TEXT profile through the same parser.

## Build 270 retained — Web Push infrastructure

Build 270 push infrastructure is already implemented in Development and should not be rebuilt on chat startup:

- server-only push-subscription table + RLS;
- existing customer notification preferences reused;
- separate staff/customer authenticated subscription endpoints;
- explicit click-to-subscribe only;
- VAPID key pair in Supabase Vault;
- service-role-only VAPID RPCs;
- active `rosie-web-push` Supabase Edge Function;
- `web-push@3.6.7` pinned;
- 404/410 subscription revocation;
- existing notification queue/retry/backoff remains the single delivery authority;
- I.T.-only remote push test;
- no notification polling loop.

Remaining work is acceptance/evidence and preference UX, not another push architecture.

## Build 271 implemented — communication + explicit actions

### Active communication boundary

Reuse the existing Build 210 unread/viewed/notified timestamps. Do not add a parallel unread system.

New live-message writes are allowed only while the booking/job is in an active live state. Completed/inactive history remains readable but live customer/detailer messages close.

Deep links:

- customer → exact progress message form;
- assigned staff → exact bounded Detailer job/live-job host.

The Detailer deep-link resolver is one-shot and does not poll for missing jobs.

### Operations actions converted

- assignment/crew changes → `operations.assignment.manage`;
- date/slot/range block/unblock writes → `operations.schedule.manage`.

### Finance actions converted

- payment application write → `finance.post`;
- bank reconciliation read → `finance.view`;
- reconciliation save → `finance.reconcile`;
- period-close read → `finance.view`;
- period-close write → `finance.period.close`.

Accountant defaults now include `finance.period.close`; Detailer has no Finance action.

### Build 271 source gates

- focused Build 271 release guard: PASS;
- cumulative Build 270 guard: PASS against canonical authorities;
- 598 Functions static checks;
- 63 critical JS syntax checks;
- customer profile quality PASS;
- route-copy parity PASS;
- global one-H1 PASS;
- no new polling in Build 271 paths.

## P0 — deployed Build 271 acceptance

Before calling Build 271 Development-proven:

1. Confirm the exact current `dev` head is the Development Pages deployment; keep `main` untouched.
2. Admin: all seven internal modules visible/accessible.
3. Detailer: Detailer only; Operations/Finance/Admin/I.T./DAIP/Socials direct URLs/APIs denied.
4. Senior Detailer: Detailer + permitted Operations reads only; high-risk schedule/assignment mutation follows action defaults/overrides.
5. Operations Manager: assignment/schedule writes pass; Finance/Admin/I.T./DAIP/Socials denied.
6. Accountant: Finance reads/post/reconcile/period-close pass; Operations/Admin/I.T./DAIP/Socials denied.
7. I.T. Specialist: I.T. notification/runtime controls pass; business/payment mutations denied.
8. Promoter: Socials only; publish/manage actions scoped there.
9. DAIP Manager: DAIP only and existing privacy gates remain authoritative.
10. Verify active customer ↔ Detailer message flow and push deep links on real sessions/devices.
11. Verify completed/inactive job message writes reject cleanly while history stays readable.
12. Capture Cloudflare evidence: exceeded CPU = 0, script exceptions = 0, memory exceeded = 0 for representative use.

## Build 272 candidate — finish high-value action extraction

Continue explicit permissions before adding more broad feature surface.

### Operations

Convert remaining high-risk mutation paths in this order:

1. quote create/edit/send/accept-state changes;
2. customer identity/contact/service-history mutations;
3. booking cancellation/reschedule/override;
4. incident/report approval and customer-visible publishing;
5. review-request queue mutation.

Keep read-only operational views separate from mutation actions.

### Finance

Convert remaining high-risk paths:

1. refunds and refund approvals;
2. deposit/final-balance settlement mutation;
3. manual journal posting / adjusting entries;
4. tax-close/lock actions;
5. payroll finalization;
6. accountant export generation where sensitive.

Do not make Accountant depend on broad `manage_staff` authority.

### I.T. / Administration / Socials / DAIP

Then continue:

- I.T.: diagnostics/test/runtime/module settings;
- Administration: staff/catalog/inventory configuration;
- Socials: review/edit/publish/provider actions;
- DAIP: intake/review/promote only behind private-media/consent gates.

## Preference / communication UX

Only extend stored authorities already present:

- customer notification opt-in/channel/event preferences;
- push subscription event preferences;
- subscription quiet-hours fields where a clear user-facing need exists.

Do not create another customer-preferences table or another queue.

Next UX priorities:

- clear notification/preferences surface in Customer App;
- staff device preference/quiet-hours surface in I.T. or Account;
- clear “live messaging closed” state on completed jobs;
- unread indicators in Operations/Detailer using existing viewed timestamps;
- deep links to quote/payment context where events already know those targets.

## Module extraction priority

Some module cards still open compatibility pages. Extract the highest-use workflows into lazy module components in this order:

1. Operations customer/booking/quote support;
2. Finance accounting/payments/reconciliation/period close;
3. I.T. Startup/Test/Runtime health;
4. Administration Staff/Inventory/Catalog;
5. Socials Content/Photo/SEO/Integrations;
6. DAIP only as privacy/cost/processing gates permit.

Retire compatibility routes only after authorization, mobile/desktop behavior and server-load evidence are clean.

## Native packaging after web event model is proven

### Mobile

Use one codebase with Capacitor rather than forking business logic.

Priorities:

- native push;
- camera/photo/video capture;
- weak-network awareness and safe retry/cancel;
- deep links to assigned job/message/payment;
- background behavior only where OS + business need justify it;
- real Wi-Fi/cellular acceptance.

### Desktop / tray

Tauri remains optional/later. Add a true tray/startup wrapper only if it creates clear operational value. A minimized desktop shell must not keep Detailer/Finance/DAIP subsystems awake.

## Current go-live evidence still open

Keep these bridged to the **current release**, never stale historical build numbers:

- Stripe test deposit/final-balance/refund/webhook settlement;
- PayPal sandbox parity decision/acceptance if PayPal remains in scope;
- email/SMS/Web Push real-provider delivery/retry/failure evidence;
- transactional inventory posting/reversal/idempotency/shortage acceptance;
- Supabase restore rehearsal;
- Cloudflare deployment rollback rehearsal;
- DAIP private media processing/retry/cancel/dead-letter/usage evidence;
- real-device CSS, keyboard/focus/contrast/reduced-motion/accessibility acceptance;
- Search Console, sitemap/canonical/schema and Google Business Profile evidence;
- controlled invite-only soft launch with monitoring.

## DAIP direction

DAIP remains private/governed and independently switchable:

1. private ingestion/storage authorization;
2. proxy/thumbnail/contact-sheet processing outside ordinary Pages request paths;
3. retry/cancel/dead-letter + usage/cost recording;
4. privacy/consent review;
5. evidence/lesson/content-package review;
6. approved-only Gallery/Social handoff;
7. never automatic public publishing.

## Public/business priorities after reliability

- replace remaining visual placeholders with approved Rosie-owned proof;
- strengthen Gallery Evidence/Technique/Efficiency proof;
- continue service-cost/minimum-price authority so labour/consumables/overhead protect margins;
- measure quote-to-booking and repeat-maintenance conversion before adding more marketing integrations;
- keep Oxford/Norfolk local pages genuinely useful/distinct;
- maintain detailed condition-aware service/add-on landing pages and one meaningful H1 per public page.

## Permanent guardrails

- one meaningful H1 per public/indexable page;
- crawlable static-first service/local pages;
- no public R2 bucket enumeration on normal requests;
- no subsystem polling merely because a module/app is installed or authorized;
- optional refresh pauses while hidden and should be event/manual first;
- heavy aggregation/filtering belongs in Postgres, not Worker JavaScript;
- no automatic replay of ambiguous non-idempotent writes;
- server authorization is authoritative;
- customer/private DAIP media never becomes public without explicit consent/review;
- secrets never belong in browser code or Git;
- `main` / live Production is promoted only deliberately from an accepted Development release.
