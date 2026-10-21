# Build 611 — Operator-Reviewed Rendered Audit Evidence Matrix & Visual Remediation Acceptance

This release creates the owner-maintained, theme-aware **single source of truth for application artwork employees should not replace**. It also adds a redacted rendered-sample review matrix. Neither feature grants customer-media consent or changes existing staff/Admin permissions.

## Permanent design artwork versus employee media

The machine-readable authority is `data/application_static_image_catalog.json`, with a generated human table at `docs/audits/ROSIE_APPLICATION_STATIC_IMAGE_CATALOG.md`.

Every image record has its unique `key` plus numbered `id`, name, format, page/context, size and measurement basis, owner policy, theme, exact file path and file existence. The current **116 records** comprise:

- **62 Standard theme candidates:** site logo/banner/hero, service and package illustrations, process art and **eight town banners**, with 12 previously runtime-only service candidate filenames reconciled into the authority. Most are still proposals; do not label them uploaded or visible.
- **49 checked-in application assets:** JPG/PNG/SVG/ICO placeholders, app icons, logos/graphics, vehicle guides, etc., with actual decoded dimensions where the format allows. Source references and directly identifiable HTML page paths accompany each.
- **Five reserved Admin illustrations:** private-safe, proposed SVG art, not approved or installed.

The catalog deliberately excludes all **617 Photo Studio targets** (they are existing managed media assignments), and **49 proposed proof/review files** previously mixed into the Standard theme manifest. This prevents an apparent permanent theme file from being treated as an automatic replacement for before/after photos, testimonials, customer job evidence, private media, employee-uploaded work photos, etc. Real public-site logo/hero/R2 overrides retain their current precedence. The name “single source of truth” refers to the **owner-maintained static catalog**, not to all existing uploaded/managed media in R2 or Postgres. It is a governance classification; enforcement of staff upload permissions has not been modified.

Generate and verify (no external access required):

```sh
node scripts/build_application_static_image_catalog.mjs --write
node scripts/build_application_static_image_catalog.mjs --check
node scripts/build611_image_catalog_test.mjs
```

The check command is part of CI. When adding artwork later, edit its owner-controlled theme manifest or add the file to the repository, regenerate both outputs, inspect changes and keep code review. Theme-specific files must never overwrite another theme's namespaced files. Dimensions are proposed for unuploaded theme files, actual for decoded local formats, and clearly distinguish scalable SVG viewBox/ICO variants; `data/media_requirements.json` alone governs required R2 upload minima.

## Explicit rendered visual review

Builds 609/610 already accept manually exported, bounded, redacted capture JSON. After an authorized operator actually views the specific public/Admin page and records a decision, Build 611 now accepts a second **local** input file:

```json
{
  "schema": "rosie.operator-visual-review.v1",
  "decisions": [
    {"page":"/admin-media-health","viewportWidth":1280,"viewportHeight":800,
     "operatorRole":"owner","decision":"hold","reasonCode":"pending-evidence"}
  ]
}
```

Run:

```sh
node scripts/accept_rendered_visual_audit_matrix.mjs --reviews approved-local-decisions.json rendered-admin-media-health.json
```

Allowed decisions: `accept-rendered-sample`, `hold`, `remediation-requested`. An accepted sample requires an exact recorded page/viewport, role `owner` or `authorized-admin`, `reasonCode: visual-approved`, no broken/pending/missing-alt/placeholder/SVG-label flags, no truncation and no out-of-recommendation measured Standard artwork. Duplicates, unobserved pages, unexpected review fields and unbounded inputs fail closed. The output lists accepted/held/remediation samples, unresolved exceptions, and Admin pages awaiting an authorized capture; review packets are local only and must not contain customer details. The output **does not** imply verified Cloudflare deployment, full-page/site coverage, R2 minimum compliance, customer media consent or approval to install art.

This build adds acceptance tooling and tests. **No real operator-reviewed screenshots or final image approvals were supplied for this build.** Actual visual remediation requires those later, without inventing evidence or disabling existing protections.

## Release verification

1. Catalog freshness `--check` and Build 611 boundary/geometry/review tests.
2. Retained Build 609/610 and Standard theme regression tests.
3. PR source checks on both branches and exact commit production acceptance after `main` merge.

Next candidate: **Build 612 — Theme-owned image activation contract, Admin approval rules and per-page artwork coverage**, requiring owner-approved artwork before switching any live site-setting or Photo Studio references.
