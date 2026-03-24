# Current Implementation State

## Completed in this pass
- Added Admin analytics journey and abandoned-order review.
- Added abandoned recovery queue flow through notification events.
- Added catalog management for systems and consumables through a real admin screen.
- Strengthened notification dispatch/retry handling with provider webhook support.
- Expanded site-side SEO foundation with canonical, keywords, and JSON-LD support.

## Admin analytics now centers on
- top pages
- top countries
- top referrers
- session journeys
- abandoned orders
- recovery queue actions

## Catalog management now centers on
- systems vs consumables
- sort order / backend reordering
- quantity on hand
- reorder level
- unit cost / notes
- active/inactive state

## SEO/site validation direction now includes
- canonical tags
- keyword meta support
- structured data for local mobile detailing
- cleaner H1/title/description alignment on core public pages


## Latest pass
- Connected public gear/consumables pages to database-backed catalog items via a public read endpoint.
- Added ratings and richer inventory fields for tools/systems/consumables.
- Added recovery template/rule editing to App Management.
- Updated schema snapshot and migration set to include catalog ratings and recovery settings.
