# Build 426 — HOLD Inventory & Authority Cleanup

## Purpose

Replace stale launch-era blocker wording with one current, fail-closed Production HOLD inventory. The release keeps external/provider and owner/operator evidence distinct from source/runtime acceptance and removes duplicate authority wording without erasing unresolved dependencies.

## Canonical backlog

`STARTUP_GO_LIVE_BLOCKERS.md` is the single current evidence/HOLD backlog. Other living release documents link to it rather than maintaining competing blocker lists.

Each unresolved item is classified as:

- `provider_dependent` — definitive evidence must come from an external provider outcome;
- `owner_action` — explicit operator/business observation or approval is required;
- `unavailable` — the required evidence cannot currently be established from the authorized evidence source.

A HOLD is closed only by dated, attributable evidence from the named authority. Source/runtime GREEN does not auto-close provider or owner evidence.

## Cleanup boundary

This release may:

- remove stale Build 406/415 launch-era wording from the canonical backlog;
- collapse duplicate blocker descriptions into one canonical row;
- retain completed source/runtime authorities by reference rather than restating their historical checklists;
- update living release pointers to the current backlog and next bounded release.

This release does not authorize schema migration, customer/booking mutation, staff-role change, consent mutation, payment/refund/provider transaction, accounting/inventory posting, secret rotation, DNS change, Production restore, destructive R2 mutation, automatic outreach or permanent polling.

## Acceptance

The exact candidate must pass:

1. focused HOLD inventory authority;
2. Current Source Gate;
3. exact feature-preview acceptance;
4. identical-SHA Development deployment/runtime acceptance after non-force fast-forward to `dev`;
5. protected-main pull-request checks; and
6. independent exact resulting `main` Cloudflare Production deployment/runtime/business acceptance.

Missing provider/owner evidence remains a truthful HOLD and is never converted into success by source acceptance.
