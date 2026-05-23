# COMPETETIVE.md Completion Matrix — Build 167

**Updated:** 2026-05-23  
**Baseline:** `rosiedazzlers-dev(161).zip`  
**Roadmap authority:** `DEVELOPMENT_ROADMAP.md`

Build 167 is a deeper completion pass against the remaining `COMPETETIVE_COMPLETION_MATRIX.md` items. It focuses on work that can be completed safely now without platform approvals or a full CMS rebuild: direct quote-photo upload foundation, structured fleet/maintenance inquiry forms, FAQ/Breadcrumb schema foundations, and clearer tracking of what is complete versus what still needs admin/database management.

## Build 167 completion changes

| Matrix area | Build 167 status | Details |
| --- | --- | --- |
| Direct customer upload | Foundation added | Booking Step 4 now includes optional estimate photo/video upload. The new `/api/public_photo_estimate_upload_url` endpoint signs storage uploads when `PUBLIC_PHOTO_ESTIMATE_UPLOADS_ENABLED=true`; if not enabled, the existing share-link path remains the fallback. |
| Structured fleet lead form | Complete public foundation | `/fleet` now includes a structured fleet quote request form that posts to `/api/public_lead_submit`. |
| Structured maintenance lead form | Complete public foundation | `/maintenance` now includes a maintenance-plan interest form that posts to `/api/public_lead_submit`. |
| Public lead database | Added | New `public_inquiry_leads` table captures topic, contact details, service area, vehicle count, cadence, message, source path, and photo links. |
| Photo upload audit database | Added | New `photo_estimate_uploads` table can audit signed public estimate uploads and keep privacy review status available for later admin tooling. |
| FAQPage schema | Improved | Public competitor-route pages now include FAQPage JSON-LD foundations. |
| BreadcrumbList schema | Improved | Public competitor-route pages and education articles now include BreadcrumbList JSON-LD foundations. |
| Booking quote-first path | Improved | Customers can now paste links or upload estimate media, and uploaded media is appended to the photo-estimate links used by checkout/staff intake. |
| Fallback/error handling | Improved | Direct upload is env-gated and gracefully tells customers to paste links when upload is not enabled. Public lead forms show direct-contact fallback messaging if storage fails. |
| Matrix/release enforcement | Improved | Added a Build 167 release guard to keep lead forms, upload endpoint, schema markers, SQL, and roadmap docs visible in every release check. |

## Updated completion status after Build 167

| COMPETETIVE.md area | Current status | Notes |
| --- | --- | --- |
| Clear local homepage hero | Mostly complete | Homepage route choices and sticky CTA already exist. Continue measuring conversion. |
| Sticky CTA buttons | Complete | Global sticky CTA remains active. |
| Better service/package selector | Mostly complete | Booking chooser, condition helper, photo links, upload foundation, and admin intake review are present. |
| Service package cards | Mostly complete | Package aliases and add-on guidance are improved; next step is DB-managed content editing. |
| Add-on cards | Improved | Catalog coverage is broad; next step is real proof/examples per add-on. |
| Specials | Complete public foundation | Static `/specials` exists; admin-managed specials remain next. |
| Gift cards | Complete public foundation | Static guide exists and links to gift workflow. |
| Proof sections | Partial | Recent work/gallery exist; service/town-aware proof filtering remains open. |
| Ceramic coating page | Mostly complete | Existing page plus education support. Needs deeper FAQ/proof/schema automation. |
| Paint correction page | Mostly complete | Existing page plus education support. Needs real proof/result examples. |
| Interior/basic vs deep distinction | Mostly complete | Service chooser and condition helper now explain the difference. |
| High-value add-ons | Improved | More competitor-aligned add-ons are bundled. |
| Booking flow | Mostly complete | Direct quote-photo upload foundation, share links, condition helper, consent, and admin intake are present. |
| Admin service controls | Partial | Admin catalog/media workflows exist; public service/special/FAQ content still needs a DB-managed editor. |
| Schema/local SEO support | Improved | One-H1 checks continue; FAQPage/Breadcrumb foundations now exist on competitor routes. |
| Conversion blocks | Improved | Homepage, Services, sticky CTA, specials, gifts, fleet, maintenance, and education now interlink. |
| Maintenance plans | Complete public foundation | Public route and structured lead form now exist. |
| Fleet/commercial | Complete public foundation | Public route and structured lead form now exist. |
| Gallery system | Partial | Needs service/town filtering, proof approval, and media privacy eligibility. |
| Customer education content | Complete starter foundation | Blog hub and starter articles exist; add more practical local guides over time. |
| Pricing display strategy | Mostly complete | Quote-safe language and add-on expansion exist; analytics-driven improvements remain next. |

## Still open after Build 167

1. Apply Build 167 SQL and set upload/storage environment variables before relying on direct public uploads.
2. Add an Admin Leads screen for `public_inquiry_leads`.
3. Connect public leads to bookings/quotes with a staff conversion action.
4. Add admin review for `photo_estimate_uploads` and link uploaded media to booking intake.
5. Add DB-managed service, special, FAQ, and education content editing.
6. Add service/town-aware proof filtering for gallery and recent work.
7. Add a quote-builder screen that turns photo links/uploads and condition flags into package/add-on proposals.
8. Enforce gallery/social publishing eligibility from consent + media privacy review + blur/crop completion.
9. Add automated FAQPage/Breadcrumb generation from DB content once the CMS layer is live.
10. Add analytics for public lead form submits, upload attempts, upload failures, and quote-first conversion.

