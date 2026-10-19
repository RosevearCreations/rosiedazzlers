# Build 579 — Owner Decision Receipt Persistence & Recovery Evidence Dashboard

## Delivered
- A source-controlled, read-only receipt processor in `scripts/release_incident_receipt_dashboard.mjs`.
- GitHub Issue comments act as durable operator-managed receipts. Each receipt is exactly one comment with `RD-REMEDIATION-RECEIPT ` followed by a JSON object satisfying the Build 578 decision contract.
- Only receipts authored by the repository owner account are accepted. Receipt transitions are replayed in GitHub comment ID order. Forged, invalid, duplicate, unauthorized and out-of-order receipts are excluded from state.
- Markdown dashboard displays per-decision owner, exact incident SHA, decision state, receipt count, and whether fresh exact-SHA Production/business verification actually proves recovery.
- Bounded scan rejects more than 250 comments rather than fabricating complete history.

## Operator use
Retrieve the incident issue comments with authenticated, least-privilege GitHub access. Pass them with the owner login into `receiptDashboard({comments,owner,health})`; render with `dashboardMarkdown(result)`. Use read-only, current Build 576/577 Production health evidence as `health`. No receipt or dashboard can approve remediation, start rollback/deployment, infer live provider success, or override owner HOLDs.

**Limitation:** GitHub issue comments are editable/deletable by users with permission and therefore are durable but not immutable audit records. This build is a source-level functional dashboard and parsing contract; a production-integrated issue list UI, write path, append-only storage and automated retrieval are future work. This build does **not** falsely claim that GitHub issues are tamper-proof.

Tests: `node scripts/release_incident_receipt_dashboard_test.mjs`; also included in cumulative release-health source gate.

Next proposed: Build 580 — Privileged Receipt Collection & Immutable Audit Snapshot Integration.
