# Build 648 — Admin Workspace Navigation, Search & Staff Login Usability

This build improves the existing authenticated Rosie Dazzlers operator interface.

- Adds a practical, task-first shortcut ribbon to the signed-in dashboard.
- Makes all existing admin cards searchable and filters them into Customer, Operations, Media, Finance and Systems workspaces. Filters act locally on already-rendered route links only; no new API calls, permissions, customer data or writes.
- Gives the large technical diagnostics an accessible, expandable section, allowing the regular dashboard and daily work to stay scannable.
- Improves grid/card overflow, readable controls, focus state and tablet/phone spacing in the existing charcoal-and-gold Standard palette.
- Reskins staff sign-in while preserving AdminAuth sign-in, redirect safety, error/status handling and authentication boundary.
- Keeps clean-route and .html source files byte-identical; runs the focused Build 648 regression in the stable source-gate entry point.

## Acceptance boundaries

Passing static checks does not prove an actual authenticated operator device session. Admin interactions remain behind existing AdminShell and AdminAuth. No payment, pricing, Supabase, staff role, booking, inventory or production data mutation is introduced. Operator acceptance can be performed after production promotion.

Production completion requires dev/main protected source suites A–D and aggregate source checks, Cloudflare exact-SHA success and HTTP availability checks.