# Build 669 — Gift Redemption & Remaining Balance Customer Guidance Mobile Copy Audit

## Delivered

- Staff-authorized, read-only `GET /api/admin/gift_redemption_balance_mobile_copy_review` checks bundled FAQs, policy and document templates, managed FAQs and app settings, and public gift, booking, account, printable certificate and help copy. The audit panel is present in both Admin Site Settings routes, with `aria-live` updates and phone-sized wrapping controls.
- Flags unsupported claims that gifts always cover a full booking, all remaining value is redeemed, unused balances are forfeited, balances update instantly, anyone can view a balance, service gifts have no package/size restrictions, a gift code confirms an appointment or unused value is automatically paid out in cash.
- Checks for missing information about entering a gift code, deposit-limited application, remaining-value checks, purchaser/recipient account authorization and printed value being subject to checkout verification.
- Records the **known preview-versus-checkout mismatch** in source-tested contracts: `api/codes/preview` can apply gift value against the total after promotions, while final `api/checkout` currently applies it only up to the deposit. Public `/gifts` says dollar gifts deduct from the booking total. These require an owner decision before promising any changed payment behaviour. This build does not alter checkout or approve policy.
- Flags a separate **printable certificate display issue**: the current `remaining_cents || face_value_cents` display fallback can render the original face value if remaining value is exactly zero. This is an owner-facing repair finding, not a live gift-balance adjustment.
- Staff output excludes customer codes, live gift balances and personal redemption history. Every source failure remains visible; snippets redact email, phone, URLs and code-like values. The endpoint never modifies gift certificates, redemptions, credits, bookings, deposits, customer records, notifications or Stripe/PayPal state.

## Verification

`node scripts/build669_gift_redemption_balance_mobile_copy_test.mjs`

`bash scripts/current_source_gate_contracts.sh`

`bash scripts/current_booking_wizard_regression.sh`

Promotion requires `dev` -> protected PR -> `main`, current-source gate success, production business acceptance, exact deployed `main` SHA and public read-only smoke.

## Next expected Build 670

**Gift Receipt, Certificate & Redemption Confirmation Mobile Readability Audit** — reconcile purchase/receipt/printable certificate guidance with confirmed booking and remaining-value messages, without changing financial authority.
