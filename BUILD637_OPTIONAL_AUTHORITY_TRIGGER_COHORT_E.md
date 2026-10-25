# Build 637 — Optional Authority Workflow Trigger De-duplication: Cohort E

## Scope
Continue the incremental queue-relief work from Builds 633–636 after their independently verified protected Production releases. This batch narrows seven non-required historical authority workflows serving staff-mobile workflow learning, service-economics planning, seasonal claim review, and reliability-cost planning.

The ONLY workflow change is to remove broad `build*` under `on.push.branches` for the seven files named in `scripts/build637_optional_authority_cohort_e_test.mjs`. Their complete jobs, test assertions, CI runners, permissions, timeouts, concurrency settings and environment variables remain unchanged. Existing protected `dev`/`main` pushes, PRs to either protected branch and manual workflow dispatch continue to execute these checks.

The existing stable, fail-closed `scripts/current_optional_authority_triggers.sh` now also runs the Build 637 test after all Build 633–636 tests. GitHub's required Current Source Gate already invokes this wrapper in suite A, so the source-gate workflow itself is not edited or weakened. Suites A–D and their aggregate `source checks` remain required.

## Safety and operational limits
- Seven redundant *future* broad feature-branch push runs are avoided for a matching push. Already queued runs are not cancelled or removed by this build.
- This is not authorization to alter any winter-booking safety requirements, customer site eligibility, pricing, payment, staff permissions, privacy/consent HOLDs or production deployment controls.
- No customer-facing site files, checkout/payment endpoints, Supabase/Cloudflare settings, schema, assets, or themes are modified.
- No GitHub required status is skipped. The protected main release only merges after exact-head required source checks pass.
- The repo's large, historical workflow inventory deserves separate owner-scoped pruning; do not delete any workflow merely to cut CI minutes.

## Acceptance evidence
1. `bash scripts/current_optional_authority_triggers.sh` runs five cohorts (633–637) under strict fail-closed shell mode.
2. Each of the seven optional workflows preserves full PR-to-dev/main and push-to-dev/main tests, manual dispatch and unchanged job bodies. Only the `build*` event selector is removed.
3. Protected Source Gate A–D plus aggregate `source checks` must succeed for the exact release head.
4. Build 637 merges into `dev` through a reviewed PR. Because `dev` and `main` historically diverge, production promotion uses a focused main-from-current-main PR with the approved: seven workflows, updated wrapper, test and documentation (10 total).
5. Cloudflare Pages Production must show SUCCESS for the exact final `main` merge SHA, project `rosiedazzlers`, branch `main`, Functions enabled, immutable deployment URL and `https://rosiedazzlers.ca` static/contextual smoke. A GitHub merge or an HTTP 200 alone does not establish GREEN.

No customer bookings or charges were created for this CI-only change.
