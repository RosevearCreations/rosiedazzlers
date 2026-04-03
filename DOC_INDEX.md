> Last synchronized: April 1, 2026. Reviewed during the session-first recovery tooling, jobsite upload reuse, DB-first catalog fallback reduction, and docs/schema synchronization pass.

> Last synchronized: March 31, 2026. Reviewed during the known-gaps/risk reduction, DB-first catalog convergence, progress-page upload reuse, and docs/schema synchronization pass.

> Last synchronized: March 30, 2026. Reviewed during the staff-session, time-flow identity, intake/media session hardening, booking/admin shell cleanup, and docs/schema synchronization pass.

# Rosie Dazzlers — Documentation Index

> Last synchronized: March 26, 2026. Reviewed during the booking add-on imagery, catalog autofill, low-stock reorder UI, Amazon-link intake, local SEO, and docs/schema refresh pass.

Use this file as the quick map to the main Markdown documents for the `dev` branch.
Last synchronized: March 24, 2026.

## Read first
- `README.md` — project overview and current direction
- `PROJECT_BRAIN.md` — mental model
- `CURRENT_IMPLEMENTATION_STATE.md` — what changed recently
- `KNOWN_GAPS_AND_RISKS.md` — current risks and remaining gaps
- `DEVELOPMENT_ROADMAP.md` — next implementation order
- `REPO_GUIDE.md` — repo structure and path map
- `SUPABASE_SCHEMA.sql` + `DATABASE_STRUCTURE_CURRENT.md` — schema truth

## Workflow docs
- `HANDOFF_NEXT_CHAT.md` — quick continuation note for a new chat
- `NEXT_STEPS_INTERNAL.md` — short operational next-move list
- `SANITY_CHECK.md` — high-level project health snapshot
- `BRANCH_WORKFLOW_NOTE.md` — `dev` branch rule reminder

## Important rule
When architecture changes, refresh the docs above together so the handoff stays reliable.

### March 25, 2026 pass note
This doc was refreshed during the vehicle catalog, progress-session, layout, and public catalog filter pass. The repo now includes NHTSA-backed vehicle make/model endpoints, a DB cache table for vehicle catalog rows, progress moderation/enable session upgrades, and public search/filter cleanup on Gear and Consumables.

## March 31, 2026 index note
The docs were refreshed again during the known-gaps/risk reduction pass. The main code-side changes in this sync were DB-first public catalog preference, progress-screen upload reuse, and another round of session-bridge wording cleanup.

> Last reviewed in the April 2, 2026 blocks/risk convergence pass.

## April 3, 2026 UI / session / video pass
- Continued route-by-route UI cleanup by moving more admin pages toward signed-in staff session usage instead of password-only page flows.
- Tightened global CSS for dark-mode form usability, including calendar-icon visibility and better wrapping for row-based inputs/buttons on smaller screens.
- Refreshed the public video/social experience so YouTube remains the main playback surface while Instagram supports reels, work photos, and single-image proof-of-work posting.
- Continued docs/schema synchronization for the current build; no new schema migration was required in this pass.



## April 4, 2026 mobile shell / security / cleanup pass
- Tightened shared CSS again for mobile form wrapping, input/button crowding, and dark-mode date-picker visibility so calendar icons remain visible on dark surfaces.
- Added a real installable app shell foundation with `manifest.webmanifest`, `service-worker.js`, and an install banner so the field/detailer workflow feels more complete on phones.
- Continued mobile-first field direction by linking admins and detailers into the same live job workflow path; admins can still act as detailers and work through arrival, evidence capture, sign-off, and billing from the phone side.
- Reduced duplicate-route/file clutter slightly by renaming clearly unlinked legacy block endpoints and one accidental duplicate notes file with an `RM_` prefix for safe removal review.
- Still not honestly complete: full role-aware auth/session convergence on every remaining internal route, final actor normalization everywhere, and total retirement of all transitional bridge assumptions.
