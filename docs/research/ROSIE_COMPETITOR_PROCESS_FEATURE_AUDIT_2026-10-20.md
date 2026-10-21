# Rosie Dazzlers — Competitor Research and Process Improvement Audit

**Study date:** 2026-10-20
**Scope:** Four user-selected websites. Public information only.
**Status:** Research proposal, not an instruction to change prices, services, policies, permissions, customer media, or live booking.
**Target app:** RosevearCreations/rosiedazzlers, development branch dev.
**Evidence vocabulary:** OBSERVED means information visible in source pages or search-indexed content; RECOMMENDED means an original proposed Rosie improvement; EXISTING means a capability located in current application files; VERIFY means the operational behavior has not been established.

## 1. Primary sources and evidence limitations

| ID | Source | Visited content | Reliability |
|---|---|---|---|
| C1 | https://www.cosmocarcustoms.com/services/paint-correction | Service page, stage comparison, proof, quote form, FAQ, aftercare | High for visible public content |
| C2 | https://www.cosmocarcustoms.com/blog/what-is-paint-correction | Technique education and realistic limits | High for text |
| E1 | https://expressmobiledetailing.ca/full-mobile-car-detailing/ | Exact inclusions, process order, access, FAQ, before/after, aftercare | High for visible content |
| E2 | https://expressmobiledetailing.ca/ | Home service comparison, sliders, pricing model, customer timeline, location links | High for visible content |
| W1 | https://waltspolish.com/ | Store navigation, kits, catalog, education and merchandising | High for visible content |
| W2 | https://waltspolish.com/collections/car-care-kits | Job-oriented supply kits | Medium; inventory changes |
| W3 | https://waltspolish.com/pages/auto-beauty-care-academy | Tiered practical training, technical competencies and business skills | High for visible content |
| D1 | https://dripxauto.com/services | Four tiers, inclusions, durations, add-ons, mobile-service notes | Moderate: direct reader returned blank; indexed content was available |
| D2 | https://dripxauto.com/ | Mobile value proposition, service cards and advertised trust badges | Moderate; performance claims unverified |

No competitor lead forms, payment checkouts or accounts were submitted or tested. No claims regarding insurance, customer satisfaction, technician certification, ratings, service reach, response time or cost were independently verified. We must never copy their prose, branded photos, graphics, trademarks or reviews.

## 2. Rosie baseline checked before recommending changes

Existing source capabilities: current /book booking; quote-first preview at /preview/quote-first/; pricing/package catalog; optional consent/Turnstile-gated quote intake; staff leads and controlled conversion; Admin Photo Studio; public proof gallery; Admin Media Health; existing tool/consumable inventory and public gear surfaces; maintenance-plan screens; regional landing pages. The quote-first preview is not proof that live quote intake is enabled. Photo Studio already declares 617 image targets across 62 routes; creating a replacement database would be wasteful.

Potential gaps below are **not guaranteed missing**. They describe upgrades that require a product/runtime comparison with these existing capabilities.

## 3. Cosmo Car Customs — specialist trust, explanations and assisted inquiries

OBSERVED from C1/C2:

1. Location-specific service headline, breadcrumb navigation, quote CTAs high and low, and callable business phone.
2. Visible explanation of paint swirls, haze, oxidation and correction, written for non-experts.
3. Included steps covering wash/decontamination, paint-depth inspection, polishing, refinement and optional protection prep.
4. Multiple process photos with stage-specific captions and a larger-image interaction.
5. Equipment and professional supplier names connected with their functions, not just brand logos.
6. Customer benefit sections including gloss, swirl reduction, coating preparation and appearance at resale.
7. Simple one-stage versus two-stage correction comparison, with different treatment intensity.
8. Condition-driven pricing and clear time expectations; inspection before final price.
9. What-work-cannot-fix section explicitly limits deeper damage and avoids universal result percentages.
10. FAQs about time, clear-coat safety, future care and coating.
11. Quote form includes year/make/model, optional date and email, name and phone, preferred call/text/WhatsApp/email, up to four optional photos, descriptive notes.
12. Educational article connects to the service.

