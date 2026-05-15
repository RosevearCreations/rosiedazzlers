# Known Gaps and Risks — Build 140

**Updated:** 2026-05-14

## Still active gaps

1. **DB migrations must be applied deliberately.** Build 140 adds optional SQL foundations for option libraries, media library, and reusable content entries, but runtime fallbacks remain until Supabase dev is migrated and verified.
2. **Review samples are not verified customer reviews.** They remain placeholders until a review API or approved manual review workflow is connected.
3. **Media is still split between JSON, R2 URLs, and app settings.** The new media-library seed and SQL table are the foundation, not the finished editor.
4. **Dropdown libraries are partially centralized.** Admin Catalog and Admin App now have a shared contract, but a full option-library editor still needs to write/read all values consistently.
5. **Before/after gallery still needs admin moderation/consent workflow.**
6. **Accounting is useful for bookkeeping workflow but is not tax-filing software.** Payment application, journal validation, reconciliation, remittance review, lock/reopen, and accountant export still need completion.
7. **Search ranking cannot be guaranteed.** We can improve relevance, clarity, crawlability, local proof, and GBP/review readiness, but ranking still depends on competition, location, prominence, and real-world review/activity signals.
8. **Root duplicate API files were removed in this package.** Valid Cloudflare Pages Functions live under `functions/api/` and `functions/api/admin/`.

## Watch every build

- No more than one H1 on exposed public pages.
- Services/Pricing embedded booking should remain compact.
- Admin App dropdowns must update their editor fields after selection.
- Admin Catalog must show saved DB rows plus bundled fallback rows.
- Add-ons with zero/missing prices should show “Quote required.”
- Add-on image editors should prefer real PNG/JPG/R2 images over SVG placeholders.
- `scripts/release_check.py` should pass before upload/deploy.
