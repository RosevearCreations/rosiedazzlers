# Build 576 — Release Health Dashboard, Drift Detection & Operator Alerting

## Delivered
- A **read-only Production release health monitor** (scripts/release_health_monitor.mjs) checks the live GitHub `main` SHA, the Cloudflare Pages project source/Production branch, its latest Production deployment, and required exact-SHA GitHub checks.
- A GitHub Actions **Release Health Dashboard & Drift Alerts** workflow runs after `main` updates, completion of current release-acceptance workflows, hourly at minute 43, or manual dispatch.
- Each run has a human-readable, access-controlled Actions **step-summary dashboard** with Production commit, Cloudflare commit/deployment ID, provider stage, three gate conclusions and operator diagnosis. It never publishes tokens or customer information.
- Status classification is exact-SHA and fail-closed: GREEN requires matching SHA + successful newest Production Cloudflare deployment, `Cloudflare Pages`, `Verify exact Production deployment`, and `Validate Production business acceptance source contract`.
- Pending deployments have a **30-minute grace period**; sustained missing/mismatched/unfinished deployment becomes STALLED or DRIFT. Explicit failed deployment or required CI is FAILED immediately. Missing credentials/provider evidence becomes UNAVAILABLE and fails visibly, never GREEN.
- On actionable failure, one deduplicated private-repository GitHub issue `[Release Health] Production deployment needs attention` is opened or updated; it is automatically closed once exact Production GREEN returns. The issue contains only diagnostic metadata, not provider secrets.
- No branch mutation, restart, deployment attempt, database/billing/booking change, payment action, or privileged production endpoint.

## Tests and acceptance
- `node scripts/release_health_monitor_test.mjs` exercises GREEN, 30-minute grace, drift, stalled, terminal failure, missing authority, check-run newest-ID matching, metadata safety and trigger configuration.
- Source Gate and feature-preview acceptance both execute this test on candidate SHA.
- Feature branch, accepted Development merge, protected main PR and independent exact-main Production Cloudflare/runtime/business checks are still required.
- If an alert cannot be written because repository workflow token Issue permissions are restricted, the workflow fails visibly; it never claims the alert was delivered.

## Operations
Open GitHub > Actions > **Release Health Dashboard & Drift Alerts** > latest completed run > **Summary**. Production problems surface in the repository Issues list under the single incident title. For delayed deployments, allow 30 minutes before expecting a stall alert. Actions schedule times are approximate and never guarantee instantaneous evaluation.

**Next proposed Build 577 — Automated Release Incident Recovery Guidance & Owner-Acknowledged Escalation**, pending roadmap confirmation and Build 576 Production GREEN.
