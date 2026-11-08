# Rosie Dazzlers Build 822 — Supervisor Follow-Up Comparison Saved Presets, Exception Review Drilldowns & Report Continuity

## Operator workflow

Admin Today now offers **comparison presets** beneath the existing Build 821 observed-cohort table. A staff user with an authenticated verified ownership identity can name and save up to four combinations of comparison mode, status filter and internal review target. Selecting a preset restores only those display settings and clears any free-text search or exception drilldown. The authorized queue is queried anew and the aggregate report is recalculated. Named Build 818 triage views remain independent.

Presets are stored only in `sessionStorage` under the current UUID-shaped staff account; they never contain queue records, customer identifiers, search strings, private notes, supervisor decisions, count snapshots or report bodies. Invalid, tampered, unreadable or unavailable session storage fails closed. Saving is disabled when staff identity is not verified. Closing the browser tab ends the saved-preset lifetime.

The **source-verified exception drilldown** is applied after the existing authenticated, bounded, filtered queue selection:

1. All records in current filters.
2. Waiting at least 48 hours with a valid request date (advisory only, no service deadline).
3. Waiting with missing, invalid or future request dates (data-quality issue, not overdue).
4. Waiting with no verified assigned owner (requires the separate ownership source).
5. Waiting with an uncleared supervisor review (requires the separate escalation source).
6. Waiting past a verified internal review target (requires the separate ownership source, not a customer SLA).

An exception with an unavailable supporting source cannot be selected as a trusted zero. If a source disappears after refresh, that drilldown pauses, shows an explicit source-unavailable message, and hides the report and customer cards rather than making an unsupported claim. The operator can return to the broader filtered queue with one accessible button. No decisions are written automatically.

**Report continuity** displays the verified queue load timestamp and selected comparison, filter and exception context. The Build 820–821 aggregate report and plain-language comparison are regenerated on each filter or exception change and after each successful authorized refresh. This is not a historical snapshot, exported file, stored report or evidence of customer response deadlines. It never contains customer text, names, booking identifiers, notes, actor IDs or event history.

### Permission and non-action boundaries

- No new database, security policy, API, background job, download, clipboard, outbound message, payment, dispatch, booking mutation or automatic escalation.
- The 150-record maximum and existing staff authentication still apply; filtering does not widen access.
- Missing owner/escalation evidence is **unavailable**, never interpreted as zero.
- Manual supervisor actions continue to require their existing audited forms and source readbacks.
- Keyboard-labeled controls, visible focus, live status feedback and small-screen stacked layouts remain accessible.

## Verification

- `node scripts/build822_followup_presets_exception_continuity_test.mjs`
- `bash scripts/current_booking_wizard_regression.sh`
- `python3 scripts/release_check.py`
- `python3 scripts/build413_workflow_efficiency_accessibility_check.py`
- `node --check assets/admin-worksite-followups-v814.mjs`
- Protected GitHub `dev`/`main` PR checks and exact-SHA Cloudflare Production acceptance are required **after** source promotion; this document makes no deployment claim.

## Next proposed build — Rosie Dazzlers 823

Supervisor Follow-Up Exception Ownership Handoff, Guided Resolution Evidence & Accessible Review Completion.