RECOMMENDED for Rosie:
- C1-01: Condition-guided visual choice in the EXISTING quote-first wizard. Choices: swirl haze; water spotting; oxidation; scratches; deep damage/chips; unknown. Flag staff-assessment work as non-instant-price. Review by experienced detailer.
- C1-02: Optional quote photos, only after a separate owner approval of private storage, consent, EXIF treatment, retention/deletion and file-validation policy. Never upload unapproved inquiry photos to public R2 or analytics.
- C1-03: Preferred contact channel on gated quote inquiries. Only offer channels we actually operate and can respect transaction-specific SMS/email consent for; do not infer marketing consent.
- C1-04: Stage comparison and meaningful timelines for actual Rosie paint correction capabilities, not every scratch or clear-coat defect.
- C1-05: Rich, consented process photos associated with existing Photo Studio target keys. Caption true method, condition and realistic result. No artificial "actual customer proof".
- C1-06: Approved tools-to-service cross-references from existing public gear/inventory. Do not reveal internal stock cost, private supplier credentials or proprietary customer data.
- C1-07: Service limits and "when we recommend another service" blocks, technically reviewed and versioned.

Do NOT transplant their one- or two-day promises, service guarantees or quoted results into Rosie without capacity, process and staff approval.

## 4. Express Mobile Detailing — transparency and customer journey

OBSERVED from E1/E2:

1. "Interior and exterior together" is explained in concrete surface-level terms, not vague premium wording.
2. Inclusion coverage explicitly calls out door jambs, sills, both sides of glass, cargo, interior trim, exterior trim and protection.
3. Typical time window and site-access conditions are explained before booking.
4. Customer intent cards cover annual refresh, recently bought used vehicles, resale and single-visit convenience.
5. Day-of timeline follows preparation, assessment, interior, exterior, protection and final customer walk-through.
6. FAQ directly answers whether the customer must attend, office parking, duration, standalone versus combined scope, and price determination.
7. Clear outcomes taxonomy: removes, usually improves, or requires another specialized service.
8. Realistic aftercare and Canadian winter maintenance guidance.
9. Homepage before-and-after controls, multiple process images and captions.
10. Pricing explanation moves from service base to size/condition to address zone and pre-confirmation total, without proving checkout correctness.
11. Mobile delivery value story explains onsite equipment and four steps from booking to handoff.
12. Locality sections contextualize real coverage; distinguish genuine local proof from generic imagery.

RECOMMENDED for Rosie:
- E-01: Canonical service inclusion and exclusions matrix for Premium Wash, Basic, Complete, Interior and Exterior, across relevant vehicle sizes. The existing catalog must remain the single truth source.
- E-02: "Why book now?" customer-intent cards: winter salt, sale/lease return, newly purchased used vehicle, annual reset, pet hair and time savings. Reuse existing landing pages and booking query handling.
- E-03: Explain site readiness in wizard: access/keys, adequate onsite space, weather safety, water rules, parking permissions, building restrictions, power and water brought by Rosie. Staff can override safe cases; avoid absolute guarantees.
- E-04: Day-of timeline mirroring our job workflow, not a second task engine.
- E-05: Clear can-fix/may-improve/not-included guidance, including salt staining, odors, etched glass, clear-coat defects and coating cure periods.
- E-06: Client handoff checklist after staff inspection, unresolved conditions, approved customer-safe proof, care instructions and accurate status.
- E-07: Product-specific aftercare and reminders only with appropriate transactional/marketing consent.
- E-08: Accessible before/after comparison for truly approved customer photos. Image labels, focus treatment and reduced-motion behavior required.
- E-09: Transparent price factor notes; do not invent zone fees or new formulas if the catalog does not authorize them.
- E-10: Maintain authentic Oxford/Norfolk local pages; prohibit near-duplicate city spam, unsupported service regions or false on-site availability.

Avoid importing their broader geographic promises, staffed capacity, pricing, insurance claims or service methods that Rosie does not actually provide.

## 5. Walt's Polish — curated supplies, product training and authority

OBSERVED from W1/W2/W3:

1. Retail rather than core mobile detailing: searchable catalog, cart, new merchandise, sale prices and sold-out labels.
2. Curated kits built around task goals, including paint care/correction, instead of requiring customers to select every chemical separately.
3. Product-oriented imagery and short demonstrations/education.
4. Academy with tiered audience-appropriate learning: enthusiast/weekend, detailing, correction, coating.
5. Training includes condition assessment, hands-on methods, safe tools, business practices and differentiated learner skill levels.
6. Published certificate/certification descriptions belong to their own programs; they cannot be transferred as Rosie credentials.

