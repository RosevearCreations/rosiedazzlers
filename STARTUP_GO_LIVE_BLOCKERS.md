# Rosie Dazzlers — Current Development / Go-Live Acceptance

**Current source:** Build 268 repository hygiene + Build 267 modular role runtime.  
**Planning authorities:** `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`.

## 1. Development deployment/cache

- [ ] Deploy Pages + Functions together to the Development project.
- [ ] Confirm `_routes.json` invokes Functions only for `/api/*`.
- [ ] Hard-refresh and confirm service-worker/cache/runtime identity is Build 268.
- [ ] Confirm no deleted root API shim or root migration path is referenced by runtime/deployment tooling.

## 2. Role/module acceptance

Database migration evidence already confirms the expanded role constraint, `staff_role_module_defaults`, and an Administrator with all seven internal module grants.

Runtime acceptance still required:

- [ ] Administrator → all seven internal modules.
- [ ] Detailer → Detailer only.
- [ ] Senior Detailer → Detailer + Operations only.
- [ ] Operations Manager → Detailer + Operations only.
- [ ] Accountant → Finance only.
- [ ] I.T. Specialist → I.T. only.
- [ ] Promoter → Socials & Promotion only.
- [ ] DAIP Manager → DAIP only.
- [ ] For every focused role, direct URL and direct API attempts outside its module/action scope deny safely.
- [ ] Staff & Access cannot narrow an Administrator below all internal modules.

## 3. Idle/server-load acceptance

- [ ] Leave `/app/` and each module home idle for five minutes: no module business-data polling.
- [ ] Detailer with no eligible open job: no live-job bundle/feed/media/message loop.
- [ ] Scheduled Detailer job does not wake the live bundle until eligible open-job state.
- [ ] Operations shell loads no dataset until a workstream is selected; workstreams remain manual/event-driven.
- [ ] Finance/Admin/I.T./DAIP/Socials shells load no subsystem data merely from opening.
- [ ] Customer progress refresh exists only for active visible jobs and stops for completed/inactive jobs.

## 4. Cloudflare reliability

During representative Development use:

- [ ] Exceeded CPU Time Limits = 0.
- [ ] Script exceptions = 0.
- [ ] Memory exceeded = 0.
- [ ] No retry/invocation storm after a harmless 5xx/network failure.
- [ ] Runtime Diagnostics captures safe route/status/wall-time/Ray evidence without storing secrets or creating its own diagnostic API traffic.

## 5. Payments/notifications

- [ ] Stripe test deposit/final-balance checkout succeeds.
- [ ] Stripe webhook settlement/reconciliation succeeds.
- [ ] Controlled refund/partial refund succeeds and is reflected in accounting evidence.
- [ ] Decide/test PayPal sandbox parity if PayPal remains in scope.
- [ ] Real email provider: queued vs delivered vs failed state verified.
- [ ] SMS only after consent/sender/quiet-hours/cost controls are accepted.
- [ ] Remote Web Push is not claimed complete until subscription storage + server delivery are implemented/tested.

## 6. Inventory/accounting

- [ ] Inventory posting preview/post/reversal/idempotency/shortage tested with harmless Development records.
- [ ] Product/catalog publish readiness blocks incomplete rows.
- [ ] Finance role can complete intended accounting/payroll/tax/close workflows without Staff/Admin access.

## 7. Media/DAIP

- [ ] Normal Photo Studio/public reads do not enumerate R2.
- [ ] Explicit approved R2 sync remains bounded.
- [ ] Private DAIP originals/keys/signed URLs never appear in public manifests/Photo Studio.
- [ ] DAIP processing, retry/dead-letter, privacy review and derivative/public handoff remain gated until separately accepted.

## 8. Public/mobile/SEO

- [ ] Booking, Services, Pricing, service landing pages and Customer app checked on real phone + desktop widths.
- [ ] Keyboard/focus/labels/contrast/reduced-motion accepted.
- [ ] PWA install/standalone/icon/shortcut behavior accepted on representative devices.
- [ ] One public H1, canonicals, sitemap and structured data validated.
- [ ] Search Console and Google Business Profile evidence reviewed before changing local SEO scope.

## 9. Recovery/promotion

- [ ] Supabase restore rehearsal completed.
- [ ] Cloudflare deployment rollback rehearsal completed.
- [ ] Development release reviewed deliberately before any `main`/live promotion.
- [ ] Controlled invite-only soft launch completed before unrestricted go-live.
