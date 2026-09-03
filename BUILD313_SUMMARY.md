# Build 313 — Catalog/Product Administration extraction

## Release boundary

Build 313 externalizes the accepted App Management/Product Catalog browser controller without changing pricing, package/add-on business rules, API authority, authentication, schema, business data or Production. The accepted Product/Pricing administration surface is `admin-app.html`; `admin-catalog.html` remains the separate Inventory Operations authority owned by Builds 311–312.

- Accepted final Build 312 Development SHA: `032bd2fab73b6cba4ab48c9db45b828c34c88d70`.
- Build 313 feature branch final SHA: `01198c0c99b86c091a44a3c2118ceb20b2fde8c7`.
- PR #61 merged to pre-documentation Development SHA: `9b253ee3e13ee45fbb35d3d757f9c5c07a205170`.
- Accepted Production/main remains Build 303 at `09442c53d385aca7995150ace4bde55abd51d7df`.
- Build 313 has **no Production promotion authorization**.

## Maintainability extraction

Build 313 moves the mature inline `admin-app.html` controller byte-for-byte into `assets/admin-app-v313.js` and replaces only that exact inline controller with the external versioned script tag.

The extraction preserves:

- `admin-app.html` and `admin-app/index.html` as byte-for-byte synchronized route copies;
- the single shared `pricing_catalog` authority used by booking, services, pricing and checkout;
- packages, add-ons, service areas and public requirements state;
- `/api/admin/app_settings_get` and `/api/admin/app_settings_save` identities;
- existing Product/Pricing save orchestration and page initialization;
- the separate link to `/admin-catalog.html` for Inventory Operations;
- existing authentication/authorization and server authority;
- the existing no-idle-polling behavior.

The Build 313 source guard reconstructs the accepted Build 312 page from the new HTML+asset representation and requires exact equality, so a future structural drift cannot silently change Product/Pricing behavior under the guise of maintainability work.

## Regression authority

Build 313 adds:

- `assets/admin-app-v313.js` — byte-for-byte accepted Build 312 Product/Pricing controller;
- `scripts/build313_release_check.py` — exact extraction/reconstruction, route-copy, Product/Pricing token, no-schema/no-server-change and no-polling guard;
- `scripts/build313_http_smoke.sh` — read-only Development deployment smoke that fetches only the page and versioned controller;
- `.github/workflows/build313-source-gate.yml`;
- `.github/workflows/build313-development-source-gate.yml`;
- `.github/workflows/build313-development-acceptance.yml`.

Retained Build 309, 311 and 312 release guards were made successor-aware only for the exact Build 313 paths. Their existing schema, migration, server/auth and future unknown-path protections remain fail closed.

## Acceptance evidence

Feature/source evidence:

- one-time exact extraction run `33773121703`: **SUCCESS**;
- Build 313 feature Source Gate run `33773450787`: **SUCCESS** on feature SHA `01198c0c99b86c091a44a3c2118ceb20b2fde8c7`;
- PR #61 Build 313 Source Gate run `33773527552`: **SUCCESS**;
- retained Build 312 Source Gate run `33773527680`: **SUCCESS**;
- retained Build 311 Source Gate run `33773527652`: **SUCCESS**;
- retained Build 304 Source Gate run `33773527646`: **SUCCESS**.

On exact merged Development SHA `9b253ee3e13ee45fbb35d3d757f9c5c07a205170`:

- Build 313 Development Source Gate run `33773589749`: **SUCCESS**;
- Build 313 Development Runtime Acceptance run `33773589777`: **SUCCESS**;
- Cloudflare Development Acceptance run `33773589753` / #106: **SUCCESS**;
- Build 301 Development Source Gate run `33773589611`: **SUCCESS**;
- the complete exact-SHA fan-out contained 47 workflow runs and **zero failures**.

## Explicitly unchanged

Build 313 does not change:

- any package, add-on, service-area or public-requirement value;
- pricing rules, booking rules, maintenance rules or checkout policy;
- Product/Catalog API/server authority;
- staff authentication or role/module/action permissions;
- Inventory Operations runtime or Build 312 integrity rules;
- database schema, migrations, RLS, business data or Supabase state;
- payment-provider or external-publishing authority;
- Production source, Production deployment or Production data.

## Closure rule

The Build 313 feature/runtime boundary is GREEN on exact Development SHA `9b253ee3e13ee45fbb35d3d757f9c5c07a205170`. Build 313 becomes the final documentation-synchronized Development boundary after this summary and queue checkpoint merge to `dev` and that exact closeout SHA again passes Build 313 source/runtime, retained historical authorities and Cloudflare Development acceptance.

## Next autonomous build

**Build 314 — Media/Photo Studio reliability:** harden photo-library synchronization, assignment tracking, before/after pairing, deletion safety and Cloudflare subrequest/resource-limit behavior without changing media ownership, privacy, public placement or business policy.
