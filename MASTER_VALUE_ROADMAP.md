# Rosie Dazzlers — Master Value Roadmap

**Living authority 2 of 2**  
**Build:** 268  
**Updated:** 2026-08-29

## North star

Build a professional mobile-first detailing platform that connects:

`lead / quote → booking → assigned work → live customer/detailer interaction → proof → payment → review/public proof → repeat maintenance`

while keeping dormant modules asleep and minimizing Cloudflare/server work.

## P0 — accept the modular Development baseline

Before major new feature work:

1. Deploy the cleaned Build 268 source to the Development Pages project only; keep live `main` untouched.
2. Confirm service-worker/cache/runtime identity is Build 268.
3. Admin: verify all seven internal module cards and direct entry to every module.
4. Detailer: Detailer only; direct Operations/Finance/Admin/I.T./DAIP/Socials access denied.
5. Senior Detailer / Operations Manager: Detailer + Operations only.
6. Accountant: Finance only; Finance endpoints work without granting broad staff administration.
7. I.T. Specialist: I.T. only; technical diagnostics do not imply business/payment mutation authority.
8. Promoter: Socials/Marketing/Content/SEO integrations only.
9. DAIP Manager: DAIP only and existing DAIP gates remain authoritative.
10. Prove launcher/module homes create no business-data polling and no-open-job Detailer remains asleep.
11. Capture representative Cloudflare evidence: exceeded CPU = 0, script exceptions = 0, memory exceeded = 0.

## Build 269 — explicit action permissions + event notification authority

Replace remaining broad legacy capability assumptions with explicit module/action permissions while preserving existing server checks during migration.

Target vocabulary examples:

- `operations.view`, `operations.assign`, `operations.schedule`
- `finance.view`, `finance.reconcile`, `finance.refund`, `finance.close`
- `it.view_health`, `it.run_tests`, `it.manage_runtime`
- `socials.edit`, `socials.review`, `socials.publish`
- `daip.intake`, `daip.review`, `daip.promote`

Build one event authority for meaningful business events rather than periodic “anything changed?” reads. Initial events:

- job assigned/reassigned;
- customer/detailer message;
- schedule/time change;
- job Arrived/Started/Paused/Completed;
- payment request/settlement/refund failure;
- urgent notification/provider failure;
- critical I.T./runtime failure.

Requirements:

- event delivery is opt-in/role-aware;
- no event means no notification polling;
- unread state is bounded and local responses update client state without full workspace reloads;
- preferences, consent, quiet hours, provider IDs, attempts and failure state are auditable;
- remote Web Push subscription/server delivery is implemented only after keys/storage/privacy are explicitly configured.

## Build 270 — customer/detailer communication completion

Turn the existing job feed into the finished two-way communication experience:

- customer ↔ Detailer/Operations messages;
- unread/badge state;
- push/deep-link into the exact job/message;
- safe attachments/media;
- message delivery/failure state;
- completed-job messaging sleep/archive rules;
- no always-on Detailer messaging loop.

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
- actual email/SMS/push provider delivery, retry and failure evidence.
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
