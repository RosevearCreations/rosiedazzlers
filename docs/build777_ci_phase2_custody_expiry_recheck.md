# Build 777 — CI Workflow Consolidation Phase II and Retention Custody Expiry Recheck

## Operational read-only custody expiry

The Build 776 owner screen `/admin-economic-owner-followthrough-v776.html#custody-expiry777` offers a manual **Recheck source custody expiry now** action. The same-origin, owner-session-only `POST /api/admin/economic_retention_custody_expiry_v777` takes the ten original signed owner envelopes from Builds 764–776. The server re-authenticates the full predecessor owner and independent issuer chain through Build 776 at the time of the new request. It never trusts client readiness flags, timestamps or expiring witness assertions.

The recheck computes source age, exact signed original custody expiry, remaining hours, and the 72-hour manual review-due point. Results:

- `CURRENT_WITNESS_READY_FOR_SEPARATE_OWNER_CUSTODIAN_REVIEW`: original signed history and custody witness remain current, with more than 72 hours until expiry.
- `RENEWAL_REVIEW_DUE_WITHIN_72_HOURS`: signed independent source is fresh and unexpired but custody renewal review is due. **No automatic renewal.**
- `HOLD_ORIGINAL_CUSTODY_WITNESS_EXPIRED`: independent custody receipt is expired.
- `HOLD_STALE_ORIGINAL_CUSTODY_SOURCE`: signed independent source observation is older than seven days.
- `HOLD_ORIGINAL_SIGNED_CUSTODY_EVIDENCE`: absent, conflicting, noncanonical or unverified original signatures/digests, open exceptions or missing owner authorization.

All cases keep separate original-owner and custodian action required. The function has no SQL, retention enforcement, source archive mutation, append-only audit append, notification, expiration extension, external dispute closure or business-signoff code. Build GREEN represents the software release, never a substituted owner receipt.

Regression: `scripts/build777_custody_expiry_test.mjs`.

## Phase II optional workflow backlog reduction

Build 776 safely path-scoped 21 optional legacy authority workflows. Build 777 applies the same trigger policy to **20 more** optional provider, local-acquisition, seasonal-capability and winter eligibility workflows. Each now runs automatically when its own YAML or related domain/shared security or release source changes. They retain original `push`/`pull_request` branches, `workflow_dispatch`, jobs, tests and permissions.

Protected source gate suites A–D, aggregate source check, authenticated-device recovery-continuity, Cloudflare Pages, Production Business Acceptance & Exact-SHA Authority and Release Health Dashboard & Drift Alerts are **not** path-suppressed by this change. `scripts/build777_ci_scope_test.mjs` verifies the 20 workflow selectors and protected source-gate names.

Measure actual workflow count after the next domain-unrelated promotion. On this implementation promotion, the edited workflow YAML files themselves intentionally trigger the affected workflows. Never bypass a required check: revert a path scope if branch protection unexpectedly requires the skipped optional authority check.
