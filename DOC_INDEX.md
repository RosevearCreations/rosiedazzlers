> Last synchronized: March 29, 2026. Reviewed during the staff-session, time-flow identity, intake/media session hardening, booking/admin shell cleanup, and docs/schema synchronization pass.

> Last synchronized: March 30, 2026. Reviewed during the guest-booking auth-noise cleanup, session-first endpoint tightening, private-page noindex pass, and docs/schema synchronization pass.

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

## March 30, 2026 gap-reduction pass
- Removed more legacy admin-fallback allowances from active blocks/live/jobsite/media/progress moderation paths so signed-in staff session access remains the preferred internal route.
- Book page now checks customer auth before requesting the client dashboard, reducing guest-session 401 noise during normal booking loads.
- Continued private-route SEO hardening by adding missing `noindex,nofollow` coverage to more internal/account completion pages while keeping exposed public pages on the one-H1 rule.
- Docs and schema snapshot were re-synchronized to this build after the latest endpoint and page cleanup pass.

