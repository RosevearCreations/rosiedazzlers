# Rosie Dazzlers — Current Implementation Handoff

**Living authority 1 of 2**  
**Build:** 301  
**Updated:** 2026-09-02  
**Read next:** `MASTER_VALUE_ROADMAP.md`  
**Execution queue:** `AUTONOMOUS_RELEASE_QUEUE.md`

## Current release state

Build 301 is the active **Finance Reconciliation maintainability extraction** Development-first slice. The accepted source baseline is Build 300 `dev` at `ed7c0c6748db6d619fb37e515057666feed1ea70`. Accepted Production remains **Build 299** at `ee010654aea48c12c885ea826bf7cf60f64852b7` until Build 301 Development evidence is green.

Production promotion of the final accepted Build 301 Development head is explicitly authorized for this release. Promotion still occurs only after the exact Development source, read-only runtime and Cloudflare deployment evidence agree.

## Build 301 authority

Build 301 externalizes the accepted `admin-accounting.html` classic-script runtime into `assets/admin-accounting-v301.js` without refactoring its executable behavior. The accepted Build 300 `admin-accounting.html` and `admin-accounting/index.html` sources were identical; Build 301 keeps those route copies aligned and makes both load the same versioned runtime asset.

This is deliberately a structural extraction rather than a Finance redesign. Bank reconciliation reads/rendering, payroll payout reconciliation, payable settlement, recurring expenses, journal/remittance behavior, documents, period-close workflow, statement/tax reports and exports retain their accepted Build 300 behavior exactly. Build 301 does not invent a reconciliation write path where the accepted runtime did not already provide one.

Build 301 changes no matching/posting/approval rule, payment/provider rule, tax/accounting judgment, API contract, schema or migration. Real provider transaction, settlement, approval or reconciliation evidence is not fabricated. Runtime acceptance is read-only.

## Application boundary

Rosie Dazzlers remains one secured, mobile-first platform with eight independently loadable modules:

1. Customer
2. Detailer
3. Operations / Supervisor
4. Business Administration
5. I.T. & Reliability
6. Finance
7. DAIP
8. Socials & Promotion

Permanent rule: **role defines the maximum module set; a staff profile may narrow non-admin access; a global module switch may make a module unavailable; workflow state decides whether an authorized module wakes.** Server authorization remains authoritative and dormant modules stay asleep.

## Retained Build 272/273 authority

Build 273 is the retained Finance/tax-support baseline. The accepted Build 272/273 boundaries remain live while later releases advance:

- narrow Operations/Finance action permissions;
- server-authoritative role/module/action permissions;
- Finance tax-support writes retain `finance.tax.manage` while reads remain narrowly scoped;
- persistent Finance tax-support records, evidence links, T2125 workpaper and accountant-package workflow remain retained;
- Complete = **Best value**;
- Exterior Detail remains differentiated from Premium Wash;
- current Small/Mid/Oversized + condition/quote pricing authority;
- current availability, conflict, deposit, checkout and payment mechanics;
- one meaningful H1 per indexable public page;
- no fabricated accounting/tax facts, reviews, consent, proof or provider evidence;
- private/customer media never becomes public without consent/privacy review and explicit publication;
- Rosie brings standard detailing water and power; customers provide a safe/private/permitted work area;
- no background polling merely because a module exists.

## Retained business/runtime authority

The accepted Builds 272–300 authority remains intact, including:

- Build 273 Finance/tax-support and accountant-workpaper authority;
- Complete = **Best value** and the current Small/Mid/Oversized + condition/quote pricing authority;
- Rosie supplies normal detailing water/power while the customer supplies a safe/private/permitted work area;
- one meaningful H1 per indexable public page;
- no fabricated accounting/tax facts, customer proof, consent, reviews, provider evidence or Google verification;
- Build 283/284 consented proof/publication and contextual-proof fail-closed rules;
- Build 285 current-rule rebook handoff;
- Build 286 completed-booking customer review authority;
- Build 287 neutral review/share attribution without referral economics;
- Build 288 customer/staff privacy-safe projections;
- Build 289 manual weak-network/auth recovery without polling/write replay;
- Build 290 server-authoritative role/module/action authorization and forward-restore readiness;
- Build 291 maintenance interest remains preference-only with no approved cadence/economics/recurring billing;
- Build 292 fleet/workplace intake remains quote-first with no approved thresholds/rates/discounts/contracts;
- Build 293 customer next-action orchestration retains current booking/payment authority;
- Build 294/295 remove customer authority over staff maintenance scheduling fields and stale private controls;
- Builds 296–299 are behavior-preserving maintainability extractions for My Account, Operations Customers, Quote Pipeline and Booking Dashboard;
- Build 300 is the behavior-preserving Finance Payments extraction in `assets/admin-payments-v300.js`, including its recorded pre-existing Payments duplicate-route boundary for Build 318.

