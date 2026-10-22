# Rosie Dazzlers — Build 613: Condition-Aware Quote-First Guidance Preview

## Scope

Build 612's Standard Theme release is the preceding protected-main/Cloudflare
Production checkpoint (release PR #453). Build 613 improves the existing
`/preview/quote-first/` journey without changing today's public booking or
live price authority.

- The review step presents 2–3 **package discussions**, grounded in the five
  recognized bundled catalog package codes. It never calculates a total or
  claims that a package is suitable before staff review.
- Light, everyday and heavy condition choices produce separate caution text.
  Heavy or uncertain condition explicitly requires assessment.
- Pet hair, winter salt, odour, paint correction and ceramic concerns map to
  the corresponding *quote-required* bundled add-on code. They are displayed
  as manual-review concerns, not selected paid add-ons.
- The review uses semantic headings, lists and `textContent` (no user HTML),
  responsive cards and keyboard-readable copy. The existing public-appointment
  link is retained.
- A new deterministic test checks every goal/condition combination, code
  existence and quote-required flags against bundled fallback metadata, no
  duplicate extras, no side effects and no pricing/payment/booking authority.
  The dedicated quote-preview, feature-preview and Current Source Gate
  workflows exercise the test.

## Boundaries and outstanding owner decisions

1. The bundled catalog is **not necessarily** the live App Management/Supabase
   pricing catalog. No price, eligibility, deposit or date is read, cached,
   changed or published by Build 613.
2. `QUOTE_FIRST_INTAKE_ENABLED` remains independently gated and **not enabled
   by this build**. The existing optional manual inquiry endpoint, consent
   handling and staff flow are untouched. Real customers should use `/book`
   until the owner accepts the new flow.
3. The prototype is `noindex,nofollow,noarchive`. No public CTA switch, DB
   migration, R2/Photo Studio upload, marketing consent, analytics, provider
   variable, charge, booking or confirmed quote is introduced.
4. Source tests do not prove real-browser accessibility or live catalog parity.
   Review a real preview at narrow/mobile and desktop widths before accepting
   activation. Preserve negative evidence as HOLD.
5. Mark Production code GREEN only after exact feature/dev/source checks,
   protected-main merge and new exact-main Cloudflare/deployment/business
   verification. The source changes alone cannot establish Production GREEN.

## Focused tests

```sh
node scripts/quote_first_guidance_613_test.mjs
node scripts/quote_first_wizard_570_test.mjs
node scripts/quote_first_intake_573_test.mjs
node scripts/build574_mobile_booking_regression_test.mjs
```

Future scope and counts: `FORWARD_BUILD_ROADMAP_613_621.md`.
