# Rosie Dazzlers Build 817 — Staff Follow-Up Search & Review-Target Triage

The authenticated Admin Today follow-up inbox now supports case-insensitive local search by booking reference, concern type, request kind, or customer question. Search is explicitly scoped to the most recent **150 records returned by the existing authorized staff API**; it is not a global historical search or a new endpoint.

Supervisors can filter *verified* internal owner-review targets into passed, next 24 hours, later, or no target. If owner records cannot be verified, that filter is disabled, owner-dependent results remain unavailable, and the staff queue continues without fabricating ownership facts. Results and summary are announced accessibly; user input is not persisted, logged or sent elsewhere.

No new Supabase migrations, customer-facing private fields, additional permissions, scheduling, automatic outreach, promise of an SLA, booking mutation, payment, or Comms Hub side effect. Existing explicit supervisor assignment permissions, revisions, and immutable audit remain authoritative.

## Acceptance

1. `node scripts/build817_followup_search_review_triage_test.mjs`
2. `bash scripts/current_booking_wizard_regression.sh`
3. `python3 scripts/release_check.py`
4. `python3 scripts/build413_workflow_efficiency_accessibility_check.py`
5. Exact-head protected dev and main PR checks plus post-merge production workflow and deployment acceptance. No bypass of failures or pending checks.

## Repository cleanup

Only refs independently confirmed reachable from both `dev` and `main` may be removed. Keep unmerged branches, release tags and audit evidence. GitHub's ordinary repository connector does not offer a delete-ref operation; deletion requires an authenticated owner-capable channel and a verified inventory.

## Next proposed build

**Build 818 — Supervisor Follow-Up Saved Triage Views, Accessible Review Notes & Queue Continuity.** Keep owner-private data, authorization and fail-closed behavior intact.