## Build 301 validation authority

- `scripts/build301_release_check.py` — exact Accounting-runtime reconstruction, route-copy parity, migration rejection and retained Finance endpoint checks;
- `scripts/build301_http_smoke.sh` — read-only deployed Accounting/Reconciliation acceptance with bounded mutable-alias convergence retry;
- `.github/workflows/build301-source-gate.yml` — feature source gate;
- `.github/workflows/build301-development-source-gate.yml` — Development cumulative source gate;
- `.github/workflows/build301-development-acceptance.yml` — Development read-only runtime acceptance;
- retained `scripts/release_check.py`, `scripts/seo_h1_check.py`, route-copy checks and Builds 271–300 focused guards remain cumulative authorities.

Do not call Build 301 Development-green until the exact `dev` SHA, Build 301 Development source/runtime gates and Cloudflare Development deployment evidence agree. Only then perform the already-authorized Production promotion and verify Production on the promoted source.

## Next autonomous build

**Build 302 — Statement Import reliability:** harden parsing, validation, duplicate detection and error reporting without changing accounting policy.

After that, continue the recorded Builds 303–319 sequence. Do not invent business rules excluded by `AUTONOMOUS_RELEASE_QUEUE.md`.

## Manual/external evidence that must not be fabricated

- genuine customer/public-use consent and proof context;
- Google Business Profile/Search Console ownership or verification;
- maintenance, fleet or referral economics not explicitly approved;
- real email/SMS/Web Push delivery;
- real payment-provider transaction, settlement, refund or webhook acceptance beyond configuration-present evidence;
- accountant/tax judgment;
- physical-device evidence not established by automated acceptance.

## Permanent runtime/cost guardrails

- no open Detailer job → no live job/media/message monitors;
- hidden/inactive refresh sleeps;
- completed jobs reject new live-message writes;
- no automatic replay of ambiguous non-idempotent writes;
- heavy aggregation belongs in Postgres rather than Worker loops;
- Functions remain under `/api/*`;
- secrets never belong in browser code or Git.

## Retained guard compatibility markers

These lines preserve historical focused-guard anchors; they are not the living build number.

- **Build:** 274 — Build 274 active implementation; I.T. Connections; Quick Book; Mobile Auto Detailing & Interior/Exterior Restoration.
- **Build:** 283 — Build 283 proof/media publication authority remains retained; explicit publish/unpublish still governs public proof.
- **Build:** 284 — Build 284 contextual proof placement remains retained.
- **Build:** 287 — Build 287 review/share attribution authority remains retained. Production remains closed.
- **Build:** 288 — Build 288 customer/staff privacy boundary remains retained. Production remains closed.
- **Build:** 289 — Build 289 account accessibility and weak-network resilience remains retained. Production remains closed.
- **Build:** 290 — Build 290 forward restore and authorization acceptance remain retained. Development configuration-present / owner sign-off remains retained. Production remains closed.
- **Build:** 291 — Build 291 maintenance retention intake remains retained. Development configuration-present / owner sign-off remains retained. Production remains closed.
- **Build:** 292 — Build 292 fleet / workplace acquisition intake remains retained. Production remains closed.
- **Build:** 293 — Build 293 — customer retention next-action hub; customer-safe review projection retaining `booking_id`; Production remains closed.
- **Build:** 294 — Build 294 customer maintenance / auto-schedule authority closure remains retained. Production remains closed.
- **Build:** 295 — customer account static source authority cleanup; My Account maintainability extraction.
- **Build:** 296 — My Account maintainability extraction.
- **Build:** 297 — Operations customer support maintainability extraction; retained accepted Production anchor `337ae533130f4bf1c566d47c2ba1bc712cbf780e`.
- **Build:** 298 — Operations booking/quote support maintainability extraction; `assets/admin-quotes-v298.js`; retained historical Production anchor `337ae533130f4bf1c566d47c2ba1bc712cbf780e`.
- **Build:** 299 — Operations booking-dashboard support maintainability extraction; retained historical Production anchor `337ae533130f4bf1c566d47c2ba1bc712cbf780e`.
- **Build:** 300 — Finance Payments maintainability extraction; `assets/admin-payments-v300.js`; accepted Production anchor `ee010654aea48c12c885ea826bf7cf60f64852b7`; next retained queue marker Build 301 — Finance Reconciliation maintainability extraction; duplicate-route owner Build 318 — Whole-application route/API authority sweep.

## Documentation policy

Only this file and `MASTER_VALUE_ROADMAP.md` are living planning authorities. Build summaries are release checkpoints; `AUTONOMOUS_RELEASE_QUEUE.md` is the agreed execution sequence; Git history is the archive.