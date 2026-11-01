# Build 734 — Standard Theme Visual Repair & Owner Device Review

**Status:** Source repairs complete; automated source checks available. **Owner physical-device sign-off: PENDING.** This record does not claim to have tested the owner's devices or authenticated Admin screens.

## Observed source/live issues and bounded repairs

| Surface | Evidence | Build 734 response |
|---|---|---|
| Public header (desktop) | At the observed 1363px live viewport, the `Menu` toggle appeared beside a complete navigation list. Base `.btn` display overrode the earlier `.nav-toggle` hide rule. `Book now` was wrapped onto two lines. | Standard-only desktop toggle suppression, compact link spacing and a single-line desktop booking CTA; the original mobile toggle breakpoint is retained. |
| Shared CSS cache parity | After the first Build 734 `main` deployment passed exact-SHA smoke, an already-open desktop browser continued to use the old `/assets/site.css?v=build647-responsive` entry sheet. A reload did not immediately change it, while a fresh version of `/assets/site.css` returned the new Build 734 import. Other pages had many historical link keys. | Update all **actual** root/folder public, app and protected Admin stylesheet link URLs to `/assets/site.css?v=20261101build734`; retain historical audit comments unchanged. A source test checks every HTML stylesheet link, not merely the new imported CSS. Recheck live Production on the final promoted SHA. |
| Shared logo | Approved `/assets/themes/standard/images/cropgold.png` exists at **945×476** and is the existing Chrome brand and footer source. On first paint before Chrome hydration, the image can briefly show its alt label. | Preserve the original image and its aspect-ratio/contain rules; use that same approved PNG as a Standard-only CSS first-paint background while the real src loads. No swap to the deprecated square icon or manufactured rebrand. |
| FAQ four guide cards | Bundled images exist. Actual intrinsic size: three **1448×1086** and one **1600×900**; HTML previously advertised **1456×1022** / **1712×960**. | Correct intrinsic HTML dimensions in root and folder FAQ routes, use a contained Standard frame to prevent cutting off the 4:3 or 16:9 originals. |
| Login | Live Standard sign-in and create-account cards rendered in two aligned columns at the observed desktop viewport. The brand image loaded after Chrome initialized. | Preserve account form behavior and artwork; add narrow-screen overflow safeguards without changing credentials, fields or actions. |
| Admin command workspaces | Build 732 cards and Build 733 named layouts already have responsive CSS; `.actorcard` retained a fixed 280px minimum that can overflow narrower containers. | Remove that minimum for the authenticated Admin home; allow long diagnostic strings and card controls to wrap. No protected-report or role-policy changes. |
| Managed customer/gallery imagery | Existing customer proof and approved R2 records are not theme assets and cannot be inferred from a static scan. | **Untouched.** No before/after, consent, attribution or Photo Studio edits. |

## Evidence and test boundaries

- Observed the public `/faq`, `/login`, and canonical service flow (`/services` redirects to `/book`) using a read-only browser at **1363px desktop width** before the source patch. Confirmed no broken loaded image after the page completed hydration on the sampled public pages.
- The root/folder FAQ copies and local media dimensions are checked by `scripts/build734_standard_theme_visual_repair_test.mjs`.
- Browser cache-version drift is an observed delivery issue, independent of GitHub and Cloudflare's source-commit acceptance. Its regression guard scans actual stylesheet links across the shipped HTML routes.
- The full booking regression, CSS/source release checks, Admin UI audit, and exact-SHA Cloudflare Production workflow remain mandatory. Source checks do **not** prove all browser viewports, every Admin authenticated screen, or live R2 assets.
- The browser run was a desktop baseline, not a physical owner-device trial. Any later Production browser spot check should be recorded separately from the deployed build SHA.

## Owner physical-device checklist (not yet completed)

For owner sign-off, inspect live Production after promotion at phone widths **320/375/390px**, tablet **768px**, and desktop **≥1280px**. Record screenshots or notes privately without exporting customer data.

- [ ] Header: full cropgold logo visible, desktop Menu hidden, mobile Menu toggles navigation by touch and keyboard; no clipped `Book now` button.
- [ ] FAQ: all four Standard images are present, not cut off; text and buttons remain readable without horizontal overflow.
- [ ] Login: sign-in, create-account disclosure, recovery links and field labels are visible; touch/focus targets remain usable. Do **not** submit live test credentials as part of visual acceptance.
- [ ] Services/booking: service-card pricing and image containment remain correct on every vehicle size; planner and add-ons still follow authoritative checkout flows.
- [ ] Authenticated Admin: six command cards, saved views, status data and diagnostics wrap correctly; tables may scroll horizontally without clipping actions or changing permissions.
- [ ] Gallery and Photo Studio: only approved real customer work is shown; record any broken or stale R2 photo for separate authorized review.

Any owner finding belongs in a subsequent targeted correction with a before/after screenshot and a canonical source path. Do not mark this checklist complete based on CI alone.
