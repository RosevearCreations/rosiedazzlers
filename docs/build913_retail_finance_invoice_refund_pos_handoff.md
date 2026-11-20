# Rosie Dazzlers — Build 913 Original Retail Finance, HST Invoice, Refund, Stand/Pickup Handoff

## Build 913 source authority
This build adds actual **integrations and transactional code**, while distinguishing tested code from witnessed real-world payment, refund, tax, terminal and physical custody evidence. No original records have been fabricated. A protected \`main\` production deployment can be green while the independent real-world operational gates remain HOLD.

### Build 913 implemented contracts
1. **Gated Stripe customer checkout** for a verified customer-owned Build912 order with \`status=quoted\`, original merchandise pricing, original Ontario HST amount, currently active pickup/stand location, approved product stock, and one stable provider idempotency key. There is **no client-side paid flag**, no unsanctioned payment from a pending cart, and the existing detailing booking/deposit authorities are not reused as retail revenue.
2. **Signed Stripe provider webhook** validates original raw-body HMAC signature with a five-minute replay window, exact original checkout/session/order ID, CAD, original total, \`payment_status=paid\` and payment intent. A single **atomic Supabase transaction** registers the paid event and creates a unique numbered invoice; duplicates replay without new revenue/invoice.
3. **Original issued invoice and Ontario HST evidence**: \`rosie_retail_invoices_v913\` records an invoice number, original subtotal, exact HST cents, total and verified provider event. This is accounting evidence of the verified retail payment, **not independent merchant payout/bank matching or a signed tax filing**. The user must explicitly enable approved Ontario HST mapping before checkout.
4. **Finance refund request and initiation**: only signed finance/refund-authorized staff can request, then explicitly send a real Stripe refund, with provider idempotency; an original signed succeeded \`refund.created\` / \`refund.updated\` event settles exact value once. Staff initiating a refund does not mark it successful; a missing provider receipt stays pending.
5. **Pickup and stand confirmation**: after an original paid, *unrefunded* order, the verified customer can generate a 96-bit random short-lived (15-minute) single-use handoff code. Original signed operations staff must attest in-person custody, provide a note and enter the code. The database atomically checks the order/payment/code, rejects repeated or unavailable handoffs, decrements original SKU stock and writes unique physical-stock movements. The staff attestation is **not a second independent physical witness**.
6. **Secure original-source customer and staff pages**: \`/retail-receipt-913.html\` and \`/admin-retail-913.html\` show scoped payment/refund/numbered-invoice states and support the deliberate checkout/refund/handoff actions. No public supplier reviews, DAIP raw media or other customer orders are exposed.
7. **Restrictive RLS** on six new tables: finance, provider events, invoices, refunds, handoffs, stock movements. No \`anon\`/\`authenticated\` grants; only the Cloudflare server service role can use the transactional SQL functions (SECURITY INVOKER) or read/write private records.
8. Protected CI: original provider signature and HMAC tamper/replay, anti-forgery/cross-origin and owner scope, exact total/HST, overrefund, stock/custody, original table grants and Build910–912 backward regression.

### Production activation flags (OFF by default)
- \`ROSIE_RETAIL_FINANCE_ENABLED_913=true\`: may only be enabled after real production provider webhook enrollment, signing secret and merchant checkout smoke.
- \`STRIPE_SECRET_KEY\` and new \`STRIPE_RETAIL_WEBHOOK_SECRET_913\`: server-only; no credentials may be committed, printed, included in audit issues, or sent to a public browser.
- \`ROSIE_RETAIL_HST_APPROVED_913=true\`: tax/accounting owner has approved the Ontario tax treatment and internal invoice mapping, including special/exempt items if applicable.
- \`ROSIE_RETAIL_REFUNDS_ENABLED_913=true\`: only after live original-provider refund acceptance and finance approval.

**Provider endpoint:** \`/api/stripe/retail_webhook_v913\`; events \`checkout.session.completed\`, \`refund.created\`, \`refund.updated\`. Stripe checkout uses original customer-owned order, hosted card payment, and server-generated amount. Legacy Rosie service booking and quote deposit Stripe/PayPal callbacks remain the source of truth for *those* workflows; Build913 does not intermingle their ledgers. PayPal retail provider activation and terminal/hardware POS still require original integrations and are NOT claimed green.

### Important real-world HOLDs and risks
- **Bank payout, Stripe fees, chargeback/dispute, PayPal retail capture/refund, multi-channel ledger integration, accountant-approved final HST filing** require independent original provider and accounting evidence.
- **Stand hardware POS card-present authorizations** are not implemented here; stand orders use customer-authenticated hosted Stripe checkout only. Treat the “stand” mode as *stand handoff requests with optional hosted card payment*, not a card-present terminal.
- **Inventory is not reserved before payment.** Original stock is checked at checkout; concurrent demand may exhaust stock before handoff. The handoff transaction fails closed if original stock is insufficient, and a staff refund/dispute review is required. Do not assert fully allocated/guaranteed availability.
- **Physical receipt** is staff-attested with customer code, not an independently witnessed original phone/tablet/site transfer. No automated marketing, customer SMS, DAIP/social publishing or invented supplier equipment receipt.
- Empty source (zero real original retail orders/products) cannot certify provider settlement, invoice, physical handoff, stand POS, or refund. No live financial action should be enabled just to make test metrics green.
- Build 911's 48-domain expanded full-business estimate ~50.1% ±10–15 points is held as the **uncertified planning baseline**. Pure code scope does not automatically produce a 5–10 point verified completion increase.

### Promotion and activation sequence
1. Protected implementation PR → \`dev\` with Build913 + prior 912–910 regressions, all source/test checks successful.
2. Original Rosie Supabase migration applied and verified: RLS true, anon/auth grants false, original zero-row source retention, transaction functions invoker/only service execute.
3. Exact SHA Cloudflare Development, dev diagnostics, authenticated test/readback and source checks all pass.
4. Protected \`dev\` → \`main\` promotion PR checks green; only merge after checks pass.
5. Exact SHA Cloudflare Production Pages + Functions + canonical HTTPS smoke; independent Production Business Acceptance; Release Health GREEN; CI budget WITHIN_BUDGET, pending=0.
6. Separately owner-enroll original Stripe live keys/webhook/HST/refund flags and run a supervised original money-flow and physical handoff. Do NOT conflate software deployment with operational activation.

### Next queued build
**Build 914 — DAIP Supplier Custody, Private Creative Review, Consent-Gated Video Publication and Measured Social Attribution Acceptance.**

After 913, five roadmap builds remain (914–918) under the current Build 911 queue; scope may be revised as original business requirements evolve.

### References
- Build 912 source: \`docs/build912_retail_pickup_stand_specials_source_of_truth.md\`
- Canonical Rosie finance: \`functions/api/admin/finance_reconciliation_v898.js\`, \`functions/api/admin/finance_acceptance_v911.js\`
- Stripe Checkout: https://docs.stripe.com/payments/checkout
- Stripe webhooks: https://docs.stripe.com/webhooks
- Stripe refunds: https://docs.stripe.com/refunds
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Ontario HST: https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses.html
