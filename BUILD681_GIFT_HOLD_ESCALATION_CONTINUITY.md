# Build 681 — Gift recovery HOLD escalation, independent recheck & customer-safe continuity

## Operator flow

1. From the owner/admin gift recovery screen, refresh the Build 681 section. It reads **signed Build 680 owner HOLD reconciliation** and checks current B678 closeout, B679 audit, and recurrence history. Evidence age is displayed as current, 60-minute warning, two-hour expired, 24-hour overdue and 48-hour escalation.
2. The signed-in owner records `hold_escalated`, linked to the exact B680 reconciliation and B679 acknowledged audit. Reasons are determined by the database: superseded closeout, reopened recurrence, two-hour expiration, or an explicit owner-requested additional recheck. No customer communication is sent.
3. A distinct active assigned auditor logs in and records `independent_recheck_attested`. The backend performs **read-only Stripe verification** against the current paid session and validates counts, certificate lines, recipient/copy delivery status, webhook holds, unchanged B679 audit fingerprint and receipt metadata. The DB enforces role separation, current sources, and a five-minute provider verification age.
4. The signed-in owner may record `owner_continuity_closed` only after the independent recheck and before its evidence ages beyond two hours. The backend rechecks paid Stripe and database state; any new recurrence, superseding closeout, failed delivery, altered receipt, expired evidence, provider outage, or unauthorized auditor **retains HOLD and rejects closure**.
5. Even successful internal closure **does not release the customer HOLD**, initiate issuance, send/retry email or SMS, change a gift balance, charge/refund Stripe or authorize a delivery. Follow-on customer changes always require an unrelated, properly approved workflow.

`gift_issuance_hold_continuity_events` is append-only. All events reference the case, B678 closeout, B680 reconciliation, B679 acknowledged audit, source actor and separate auditor. The B681 RPC serializes each Checkout session using the established advisory lock, prevents conflicting event-ID replay, uses invoker rights, explicit service-role-only access and RLS without public policies. The admin API requires authenticated staff sessions, owner versus auditor permission checks, explicit continued-HOLD acknowledgment, and rejects cross-origin POSTs. Responses are private/no-store and include no recipient email or other gift-certificate PII.

## Verification

- `bash scripts/current_gift_issuance_regression.sh`: Builds 673–681, including owner/auditor role checks, provider unpaid case, event ordering, no outbound Stripe mutation and no-delivery outputs.
- `python scripts/release_hygiene_check.py` and `python scripts/production_readiness_check.py`.
- `20261027150000_build681_gift_hold_escalation_continuity.sql`: production DDL + transactionally locked RPC and immutable event table.
- `20261027150001_build681_hold_continuity_rollback_canary.sql`: synthetic complete B675–681 chain and negative self-review, stale Stripe and event immutability assertions, followed by an **intentional full rollback** with no retained synthetic gift, staff, receipt, case or audit rows.
- Source-gated feature → `dev` → `main` promotion, then successful exact-SHA Cloudflare Production acceptance and public-site smoke.

**Operational restriction:** A distinct real active auditor is still required for signed rechecks; do not create staff or approve real customer delivery automatically. Incomplete staffing means an honest HOLD, even if the software's main Production deployment is GREEN.
