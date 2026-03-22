# Current Implementation State

## Completed in this pass
- Booking page add-on row layout corrected and preserved.
- Admin app-management screen now persists settings instead of staying planning-only.
- Admin notifications queue screen added.
- Internal navigation and dashboard updated for notification review.
- Progress/jobsite flow continues to center around picture-first observations and threaded updates.

## Customer screen now centers on
- profile, preferred contact, email, phone, SMS
- home + alternate address
- notification preferences
- live updates / billing profile toggle
- customer-only notes, detailer-visible notes, admin-only notes
- garage vehicles with per-vehicle contact details and billing label
- booking history, tier visibility, gift certificates, redemption history

## Detailer/Admin screen now centers on
- address/contact profile
- emergency contact
- work hours / payroll metadata
- vehicle info
- detailer level and admin level
- supervisor, permissions profile
- admin-only note zones
- recent assignments + tip payout history placeholders

## Admin management screen now centers on
- role/visibility matrix
- blocking time as Admin-only
- manual scheduling authority settings
- feature flags for live updates, chat, picture-first observations, and tier badges

## Notifications now cover
- queued comment / progress / media hooks
- recipient email/phone visibility
- queue status, attempts, last error, processed timestamp

## Still next
- richer image annotation tools inside the observation workflow
- stronger two-sided thread UI polish for customers and detailers
- real dispatch workers for queued notification events
- more persistence across admin policy controls and role-specific enforcement
