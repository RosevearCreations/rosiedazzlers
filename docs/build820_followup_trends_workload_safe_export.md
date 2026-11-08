# Rosie Dazzlers Build 820 — Supervisor Follow-Up Outcome Trend Snapshots, Review Workload Signals & Safe Queue Export Preview

Admin Today now has **read-only cohort snapshots** of the latest 150 authenticated staff follow-ups at most, restricted to the active Build 817/818 search, status, review-target and saved-view selection. Cohorts group records by **request date** into latest 24 hours, previous 24 hours, days 2–7, older records and missing/future timestamps. Their outcome columns are derived from Build 819's source-consistent statuses (awaiting staff, replied, needs more help, answer confirmed, requires source review).

These are **current bounded observations**, not historical longitudinal trends, a complete workload census, customer SLAs, a booking resolution claim or proof that a worksite issue was closed. No values are compared to a prior persisted snapshot. Malformed, future or missing request dates are explicitly counted as unknown, not silently treated as fresh.

Workload guidance shows current filtered waiting records, valid 48+ hour request ages, missing/future request ages, verified unassigned reviewers, passed internal review targets and open supervisor reviews among waiting records. Owner and supervisor counts say **unavailable** if their separate authorized APIs did not return verified data. Invalid or contradictory follow-up statuses are not counted as valid waiting records for workload advice. Indicators never promise a customer response deadline, trigger escalation, or change the booking.

The expandable **CSV preview contains aggregate numeric counts only** from the current filtered view. It excludes customer/booking identifiers, names, addresses, message text, search terms, private reviewer notes, staff IDs, event history and timestamps. Preview data is built in memory and rendered as text; there is **no file download, copy button, persistence or network export**. Sharing any such aggregate preview outside the authorized operator context would require a separate owner decision.

Existing server authentication, owner/supervisor roles, source API scopes and revision-checked writes are unchanged. No new endpoint, migration, external messaging, automatic issue closure, Comms Hub or payment effect.

## Acceptance

1. `node scripts/build820_followup_trend_snapshot_test.mjs`
2. Builds 816–819 focused tests and `bash scripts/current_booking_wizard_regression.sh`
3. `python3 scripts/release_check.py`
4. `python3 scripts/build413_workflow_efficiency_accessibility_check.py`
5. Protected `dev` and `main` checks; exact-SHA Cloudflare production acceptance against the live canonical domain. Source-only status is not Production GREEN.

## Next proposed build

**Build 821 — Supervisor Follow-Up Trend Comparison Controls, Workload Threshold Explanations & Safe Report Accessibility.** Retain bounded, authorized, nonidentifying snapshots without inventing longer history or activating outbound export.
