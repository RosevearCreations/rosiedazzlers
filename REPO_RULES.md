# Rosie Dazzlers Repo Rules

## 1) Preserve working field names
Do not rename JSON keys, DB columns, or page IDs unless the entire chain is updated and tested.

## 2) Preserve asset paths
Do not casually rename or "clean up" R2 filenames. Exact path matching matters.

## 3) Prefer additive changes
New feature? Add endpoint/page/schema carefully instead of rewriting large working areas.

## 4) One source of truth per concern
- packages/pricing/add-ons should converge toward one canonical source
- roles/permissions should come from staff data, not page assumptions

## 5) Keep customer and admin visibility separate
Anything marked internal must never appear on customer progress pages.

## 6) Customer tiers are not security
`gold`, `silver`, `vip`, etc. are business labels only.

## 7) Shared admin password is temporary architecture
Do not design future work as if shared password is the final security model.

## 8) Token-based progress is the preferred progress system
Do not build new customer-facing progress features on the old simple progress path.

## 9) Jobsite work must remain mobile-friendly
Any new jobsite/detailer workflow should assume phone or tablet use in the field.

## 10) Document new systems when added
If a new subsystem is created, update the main `.md` docs so future chats can follow the architecture.


## Current snapshot — March 21, 2026

Latest pass completed:
- fixed booking add-on checkbox/text layout pressure
- improved service/package image fallback with extra photo cards
- expanded staff management toward richer Admin/Detailer profile editing
- added customer tier discount support in the UI/data model direction
- added/confirmed garage, gift, and redemption visibility in client/admin screens
- added current SQL for tier discounts and richer staff/customer fields

Current next priorities:
- picture-first observation interface
- richer client/detailer threaded comments UI
- manual scheduling / app-management rules UI completion
- final layout polish across booking and internal screens

