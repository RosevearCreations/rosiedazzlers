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