RECOMMENDED for Rosie:
- W-01: Improve our public gear page to show what each actual approved tool or chemical is for, which Rosie services use it, customer-relevant safety notes and appropriately licensed/owned photos.
- W-02: Optional real home-care kit recommendations by season and vehicle needs. Actual sale requires inventory, tax, margin, packaging, shipping, liability and refund review. Education-only can precede commerce.
- W-03: Internal staff skill matrix and task-specific technique checkoffs leveraging current roles/job notes. No unverified certification badge.
- W-04: Small owner-approved educational lessons: salt prevention, safe interior care, microfiber selection, washing habits, wax/coating maintenance.
- W-05: Accurate product gallery and category merchandising, preserving existing inventory price and approval controls.

Do not begin a training academy, public store, certification program or stocked kit fulfillment until owner has expressly approved business scope and costs.

## 6. DRIPX Auto — straightforward service choice

OBSERVED from D1 search-indexed text and D2:

1. Four simple tiers: Express Clean, Interior Deep Clean, Exterior Detail & Protection, Full Detail.
2. Visible indicative durations per tier.
3. Inclusion bullet lists attached to cards.
4. Full Detail card visually marked most popular.
5. Add-ons grouped beneath packages and listed plainly.
6. Apartment/condo/garage-friendly mobile service messaging, qualified by size/condition impact.
7. Quote CTA on cards and contact options.

RECOMMENDED for Rosie:
- D-01: Group existing packages into plain language goals without renaming or losing established catalog identifiers. Keep service cards short, offer expand for precise inclusions.
- D-02: Show accurate conditional duration ranges (size, condition, on-site access, one vehicle/day capacity). Never advertise a guaranteed finish time.
- D-03: Render add-on compatibility and prerequisites in the existing wizard and package comparison; avoid duplicate bundled work.
- D-04: Use a "popular" badge only with genuine aggregate booking data for a stated period. Otherwise a neutral "Interior + Exterior" label is more defensible.
- D-05: Add contextual parking/site feasibility note rather than blanket condo approval.
- D-06: Only display independently supportable trust claims: current insurance, qualified personnel, consented reviews, no fabricated satisfaction percentages.

Caution: indexed website content is sufficient for layout/process ideas but not for assertions about actual booking implementation or results.

## 7. Cross-site transferable design patterns

| Pattern | Seen at | Desired outcome | Reuse existing system |
|---|---|---|---|
| Start with customer's problem | C1, E1 | Reduce wrong package choices | Quote-first guided selections |
| Show what's included and excluded | C1, E1, D1 | Fewer billing/service surprises | Admin service catalog |
| Explain time and safety limits | C1, E1, D1 | Set achievable expectations | Duration and staff quote review |
| Show real craft photos with captions | C1, E2 | Earned trust | Photo Studio targets and privacy gate |
| Keep one clear action per screen | C1, D1 | Easier mobile conversion | Existing Book and gated Request Quote |
| Tell the on-site story | E1, E2 | Smooth customer experience | Job progress and handoff |
| Explain price factors | E2 | Transparent total before booking | Current quote/booking engine |
| Educate about products and upkeep | W1, W3, E1 | Aftercare and repeat business | Public tools, maintenance plan |
| Conditional supporting add-ons | D1 | Relevant upsell without duplication | Current add-on rules |
| Contextual local pages | E2 | Trust in service area | Existing Oxford/Norfolk pages |

## 8. Comprehensive feature backlog, acceptance and dependencies

