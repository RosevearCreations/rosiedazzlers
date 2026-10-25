# Build 654 — Contact & FAQ Help Readiness

The current public sequence has repaired booking discovery, gift-card choices,
gallery browsing and maintenance-interest capture. Build 654 improves the
remaining contact/FAQ self-service paths on `/contact` and `/faq`.

## Customer changes

- Contact visitors can prepare a structured enquiry: topic, vehicle size,
  optional town and short notes. The result is an encoded `mailto:` draft for
  `info@rosiedazzlers.ca`, opened **only** when the visitor selects the link;
  there is no public POST or new data store. The user reviews the email in
  their email application before sending it.
- A live topic/size summary, note character count and clear button improve
  keyboard and narrow-screen usability. Photo-privacy reminders are retained.
- FAQ search reports the number of matching questions, offers a clear-search
  action and an accessible empty state that links to direct contact. FAQ answer
  buttons retain their expanded/collapsed state and static SEO-visible source.
- The displayed FAQ availability shortcut now targets canonical `/book#booking`.
- Contact help navigation is moved inside the primary document container.

## Boundaries and verification

No Supabase, Stripe, pricing, appointment, mail-send, consent, outreach,
recurring billing, booking or payment authority changes. Service water/power
language remains unchanged pending owner verification because existing site
copy and earlier operator instructions differ. The static FAQ source remains
readable if the public FAQ API is unavailable.

`scripts/build654_contact_faq_test.mjs` is wired to the existing Source Gate
booking regression wrapper and verifies byte-identical route pairs, privacy
boundaries and responsive selectors. Also verify production `/contact` and
`/faq` and the CSS/JS assets without actually sending any email.

Promote through protected `dev` and `main` source suites A–D, aggregate
`source checks`, exact-SHA Cloudflare Production acceptance and canonical
live HTTP smoke before declaring Production GREEN.
