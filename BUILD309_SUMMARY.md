# Build 309 — Staff Administration maintainability extraction

## Release boundary

Build 309 is a behavior-preserving Staff Administration maintainability release on Development. It externalizes the accepted root Staff Administration browser controller without changing authentication, authorization, role/module/action ceilings, staff-management rules, schema, payroll/business rules, provider behavior, polling behavior or Production.

- Accepted final Build 308 Development SHA: `d14a63c62913edf125a3e2bd8d69f110a6942dad`.
- Build 309 feature branch final SHA: `f6fc9872cfc914074489a3525d4cc2db18c9ad6d`.
- Accepted pre-documentation Build 309 Development SHA: `d579eba52090755cfa5248565e45fdd7358052d3`.
- Accepted Production/main remains Build 303 at `09442c53d385aca7995150ace4bde55abd51d7df`.
- Build 309 has **no Production promotion authorization**.

## Implementation

- `assets/admin-staff-v309.js` now owns the accepted root Staff Administration controller.
- `admin-staff.html` differs from the accepted Build 308 root source only by replacing the inline module with `<script type="module" src="/assets/admin-staff-v309.js"></script>`.
- Existing `MODULE_KEYS` / `ROLE_MODULES` ceilings are preserved.
- Per-profile module narrowing is preserved.
- Administrator accounts remain forced to all internal modules; Build 309 does not broaden or narrow that established rule.
- Existing `/api/admin/staff_list` and `/api/admin/staff_save` orchestration, staff fields, payroll fields and optional legacy password fallback presentation are preserved.
- No idle polling was introduced.
- The pre-existing older `admin-staff/index.html` route remains byte-for-byte unchanged. Build 318 — Whole-application route/API authority sweep owns deliberate route convergence/removal.

## Regression authority

Build 309 adds:

- `scripts/build309_release_check.py` — exact Build 308 root reconstruction, Staff controller authority, unchanged server authorization files, unchanged older folder route, no-schema/no-polling/no-scope-creep checks.
- `scripts/build309_http_smoke.sh` — read-only Development Staff page/asset acceptance; it verifies staff-list/save identities statically and performs no staff mutation.
- `.github/workflows/build309-source-gate.yml` — focused feature source gate.
- `.github/workflows/build309-development-source-gate.yml` — exact Development Build 309 source gate.
- `.github/workflows/build309-development-acceptance.yml` — read-only Development runtime acceptance.

## Historical guard convergence

The final Build 309 fan-out exposed one retained historical checkout issue rather than an application regression:

- PR #52 makes `scripts/build294_release_check.py` shallow-history safe while retaining the exact accepted Build 293 Production ancestry assertion.
- PR #53 allows only that specific Build 294 forward-compatible guard repair inside the Build 309 scope allowlist.
- The ancestry requirement was not weakened; missing history or false ancestry remains fail-closed.

## Pull requests

- PR #51 — Build 309: Staff Administration maintainability extraction.
- PR #52 — Make Build 294 ancestry guard shallow-history safe.
- PR #53 — Allow Build 294 forward-compat guard in Build 309 scope.

## Accepted pre-documentation evidence

All 40 workflows for exact `d579eba52090755cfa5248565e45fdd7358052d3` drained with zero failed, zero queued and zero in-progress runs.

- Build 309 Development Source Gate run `33708957679`: **SUCCESS**.
- Build 309 Development Runtime Acceptance run `33708957648`: **SUCCESS**.
- canonical Development Source Gate run `33708957663`: **SUCCESS**.
- Cloudflare Development Acceptance run `33708957640`: **SUCCESS**.
- exact Cloudflare deployment: `c1473523-7924-4f3c-92e2-da54d8d0e097`.
- exact deployment reached `success`, retained `uses_functions=true`, and passed immutable Development static smoke at `https://c1473523.rosiedazzlers.pages.dev`.
- retained Build 284 contextual-proof immutable smoke passed.
- the mutable `dev` alias passed full static + runtime/API smoke and converged on attempt 1/12.
- retained Build 284 contextual-proof full alias smoke passed.

## Explicitly unchanged

Build 309 does not change:

- staff authentication/session design;
- role/module/action permission policy or role defaults;
- server authorization helpers/endpoints;
- database schema/migrations;
- staff/payroll business policy;
- pricing, booking, accounting or tax authority;
- provider transaction behavior;
- background polling/runtime wake rules;
- Production data or Production source.

## Closure rule

The pre-documentation implementation/evidence boundary is GREEN. Build 309 is fully Development GREEN/CLOSED only after this summary, `AI_PROJECT_HANDOFF.md`, `MASTER_VALUE_ROADMAP.md` and `AUTONOMOUS_RELEASE_QUEUE.md` are merged to `dev` and the documentation-synchronized exact SHA again passes the complete Build 309/cumulative source, read-only runtime and Cloudflare exact-SHA acceptance fan-out with zero failed/queued/in-progress workflows.

## Next autonomous build

**Build 310 — Admin full-access acceptance matrix:** automatically prove that the Admin role can access every enabled module/action while narrower staff profiles remain correctly restricted. Build 310 must test the existing authority; it must not broaden Admin or staff permissions to make the matrix pass.