| ID | Priority | Feature | Evidence | Acceptance / release test | Guardrail |
|---|---|---|---|---|---|
| RCI-001 | P0 | Service truth matrix | E1/D1 | All inclusions sourced from current App Management; no conflicting copy | No duplicate prices |
| RCI-002 | P0 | Quote-first route parity | C1/E2 | Keep direct-book path, 409 conflict and deposit authority | Preview cannot reserve |
| RCI-003 | P0 | Private quote-media policy | C1 | Consent, expiry, MIME validation, private R2, staff access, deletion, abuse tests | Gate OFF until approved |
| RCI-004 | P0 | Complete media/static filename audit | All | Actual route and asset table, dimensions, broken cases, approval class | No private auto-publication |
| RCI-101 | P1 | Package comparison | E1/D1 | Precise mobile-friendly included/excluded matrix and price data provenance | Catalog authoritative |
| RCI-102 | P1 | Price-factor explanations | C1/E2 | No promises outside actual pricing engine | Staff confirmation on advanced work |
| RCI-103 | P1 | Condition outcome matrix | C1/E1 | Editorial signoff on can/may/cannot solve | No universal "like new" claims |
| RCI-104 | P1 | Why-now intent cards | E1/E2 | Yearly reset, winter, resale, used, pets; accurate routing | No unverified offers |
| RCI-105 | P1 | Honest duration ranges | D1/E1 | Correct size/condition assumptions and one-car/day availability | No schedule overpromise |
| RCI-106 | P1 | Location readiness | E1/D1 | Parking/access/weather/water rules workflow | Safe, accessible messages |
| RCI-107 | P1 | Staff inspection checklist | C1/E1 | Condition, boundary areas, staff approval, evidence and scope changes | Existing roles only |
| RCI-108 | P1 | Customer walkaround closeout | E1 | Inspection, unresolved limitations and handoff documented | Private customer proof |
| RCI-109 | P1 | Contact preference | C1 | Selected method with one-inquiry permission, STOP/HELP for SMS | No inferred marketing opt-in |
| RCI-110 | P1 | Process-proof rich gallery | C1/E2 | Consented, owned photos, accurate captions, responsive | Photo Studio first |
| RCI-111 | P1 | Before/after slider | E2 | Keyboard/touch/screen reader, unmodified true pairs | No simulated proof |
| RCI-112 | P1 | Gear-by-service credibility | C1/W1 | Actual verified gear linked to services, no private stock data | Supplier/logo rights |
| RCI-113 | P1 | Add-on compatibility card | D1 | Enforce prerequisites, avoid duplicate included work | Booking rules authoritative |
| RCI-114 | P1 | Local seasonal landing quality | E2 | Unique genuine conditions and regional rules | No door-to-door spam |
| RCI-201 | P2 | Home-care kit recommendations | W1 | Real product safety, stock, taxes, packing, profit, returns | Optional commerce |
| RCI-202 | P2 | Detailer competency signoff | W3 | Staff checkoffs, assessor/date, roles | No false certification |
| RCI-203 | P2 | Service learning content | C2/W3 | Reviewed FAQ/technical info, accurate update date and CTA | No copied prose |
| RCI-204 | P2 | Optional maintenance aftercare | E1 | User preference, notification permissions, frequency cap | No unsolicited promotions |
| RCI-205 | P2 | Verified popular package signal | D1 | Aggregate actual booking count over defined period | No made-up reviews |
| RCI-206 | P2 | Funnel drop-off metrics | C1/D1 | Necessary metrics, privacy and consent review | No personal data leakage |

## 9. Target user journeys

### A. Unsure what to book

Entry services page or seasonal card -> vehicle type and size -> visible condition and goals -> suggested discussion (not a confirmed quote) -> optional approved private evidence upload -> contact channel/consent -> existing lead intake with Turnstile/idempotency -> authorized staff reviews conditions and actual price -> existing staff conversion to standard booking and live slot.

### B. Customer knows exact package

Package inclusion and duration/price explanation -> correct size, condition and location requirements -> compatible add-ons -> availability -> existing hold/409 checks -> payment/deposit handled by existing authorized provider -> confirmation. New UI does not create a parallel booking table.

### C. Specialist service/paint

Problem description -> technician inspection if needed -> achievable result and paint safety limitations -> written condition/scoped estimate -> explicitly approved adjustment before work -> completed service record -> relevant honest aftercare.

### D. On-site and aftercare

Safe arrival/access -> walkaround and condition notes -> detailing sequence -> consent-governed progress photos -> final review -> customer-specific care information -> appropriate maintenance prompt only if permitted.

## 10. Media candidates inspired by the positive patterns

These are proposals, not proof of a missing current media asset. Filename is exact **only once** we assign it to the relevant target and approve it. Standard root: assets/themes/standard/images/.

