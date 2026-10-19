# Build 578 — Incident Remediation Decision Ledger & Verified Recovery Follow-Up

This change provides a pure, auditable state-machine contract in `scripts/release_incident_decision_ledger.mjs`. It intentionally does not initiate Cloudflare deployments, GitHub merges, credential changes, billing changes, database restores or production mutations.

## Decision receipt
Each remediation proposal requires a stable decision ID, incident SHA, named owner, supported action and reason. Explicit states are PROPOSED → OWNER_APPROVED → EXECUTED → VERIFIED; OWNER_REJECTED and REOPENED are supported exception paths. Approval, execution, and recovery verification require separate evidence references. A Build 577 acknowledgement comment is not an approval receipt.

## Recovery follow-up
A VERIFIED receipt requires exact SHA and both Cloudflare and business acceptance evidence references. A follow-up can be accepted only if fresh read-only release health is GREEN, its main SHA and Production SHA match the receipt, and all three required acceptance checks succeed. Cross-SHA successor deployments require new decision receipts rather than rewriting incident history.

## Test
`node scripts/release_incident_decision_ledger_test.mjs`

This is an isolated ledger contract for future integration, not a claim of a persistent owner UI or automated incident resolution. Prior Build 577 must separately reach Production GREEN; Build 578 must pass protected main and exact Cloudflare Production checks.

Next proposed: Build 579 — Owner Decision Receipt Persistence & Recovery Evidence Dashboard.
