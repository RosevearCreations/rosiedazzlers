# Rosie Dazzlers 869 — Roadside Quick Capture, Image Compression, Canonical Booking Handoff and Private Quota

**Purpose:** While detailing a car or when approached unexpectedly, staff can capture condition photos in seconds and preserve a private temporary request. Admin can subsequently complete a contact-approved estimate, conduct the **existing** booking checkout with the customer, collect a deposit through the existing payment process, and explicitly link the resulting real booking to the media intake.

## Fast field workflow

1. Sign in as staff with `manage_bookings`. Open `/admin-booking.html` (or `/admin-booking/`). The camera controls now appear **above** the banner and booking management tools, with the advanced contact panel initially collapsed.
2. Confirm the person agreed to vehicle-condition photos/video for a **private** quote, not advertising or public sharing. Tap **Take Photo(s)**, **Take Video**, or **Choose from Device**. If not yet checked, a short confirmation prompt is displayed. The first selected file creates a durable `RD-TMP-YYYYMMDD-XXXXXXXX` label and permanent UUID **before** upload, so the request itself survives upload failure.
3. Browser JPEG/PNG/WebP/other decodable images are reduced toward a maximum 1,800px edge and JPEG quality 78%, only when the resulting file is smaller. Unsupported formats such as unrecognized HEIC retain the original. Videos remain original (max 40 MiB each); do not make lengthy recordings during work. Capture no more than eight private files per request.
4. Rename, add brief condition notes, and save later. A staff-only request list and local tab resume ID reopen the same private Supabase draft; no customer media is placed in public object storage or browser-local persistent file copies.
5. Expand **Quick customer quote & booking handoff**. With explicit customer permission to retain contact details, add name/phone/email and a CAD **indicative estimate**. Save it privately. Contact data never travels in a booking URL.
6. If the person wishes to proceed, open **secure booking & deposit checkout**, fill the ordinary booking journey and obtain the customer's acknowledgements. The canonical checkout determines current package prices, exact slot/capacity, geographic availability, promo rules, terms and payment. The draft's indicative quote does **not** override prices and never charges or confirms a booking.
7. When a real booking UUID exists, return to the staff intake and explicitly **link existing booking**. The server requires the exact booking record, non-cancelled status, a quoted/consented draft, and case-insensitive customer email match. One real booking may be linked to only one intake. This linking step does **not** certify any deposit; payment status requires normal Stripe/PayPal verified settlement evidence.

## Data architecture and privacy

All new media stays on the **existing original RosieDazzlers Supabase** project in the non-public `rosie-intake-private` bucket, using signed-upload and 120-second private preview links. No Cloudflare R2 migration or second provider credentials are necessary now.

The original v869 migration augments existing staff-only v868 intake records with optional consent-approved contact, indicative CAD quote, actual linked booking ID and actor/date. The existing restrictive v868 RLS and service-role-only grants continue to apply. Service-only SQL functions:

- `rosie869_storage_meter`: reports total reserved/confirmed/pending bytes and counts (metadata estimate, **not** Supabase billing usage).
- `rosie869_reserve_media`: advisory-lock atomic reservation, original private-photo permission check, 8-file cap, exact object path/MIME/size, and a bucket-wide configurable budget. Default **900 MiB internal pilot cap**; server-only `ROSIE_PRIVATE_MEDIA_BUDGET_BYTES` may adjust within 100 MiB–10 GiB. Pending media reservations count until manually resolved; the workflow never deletes raw images on its own. UI warns at 80% and SQL blocks at the cap. This prevents free-plan consumption from silently growing.
- `rosie869_link_existing_booking`: explicit atomic source match; checks quoted/consented unlinked draft and actual booking customer email, then stores the link. Does **not** mutate real booking totals, Stripe/PayPal state, availability, or payment records.

**Safeguards:** No silent capture consent, no automated marketing permission, no public URLs, no browser-side service keys, no auto-charge, no fraudulent paid status, no automatic release of pending upload bytes. The customer may always choose to complete a normal booking without linking their initial photos. Pricing differences between estimate and canonical checkout must be discussed with the customer.

## Deployment verification

Original Supabase migration: `supabase/migrations/20261113000200_build869_quick_quote_media_budget.sql`. Apply to original RosieDazzlers project, verify no public/anonymous/authenticated table or function privileges and the bucket is non-public.

Regression: `node scripts/build869_roadside_quick_quote_test.mjs`, `bash scripts/current_jobday_custody_regression.sh` (850–869), existing build 868 tests, source gate, four production business acceptance suites and combined gate, dev/main protected PR checks, exact-SHA Cloudflare deployment and live release-health GREEN.

**What Build 869 does not do:** instant SMS/email quote dispatch, auto-convert into an appointment, charge a deposit directly inside the intake draft, assert that a deposit was received without provider evidence, or change underlying Master HOLD. These belong to separate explicit provider/consent-authorized workflows.

**Next proposed Build 870:** Consent-Safe Roadside Quote Share/Customer Approval, One-Link Prefill of Canonical Booking and Verified Deposit Return to Intake (only after payment-provider evidence).
