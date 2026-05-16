# Project Brain — Build 143

Rosie Dazzlers is moving from a brochure site into an operations app. Keep the customer-facing site simple, local, and crawlable while moving editable business rules into Admin App and Supabase.

## Build 143 principle

Partial DB migration must never make the public site look empty. If only two consumables are saved in Supabase, the public Consumables page must still show the full bundled fallback catalog until the full import is complete.

## Current source-of-truth pattern

- Supabase/app settings are preferred for edited records.
- JSON remains the fallback source.
- Public pages should merge the two during migration.
- DB rows override matching fallback rows.
- Fallback rows stay visible until intentionally retired.

## Keep doing

- Local SEO wording on titles/H1s.
- One clear H1 per exposed page.
- Robust fallbacks for public pages.
- Fresh Markdown/schema notes every pass.
- Release scripts that catch regressions.
