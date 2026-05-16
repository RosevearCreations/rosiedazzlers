# Images and Media — Build 147

**Updated:** 2026-05-16

No image-size rule changed in this pass. Continue using the current media workflow:

- Add-on/service images: prefer PNG/JPG/WebP primary images; keep SVGs as fallback or line-art only.
- Public proof/review/before-after images: use clear landscape or square images, ideally at least 1200px wide.
- Inventory/catalog item images: store R2/public URLs in the catalog, then use local bundled data only as fallback.
- First public product/service images should avoid tight cropping and should use `object-fit: contain` where the full item matters.
- Admin App dropdown/media changes in this pass do not change the required upload sizes.

Future image work:

1. Move media library entries into DB once the admin media workflow is stable.
2. Add image score warnings before saving public images.
3. Add dedicated before/after media consent status to the DB-backed gallery workflow.

<!-- Build 147 sync 2026-05-16: Admin App mergeServiceAreaRows repair, dropdown option editor, compact mobile navigation, release-check guardrails, root API duplicate cleanup, local SEO/H1 discipline. -->
