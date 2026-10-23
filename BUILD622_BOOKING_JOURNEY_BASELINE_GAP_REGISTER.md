# Rosie Dazzlers — Build 622: Booking Journey Baseline & Gap Register

Status: **baseline recorded / not a live booking redesign**. Date: 2026-10-23.

## Verified source inventory
- `book/index.html` is the current public consolidated Services, Prices & Booking page. Its canonical URL is `https://rosiedazzlers.ca/book`.
- The booking page contains sections with IDs `services`, `addons`, and `booking`; it references `/assets/booking-hours.js`, `/assets/site-policies.js`, and `/assets/chrome.js`.
- Its page metadata describes vehicle-size prices, add-on selection, availability and service areas Oxford/Norfolk. This is a **claim in source**, not evidence of an end-to-end real booking passing.
- `data/theme_registry.json` exists. Builds 620–621 added owner-only theme preview/release requests; they must not activate an unapproved public theme.
- The previously reported protected `dev → main` PR #468 remained open at the start of this build.
- Release-source parity failure: `admin-app.html` differed from `admin-app/index.html`, and `admin-catalog.html` differed from `admin-catalog/index.html`. Build 622 synchronizes each nested route copy to its canonical file on its feature branch.

## Customer journey stages and gaps to verify before changes
| Stage | Existing visible entry | Acceptance / next investigation | Risk |
| --- | --- | --- | --- |
| Service discovery | `/book` services section | Verify public packages, exclusions and image/media accuracy | Wrong service chosen |
| Vehicle profile | `/book` selection | Confirm type/size conversion and optional vehicle details | Underquote |
| Add-on selection | `/book` addons | Validate eligibility, dependencies, totals and image labels | Unavailable work selected |
| Service geography | Oxford/Norfolk marketing scope | Compare exact towns, water/power and travel tier rules with canonical data | Ineligible appointment |
| Availability | Booking section | Check date, AM/PM slot, holds, server recheck and conflict behaviour | Double booking |
| Quote-first intake | Previously planned preview flow | Locate current preview source and verify it cannot mutate live booking/payment records | Preview leakage |
| Customer details | Booking section | Confirm field constraints, accessibility, privacy, consent, validation | Abandonment / data exposure |
| Deposits | Existing Stripe-linked roadmap | Verify amount, expiry, idempotency, webhook reconciliation; no live charges for tests | Duplicate charge |
| Confirmation | Existing operational workflows | Verify customer/staff messages, receipt and status transition | Lost booking |
| Staff handoff | Admin operational workflow | Match work order, duration, supplies and customer instructions | Unprepared visit |
| Cancellation/reschedule | Existing booking rules | Confirm cutoffs, refunds and release of capacity | Orphan slots |
| Completion | Job closeout/inventory | Verify actual usage posting, COGS, follow-up and retention | Inaccurate costs |

## Acceptance discipline for Build 622
1. Keep the live `/book` and payment logic unchanged.
2. Validate exact parity between the two canonical Admin HTML files and their nested copies in the source branch.
3. Confirm customer and staff journeys using authenticated real-world acceptance before claiming them operational.
4. Record each missing feature with its source of truth, owner decision, severity and future build dependency.
5. Do not treat a successful site HTTP response as proof of booking/payment correctness.
6. Protect `main`: require `source checks`, deployment acceptance and exact-main Cloudflare Production GREEN evidence.

## Suggested immediate continuation
Build 623 — Unified Pricing, Availability & Eligibility Contract. Subsequent Builds 624–626 should establish server-authoritative totals, vehicle/service constraints, and booking state/recovery tests before new wizard screens ship.

## Evidence
- [Booking route](https://github.com/RosevearCreations/rosiedazzlers/blob/dev/book/index.html)
- [Protected production PR](https://github.com/RosevearCreations/rosiedazzlers/pull/468)
- [Admin App canonical source](https://github.com/RosevearCreations/rosiedazzlers/blob/dev/admin-app.html)
- [Admin inventory canonical source](https://github.com/RosevearCreations/rosiedazzlers/blob/dev/admin-catalog.html)

This register records source-verifiable observations and unverified acceptance tasks separately; it does not imply that untested production features work.
