# Build 448 — Authenticated Cross-Device Acceptance Refresh

## Purpose
Renew the existing authenticated Customer and staff phone/tablet/desktop acceptance evidence for the current release without creating a second device-acceptance system.

Build 448 extends the retained Build 438 `authenticated_device_visual_acceptance` classifier. Source responsive/accessibility checks remain supporting evidence only and never substitute for direct authenticated observation.

## Owning evidence
- `BUILD438_AUTHENTICATED_DEVICE_VISUAL_ACCEPTANCE.md` remains the device/visual evidence authority.
- `BUILD419_CUSTOMER_STAFF_PRODUCTION_WORKFLOW_EVIDENCE.md` remains the role/workflow authority.
- `STARTUP_GO_LIVE_BLOCKERS.md` remains the single canonical HOLD inventory.

The existing read-only endpoint remains:
`/api/admin/authenticated_device_visual_acceptance`

Build 448 adds current-release refresh metadata to that same authority rather than creating a parallel endpoint.

## Current-observation rule
A role observation can satisfy the current refresh only when all retained Build 438 evidence is present:
- verified retained workflow evidence;
- authenticated/signed-in session evidence;
- explicit phone/tablet/desktop device class;
- browser evidence;
- safe internal route;
- viewport/width evidence;
- usable/successful outcome; and
- a valid dated `verified_at` timestamp.

The observation must also be no older than the bounded **30-day freshness window** at evaluation time.

Evidence older than the freshness window remains visible as a historical observation but is classified stale and cannot satisfy current-release acceptance.

## Cross-device rule
A closure candidate requires all four retained role observations (Customer, Detailer, Operations, Admin) to be current and representative **phone, tablet and desktop** coverage to be current.

Stale, missing, undated or unavailable evidence remains `owner_action` or `unavailable`.

## Safe output boundary
The existing endpoint may expose only safe role/device classifications, timestamps, age, freshness, bounded viewport widths, browser/device classes and sanitized internal route paths.

It must not expose evidence-note contents, customer identity, booking identifiers, addresses, credentials, cookies, tokens, provider secrets or protected page contents.

## Canonical HOLD boundary
A runtime `closure_candidate` never edits or closes the **Independent device / visual evidence** HOLD automatically. Explicit operator review remains required.

## Mutation boundary
Build 448 performs no customer/booking mutation, staff role/capability widening, provider/payment/refund/message transaction, accounting/inventory posting, schema migration, screenshot capture/polling, destructive storage action, automatic outreach or permanent polling.

## Acceptance
The exact candidate must pass focused Authenticated Cross-Device Acceptance Refresh authority, retained Build 438 and Build 419 authorities, responsive/accessibility supporting authorities, Current Source Gate, exact feature-preview acceptance, exact Development deployment/runtime acceptance, protected-main PR checks and independent exact resulting-`main` Production deployment/runtime/business acceptance.

Missing or stale real-device evidence remains a truthful HOLD even when source/runtime checks are GREEN.

## Next bounded release
**Build 449 — Fleet & Maintenance Commercial Decision Closure** begins only after Build 448 is independently GREEN on protected `main`.
