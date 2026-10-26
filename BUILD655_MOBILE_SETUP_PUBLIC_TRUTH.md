# Build 655 — Mobile Service Setup Public Copy Consistency

The owner-established operating model is **Rosie supplies standard detailing
water and power**. Customers need a suitable safe/private or otherwise
permitted work area; unusual building, parking, runoff and local water-use
constraints remain subject to review before dispatch.

## Implementation

- Correct `/contact` text and public/footer fallback copy, while leaving the
  actual contact email draft and membership interest behavior unchanged.
- Synchronize `/faq` visible answer, JSON-LD, inline FAQ dataset, static FAQ
  seed and the public FAQ API's *static fallback*. Maintain the canonical
  `/book#booking` availability link.
- Align local policy fallbacks, bundled pricing requirement copy and legacy
  admin/client catalog defaults with the same ordinary water/power setup
  statement. Retain environmental work-area exceptions.
- The public FAQ API can still prioritize authenticated owner-managed
  `public_faq_entries`; this release does **not** silently overwrite existing
  database answers, RLS policies or private credentials.

## Explicit holds

`/terms` and `/waiver` contain older legal/customer acknowledgements that
conflict with the owner-established operating model. They remain unchanged
pending direct owner review of the operative agreement text. Likewise,
owner-managed public `site_policies` and `public_faq_entries` in Supabase may
override packaged fallbacks; any production data correction requires an
authorized inspection and update in a separate controlled step.

No scheduling, booking acknowledgement semantics, pricing, payment, deposit,
eligibility, Supabase schema, RLS or real customer records are changed.

Verification: `scripts/build655_mobile_setup_copy_test.mjs` in the current
booking source gate, protected suites A–D + aggregate GREEN, matching dev/main
trees, Cloudflare exact-main Production acceptance and live contact/FAQ
read-only smoke. Test must not submit an email or booking.
