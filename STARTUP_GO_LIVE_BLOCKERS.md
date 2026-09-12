# Rosie Dazzlers — Current Development / Go-Live Acceptance

**Current planning boundary:** Build 386 living release authority. Resolve the accepted exact source/deployment identity from synchronized Git refs and exact-SHA workflow evidence rather than pinning a commit here.

**Planning authorities:** `AI_PROJECT_HANDOFF.md`, `AUTONOMOUS_RELEASE_QUEUE.md`, and `FORWARD_BUILD_ROADMAP_386_395.md`.

This document is an acceptance surface, not a claim that unchecked external/provider/runtime evidence has already passed.

## 1. Release governance and deployment identity

- [ ] Feature candidate passes focused authority, Current Source Gate and feature-preview acceptance on one exact SHA.
- [ ] `dev` passes exact-SHA Development deployment/runtime acceptance before Production promotion.
- [ ] `main` promotion is a non-force fast-forward of the same Development-GREEN SHA.
- [ ] Exact Production Cloudflare deployment identity, Functions metadata and canonical runtime smoke pass independently after source promotion.
- [ ] Branch/ruleset protection readiness is observed and documented fail-closed; missing protection evidence is not silently treated as GREEN.

## 2. Role/module and idle-load acceptance

- [ ] Administrator can reach every authorized internal module and cannot be narrowed below full internal access.
- [ ] Focused staff roles deny direct URL/API access outside their module/action ceilings.
- [ ] Detailer with no eligible open job does not wake live-job feeds/media/message loops.
- [ ] Operations, Finance, Admin, I.T., DAIP and Socials do not load business datasets merely from opening their shells.
- [ ] Customer progress refresh runs only for eligible active/visible work and stops for inactive/completed work.

## 3. Cloudflare/Supabase reliability

- [ ] Representative Development use shows no CPU-limit, memory-limit or invocation/retry storm caused by ordinary navigation.
- [ ] Runtime Diagnostics records safe route/status/wall-time/Ray/dependency evidence without storing secrets or generating its own traffic storm.
- [ ] Supabase connectivity and required schema dependencies fail closed with actionable I.T. evidence rather than request-time schema mutation.
- [ ] D1/legacy references are absent from Rosie Dazzlers runtime/deployment authority unless deliberately reintroduced by an approved build.

## 4. Payments and customer communication

- [ ] Stripe Development deposit/final-balance checkout and webhook settlement evidence pass on current release authority.
- [ ] Controlled refund/partial-refund evidence reconciles correctly before Production provider mutation is enabled.
- [ ] PayPal remains evidence-gated unless explicitly retained and accepted in current business scope.
- [ ] Email delivery distinguishes queued, delivered and failed evidence.
- [ ] SMS/push remain consent, sender/configuration, cost and delivery-evidence gated.

## 5. Public services, pricing and booking

- [ ] Principal packages and all add-ons show current inclusions, exclusions, condition factors and realistic price/range language.
- [ ] Variable-scope work such as headlight restoration, extraction/restoration, odor, pet hair, paint correction and protection explains inspection/escalation rules rather than implying one fixed effort level.
- [ ] Booking/quote flows revalidate current package, vehicle size, add-on compatibility, availability, price and deposit immediately before commitment.
- [ ] Refresh/back/retry, stale availability and 409 collision paths recover without duplicate booking/payment creation.

## 6. Media, R2 and proof

- [ ] Normal Photo Studio/public reads do not enumerate R2.
- [ ] Explicit approved R2 sync remains bounded and cannot create subrequest storms.
- [ ] Photo assignment shows placement ownership, supports before/after sets and multiple placements, and safely permits unassign/reset/delete-unassigned operations.
- [ ] Principal service and landing-page images do not silently fall back to stale/default media when approved media exists.
- [ ] Private DAIP originals/keys/signed URLs never appear in public manifests or public Photo Studio responses.

## 7. Operations, inventory and finance

- [ ] Field workflow captures readiness, before/after evidence, approved add-ons, product usage, completion evidence and final-balance handoff under staff authorization.
- [ ] Inventory usage/post/reversal/idempotency/shortage evidence is accepted with harmless Development records before Production operational reliance.
- [ ] Per-job consumable/product cost evidence converges into existing inventory/finance authority without a duplicate ledger.
- [ ] Finance can complete deposit/final-balance/refund/fee/HST/reconciliation/month-end/accountant-export scenarios with missing evidence held as review/unavailable.

## 8. Retention, maintenance and fleet

- [ ] Customer retention/rebook flows use genuine service history and current catalog/pricing authority.
- [ ] Maintenance enrollment follows approved cadence/price/inclusion/cancellation rules before recurring payment automation is enabled.
- [ ] Fleet minimums, tiers, travel limits, volume pricing, PO/reference and invoice grouping use approved business rules rather than inferred economics.
- [ ] Optional marketing/review outreach remains consent/eligibility/provider-evidence gated.

## 9. Public/mobile/SEO acceptance

- [ ] Booking, Services, Pricing, service landing pages, town pages and Customer app are checked at representative phone and desktop widths.
- [ ] Keyboard/focus/labels/contrast/reduced-motion remain accepted.
- [ ] One meaningful public H1, unique metadata/canonical/structured data, sitemap and robots authority pass.
- [ ] Local/service proof uses genuine approved reviews/media and truthful Oxford/Norfolk coverage.
- [ ] Search Console and Google Business Profile evidence is reviewed before changing verified local-search claims.

## 10. Recovery and launch boundary

- [ ] Retained recovery drill evidence remains readable and observation-only.
- [ ] Any real rollback, database restore, R2 mutation, DNS change, secret rotation or provider action receives explicit operator authorization and normal exact-SHA re-acceptance afterward.
- [ ] Controlled soft-launch/business-path acceptance is complete before unrestricted Production reliance.
- [ ] Production is not called GREEN from source promotion alone.