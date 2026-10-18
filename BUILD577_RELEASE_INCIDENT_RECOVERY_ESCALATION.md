# Build 577 — Automated Release Incident Recovery Guidance & Owner-Acknowledged Escalation

The existing Build 576 release monitor remains read-only for Cloudflare and business data. Failed, stalled, drifted, or unavailable releases now carry state-specific diagnosis and explicit manual recovery instructions in the Actions summary and deduplicated private incident issue.

## Owner acknowledgement
The GitHub repository owner `RosevearCreations` can comment exactly `/ack-release-incident <40-character-main-sha>` on the open release health issue. The monitor re-reads issue comments and marks acknowledgement for the **current exact main commit only**. A comment by another account, or one for a previous SHA, does not acknowledge the current incident. Rechecking a current issue is safe and does not create a second incident issue.

Acknowledgement is an awareness receipt only, **not** approval to rollback, retry, mutate a branch, deploy, change payments/booking, restore a database, or close the issue. Those actions require separate explicit authorization, and GREEN is never inferred from a receipt. On independently verified Production GREEN the issue is closed as in Build 576.

## Verification
`node scripts/release_health_monitor_test.mjs` exercises state-specific guidance, owner identity, exact-SHA matching and acknowledged versus required display in addition to the Build 576 health states.

Next proposed: Build 578 — Incident Remediation Decision Ledger & Verified Recovery Follow-Up (pending Production GREEN).
