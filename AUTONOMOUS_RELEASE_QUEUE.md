# Rosie Dazzlers — Autonomous Development Queue

This queue records only current actionable work. Completed implementation history belongs in Git history and archived gate/deployment evidence.

## Accepted synchronized checkpoint

**Build 334 — Durable Completed-Service Vehicle History Sync** is GREEN and closed at exact SHA `a5feaa71df1d87581674f93526ae44e2f861d244`. At active-work start, `dev == main` on that SHA.

## Active — Build 335

Branch: `build335-controlled-fleet-quote-handoff`

Scope: **Controlled Fleet Lead → Draft Quote Handoff**.

The accepted fleet pipeline and existing quote dashboard now gain one explicit, staff-authorized bridge. Eligible fleet inquiries may create or reopen one durable draft quote without granting the generic fleet status editor quote, customer, booking, scheduling or payment authority.

### Acceptance checklist

- Require authenticated `manage_bookings` staff authority.
- Reload the lead server-side by UUID with `topic=fleet` before handoff.
- Block new draft quote creation for converted, closed and spam leads.
- Reuse an existing `quote_pipeline_items` row linked to the lead.
- Fail closed when multiple quote rows already point to the same fleet lead.
- When no quote exists, use the fleet lead UUID as the deterministic quote UUID so concurrent retries converge on one primary-key identity.
- Create only a `draft` quote with zero quoted/accepted amounts and follow-up stage `prepare_quote`.
- Pre-fill only low-risk inquiry context such as business/contact display name, service area and vehicle-count scope label.
- Do not create or mutate `customer_profiles`, bookings, appointments, schedules, recurring-service enrollment or payments.
- Do not automatically set the fleet lead to `quoted`; staff owns that status after a real quote is prepared/sent.
- Preserve the generic fleet PATCH boundary as status + internal staff note only.
- Deep-link the Quote dashboard to the exact authorized quote returned by the handoff.
- Keep public fleet intake quote/booking/billing neutral.
- No database migration or historical/business-data backfill is introduced.
- Extend durable Fleet Account Pipeline Authority with syntax/source guards and executable deterministic/reuse/ambiguity tests.
- Exact feature SHA must pass Current Source Gate, Fleet Account Pipeline Authority, Booking Vehicle Identity Authority, Maintenance Retention Follow-up Authority and Cloudflare feature deployment.
- Fast-forward `dev` only after feature GREEN; require exact-SHA source authorities plus Cloudflare Development Acceptance.
- Fast-forward `main` only after Development is GREEN; require exact-SHA source authorities plus Cloudflare Production deployment.
- Finish with `dev == main` on the accepted SHA.

## Next sequential scope

After synchronization, inspect the accepted fleet quote → verified customer/account/booking conversion path. Any future conversion must reuse a confidently matched customer profile or require explicit staff resolution; phone-only leads must never force a fabricated email/customer identity. Quote acceptance must not itself capture payment, reserve capacity or create recurring service without its own approved workflow.

## Continuing rule

Never start the next RosieDazzlers release from stale Markdown. Verify `dev`, `main`, the prior accepted SHA and exact-SHA gates first. Database migrations remain a separate acceptance boundary from source promotion.
