# Rosie Dazzlers — Current Implementation Handoff

**Living authority 1 of 2**  
**Build:** 288  
**Updated:** 2026-09-01  
**Read next:** `MASTER_VALUE_ROADMAP.md`

## Current release state

Build 288 is the active **authenticated customer privacy + device acceptance** slice. It follows the accepted Build 287 review/share checkpoint and keeps the retained Build 285 Production line unchanged until Development evidence is accepted and deliberately promoted.

The exact Build 288 feature candidate is `9f8127861f958d430c094c592b76f96e5abca551`. Its focused source gate and Cloudflare feature preview are green. Development promotion is allowed only as a fast-forward from the accepted Build 287 `dev` lineage; Production promotion must follow accepted Development source/runtime/Cloudflare evidence.

`main` remains at the accepted Build 285 Production promotion until that deliberate Build 288 Production step occurs.

## Application boundary

Rosie Dazzlers remains one secured, mobile-first platform with a static-first acquisition website and eight independently loadable modules:

1. Customer
2. Detailer
3. Operations / Supervisor
4. Business Administration
5. I.T. & Reliability
6. Finance
7. DAIP
8. Socials & Promotion

Permanent runtime rule:

> **Role defines the maximum module set; the staff profile may narrow non-admin access; the global module switch may make a module unavailable; workflow state decides whether an authorized module actually wakes.**

Server authorization remains authoritative. Dormant modules do not wake merely because they exist.

## Retained authority

Builds 272–287 remain retained. Do not reopen earlier booking, SEO, proof/publication, rebook, direct-review or neutral-share work merely because older checkpoint documents mention it.

In particular, retain:

- server-authoritative role/module/action permissions;
- Finance tax-support authority from Build 273;
- Complete = **Best value** and Exterior Detail differentiated from Premium Wash;
- current Small/Mid/Oversized + condition/quote pricing authority;
- current availability, conflict, deposit, checkout and payment mechanics;
- one meaningful H1 per indexable public page;
- no fabricated accounting/tax facts, reviews, consent, proof or provider evidence;
- private/customer media never becomes public without consent/privacy review and explicit publication;
- Rosie supplies standard detailing water and power while the customer supplies a safe/private/permitted work area;
- no background polling merely because a module exists.

## Build 288 — customer/staff privacy boundary

Build 288 fixes a real customer/staff authorization defect in the authenticated account surface.

### Server-side boundary

Customer-facing profile, vehicle and review responses now pass through explicit customer-safe shapes. Internal service-role reads may still load full rows, but staff-private fields are removed before browser responses are created.

Customer profile and vehicle writes no longer accept `admin_private_notes`. A handcrafted authenticated request cannot restore that authority.

Legitimate customer-owned/team-visible fields remain supported, including:

- general account notes;
- client-private preferences;
- detailer-visible notes;
- vehicle notes for the team;
- vehicle detailer-visible notes;
- communication/contact/service-location preferences.

### My Account boundary

Legacy `Admin-only notes` controls are hidden and disabled by the Build 288 account adapter. The server remains authoritative even if browser code is bypassed.

### Reliability boundary

Build 288 also restores a cumulative Development source gate that explicitly retains Builds 271–288. Historical focused guards remain executable instead of depending on a compact loop that drops their retained textual contracts.

Build 288 does **not** add a service worker or claim full PWA completion. It validates the existing responsive/mobile account surface and authenticated API boundary without inventing PWA/provider evidence.

### Storage/business boundary

Build 288 requires no schema migration and changes no package price, availability rule, booking rule, deposit, checkout, Stripe, PayPal, payment state, referral economics, maintenance economics or fleet economics.

## Current validation authority

- cumulative: `scripts/release_check.py`;
- one-H1/current customer guards: `scripts/seo_h1_check.py`;
- retained Builds 271–287 focused guards;
- focused Build 288 guard: `scripts/build288_release_check.py`;
- feature source workflow: `.github/workflows/build288-source-gate.yml`;
- Build 288 runtime smoke: `scripts/build288_http_smoke.sh`;
- Build 288 Development runtime workflow: `.github/workflows/build288-development-acceptance.yml`;
- Development source workflow: `.github/workflows/development-source-gate.yml`;
- retained exact/static + alias/full smoke: `scripts/development_http_smoke.sh`;
- full Development deployment workflow: `.github/workflows/cloudflare-development-acceptance.yml`.

Never call Build 288 Development-green until exact `dev`, Development source/runtime gates and Cloudflare artifact agree.

## Next business/product work after Build 288

Proceed where real evidence/rules exist:

1. genuine consented proof through the retained Build 283/284 path;
2. Google Business Profile/Search Console verification when account access exists;
3. maintenance plan after cadence/economics/pause/cancel rules are approved;
4. fleet/workplace path after minimum-vehicle/discount/travel/commitment rules are approved;
5. further role/action/direct-URL/API, accessibility, weak-network, notification-provider and restore/rollback acceptance;
6. Stripe/PayPal provider acceptance and Finance settlement/reconciliation closure;
7. referral/loyalty economics only after explicit business approval.

## Manual / external evidence that must not be fabricated

- real customer/public-use consent and real proof context;
- Google Business Profile ownership or Google-review return/verification;
- Search Console ownership/indexing evidence;
- maintenance-plan, fleet and referral/loyalty economics not yet approved;
- real email/SMS/Web Push delivery evidence;
- Stripe/PayPal provider acceptance;
- restore/rollback rehearsal evidence;
- accountant/tax judgment.

## Permanent runtime/cost guardrails

- no open Detailer job → no live job/media/message monitors;
- hidden/inactive refresh sleeps;
- completed jobs reject new live-message writes;
- no automatic replay of ambiguous non-idempotent writes;
- heavy aggregation belongs in Postgres rather than Worker loops;
- Functions remain under `/api/*`;
- secrets never belong in browser code or Git.

## Documentation policy

Only this file and `MASTER_VALUE_ROADMAP.md` are living planning authorities. Build summaries are release checkpoints; Git history is the archive.

<!-- Historical Build 287 retained-guard compatibility only; not the living build number.
**Build:** 287
Build 287 review/share attribution authority remains retained.
Production remains closed
-->

<!-- Historical Build 284 retained-guard compatibility only; not the living build number.
**Build:** 284
Build 284 contextual proof placement remains retained.
-->

<!-- Historical Build 283 retained-guard compatibility only; not the living build number.
**Build:** 283
Build 283 proof/media publication authority remains retained; explicit publish/unpublish still governs public proof.
-->

<!-- Historical Build 274 retained-guard compatibility only.
**Build:** 274
Build 274 active implementation
I.T. Connections
Quick Book
Mobile Auto Detailing & Interior/Exterior Restoration
-->
