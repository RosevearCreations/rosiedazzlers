# Next Steps Internal — Build 153

**Updated:** 2026-05-18

1. Deploy Build 153 and confirm Cloudflare Pages Functions compile without the prior `media_library_list.js` regex error.
2. Apply Build 150 and Build 151 SQL migrations in Supabase dev.
3. Smoke-test `/api/admin/media_library_list?usage_context=inventory_item`.
4. Seed `app_media_library` from current R2 products/tools folders.
5. Add direct Admin Catalog upload-to-R2 workflow.
6. Add picker metadata editing: alt, caption, source, consent, preferred-public-image.
7. Add **Repair all fallback-matched images** with review before write.
8. Add server-side image health report for scheduled broken-image monitoring.
9. Add intentional duplicate-image approval/ignore controls.
10. Connect media rows to service/town/review/before-after proof tags.
11. Move before/after gallery to admin-managed DB content.
12. Add receipt/bill upload to inventory purchases and accounting entries.
13. Connect booking closeout consumable usage to COGS/accounting posting.
14. Add inventory stock-count sessions and variance approvals.
15. Add month-end inventory valuation lock/reopen controls.
16. Share vendor data between Admin Catalog and Accounting.
17. Add Search Console and Google Business Profile reporting once credentials are ready.
18. Replace remaining placeholder/external landing photos with Rosie-owned R2 images.
19. Expand admin fallback banners for DB/app-setting/JSON source clarity.
20. Add mobile detailer closeout tools for media, sign-off, consumables, and notes.
21. Continue release checks for one H1, title/meta clarity, structured data, CSS drift, and redirects.

<!-- Build 153 sync 2026-05-18 -->

## Build 153 immediate next steps

1. Upload/deploy Build 153.
2. Confirm Cloudflare Pages Functions compile past the previous unresolved `_lib` import errors.
3. If clean, continue with media-library seeding and Admin Media Library editing.
4. If not clean, paste the next deploy log before making feature changes.
