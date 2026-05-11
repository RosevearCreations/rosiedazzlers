# Known Gaps and Risks

**Reset date:** 2026-05-10  
**Build pass:** 139 corrected-package cleanup

## Highest-risk gaps

1. **Schema drift** — several screens include compatibility fallbacks because live Supabase may not have every migration applied.
2. **Checkout/accounting reliability** — checkout, payroll, accounting, and reconciliation require clear migration discipline before relying on them for production bookkeeping.
3. **Admin option sprawl** — categories, types, colours, vendors, units, zones, and tiers need one customizable option-library source.
4. **Media source drift** — some images still exist in JSON, some in R2 paths, and some in admin settings. The media library needs to become the long-term control point.
5. **Review placeholders** — sample reviews must be replaced with real review/API content before being presented as verified customer reviews.
6. **Root/api duplication history** — older packages carried API endpoint files at repo root. The valid location is `functions/api/`; root duplicates were removed in this cleanup.
7. **Accounting is not full filing software** — the system can support bookkeeping and accountant handoff, but T2/GIFI/export workflows still need review and validation.
8. **Local SEO needs ongoing proof** — ranking depends on relevance, distance, prominence, content quality, reviews, and Google Business Profile signals.

## Watch every build

- No more than one H1 on exposed public pages.
- CSS cards/tables must not overflow or stretch vertically.
- Services/Pricing embedded booking should remain compact.
- Admin App dropdowns must update their fields after selection.
- Admin Catalog must show saved DB rows plus bundled fallback rows.
- Add-ons with zero/missing prices should show “Quote required,” never `$0.00`.
- Add-on image editors should prefer real PNG/JPG/R2 images over SVG placeholders.
