# Rosie Dazzlers — Autonomous Development Queue

This queue records only current actionable work. Completed implementation history belongs in Git history and archived gate/deployment evidence.

## Accepted synchronized checkpoint

Build 325 — Booking Wizard Responsive UX — is GREEN and closed at exact SHA `7d8b5cb4b85986636a4a70c4bd298f6d7bc51de2`.

At the Build 326 start boundary, both `dev` and `main` were exactly that SHA. The old instruction to keep `main` indefinitely frozen is obsolete. A build is now closed only after the accepted SHA is proven through feature, Development and Production gates and `dev == main` again.

## Active — Build 326

Branch: `build326-booking-retention-rebooking`

Scope: **Booking Completion + Retention/Rebooking Lifecycle**.

The initial retention review exposed a higher-priority checkout boundary defect: Stripe and PayPal checkout success returned to `/complete`, but `/complete` is the token-protected customer job completion/sign-off page. Build 326 therefore repairs payment completion first and then adds a privacy-minimized rebooking path.

### Acceptance checklist

- Keep `/complete?token=...` exclusively for customer job completion/sign-off through `/api/progress/*`.
- Route Stripe/PayPal checkout returns to a dedicated `/booking-confirmed` surface without weakening the existing provider authorities.
- Stripe browser confirmation must verify stored session identity, Stripe metadata booking identity, CAD currency, exact deposit amount and Stripe payment status server-side.
- Stripe browser confirmation must not mark a booking confirmed; the signed Stripe webhook remains settlement authority.
- PayPal return handling must continue through the existing replay-safe `/api/paypal/capture-order` authority before booking confirmation is shown.
- Fully gift-covered checkout must receive a browser confirmation URL only after canonical `/api/checkout` has already returned `gift_only_confirm`.
- Never expose names, emails, phones, street addresses, postal codes, plates, gift codes, booking IDs or payment IDs as rebooking prefill.
- Rebooking may carry forward only low-risk package and vehicle-size choices; date, slot, location, contact details, acknowledgements and payment must be chosen/confirmed again.
- Preserve the Build 324 booking funnel event vocabulary.
- Add `booking_confirmation_view`, `booking_rebook_prompt_view`, `booking_rebook_start` and `booking_rebook_prefill_applied` evidence.
- `booking-confirmed.html` must remain `noindex` and contain one meaningful H1.
- `scripts/booking_completion_retention_check.py` must pass in the cumulative Current Source Gate.
- No Build 326 database migration is introduced.
- Exact feature SHA must pass Current Source Gate and Cloudflare feature deployment/runtime evidence.
- Only then fast-forward `dev` to the identical SHA and require Current Source Gate plus Cloudflare Development Acceptance.
- Only after Development is GREEN may `main` fast-forward to the identical accepted SHA.
- Require exact-SHA `main` Current Source Gate plus Cloudflare Production deployment before calling Build 326 GREEN.
- Finish with `dev == main` on the accepted Build 326 SHA.

## Next sequential scope

Do not number Build 327 until Build 326 is fully GREEN and synchronized. After Build 326 closes, select the next unfinished roadmap slice from the current repository evidence. The broader agreed direction remains retention/booking analytics follow-through, then maintenance/fleet business rules, then payment/Production-readiness depth unless a higher-priority defect is discovered.

## Continuing rule

Never start the next RosieDazzlers build from stale Markdown. First verify current `dev` and `main`, the prior build's exact accepted SHA, source gates and Cloudflare deployment evidence. Database work is never implied by a source promotion; schema changes require their own explicit migration/acceptance boundary.
