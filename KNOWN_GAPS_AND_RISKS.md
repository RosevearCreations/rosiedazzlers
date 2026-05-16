# Known Gaps and Risks — Build 147

**Updated:** 2026-05-16

## Reduced in this pass

- Admin App no longer fails on `mergeServiceAreaRows is not defined`.
- Admin App no longer binds to a missing `saveCatalogDropdownOptionsBtn` because the dropdown option library panel now exists.
- Service-area data can be merged from saved catalog settings plus bundled defaults without losing county/water-rule fallback details.
- Public mobile navigation is now compact and expandable instead of appearing as a long list on small screens.
- Release checks now include a compact mobile-navigation guard.
- Root duplicate API files were removed again so deployment surface stays cleaner.

## Still open

1. Pending Supabase migrations must still be applied in the dev database.
2. The dropdown option library is still stored as an app setting; a DB table will be cleaner once the workflow is proven.
3. Service-area rules are partly available as JSON/fallback and partly as DB/API foundations; the Admin App should eventually edit the dedicated DB table directly.
4. Amazon CSV matching is still generated from a local CSV workflow; the next step is private admin upload.
5. Amazon match outputs should move behind authenticated admin APIs before production use.
6. Cost history and receipt attachments are still needed for stronger accounting audit support.
7. Admin Catalog remains dense and needs mobile testing after each new workflow.
8. Sample reviews remain placeholders until the real review API is connected.
9. Search ranking is not guaranteed; we can improve relevance, crawlability, structured data, proof, and local prominence support only.
10. Continue validating one H1, local wording, sitemap coverage, structured data, and CSS overflow every pass.

<!-- Build 147 sync 2026-05-16: Admin App mergeServiceAreaRows repair, dropdown option editor, compact mobile navigation, release-check guardrails, root API duplicate cleanup, local SEO/H1 discipline. -->
