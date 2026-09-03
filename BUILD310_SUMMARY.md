# Build 310 — Admin full-access acceptance matrix

## Release boundary

Build 310 is a proof/acceptance-only Development release. It verifies the existing server-authoritative Admin access model across every canonical module/action while proving narrower non-Admin role ceilings and profile narrowing remain fail-closed. It does not broaden permissions or change application business behavior.

- Accepted final Build 309 Development SHA: `1eea3569da3ea402eb3cd7cedb1f107194265c71`.
- Build 310 feature final SHA: `d4fbdd8843d8bb9e476c984ec9a614452fc8843e`.
- Accepted pre-documentation Build 310 Development SHA: `c7db8fed785851f167167e8c1a1ca9d43066ab5e`.
- Accepted Production/main remains Build 303 at `09442c53d385aca7995150ace4bde55abd51d7df`.
- Build 310 has **no Production promotion authorization**.

## Proven authority

Build 310 proves the current authorization implementation rather than redesigning it:

- seven canonical internal modules remain `detailer`, `operations`, `admin`, `it`, `finance`, `daip`, and `socials`;
- the canonical registry contains 28 actions across those seven modules;
- Admin accepts every registered action even when a deliberately narrowed profile is supplied;
- legacy Admin fallback retains the same full-action bridge where that existing compatibility path applies;
- every non-Admin role remains bounded by its existing hard role ceiling;
- per-profile module/action settings may narrow non-Admin authority but cannot expand it past the role ceiling;
- unknown action keys fail closed;
- Staff Administration UI module controls, client-side forced-Admin presentation, staff-save normalization, server-side role ceiling, and action registry agree.

## Regression authority

Build 310 adds only proof/acceptance assets:

- `scripts/build310_admin_full_access_test.mjs` — exhaustive seven-module / 28-action authorization matrix plus Staff UI/save/auth source agreement.
- `scripts/build310_http_smoke.sh` — read-only Development Staff Administration smoke; its API probe is credential-free and must be denied before any business mutation.
- `.github/workflows/build310-source-gate.yml` — focused Build 310 proof gate with a changed-files boundary that rejects runtime/business source changes.
- `.github/workflows/build310-development-acceptance.yml` — Development matrix plus deployed read-only smoke.

## Accepted pre-documentation evidence

- Build 310 Source Gate run `33759860596` / #2: **SUCCESS** on exact feature SHA `d4fbdd8843d8bb9e476c984ec9a614452fc8843e`.
- PR #55 merged Build 310 into `dev`.
- exact pre-documentation Development SHA: `c7db8fed785851f167167e8c1a1ca9d43066ab5e`.
- Build 310 Development Runtime Acceptance run `33759971667`: **SUCCESS** on that exact Development SHA.
- Cloudflare Development Acceptance run `33759971634` / #100: **SUCCESS** on that same SHA.
- Cloudflare acceptance retained exact Development=`dev`, Production=`main`, immutable deployment smoke, mutable alias convergence, and the no-Production-mutation boundary.

## Explicitly unchanged

Build 310 does not change:

- role/module/action policy or role defaults;
- Admin or staff permissions;
- staff authentication/session design;
- database schema/migrations;
- pricing, booking, inventory, accounting, tax or payroll business rules;
- payment-provider transaction behavior;
- external publishing/delivery authority;
- background polling/runtime wake rules;
- Production data or Production source.

## Closure rule

The implementation/evidence boundary is GREEN on exact Development SHA `c7db8fed785851f167167e8c1a1ca9d43066ab5e`. Build 310 becomes the final documentation-synchronized Development boundary after this summary and the living release authorities are merged to `dev` and that exact documentation SHA again passes cumulative source/runtime/Cloudflare Development acceptance.

## Next autonomous build

**Build 311 — Inventory Operations maintainability extraction:** modularize inventory, supplies, tools, consumption, reorder and kit administration without changing stock/accounting rules. Build 311 is structural/maintainability work only unless an existing deterministic defect is proven. Build 312 owns the subsequent inventory data-integrity sweep.
