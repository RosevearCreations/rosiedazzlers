> Last synchronized: April 22, 2026. Reviewed during the live SVG pricing-chart, structured-data local SEO, static-check hardening, and docs/schema synchronization pass.

## April 22, 2026 handoff note
1. Deploy this build and purge cache.
2. Verify `/pricing` shows live-rendered SVG versions of the price chart and package-details chart.
3. Verify `/services` modal buttons open the same live chart renders for price/details and still open the packaged vehicle size chart correctly.
4. Run `python3 scripts/stress_static_checks.py` before the next packaging pass.
5. Use `book.html` as locked/stable unless a direct production defect forces a change.
6. Strongest next product move: add a staff-facing preview/download tool for the live pricing charts inside App Management.

# Rosie Dazzlers — Handoff for Next Chat

## Branch rule
Use `dev` as source of truth unless explicitly told otherwise.

## Resume prompt
Continue Rosie Dazzlers from the `dev` branch docs. Use `README.md`, `PROJECT_BRAIN.md`, `CURRENT_IMPLEMENTATION_STATE.md`, `KNOWN_GAPS_AND_RISKS.md`, `DEVELOPMENT_ROADMAP.md`, and `NEXT_STEPS_INTERNAL.md` as source of truth.

## Current state in one paragraph
Rosie Dazzlers is a role-aware detailing operations platform with booking, deposits, gifts, token-based customer progress, jobsite intake/time tracking, customer/staff/admin screens, recovery messaging foundations, and DB-backed catalog/inventory foundations. The newest pass reduced public pricing drift by rendering the main package pricing charts live from the canonical pricing catalog on `/pricing` and in `/services`, while also strengthening structured-data/local SEO coverage on the main public pages and hardening the static sanity checks.

## Most likely next priorities
1. App Management helper for live pricing chart preview/download
2. decide whether the vehicle size chart should also become a live chart
3. post-deploy validation of structured-data/rich-result rendering
4. customer vehicle crop/editor hardening
5. real staff auth/session completion on the remaining bridge paths

## Delivery style preference
- one file at a time
- brief description first
- then one complete code block for the entire file

## Newest pass summary
- moved the two main public pricing charts to live SVG rendering from the canonical pricing catalog
- kept packaged PNGs only as fallback/reference where still useful
- added JSON-LD helpers and page-level structured-data coverage on pricing/services/about/contact
- tightened static checks so the core public local pages must keep title/description/canonical/JSON-LD coverage plus one H1
- refreshed docs and schema notes with no DDL change in this pass
