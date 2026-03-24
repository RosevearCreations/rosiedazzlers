# Project Brain

Rosie Dazzlers is now structured around three primary user surfaces:
- **Customer**: account, garage, booking history, gifts, progress access
- **Detailer**: profile, work metadata, operational threads, observation workflow
- **Admin**: customer/staff oversight, app policy management, notifications queue, analytics, recovery, and operational catalog management

## Current operational direction
- booking and progress experiences remain the main customer-facing workflows
- jobsite is becoming the true picture-first operations workspace
- policy is moving from static planning docs into saved app settings
- notifications are moving from best-effort hooks into a visible queue that can later be processed/retried/dispatched
- analytics are moving from simple counts into session journeys and abandoned-order recovery

## Immediate focus
- keep refining local-business SEO and page validation
- make analytics and recovery useful in the admin interface
- continue deepening annotation + thread UX
- connect systems/consumables maintenance to real purchasing and reorder decisions


## Current direction update
The app now treats tools, systems, and consumables as a rateable backend-managed catalog with a public read path. Recovery messaging is also becoming a first-class managed setting instead of hard-coded copy.

## Architecture update from this pass
The repo now has a stronger operational layer in three places: provider-aware recovery messaging, moderation-aware two-sided progress threads, and low-stock/reorder tracking for inventory. These additions reduce drift risk by pushing policy into app settings and persistent tables rather than leaving behavior only in screen code.


## March 24 2026 pass update
- Added PayPal deposit checkout flow alongside Stripe.
- Completed booking-time gift redemption through checkout, including zero-due gift confirmation when the deposit is fully covered.
- Switched booking checkout pricing/add-on validation to the canonical public pricing JSON.
- Added annotation moderation endpoint and moderation controls in the jobsite workspace, plus thread visibility summaries in progress management.
- Added per-item quick quantity adjustments and stronger low-stock/reorder handling in Admin Catalog.
- Continued route metadata cleanup across remaining public pages.
