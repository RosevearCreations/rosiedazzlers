# Rosie Dazzlers — Build 615: Quote Intake & Staff Handoff Acceptance

## Scope and actual release behavior

Build 615 strengthens the existing `/preview/quote-first/` optional journey
without activating customer inquiry collection or changing current
customer-facing booking, packages, pricing, checkout, payments, marketing,
photos or appointment availability.

1. The quote preview shows an accessible, visible status explaining when
   intake is disabled (the form stays hidden, no contact details are requested).
   An unavailable capability check also fails closed.
2. Only **if a separately owner-authorized production environment has
   `QUOTE_FIRST_INTAKE_ENABLED=true`, valid Turnstile public/private keys,
   and Supabase server configuration** does the form become available after
   the wizard review. A customer must choose an inquiry-specific contact
   permission and pass server-side Turnstile verification. No marketing
   permission is inferred.
3. The browser keeps the anonymous selection and pending contact details in
   memory only; it creates a unique request UUID per canonical set of fields.
   Retrying identical details uses the same UUID, while edits use a fresh
   request identity. The server's existing atomic lead primary-key constraint
   blocks duplicates. Identical 409s return a safe replay acknowledgement;
   conflicting 409s never overwrite the earlier lead.
4. The existing authorized `/admin-leads.html` staff workbench offers a
   `Quote-first preview` source filter backed by the whitelisted
   `public_inquiry_leads.source_path` filter. Such leads are visibly labelled
   and carry an explicit note to verify current pricing, availability,
   vehicle conditions and consent manually before any later action.

## Owner decisions that stay on HOLD

- Activating quote intake or collecting real customer contact information.
- Approving privacy/retention language, rate limits, staff workload and
  Cloudflare Turnstile/Supabase credentials for actual launch.
- Resolving Build 614's Basic Detail pricing mismatch: bundled/App Management
  versus public customer-visible override. No pricing is silently changed.
- Automatic quote acceptance, marketing subscription, booking, slot reserve,
  deposit/Stripe/PayPal checkout, or customer-photo publication.

The production `GET /api/quote_first_request` response was independently
checked before this release and was `enabled:false`, `site_key:null`, with
`accepts_booking:false` and `accepts_payment:false`. That observation does
**not** authorize changing the flag; release verification must recheck it.

## Acceptance evidence

`node scripts/quote_first_handoff_615_test.mjs` exercises the source-only
disabled gate, explicit opt-in/invalid contact, capability state, in-memory
request identity, temporary persistence failure and retry, identical replay,
conflicting-key rejection, manual-lead mapping, staff source filter, route
mirror parity, and accessibility/no-storage/no-checkout contracts. All
external Turnstile and Supabase calls are mocked; tests never send test
contacts to live providers.

Regression: Build 570 wizard, Build 573 intake, Build 574 responsive booking
and Build 613 guidance. Require GitHub checks at both branches, protected
`main` PR approval rules, successful exact-SHA Cloudflare Pages Production
deployment, and Production acceptance before claiming GREEN. Do not claim
staff acceptance of a *real* inquiry without an owner-authorized live trial.
