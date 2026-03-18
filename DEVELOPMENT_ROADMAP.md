# Rosie Dazzlers — Development Roadmap

This is the updated next-build order after recent admin/security/jobsite work.

## Current state
Already built:
- booking + Stripe deposit flow
- gifts purchase flow
- admin booking management
- date/slot block system
- token-based progress flow
- customer signoff
- jobsite intake foundation
- time tracking foundation
- live monitor foundation
- staff management foundation
- customer profiles / tiers foundation

## Next 10 upgrades in order

### 1) Enforce staff roles in APIs
Move from shared admin-password-only logic toward actual checks for Admin vs Senior Detailer vs Detailer.

### 2) Connect jobsite actions to real staff users
Use `staff_user_id` on intake, time entries, progress, and media instead of relying mostly on typed names.

### 3) Add staff login/session layer
Introduce actual staff authentication so phone/tablet field use is realistic.

### 4) Complete gift certificate redemption during booking
Apply gift codes, reduce totals, track remaining value, and close loop with bookings.

### 5) Unify add-on pricing/config
Use one canonical structure for frontend + checkout.

### 6) Add direct file upload from phone
Support signed upload URLs or direct storage integration for progress and intake media.

### 7) Expand live detailer workflow
Wire jobsite page to live note/media posting without needing separate admin-progress use.

### 8) Add override logging in real update flows
When a senior detailer/admin overwrites lower-level data, write to `staff_override_log`.

### 9) Add customer/vehicle history view
Show linked customer profile, prior bookings, tier, and eventually vehicle history.

### 10) Replace weak admin navigation patterns with role-aware internal shell
Create a cleaner admin/detailer app shell optimized for mobile with the right menu for each role.

## Keep avoiding
- breaking working JSON keys
- renaming live asset filenames without audit
- replacing whole files when a smaller additive change is enough
- mixing customer tiers with security roles
