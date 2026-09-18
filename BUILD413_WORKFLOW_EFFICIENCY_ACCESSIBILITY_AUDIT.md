# Build 413 — Admin / Detailer / Customer Workflow Efficiency & Accessibility Audit

Build 413 audits and hardens three high-frequency Rosie Dazzlers workflows without creating a new state authority:

- Admin: Today Operations Cockpit;
- Detailer: assigned-job mobile workspace;
- Customer: My Account profile/vehicle/gift/review workflow.

The release is schema-neutral. There is no schema migration, provider mutation, payment mutation, destructive R2 action or new background polling.

## Evidence classes

Build 413 separates evidence rather than treating source inspection as a visual browser pass.

- **source-proven** — HTML/JavaScript/CSS contracts are directly validated by the focused authority.
- **runtime-proven** — the normal exact-SHA Development/Production Cloudflare deployment/runtime authorities prove that the accepted source is the deployed runtime.
- **unavailable** — independent authenticated visual browser proof remains unavailable unless a representative logged-in browser session is directly observed.

A source-proven responsive contract is not relabeled as independent authenticated visual browser proof.

## Representative phone / tablet / desktop contract

The retained Build 397 responsive baseline remains active across the three target surfaces. It provides the current phone/tablet/desktop source contract through responsive breakpoints, minimum touch targets, 16px form controls, bounded dialogs/tables and reduced-motion handling.

Build 413 specifically verifies that the three target pages retain viewport metadata and the shared site stylesheet. This is source-proven responsive evidence. Independent authenticated visual browser proof remains **unavailable** unless separately observed.

## Keyboard and focus

The retained Build 376 accessibility baseline continues to provide `:focus-visible`, reduced-motion and forced-colors behavior.

Build 413 adds workflow-specific focus behavior:

- Admin task-title validation marks the field invalid and returns focus to it.
- Customer gift-code validation marks the field invalid and returns focus to it.
- Detailer, Admin and Customer blocking errors use assertive alert semantics and focus the status surface without forcing a scroll jump.
- Native buttons remain keyboard-operable; Detailer workflow actions are explicitly `type="button"`.

## Loading, error, empty and retry clarity

### Admin

The attention summary and urgent/normal lists expose `aria-busy` while the queue loads. Refresh is disabled while in flight and its label changes to **Refreshing…**. Duplicate refresh and duplicate owner-task creation are blocked. Loading/errors are announced in a live status region. The error state instructs the operator to retry manually.

Owner-task controls now have explicit visible labels rather than placeholder-only naming.

### Detailer

The assigned-job region exposes `aria-busy`; both desktop and mobile refresh controls are disabled during the one bounded refresh. Duplicate refresh requests are ignored while one is active. Error status becomes an assertive alert and explains that no automatic retry was started.

The no-jobs empty state remains explicit, and no recurring job polling is introduced.

### Customer

My Account makes account, vehicle, gift-code and review forms explicitly busy while their request is in flight. Submit controls are disabled and labelled with the current action. Repeated submit attempts are ignored until the request settles.

Network/API errors are caught and announced instead of leaving an unhandled promise. Gift-code empty validation focuses the invalid field. Account-wide failure status is a polite status for normal progress and an assertive alert for blocking failures.

## Interaction cost

The changes reduce accidental repeat work rather than adding new steps:

- one refresh request at a time;
- one form mutation at a time;
- explicit busy labels instead of uncertain repeated clicks;
- direct focus to the field that needs correction;
- no automatic retry loops;
- no new confirmation step for ordinary save/refresh paths.

Existing destructive or lifecycle-sensitive confirmation boundaries are not weakened.

## Role/capability boundary

Build 413 does not widen access.

- Detailer still requires the canonical `detailer` module capability through the shared resolver.
- Admin Today retains the protected `admin-today` AdminShell page key and existing staff authorization.
- My Account continues using authenticated client endpoints and customer credentials.

Accessibility improvements do not create an authorization bypass or alternate business-state authority.

## Acceptance

Build 413 may be source GREEN when the focused authority proves the interaction/accessibility contracts and all retained release checks stay GREEN.

Development and Production still require exact-SHA Cloudflare deployment/runtime acceptance. Independent authenticated visual browser proof is retained as **unavailable** unless separately observed; it is never invented from CSS/source checks alone.
