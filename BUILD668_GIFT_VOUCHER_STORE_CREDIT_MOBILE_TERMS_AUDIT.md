# Build 668 — Gift Card, Voucher & Store Credit Mobile Terms Clarity Audit

## Delivered

- Owner-authorized, GET-only `/api/admin/gift_voucher_credit_mobile_terms_review` checks bundled policy, FAQ and document sources; managed active FAQ and gift-delivery, site-policy, document and notification settings; and same-origin public `/gifts`, `/gift-cards` and `/terms` copy.
- Flags blanket one-year validity, categorical nonrefundability, balance-reducing fees, unsupported unrestricted redemption, automatic cash-out and gift purchase equated with a confirmed booking. These are **review prompts**, not legal findings, refund decisions or new policies.
- Identifies an important **gift-type scope issue**: the site offers dollar-value and specific-service gifts together but states broadly that gift certificates last one year. Ontario's public guidance describes different rules for these types. An owner and qualified legal adviser must reconcile the actual gift classifications and approved terms before public copy is changed.
- Readable, mobile-friendly, text-only owner review is available on both Admin Site Settings variants, with redacted excerpts and explicit warnings if live or managed sources cannot be read.
- Limited to up to 100 managed FAQ rows and bounded template values; it is not an exhaustive legal compliance assessment.
- No issuance, activation, delivery, redemption, remaining-value calculation, expiry, store credit, payments, refunds, booking, consent, customer contact or stored gift data is changed.

## Verification and release

Run `node scripts/build668_gift_voucher_store_credit_copy_test.mjs`, `bash scripts/current_source_gate_contracts.sh` and `bash scripts/current_booking_wizard_regression.sh`. Promote `dev` via protected PR to `main` and require exact-SHA Cloudflare production verification and read-only live smoke.

## Next expected Build 669

**Gift Redemption & Remaining Balance Customer Guidance Mobile Copy Audit** — audit balance and redemption explanations without changing value ledgers or transactions.
