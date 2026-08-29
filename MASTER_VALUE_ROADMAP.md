# Rosie Dazzlers — Master Value Roadmap

**Living authority 2 of 2**  
**Build:** 269  
**Updated:** 2026-08-29

## North star

Build a professional mobile-first detailing platform that connects:

`lead / quote → booking → assigned work → live customer/detailer interaction → proof → payment → review/public proof → repeat maintenance`

while keeping dormant modules asleep and minimizing Cloudflare/server work.

## P0 — accept the modular Development baseline

Before major new feature work:

1. Confirm the current Build 269 `dev` head is the Development Pages deployment only; keep live `main` untouched.
2. Confirm service-worker/cache/module-resolver identity is Build 269.
3. Confirm `/app/` is clearly the Staff App Launcher, `/app/admin/` is Administration, and both launcher/protected pages can return to the Public Site.
4. Admin: verify all seven internal module cards and direct entry to every module.
5. Detailer: Detailer only; direct Operations/Finance/Admin/I.T./DAIP/Socials access denied.
6. Senior Detailer / Operations Manager: Detailer + Operations only.
7. Accountant: Finance only; Finance endpoints work without granting broad staff administration.
8. I.T. Specialist: I.T. only; technical diagnostics do not imply business/payment mutation authority.
9. Promoter: Socials/Marketing/Content/SEO integrations only.
10. DAIP Manager: DAIP only and existing DAIP gates remain authoritative.
11. Prove launcher/module homes create no business-data polling and no-open-job Detailer remains asleep.
12. Capture representative Cloudflare evidence: exceeded CPU = 0, script exceptions = 0, memory exceeded = 0.

## Build 269 — explicit action permissions + event notification authority

Build 269 is now source-implemented as the first action-permission convergence release.

Implemented foundation:

- `staff_users.permissions_profile` is normalized safely when historical Development returns TEXT and when fresh/canonical databases return JSONB;
- staff saves preserve the observed TEXT/JSONB representation instead of blindly sending one type;
- `data/action_permissions.json` defines the initial explicit action vocabulary and role defaults;
- role/module ceilings are checked before action access, so action grants cannot escape a role's module ceiling;
- Admin remains all modules/all actions;
- the existing notification queue remains event/manual driven;
- notification list/read now requires `it.notifications.view`;
- notification process/retry now requires `it.notifications.process`;
- selected `/api/admin/` compatibility copies are thin wrappers around canonical handlers rather than duplicated logic;
- no notification polling loop was introduced.

Current action families include:

- Detailer: `detailer.job.view`, `detailer.job.update`, `detailer.message.send`;
- Operations: `operations.schedule.view`, `operations.schedule.manage`, `operations.assignment.manage`, `operations.customer.manage`;
- Administration: `admin.staff.view`, `admin.staff.manage`, `admin.settings.manage`;
- I.T.: `it.runtime.view`, `it.runtime.manage`, `it.notifications.view`, `it.notifications.process`, `it.modules.manage`;
- Finance: `finance.view`, `finance.post`, `finance.reconcile`;
- DAIP: `daip.view`, `daip.manage`;
- Socials: `socials.view`, `socials.manage`, `socials.publish`.

Remaining Build 269 acceptance:

- deployed Admin/focused-role browser evidence;
- direct URL/API denial evidence outside module/action ceilings;
- staff edit/save evidence against the historical TEXT profile column;
- I.T. Specialist notification list/process evidence without granting broad `manage_staff`;
- Cloudflare cache/runtime/CPU evidence.

## Build 270 — stored Web Push + customer/detailer communication completion

Use the existing notification queue as the event source instead of creating a polling service.

Add the minimum persistent push authority required for real remote delivery:

- browser/device push subscriptions tied to the authenticated customer/staff identity;
- notification preference and consent state;
- optional quiet hours;
- endpoint/provider identifiers and subscription lifecycle/revocation;
- delivery attempt/error/audit linkage to existing notification events;
- VAPID/provider configuration held in secrets, never source;
- remove expired/unsubscribed endpoints safely;
- no periodic client “anything changed?” polling.

Then finish the two-way communication experience:

- customer ↔ Detailer/Operations messages;
- unread/badge state;
- push/deep-link into the exact job/message;
- safe attachments/media;
- message delivery/failure state;
- completed-job messaging sleep/archive rules;
- assignment/schedule/job-state/payment/urgent-I.T. events wake only relevant recipients.

## Build 271 — native mobile packaging

Package the same shared app with Capacitor for Android/iOS after the PWA/event model is accepted.

Priorities:

- native push;
- camera/photo/video capture;
- weak-network awareness and safe retry/cancel;
- deep links to assigned job/message/payment;
- background behavior only where the operating system allows and the business case requires it;
- real Wi-Fi/cellular acceptance.

Do not fork business logic into a second mobile codebase.

## Build 272 — desktop/tray packaging if useful

Use a thin Tauri wrapper around the same Rosie application only if a true system tray/start-with-Windows/background-notification benefit is demonstrated. Do not keep Detailer/Finance/DAIP services awake merely because a desktop shell is minimized.

## Continue explicit action conversion

Keep legacy capabilities only as a temporary compatibility bridge. Convert high-value endpoints to explicit action permissions in this order:

1. Operations assignment/schedule/customer/quote mutations.
2. Finance read/post/reconcile/refund/close.
3. I.T. diagnostics/test/runtime/module settings.
4. Administration staff/catalog/inventory configuration.
5. Socials review/edit/publish/provider integrations.
6. DAIP intake/review/promote only behind existing privacy gates.

Each conversion must prove that a focused role can do its job without inheriting unrelated broad authority.

## Continue module extraction

The card hierarchy owns 60+ existing workflows, but some cards still open compatibility pages. Migrate high-use workflows into true lazy module components in this order:

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

DAIP remains private/governed and independently switchable. Continue only behind its existing gates:

1. private ingestion/storage authorization;
2. proxy/thumbnail/contact-sheet processing outside ordinary Pages request paths;
3. retry/cancel/dead-letter and usage/cost recording;
4. privacy/consent review;
5. evidence/lesson/content-package review;
6. approved-only Gallery/Social handoff;
7. never automatic public publishing.

## Public/business work after reliability

- replace remaining visual placeholders with approved Rosie-owned real proof;
- improve Gallery Evidence/Technique/Efficiency proof;
- continue service-cost/minimum-price authority so labour/consumables/overhead protect margins;
- measure quote-to-booking and repeat-maintenance conversion before adding more marketing integrations;
- keep local Oxford/Norfolk pages useful and distinct rather than keyword-swapped duplicates.

## Permanent guardrails

- one meaningful H1 per public/indexable page;
- descriptive titles/meta, honest local relevance and crawlable static-first service pages;
- no public R2 bucket enumeration on normal requests;
- no routine subsystem polling merely because a module is installed/authorized;
- optional refresh pauses while hidden and should be event/manual first;
- heavy aggregation/filtering belongs in Postgres, not Worker JavaScript;
- no automatic replay of ambiguous non-idempotent writes;
- server authorization is authoritative; hidden navigation is not security;
- customer/private DAIP media never becomes public without explicit consent/review;
- `main`/live Production is promoted only deliberately from an accepted Development release.
