# Rosie Dazzlers Build 898 — Finance, Payment Reconciliation & Accounting

## Delivered source-only finance review
The new Admin Finance Review page reads six original source tables through a signed, authorized, read-only finance API: quote deposit payment requests, refund records, original webhook history, payment applications, booking accounting records and final-balance payment requests. It reports deposits, refunds, processor fees, booking/invoice-accounting links, final balances and **accounting-recorded** tax amounts. It does not create a second ledger or duplicate a payment application.

The view flags original callback ID mismatches, missing processed provider callbacks, provider/currency drift, paid-state amount conflicts, missing processor fees, partial/pending refunds, refund-over-payment, duplicate payment application candidates, orphan refunds outside the sampled window, final balances without a provider reference, and booking accounting underapplication. Source windows and truncation warnings are explicit; zero sample records are not treated as zero historical revenue.

The endpoint requires a genuine original staff session with finance.view and finance.reconcile permissions. Legacy administrator password and header bridge do not authorize the endpoint. Private responses use no-store and exclude customer/staff identities, provider payloads and raw references, returning only short internal ID suffixes for review.

## Evidence and accounting boundaries
- A processed original webhook row is evidence of the local callback record. Independent provider settlement and bank deposit must still be reviewed; neither is proven from application state.
- Refunds classified as pending or failed do not count as completed refunds. No automatic replay or money movement is triggered.
- HST figures come from original accounting_records.tax_cad values, **not** a hardcoded universal 13 percent split. This is not a CRA return, input-tax-credit calculation, tax payment or accountant signoff.
- Application-generated invoices are not independently issued invoices. No invoice is issued, no tax journal is posted and no final month-end or accounting close is approved.
- The existing original booking finance, refund poll, accountant export, bank reconcile, HST and monthly close workflows remain the owners of those separate permitted actions. No Stripe/PayPal API call is made in this route.
- Source-only provider, invoice, staff/device, bank, accounting and HST field acceptance remains BUSINESS ACCEPTANCE HOLD. Earlier builds 892–897 owner/provider field acceptance holds are unaffected. No fake approval or provider result.

## Deployment and independent application sync
Additive Rosie-only source is backward-compatible with protocol 1.1/1.0. No Vercel peer deployment, no AI Data/Comms connection, no direct Master delivery, no shared secret and no original Windows-host activation is performed.

Protected release gates: run Build 898 pure regression tests, node syntax, retained Build 832 economics regression, protected PR/source suites, Cloudflare preview, exact Development deployment, protected main PR, exact-main Cloudflare Pages and Functions Production, canonical HTTP smoke, release health GREEN and CI queue WITHIN_BUDGET. Synthetic test data is never considered original evidence. Only a successful exact-main acceptance permits the claim SOFTWARE PRODUCTION GREEN.

**Next proposed Build 899 — Supplies, Inventory & Equipment Maintenance.** Implement canonical stock reconciliation, durable equipment service records and role-isolated owner approvals; do not infer purchase, consumption or actual maintenance without original evidence.
