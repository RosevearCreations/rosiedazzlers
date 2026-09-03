# Build 308 — Cloudflare Deployment / Recovery Consolidation

**Development status:** technically accepted before documentation synchronization  
**Accepted pre-documentation Development SHA:** `5147b13f07d6eeef29162c69c4f46b76722956f7`  
**Production/main:** unchanged at accepted Build 303 `09442c53d385aca7995150ace4bde55abd51d7df`  
**Production promotion authority:** none

## Scope closed

Build 308 consolidates Rosie Dazzlers Development deployment acceptance and recovery mechanics around one canonical Cloudflare Pages helper while preserving the exact-SHA, Functions, immutable-deployment, mutable-alias, rollback and Production-isolation authority established by earlier releases.

Normal Development acceptance is deliberately read-only. Recovery is no longer an automatic push-triggered repair path: it is manual-only, defaults to observation, and a repair requires the operator to select `repair` and confirm the exact current `dev` SHA before any preview-deployment deletion/recreation mechanic can run.

Build 308 changes no application business logic, schema/database authority, pricing, booking, Finance/accounting/tax policy, staff authorization model, provider transaction behavior or Production data.

## Implementation authority

- `scripts/cloudflare_pages_development.sh` is the canonical Development Cloudflare Pages acceptance/recovery helper.
- `.github/workflows/cloudflare-development-acceptance.yml` delegates normal exact-SHA Development acceptance to the canonical helper instead of carrying a second inline implementation.
- the Cloudflare recovery workflow is `workflow_dispatch` only, defaults to `observe`, and requires exact current-`dev` SHA confirmation before `repair` can mutate a non-terminal Development preview.
- normal acceptance contains no deployment DELETE/recreate operation.
- exact-SHA deployment success remains mandatory.
- Cloudflare deployment detail must retain the expected Development branch/SHA and `uses_functions=true`.
- immutable deployment static smoke remains mandatory before mutable Development-alias acceptance.
- Development alias convergence remains bounded and the full runtime/API smoke still executes only against the mutable alias.
- Production branch/deployment targets remain outside recovery and fail closed.
- recovery DELETE/recreate mechanics exist only in the canonical helper.

## Cloudflare metadata consistency repair

Build 308 exposed a real Cloudflare propagation race during exact Development acceptance: the deployment-list endpoint could report the exact SHA as successful while the deployment-detail endpoint briefly still reported `active` for the same deployment ID.

The canonical helper now performs a bounded same-deployment-ID detail-metadata consistency retry after exact list-side success. It does not relax identity or terminal-state safety:

- wrong SHA or branch still fails immediately;
- a terminal failed/cancelled state still fails immediately;
- the retry is bounded to the same deployment ID;
- `uses_functions=true`, immutable smoke, alias convergence and Production isolation remain mandatory.

## Historical guard convergence

Consolidation relocated executable Cloudflare/smoke mechanics that several retained historical guards had previously located directly inside workflow YAML. Those guards were repaired forward-compatibly rather than weakened:

- Build 274 retains its I.T. Connections evidence marker.
- Build 275 retains its exact historical static/full smoke evidence while executable smoke remains centralized.
- Build 276 retains exact-SHA success and Production-boundary authority while following the canonical helper.
- Build 281 retains successful exact SHA, `uses_functions=true`, immutable smoke and bounded Development-alias convergence while following the canonical helper.
- Build 283/284 compatibility evidence remains explicit.
- Build 308's own release guard protects these successor-aware markers so future release-tooling refactors cannot silently discard them.

## Validation evidence

The exact pre-documentation Development candidate is `5147b13f07d6eeef29162c69c4f46b76722956f7`.

On that exact SHA:

- Build 308 Development Runtime Acceptance run `33704055168`: **SUCCESS**.
- Build 308 Development Source Gate run `33704055304`: **SUCCESS**.
- canonical Development Source Gate run `33704055243`: **SUCCESS**.
- Cloudflare Development Acceptance run `33704055178`: **SUCCESS**.
- exact Cloudflare deployment: `3fd42f73-1053-4cfd-8919-4ba94a6ddc62`.
- the exact deployment moved from `active` on attempt 1/24 to `success` on attempt 2/24.
- deployment-detail metadata for the same deployment ID was `success` on consistency attempt 1/12.
- the exact immutable deployment passed Development static HTTP smoke at `https://3fd42f73.rosiedazzlers.pages.dev`.
- the exact immutable deployment passed retained Build 284 contextual-proof static smoke.
- the mutable `dev` alias passed the full Development runtime/API smoke and converged on attempt 1/12.
- the mutable `dev` alias passed retained Build 284 contextual-proof full smoke.
- the canonical helper completed with `Cloudflare Development exact-SHA acceptance: PASS`.
- the exact-SHA workflow fan-out drained with zero failed, queued and in-progress runs before documentation synchronization.

## Boundaries retained

Build 308 introduces no schema/database migration, pricing/booking change, Finance/accounting/tax judgment, payment/refund/settlement/provider transaction, role/action permission change, external delivery/publishing proof or Production mutation.

Production `main` remains accepted Build 303 at `09442c53d385aca7995150ace4bde55abd51d7df`. **Do not move `main` for Build 308.**

## Final closure requirement

Build 308 is not fully closed until this summary, `AI_PROJECT_HANDOFF.md`, `MASTER_VALUE_ROADMAP.md` and `AUTONOMOUS_RELEASE_QUEUE.md` are synchronized on `dev` and the documentation-synchronized exact SHA passes the same Build 308 source/runtime, canonical Development source and Cloudflare exact-SHA acceptance with no remaining failed/queued/in-progress workflows relevant to that SHA.

## Next autonomous build

**Build 309 — Staff Administration maintainability extraction.** Externalize the accepted staff/profile/account administration browser runtime while preserving authentication, role/module/action authority and current staff-management behavior exactly. Build 309 must not broaden Admin or staff permissions; the exhaustive Admin full-access acceptance matrix remains Build 310.