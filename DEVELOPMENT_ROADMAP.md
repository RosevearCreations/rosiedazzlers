<!-- DEVELOPMENT_ROADMAP.md -->

# Rosie Dazzlers — Development Roadmap

This document defines the **next upgrades for the Rosie Dazzlers system in the correct implementation order**.

It is intended to guide both developers and AI assistants so work proceeds logically without breaking existing functionality.

For system overview see:

PROJECT_BRAIN.md  
AI_CONTEXT.md  
SANITY_CHECK.md  
REPO_GUIDE.md  

---

# Current System Status

The Rosie Dazzlers platform already includes:

• Static marketing website  
• Booking system with Stripe deposit checkout  
• Gift certificate purchase system  
• Admin booking management  
• Date and slot blocking system  
• Promo code system  
• Product and gear catalog pages  
• Two progress update systems (simple + token-based)

The system is **functional but still evolving**.

Primary goals of the roadmap:

• stabilize the architecture  
• unify duplicate systems  
• improve admin usability  
• complete customer workflow features  
• maintain serverless simplicity

---

# Upgrade Order (Next 10 Improvements)

## 1) Resolve Duplicate Routes (Stability Fix)

Currently both route styles exist:

services.html  
services/index.html  

pricing.html  
pricing/index.html  

This can create routing ambiguity in Cloudflare Pages.

Required action:

Choose **one canonical structure** and remove duplicates.

Recommended approach:

Use folder routes

/services/index.html  
/pricing/index.html

Then enforce redirects if necessary.

---

## 2) Fix Hover Carousel Image Paths

The hover media defined in `assets/site.js` does not always match the actual R2 filenames.

Example mismatch:

site.js references  
`packages/Exteriordetail.png`

Actual file

`packages/Exterior Detail.png`

Required action:

Align hover media paths with the exact filenames stored in R2.

Correct folder usage:

brand/  
packages/  
products/  
systems/

---

## 3) Unify Add-On Definitions

Add-ons currently exist in multiple places:

assets/config.js  
assets/site.js  
functions/api/checkout.js  
rosie_services_pricing_and_packages.json

This creates a risk of pricing mismatches.

Required action:

Define add-ons in **one canonical source**.

Recommended location:

data/rosie_services_pricing_and_packages.json

Frontend and backend should both read from this.

---

## 4) Clean Up Duplicate Admin Block Endpoints

There are multiple versions of date/slot block logic.

Examples:

admin/block_date.js  
admin/block_slot.js  
admin/unblock_date.js  
admin/unblock_slot.js  

Older block logic may still exist elsewhere.

Required action:

Consolidate to **one clear system** for:

date_blocks  
slot_blocks

Remove legacy endpoints.

---

## 5) Harden Booking Checkout Validation

Improve booking reliability by validating:

vehicle size  
package compatibility  
add-on selections  
promo codes  
slot availability

Validation should occur **before creating the Stripe checkout session**.

Primary file:

functions/api/checkout.js

---

## 6) Complete Gift Certificate Redemption

Currently gift certificates can be purchased but redemption during booking should be fully integrated.

Required features:

validate gift code  
determine remaining value  
apply to booking total  
update remaining balance  
mark certificate as redeemed if fully used

Database table used:

gift_certificates

---

## 7) Finish Token-Based Progress Update System

Two progress systems exist.

Simple system

progress_updates

Token-based system

job_updates  
job_media  
job_signoffs

Recommended long-term system:

Token-based system.

Required tasks:

finish `/api/progress/view`  
finish `/api/progress/signoff`  
generate progress_token for bookings  
remove or archive simple progress system once replacement is complete

---

## 8) Improve Admin Dashboard

The admin dashboard currently links to multiple tools but can be improved.

Desired upgrades:

central dashboard page  
today’s bookings view  
quick status update buttons  
links to progress updates  
links to gift certificates and promo tools

Admin pages involved:

admin.html  
admin-booking.html  
admin-progress.html  
admin-upload.html  
admin-promos.html  

---

## 9) Implement Customer Completion Sign-Off

Allow customers to sign off after a service is completed.

Required functionality:

customer enters name and email  
signoff timestamp recorded  
user agent stored  
optional note field

Database table:

job_signoffs

This feature increases service accountability and professionalism.

---

## 10) Add Field Photo Upload System

Allow technicians to upload photos directly from a phone while working.

Recommended implementation:

generate signed upload URL  
upload image directly to R2 or Supabase Storage  
store media reference in database

Database table:

job_media

This will enable:

before/after photos  
damage documentation  
customer progress updates

---

# Future Enhancements (After the Top 10)

These are valuable but lower priority.

Customer accounts with Supabase Auth  
Vehicle profiles with service history  
Admin scheduling calendar  
Route planning for mobile detailing visits  
Automated reminder emails  
Customer review collection  
Analytics dashboard

---

# Development Philosophy

Maintain the following design principles:

• keep the site mostly static for speed  
• use serverless functions for business logic  
• avoid heavy frameworks unless necessary  
• prefer configuration and JSON over hardcoded values  
• maintain clear separation between frontend and backend logic

---

# Quick Summary

Rosie Dazzlers development priorities are:

1) stabilize routing  
2) fix asset references  
3) unify pricing definitions  
4) clean backend endpoints  
5) strengthen booking validation  
6) finish gift redemption  
7) complete token-based progress system  
8) improve admin usability  
9) implement customer signoff  
10) add field photo uploads

Following this roadmap will transform the system from **functional prototype** into a **fully mature detailing operations platform**.


---

# March 24, 2026 pass update

## Recently moved forward
- recovery-message provider rules and preview/testing foundations
- low-stock/reorder admin workflow foundation
- moderation-aware two-sided progress thread foundation

## Newly advanced
- public catalog connection to DB inventory with JSON fallback
- rated tool/consumable inventory fields and public display support
- recovery templates and rules persistence
- roadmap adjusted to reflect current sequencing

## Move up next
- jobsite moderation controls UI
- gift redemption inside booking totals/checkout
- add-on pricing canonicalization

## Upcoming implementation targets
1. Page-by-page SEO/H1/meta audit
2. Recovery email/SMS templates and flows
3. Deeper thread moderation and annotation tooling
4. Catalog reorder reminders and purchasing workflows
