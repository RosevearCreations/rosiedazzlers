# Rosie 877 production release-health exact-main duplicate-check repair

## Observed original source
Build 877 exact Production SHA `201b5d4e32cf0e6d309aca539cce6dcc34ce346f` was deployed to Cloudflare Pages and returned `PRODUCTION EXACT-SHA ACCEPTANCE: PASS`. Release health's source/runtime/business checker printed `GREEN`, but the independent Build 780 CI queue budget enforcement rejected two **older stale queued check-run records** inside otherwise completed, successful original GitHub workflows:

- `43462730514` Build 427 Booking Conversion & Quote Clarity. Real latest successful job `132013685664`, with obsolete `132013682059` still reported queued.
- `43462727476` Build 423 Reliability, Performance & Cost Capacity Authority. Real latest successful job `132013669854`, with obsolete `132013666851` still reported queued.

Both workflows were concluded `completed/success`, and GitHub Actions latest jobs returned only the successful completed job, while `/commits/<sha>/check-runs?filter=all` still returned an older queued duplicate with the **same name**, earlier start and different job ID.

## Evidence-preserving correction
`scripts/ci_queue_budget_v780.mjs` now groups check-run evidence by exact `name` within one original workflow run and discards a duplicate **only if**:
- its owning workflow is `completed/success`;
- a **later started, completed/success** check with the same name has a valid start/completion timestamp;
- every discarded check is an earlier queued record with no conclusion or another earlier completed/success record.

It **does not** ignore: pending workflow runs; queued/incomplete checks with a different name; later queued checks; missing timestamps; failed, cancelled, timed-out or action-required checks; invalid details URLs; missing check records; incomplete pages; over-budget runtimes/queue time; or actual production business/deployment failures.

The source and budget proof remains read-only and exact-main anchored. Added regressions to `scripts/build780_ci_queue_budget_test.mjs` and invoked them from the protected Build 877 gate.

This is a code repair, not an override of the original Release Health gate. Promote the correction via `dev` and protected `main` and require the **new final SHA** to have successful Cloudflare Production and fully GREEN release-health **including** enforced Build 780 budget measurement.
