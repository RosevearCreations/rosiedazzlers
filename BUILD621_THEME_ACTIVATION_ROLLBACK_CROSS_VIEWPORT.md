# Build 621 — Theme Activation, Rollback & Cross-Viewport Acceptance

Build 621 introduces an owner-only, **review-held** activation and rollback
workflow at `/admin-theme-release.html`. It does **not** authorize or execute a
live theme change. Standard remains the only approved public theme.

## Workflow

1. Review a versioned local candidate in Build 620; export its non-activating
   JSON receipt with an acknowledged review.
2. Owner imports the receipt into the Build 621 page. The operator must verify
   all 20 public/Admin viewport combinations: 360px, 390px, 768px, 1280px
   against homepage, services, booking, Admin dashboard and theme manager.
3. Separately confirm static licensing and managed/R2/customer image consent.
   Check an explicit owner release *request* authorization.
4. Export the versioned activation review request. This is an evidence artifact,
   **not an approval or an activation**. The server and theme registry are not
   written. Another reviewer must reconcile the receipt, actual stylesheet,
   permitted media slots and release candidate SHA before merging changes.
5. Approved release requires protected `dev` → `main`, required GitHub checks,
   Cloudflare exact-main Production proof, and real cross-device review.
6. If the release is defective, export a reasoned owner rollback request to the
   sole trusted Standard baseline and take it through the same release gates.

## Guardrails

- A draft never activates the theme; a boolean checkbox is not an identity
  credential. The actor must have the verified `owner` role as provided by
  `AdminShell` even to use the release request UI.
- A review receipt is not cryptographically signed and is not trusted as
  standalone authorization. Its contents must be independently checked.
- There is no automatic stylesheet registry edit, public preference cookie,
  R2 asset copy, Supabase write, or Cloudflare deployment from this page.
- `data/theme_registry.json`, `assets/theme-runtime.js`, and public Standard
  artwork remain unchanged by Build 621.
- Verify on devices at the actual widths; clicking checkboxes alone is not
  proof of visual or accessibility correctness.

## Local verification

`node scripts/build621_theme_activation_test.mjs`

## Batch closure

Builds 613–621 are the completed *planned scope* only when each has proven
Production GREEN. Owner theme candidate approval and real field tests remain
separate; do not infer them from tests or merged code. After this batch,
reassess the next roadmap based on observed user workflows.
