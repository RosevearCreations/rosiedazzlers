# Rosie Dazzlers - Build 682

## Gift Recovery Independent Recheck Outcome Aging, Owner HOLD Exception Follow-Up & Closure Recurrence Monitoring

**Release date:** October 27, 2026

### Purpose

Keep completed Build 681 internal gift-recovery outcomes under review. Track evidence that reaches a 60-minute warning, expires at two hours, becomes overdue after 24 hours, or reaches 48-hour escalation. New recurrences and superseded closeout evidence must remain on HOLD.

### Owner and auditor process

1. **Refresh:** The signed-in owner or assigned independent auditor opens the Build 682 section of Admin Gift Recovery and refreshes the current case evidence. Current B681 outcome, closeout and follow-up age are shown without customer PII.
2. **Open owner exception:** The owner records an immutable `exception_followup_opened` event, linked to the exact B681 independent/owner source event, with a database-verified reason: `owner_requested_followup`, `independent_outcome_aged`, `owner_closure_aged`, `recurrence_reopened` or `source_superseded`.
3. **Independent recheck:** Only the different assigned signed-in auditor may record `independent_outcome_rechecked`. This requires the source to be an actual B681 owner continuity closure, paid read-only Stripe proof from the past five minutes, stable gift certificate line counts, no failed delivery state or webhook HOLD, unchanged receipt and source evidence, and no recurrence after the applicable closeout.
4. **Owner follow-up closure:** A separately signed-in owner may record `owner_followup_closed` only with the current independent recheck, source continuity and paid/issuance evidence, while the independent check is less than two hours old.
5. **Continue monitoring:** The closure is internal evidence only. It **never releases a customer HOLD or authorizes gift delivery, resend, refund, charge, balance mutation, email or SMS.** Cases with reopened recurrence, superseded closeout, changed receipt, expired proof or absent independent auditor remain on HOLD.

### Protection and audit trail

- Append-only `gift_issuance_hold_followup_events` with event-ID conflict detection, explicit case/closeout/B681 source reference, source/role checks and Stripe-session advisory lock.
- Supabase RLS enabled, no public user policy, explicit backend service-role-only table grants and RPC execution.
- Cloudflare API accepts only signed-in owner or assigned separate auditor. Responses are no-store/private, POST rejects cross-origin requests and no recipient email is exposed.
- All payment checks use Stripe read-only GET. The workflow has no customer-message or gift/payment write operation.

### Acceptance and rollout

- Cumulative automated gift regression Builds 673-682.
- Database migration: `20261027160000_build682_gift_recheck_aging_followup.sql`.
- Synthetic full-chain rollback canary: `node scripts/build682_hold_followup_canary.mjs` composes the B681 rollback fixture with Build 682 owner/auditor and immutable-receipt assertions; **zero synthetic gift, staff or audit records may remain**.
- Release hygiene and production readiness checks.
- Protected feature-to-`dev` and `dev`-to-`main` GitHub gates and final Cloudflare exact-SHA Production and live-domain smoke tests.

### Operator availability

The independent auditor must be a real active person distinct from the owner and prior reviewer. No dummy staffing, automatic approvals, certificate delivery or customer notifications are to be created as part of this release. Deployment GREEN does not imply an individual customer HOLD is resolved.

### References

- Code: `https://github.com/RosevearCreations/rosiedazzlers`
- Site: `https://rosiedazzlers.ca`
- Supabase Data API security: `https://supabase.com/docs/guides/api/securing-your-api`
- Supabase RLS: `https://supabase.com/docs/guides/database/postgres/row-level-security`
