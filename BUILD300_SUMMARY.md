# Build 300 — Finance Payments Maintainability Extraction

Build 300 extracts the accepted Build 299 root `admin-payments.html` inline runtime into `assets/admin-payments-v300.js` without changing its contents or execution authority.

The Build 300 guard exposed a **pre-existing Payments route divergence**: `admin-payments.html` contains the newer Build 217 secure-final-balance surface, while `admin-payments/index.html` remains an older Build 185 Payments route. Build 300 does **not** silently converge those two behaviours. The folder route remains byte-for-byte unchanged from the accepted Build 299 baseline; deliberate duplicate-route authority cleanup remains assigned to **Build 318**.

This is a maintainability release: there is **no payment behavior change**, no API-contract change, no provider/refund/final-balance/reconciliation rule change, no accountant/tax judgment change, and **no database or schema migration**. Existing webhook review/replay, deposit request review, manual/provider refund actions, receipt retry, processor-fee recording, reconciliation/accountant exports, secure final-balance links on the root route, and payment operations summaries remain unchanged. Server authorization and payment-provider/API validation remain authoritative.

Real Stripe/PayPal transaction, settlement, webhook-delivery, email/SMS or other external-provider acceptance evidence is not fabricated by this build. Runtime acceptance is intentionally read-only.

Accepted Production is Build 299 at `ee010654aea48c12c885ea826bf7cf60f64852b7`. Build 300 remains Development-first until deliberate promotion from final accepted Development evidence.