## Build 167 decision

The competitor roadmap is now largely represented in the public customer journey. The remaining work has shifted from “missing pages” to “admin-managed content, quote workflow, direct media review, lead conversion, and proof automation.”

---

# COMPETETIVE.md Completion Matrix — Build 166

**Updated:** 2026-05-23  
**Baseline:** `rosiedazzlers-dev(160).zip`  
**Roadmap authority:** `DEVELOPMENT_ROADMAP.md`

Build 166 is a competitor-roadmap completion pass. The goal was not to copy another site, but to turn the public customer path into the service hub described in `COMPETETIVE.md`: clear service categories, quote-first paths, proof, gifts, specials, fleet/maintenance routes, education pages, and safer social/gallery readiness.

## Completion status

| COMPETETIVE.md area | Build 166 status | Notes |
| --- | --- | --- |
| Clear local homepage hero | Mostly complete | Existing homepage already targets mobile detailing in Oxford/Norfolk. Build 166 adds a stronger quick-path CTA block. |
| Sticky CTA buttons | Complete | Global sticky CTA bar now offers Book now, Send photos for estimate, Call/text, and Specials. |
| Better service/package selector | Mostly complete | Builds 161–165 added service chooser, condition helper, photo-estimate link capture, and admin intake review. |
| Service package cards | Mostly complete | Existing pricing/catalog package cards remain; customer-facing aliases now map to simpler decision language. |
| Add-on cards | Improved | Build 166 expands the bundled add-on catalog with pet hair, odour, shampoo, salt, headlight, glass coating, ceramic spray, trim, bug/tar, truck box, and fleet add-on entries. |
| Specials | Complete public foundation | New `/specials` page covers spring salt cleanup, multi-vehicle, senior-friendly, fleet/work truck, and headlight refresh quote starters. |
| Gift cards | Complete public foundation | New `/gift-cards` page gives the competitor-requested gift-card entry route and links to the existing gift system. |
| Proof sections | Mostly complete | Services already includes recent work/reviews/service-area proof. Next step is service/town-aware proof filtering. |
| Ceramic coating page | Mostly complete | Existing `/ceramic-coating` page remains; next step is deeper FAQ/schema/proof expansion. |
| Paint correction page | Mostly complete | Existing `/paint-correction` page remains; Build 166 adds an education article that reinforces honest result expectations. |
| Interior/basic vs deep distinction | Mostly complete | Booking condition helper and service chooser handle this; next step is more public FAQ copy and admin-managed content. |
| High-value add-ons | Improved | Data catalog now includes more competitor-listed add-ons with quote-safe/starting-price wording. |
| Booking flow | Mostly complete | Vehicle, service, condition, add-ons, photo links, recommendation, and notes/consent capture are present. Direct upload is still next. |
| Admin service controls | Partial | Admin catalog/media workflows exist, but full DB-first public service editor remains open. |
| Schema/local SEO support | Partial | Core pages have schema and one-H1 checks. Build 166 adds schema-backed public pages, but deeper FAQPage/Breadcrumb automation remains next. |
| Conversion blocks | Improved | Services and homepage now connect booking, quote-first, specials, gifts, fleet, maintenance, and education paths. |
| Maintenance plans | Complete public foundation | New `/maintenance` route explains plan types and links to existing maintenance-plan interest flow. |
| Fleet/commercial | Complete public foundation | New `/fleet` route gives the competitor-requested fleet/commercial service hub and quote checklist. |
| Gallery system | Partial | Gallery exists, but category filters and admin proof approval remain next. |
| Customer education content | Complete starter foundation | New `/blog` hub plus local articles for road salt, pet hair, ceramic/wax, paint correction, and mobile-detail prep. |
| Pricing display strategy | Mostly complete | Existing pricing uses transparent package/add-on structure; Build 166 adds more quote-safe content. |

## Still open after Build 166

1. Add direct customer upload, not only shared photo links.
2. Add service/town-aware proof filtering for gallery and recent work.
3. Add FAQPage and Breadcrumb schema automation to service and help pages.
4. Add admin-managed service/add-on/special/FAQ content so public copy can move away from static HTML.
5. Add quote builder that turns photo-estimate review into proposed packages/add-ons.
6. Add per-media privacy review records for individual job photos/videos.
7. Add gallery/social publishing eligibility that requires consent + privacy approval + blur/crop completion.
8. Add public maintenance/fleet inquiry forms that create structured leads.
9. Add more education pages from the competitor list, then connect them to booking analytics.
10. Add service-specific review/proof blocks when real reviewed jobs are available.

## Build 166 decision

`COMPETETIVE.md` is now substantially represented in the website/app. Remaining work is no longer “add the missing public pages” as much as “make the public pages DB-managed, measurable, and tied into quoting, proof, and privacy workflows.”
