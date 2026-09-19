# Build 428 — Service Economics & Job Profitability

## Purpose

Turn existing service, completed-job, consumables and job-cost evidence into a bounded operator view of service economics so future pricing decisions are based on recorded costs and observed work rather than assumptions.

## Evidence model

Build 428 may reconcile existing read-only evidence for:

- service/package and add-on revenue attributable to a completed job;
- recorded consumables and inventory usage;
- recorded material/unit cost where a durable cost exists;
- staff/job duration evidence already available to Operations;
- deposit, final-balance and refund state needed to avoid overstating realized revenue;
- incomplete or missing cost attribution, which must remain visibly incomplete rather than estimated as fact.

Profitability may be classified only from recorded evidence. Missing quantities, missing durable cost, unresolved refunds, incomplete job-close evidence or unsupported labour assumptions remain `review`, `partial` or `unavailable`.

## Operator workflow

The preferred outcome is a read-only Service Economics / Job Profitability surface that helps us answer:

1. Which services and add-ons have complete enough evidence to review?
2. Which completed jobs have incomplete material or revenue attribution?
3. Where are costs rising or repeatedly missing?
4. Which services deserve owner review before any pricing change?
5. Which gaps are evidence-quality problems rather than genuine low margin?

No automated price change, discount, purchasing action or accounting posting follows from this analysis.

## Mutation boundary

This build authorizes no schema migration unless separately approved, no catalogue or customer-price mutation, no booking/customer mutation, no inventory quantity adjustment, no purchasing or reorder action, no accounting journal/AP/AR posting, no payment/refund/provider transaction, no staff compensation mutation, no secret/DNS change, no destructive R2 action and no permanent polling.

## Acceptance

The exact candidate must pass:

1. focused Service Economics & Job Profitability authority;
2. retained inventory/job-cost, payment/reconciliation and finance authorities;
3. Current Source Gate and exact feature-preview acceptance;
4. identical-SHA Development deployment/runtime acceptance after non-force fast-forward to `dev`;
5. protected-main pull-request checks; and
6. independent exact resulting `main` Cloudflare Production deployment/runtime/business acceptance.

Source/runtime GREEN never converts incomplete cost evidence into a profitability claim.
