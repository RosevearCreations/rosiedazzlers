# Rosie Dazzlers Build 821 — Supervisor Follow-Up Trend Comparison Controls, Workload Threshold Explanations & Safe Report Accessibility

The authenticated Admin Today follow-up dashboard adds explicit **comparison controls** using only the current Build 820 filtered, bounded (newest 150 at most) queue. It offers:

- Equal-duration **last 24 hours vs preceding 24 hours**, with a simple observed-count difference (first minus second), never a growth-rate claim.
- **Last seven days vs older loaded records**, with no difference or rate because the periods are unequal and older requests can be outside the source cap.
- **Valid request dates vs missing/future dates** for source quality review, again without a misleading change rate.

The side-by-side semantic table reports source-grounded outcomes (awaiting staff, staff replied, needs help, answer confirmed, source review, total). If group counts are inconsistent, exceed the bounded source or are absent, the comparison fails closed with clear refresh guidance. A selector changes the view locally, announces the result through an accessible status, and returns keyboard focus to that status. Changing filters or refreshing reuses the current selector without storing any customer data.

An expandable **workload threshold explanation** clarifies each Build 820 signal: waiting means source-consistent and unanswered; the 48-hour mark is advisory rather than a response SLA; unknown request dates are not assigned an age; owner and supervisor counts require their separate authenticated sources; passed internal review targets are not customer commitments. Missing sources show **Source unavailable**, not zero.

A keyboard-focusable **plain-language aggregate report preview** repeats only approved counts, scopes and caveats from the current filtered selection. No customer message, booking identifiers, search strings, personal notes, staff identities or event histories are included. No download, printing action, clipboard operation, storage, telemetry or external export is added. Build 820's safe CSV preview remains read-only and source-limited.

No new endpoint, database migration, role, permission, automatic outreach, booking modification, worksite issue closure, payment, dispatch or Comms Hub side effect.

## Acceptance

1. `node scripts/build821_followup_comparison_accessibility_test.mjs`
2. `bash scripts/current_booking_wizard_regression.sh` with retained 816–820 tests
3. `python3 scripts/release_check.py`
4. `python3 scripts/build413_workflow_efficiency_accessibility_check.py`
5. Protected `dev`/`main` checks plus exact-SHA Cloudflare Production deployment and live canonical-domain smoke. Only the final exact-SHA proof establishes Production GREEN.

## Next proposed build

**Build 822 — Supervisor Follow-Up Comparison Saved Presets, Exception Review Drilldowns & Report Continuity.** Preserve bounded current-source truth and role boundaries; no fabricated historical comparisons or unsupervised export.
