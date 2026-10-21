# Rosie Dazzlers — Standard Theme Phase 2: Public / Admin Visual QA and Missing-Artwork Protocol

**Status:** Implemented read-only audit tooling on development release branch; operational browser audit evidence must still be collected. Not a certification that every live image is present or correctly sized.

## 1. What has been inspected

- The existing Photo Studio target registry contains **617 target keys across 62 page paths** (source register, not 617 broken assets). See \`docs/audits/ROSIE_MEDIA_SLOT_CATALOG_STANDARD.md\`.
- The verified Admin + customer source sample covers **17 HTML templates and 39 \`img\` source elements**. See \`data/standard_admin_visual_source_inventory.json\`.
- **Five protected internal-process illustration requests** are enumerated from \`data/visual_placeholder_registry.json\`; these are placeholders, not approved photos.
- The prior SVG source inventory identifies **17 SVG files** with their exact authored \`viewBox\`, where present. See \`docs/audits/ROSIE_KNOWN_SVG_AND_BANNER_GEOMETRY.md\`. An SVG viewBox is NOT the actual CSS size.
- **24 service-process placeholders** have Standard-theme filenames bound and require optional real artwork uploads; approval-controlled customer before/after pairs are deliberately excluded.
- Full checkout scan \`node scripts/audit_standard_theme_media.mjs\` can enumerate all textual HTML/CSS/JS/SVG references and now distinguishes missing local files from intentionally unuploaded Standard artwork. It generates \`data/generated_media_reference_inventory.json\` and \`docs/audits/GENERATED_MEDIA_REFERENCES.md\`.

## 2. Operator-initiated rendered browser audit

Shared public + Admin pages that load \`/assets/chrome.js\` have a fully opt-in audit action. To inspect a page that you are allowed to access, add \`?rosieVisualAudit=1\` to its URL and then click **Download this page’s visual audit** at the bottom right.

The Admin **Media and Image Health** page additionally has an **Audit this rendered Admin page** button, without a URL modification. Both routes call the same read-only auditor: \`assets/visual-audit-inspector.js\`.

The local JSON report includes:
- exact current page *path* and active theme, without URL query strings or credentials;
- displayed and intrinsic pixel size of loaded images, broken vs pending/lazy images, static artwork filenames, available Photo Studio \`data-photo-image-target\` IDs, placeholder detection and alt-attribute presence;
- actual inline SVG \`viewBox\`, authored width/height, rendered dimensions and whether accessible labeling is indicated;
- CSS background images that have been painted in the DOM and video poster images;
- explicit caps (3,000 scanned DOM elements and 850 per media class), and a \`truncated\` warning if limits are reached.

**Privacy:** All private, dynamic or external image URLs are redacted; no alt text, names, customer images, auth headers, cookies, API responses, image pixels, customer form data or R2 object lists are exported. No scanner auto-runs when a page loads; no customer-media assignment, upload, deletion, preview replacement, review claim or publication is performed.

**Critical limitation:** This audits the currently *rendered DOM in that browser session*, not every route automatically. A hidden Admin tab, unloaded lazy image, authenticated route, modal, alternate vehicle size or runtime component state must be opened before measuring. Pending/lazy does not equal broken. The browser download stays local unless the operator explicitly attaches it.

## 3. How to complete the true entire-site rendered audit

1. Run the full-checkout source scanner on GitHub CI and review its generated Markdown/JSON audit artifacts.
2. Audit a representative desktop and mobile viewport using the opt-in browser tool on every public page and every authorized Admin screen (including modal/card/list variants). Capture each screen's JSON, then inspect and reconcile identifiers; do not publish private reports.
3. In Photo Studio / Admin Media Health, verify the exact approved R2 key and natural image dimensions for any candidate replacement. Use the existing media requirement thresholds, not the design proposal alone.
4. Mark each slot \`approved_public\`, \`private_managed\`, \`reserved_optional\`, \`broken_static\`, \`editorial_review\`, or \`needs_live_measurement\`. Confirm name, size, aspect ratio, crop/focal point, accessible text, and approval/provenance.
5. Fix any broken static path only after confirming there is a legitimate replacement file; never fabricate a before/after pair, customer review, certificate or staff evidence.
6. Recheck dark/light contrast and overflow if future themes are introduced, with 320/375/390/768/desktop widths, mouse/touch/keyboard, and screen readers.
7. Preserve deployment proof: exact \`main\` SHA, Cloudflare Pages production SHA, successful source checks and business acceptance, and actual runtime smoke.

### Suggested inspection priority

| Surface | Important slots | Current source authority | Action |
|---|---|---|---|
| Shared header/footer | logo, banner, reviews | current site settings + R2 | Keep authentic, verify rendered proportions |
| Services/booking | package/add-on cards, dynamic pricing | App Management + catalog | Verify photos and accurate CTA, no generic proof |
| Specialist service landing | hero + process placeholder | authored/R2 and optional Standard artwork | 24 process filenames ready, optional uploads missing |
| Public gallery | before/after pairs and recent work | Photo Studio consent/assignment | Verify real matched proof; no auto replacement |
| Admin Media Health | health counters, placeholder guidance | protected current media registry | Manually export rendered report |
| Admin Photo Studio | dynamic thumbnail, editor preview | protected Photo Studio | No static fallback over customer photos |
| Inventory admin | dynamic item previews, empty-state photos | protected inventory records | Generic placeholder only when unassigned |
| Admin gallery | customer before/after records | protected gallery approvals | Never copy private media into theme |
| DAIP Gate C | four authored public R2 proof-image sources | existing public R2 references | Independently verify actual objects, consent and relevance |
| Quote-first wizard preview | five-step UI / optional intake | gated preview | No public submission or theme activation |
| SVG icon/vehicle overlays | 17 known assets, CSS/JS-generated SVGs | authored vector | Preserve aspect and semantics, audit viewBox at runtime |

## 4. Standard theme contract and future global switching

- **Standard remains the original default appearance**, defined in \`assets/themes/standard.css\`, and listed in \`data/theme_registry.json\`.
- \`assets/theme-runtime.js\` validates approved theme IDs and same-origin stylesheet names before any user-requested preview. It exposes a nonpersistent in-memory interface through \`window.RosieThemes\` on shared public and Admin chrome. No new theme is enabled; no switcher UI, cookie or database preference is created.
- For the future theme switch to be fully supported, all pages must use semantic visual tokens, all Admin inline hard-coded colour/layout values must be audited, logo/banner/icon variants must be defined per theme, and the user/owner preference, rollback, accessibility and caching contract must be approved.
- Current service photos, customer before/after, staff private evidence and managed R2 images remain **content**, not theme assets, and do not switch with colour themes unless the owner explicitly defines a public branded variant.
- Future themes need a complete stylesheet \`/assets/themes/<theme-id>.css\`, registry \`status: approved\`, a guaranteed Standard fallback, and browser acceptance. Do not mark "entire site theme switching complete" until Admin and wizard variants are covered.

## 5. Tracked issues / limitations (must not be silently closed)

- No authenticated browser, full screenshot gallery, Cloudflare R2 permissions, or complete media pixel bytes were available for this source-authoring pass.
- A public reader of \`/services\` resolved to \`/book\` during this check; confirm intended service-page canonical routing as a separate task (not proof of a media regression).
- The specialized ceramic coating page still visibly describes three **Photo needed** slots. The first can only be real, permissioned customer proof; the process image may use the exact optional Standard filename when uploaded and successfully loaded.
- Static Admin source inventory contains 17 key templates; it is a **sample**, not a claim that every Admin route has been rendered and measured.
- Five Admin process diagrams have recommended names but are not uploaded/approved. An illustration must never reveal customer, provider credentials, payment data or internal secrets.
- The full-checkout scanner detects local references, not live R2 object existence or exact runtime crop. A missing file may be a purposeful optional asset or a genuine broken reference; report separately.
- Future theme switching is scaffolded but not user-selectable yet; preserving the current appearance is intentional.

## 6. Reusable acceptance gate

\`node scripts/standard_theme_phase2_test.mjs\`

\`node scripts/audit_standard_theme_media.mjs\`

\`node --check assets/visual-audit-inspector.js\`

\`node --check assets/theme-runtime.js\`

Tests validate the single approved theme, safe source/audit controls, 24 process filenames, main Photo Studio registry count and both Admin Media Health aliases. Full browser visual verification and Cloudflare exact-SHA Production approval are separate gates, not implied by source checks.
