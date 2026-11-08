# Rosie Dazzlers Build 810 — Customer appointment preparation

## What the customer sees

1. Sign in to **My Account**. Once the same verified customer dashboard and private request history load, open **Get ready for Rosie’s arrival**.
2. Choose an upcoming, open appointment with a valid recorded date. Closed, completed, in-progress, past and invalid bookings are excluded.
3. Read the recorded date and appointment slot. Unconfirmed or pending-change visits explicitly require Rosie’s confirmation. This is not a live arrival estimate.
4. Review the six worksite items: safe parking, building and local rules, water/power *arrangements*, vehicle and valuables, special condition notes, and contact/weather plan.
5. Check items as a **personal on-screen guide**. Checkmarks are kept only in page memory (per signed-in account, per appointment), are never written to the database, and reset on leaving/reloading the page.
6. Optionally copy a short non-sensitive preparation note and manually send it to Rosie via **Contact**. Clipboard failure provides a select-and-copy fallback. Nothing is sent automatically.

## Canonical operational policy

The current `data/site_policies.json` and `assets/site-policies.js` explicitly state Rosie brings standard water and power. The page **does not require the customer to supply either**. It asks about safe parking, access constraints, runoff, condo rules and other special restrictions. No promise of a particular arrival ETA, guaranteed service, refund, extra work, photo permission or automatic notification is made.

## Security and release boundaries

- Reuses the verified customer dashboard + history; no new API, permission, RLS policy, migration, server-side acknowledgment, or Comms Hub integration state.
- UI escapes dynamic booking content; customer identifiers, contact details and addresses are omitted from any copied note.
- Failures loading private history and invalid/changed customer sessions clear appointment/checklist content. No localStorage/sessionStorage.
- No booking, availability, payment, quote, consent or messaging writes.
- Both `/my-account` and `/my-account.html` use identical markup.

## Owner acceptance checklist

- [ ] On a phone, sign in and select an upcoming confirmed appointment.
- [ ] Verify original date/slot, condition and arrival expectations, and responsive six-item checklist.
- [ ] Check items, switch appointments and return; each has its own in-page progress.
- [ ] Test an unconfirmed or pending-reschedule appointment; the page does not claim an arrival slot is final.
- [ ] Check no visit appears for past, cancelled, completed, or in-progress jobs.
- [ ] Verify current Rosie water/power and condo/runoff policy wording.
- [ ] Copy a note or use the manual copy fallback; no automatic communication should be sent.
- [ ] Sign out, refresh or encounter failed history: no previously viewed appointment or checklist remains exposed.

## Verification

`node scripts/build810_customer_visit_preparation_test.mjs`, `bash scripts/current_booking_wizard_regression.sh` and `python3 scripts/release_check.py`.
