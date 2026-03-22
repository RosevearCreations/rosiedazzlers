# Rosie Dazzlers — Current Implementation State

Use this file as the quick “where are we right now?” snapshot for the `dev` branch.

---

## Branch status

Current active development branch:

- `dev`

Do not assume `main` is current.

---

## Implemented enough to build on

### Customer-facing foundation
- static marketing/site pages
- booking form flow
- Stripe deposit checkout
- gift certificate purchase flow
- token-based customer progress page
- customer signoff foundation
- R2-served media/assets

### Booking operations foundation
- booking save/update patterns
- booking detail/read patterns
- booking search/list patterns
- booking confirm / complete / cancel / delete patterns
- booking availability/day-schedule support
- assignment support

### Scheduling / capacity foundation
- date blocks
- slot blocks
- AM / PM slot logic
- full-day usage across both slots

### Progress / job delivery foundation
- progress enable
- progress detail/list patterns
- progress delete pattern
- media save/list/delete patterns
- signoff save/list/delete patterns

### Jobsite foundation
- jobsite intake save/list/detail/delete
- job time save/list/delete
- combined jobsite detail pattern

### Admin operations foundation
- dashboard summary pattern
- live list pattern
- booking form bootstrap pattern
- staff assignable list pattern

### Staff admin foundation
- current actor endpoint
- staff list/detail/save
- active toggle
- override log list

### Customer admin foundation
- customer list/detail/save/delete
- customer tier list/save/delete

### Promo admin foundation
- promo list/detail/save
- promo active toggle
- promo delete

---

## Implemented but still bridge/transitional

### Security/access
- shared `ADMIN_PASSWORD` bridge still exists
- role-aware backend direction is in place
- real staff login/session is still not finished

### Staff identity handling
- structured staff/user linkage exists in direction and endpoints
- some flows may still rely on typed names or bridge-style identity input

### Progress direction
- token-based model is preferred
- older/simple progress patterns may still exist in the repo

### Admin UI structure
- admin pages exist
- role-aware internal shell/app experience is still not finished

---

## Partially implemented / still in progress

### Gift redemption during booking
Still needs full booking-time application flow:
- validate code
- apply remaining balance
- update certificate state

### Direct media upload from phone
Still needs:
- signed upload URL flow or direct storage integration
- field-friendly upload UX
- tighter save flow into `job_media`

### Add-on canonical source
Still needs one true shared source between:
- frontend display
- frontend selection
- backend validation
- checkout/pricing

### Endpoint cleanup / consolidation
Still needs review of:
- legacy routes
- duplicate admin patterns
- older shared-password-only paths

---

## Not implemented enough yet to call finished

### Real staff auth/session
Needs:
- actual staff authentication
- session persistence
- frontend actor/session loading
- less reliance on manual headers

### Full role-aware internal shell
Needs:
- shared internal layout
- role-aware menus
- smoother mobile workflow
- cleaner admin/detailer navigation

### Deeper customer/vehicle history
Needs:
- stronger booking history connection
- future vehicle profile/history model
- more operational customer memory

---

## Key rules that must remain true

### 1) Customer tiers are not security roles
Customer tiers are:
- business segmentation
- loyalty/grouping
- customer admin context

Customer tiers are not:
- admin permissions
- staff access levels

### 2) Token-based progress is preferred
Long-term customer progress should center on:
- `progress_token`
- `job_updates`
- `job_media`
- `job_signoffs`

### 3) Additive changes are safer than destructive rewrites
Prefer:
- small controlled updates
- preserving working paths
- avoiding unnecessary renames

### 4) `dev` branch is the working source of truth
Judge current implementation against `dev`, not `main`.

---

## Best next development sequence

1. real staff login/session
2. consistent real staff identity across jobsite actions
3. gift redemption during booking
4. unified add-on source
5. direct upload flow
6. role-aware internal shell
7. cleanup of old/duplicate endpoint patterns

---

## One-line summary

The `dev` branch already has a strong operations/backend foundation, but the next phase should focus on **auth, workflow consistency, uploads, pricing unification, and cleanup** rather than just adding more isolated pieces.

### Client account foundation
- client sign-up/login/logout endpoints exist
- client account page exists
- top nav can show who is signed in for staff or client users
- richer customer/staff profile fields require the latest SQL migration


## Latest additions
- Staff sessions now fall back safely when the dedicated session secret env var is not set.
- Client dashboard now includes booking history, gift certificates, redemption history, and direct progress links.
- Customer profiles now support notification preferences and detailer chat opt-in.
- Progress pages now support signed-in client replies visible to detailers and admins.


## Latest auth/progress/gift pass
- Added actual gift redemption writes through booking confirmation webhook using `gift_certificate_redemptions`.
- Added staff/detailer observation-thread posting through `progress_comments`.
- Added notification queue hooks through `notification_events` for customer email/SMS preference flows.
- Added richer customer/staff profile field direction and a current schema snapshot in `DATABASE_STRUCTURE_CURRENT.md`.


## March 2026 additions

- Client garage foundation added through `customer_vehicles` plus new client vehicle APIs.
- Observation-thread UI foundation added on the jobsite screen using `progress_comments`.
- Gift redemption history is now surfaced in the client dashboard and customer detail direction.
- Richer customer/staff fields now include alternate service address, preferred contact/SMS, admin level, supervisor, pay schedule, hourly rate, and tips history support.
- Layout cleanup pass added shared form-grid / check-grid helpers to reduce overlapping boxes and misaligned checkboxes.


## Additional current-state notes

- `/admin-staff` unauthorized issues caused by session resolution mismatch were addressed in the shared staff auth helper.
- `/admin-app` now exists as a live planning/control screen for role splits and future feature switches.
- Admin customer detail now exposes vehicles, gift certificates, and redemption history in the UI.
- Next schema pass includes customer-vehicle contact fields, admin/detailer private notes, detailer level/pay metadata, and app-management settings.
