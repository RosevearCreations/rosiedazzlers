# Build 620 — Owner Theme Manager Preview & Approval

The protected `/admin-theme-manager.html` workspace provides a versioned theme-clone and colour-preview interface, with a contrast check and explicit separation of theme-owned static illustrations from managed Photo Studio/R2 media. The Owner/Admin can acknowledge that a local draft was reviewed and export a JSON review receipt. The receipt is **not** permission to activate the theme.

## Safety boundaries

- The deployed `Standard` baseline cannot be edited from this screen.
- A clone is stored as a browser-local review draft only. Export a receipt for durable handoff; browser storage is not a server-side approval ledger.
- `data/theme_registry.json`, `assets/theme-runtime.js`, live app/site settings, customer media, current page styles, and public pricing are untouched.
- Managed R2 assets are displayed as provenance-dependent slots, never copied or published from the preview. No customer image consent is inferred.
- Theme activation, server-side approval persistence, audit history and rollback are reserved for Build 621; this release must not be described as public theme activation.

## Acceptance

1. As an authenticated Admin, open App Management → Owner Theme Manager.
2. Clone Standard to a new slug and verify it is versioned, separate from the baseline and editable.
3. Alter palette colours, inspect preview and confirm a failing text contrast prevents receipt export.
4. Verify the static and managed tabs distinguish theme artwork from consent-governed media.
5. Acknowledge review, save locally and export the review receipt, then verify `publicActivation:false`.
6. Confirm anonymous/non-Admin access cannot use the workspace; no server writes are issued.
7. Check the public site still uses Standard after deploying Build 620.

`node scripts/build620_owner_theme_preview_test.mjs` validates the preview contract. Live authenticated browser and exact-main Cloudflare verification are separate acceptance gates.