| Subject | Proposed filename | Canvas / viewBox | Suggested surface |
|---|---|---|---|
| Paint inspection in detailing light | paint-correction-inspection.webp | 1600x900 | Paint correction |
| Stage-one polishing | paint-correction-one-stage.webp | 1600x900 | Stage comparison |
| Stage-two refinement | paint-correction-two-stage.webp | 1600x900 | Stage comparison |
| Pre-clean paint decontamination | process-decontamination.webp | 1600x900 | Process |
| Upholstery hot-water extraction | process-interior-extraction.webp | 1600x900 | Complete detail |
| Door jamb and sill work | process-door-jambs.webp | 1600x900 | Scope |
| Fully equipped mobile arrival | process-mobile-arrival.webp | 1600x900 | How it works |
| Safe vehicle condition diagram | diagram-condition-assessment.svg | 0 0 1600 900 | Wizard guidance |
| Cosmetic defect limit diagram | diagram-paint-limits.svg | 0 0 1600 900 | FAQ |
| Package scope comparison | diagram-package-scope.svg | 0 0 1600 900 | Services |
| Location readiness diagram | diagram-site-readiness.svg | 0 0 1600 900 | Booking |
| Winter salt problem | season-winter-salt.webp | 1920x1080 | Seasonal page |
| Annual detail maintenance | season-annual-reset.webp | 1600x900 | Maintenance |
| Real equipment close-up | equipment-polisher-pads.webp | 1600x900 | Gear page |
| Handoff summary diagram | diagram-job-walkaround.svg | 0 0 1600 900 | Closeout |
| Contributed before/after pair | proof-approved-id-before.webp / -after.webp | 1600x1200 each | Gallery, only real consented proof |

Never use competitor logos/photos, fake before/after, fictional reviews, warranty logos or unsupported credentials. A generic diagram must visibly be an illustration, not a claimed real outcome.

## 11. Acceptance criteria across any implementation

- 320px, 375px, 390px, 768px and desktop; no text clipping or unsupported sideways scroll.
- Screen reader names, descriptive alt, keyboard focus, contrast, accessible compare controls and reduced motion.
- App Management price/condition/size/availability single source; exact booking total before deposit.
- Protected photo uploads: private R2, consent, hostname/rate checks, MIME/content signatures, storage retention/deletion, signed staff access and no production customer test writes.
- Clear one-car/day capacity, safe winter water restrictions and actual mobile power/water provisions.
- End-to-end existing booking happy/failure paths and explicit 409 conflict.
- No invented social proof, unauthorized product marks or claims of certification.
- Source CI, exact main SHA, Cloudflare Production deployment and owner business acceptance before GREEN.
- No one-off workflow per improvement; group bounded features into meaningful releases to avoid queue overload.

## 12. Owner decisions needed for new production features

1. Do we want optional quote photos in the gated wizard? What privacy/retention rules and real upload limits?
2. What contact methods can staff reliably support, and what consent text is approved?
3. Which service-stage comparisons and actual time windows reflect Rosie's one-car/day capacity?
4. Do we display all prices as published base with conditional factors, or advanced-work inspection only?
5. Should kits be an educational guide or a genuine product line with stock/returns?
6. Which personnel qualifications, equipment brands, public photos and testimonials have verifiable approval?

## 13. Implementation sequencing

**Release A — Site proof and source consistency.** Finish Standard image inventory, per-page sources, size requirements, safe static fallback wiring and service inclusions. No new backend writes.
**Release B — Read-only service improvements.** Comparison tables, duration caveats, limitations, intent cards and accessible real proof.
**Release C — Quote-first guidance.** Optional condition triage and contact preference; public form remains gated.
**Release D — Separate security-approved media intake.** Private storage and deletion only after explicit owner consent.
**Release E — Staff operations and aftercare.** Existing job data and permissions, not parallel CRM.
**Release F — Education/gear/optional merchandise.** Only if capacity and economics justify it.

Wait for each complete protected-green release before starting the next. Keep all service-price authority centralized.

## 14. Machine-readable traceability convention

Each RCI ID is stable. A subsequent delivery proposal should include:
- RCI ID(s), current source file + route, verified existing behavior, exact desired delta.
- Affected pricing authority, DB columns, permissions, consent, image target keys, alt and size.
- Required unit/integration/accessibility/real-device/Cloudflare tests.
- Rollback behavior and whether the feature can remain disabled.
- Explicit owner-approval flag when applicable.

The image target inventory is in docs/audits/ROSIE_MEDIA_SLOT_CATALOG_STANDARD.md; source scanner is scripts/audit_standard_theme_media.mjs. This competitor study does not constitute proof any candidate is currently missing or functional in production.
