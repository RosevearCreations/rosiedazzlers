# Build 283 — Proof / Media Eligibility and Gallery Publication Controls

**Date:** 2026-08-31  
**Base:** Build 282 `841d90561a98089835018c008ec144667782f37d`  
**Feature branch:** `build283-proof-publication-controls`

## Scope

Build 283 is intentionally bounded to **proof/media eligibility** and **Gallery publication controls**. It extends the existing Gallery/App Management authority; it does not create another media service, transaction path, or database schema.

## What changed

- Final job-media candidates are filtered server-side before they appear in Gallery Approvals.
- Customer-visible/final job media remains only a pairing candidate; that state does **not** imply public-use consent.
- Gallery consent/privacy review is now separate from publication.
- New/edited Gallery rows remain draft/unpublished until staff explicitly chooses **Publish**.
- Public Gallery output requires an explicit `published` state plus a passing public-use consent/privacy gate.
- Legacy saved Gallery rows without an explicit publication state fail closed; bundled sample fallback remains available so the public Gallery does not break while older rows are reviewed.
- Publication-sensitive edits return a published row to draft review.
- Real proof readiness is stronger than Gallery publication. A proof row must be non-sample, published, and retain vehicle, condition, **problem → process → result** context.
- Pairing an eligible final-media candidate into a new Gallery row preserves the source booking/job-media identifiers when available.

## Privacy / evidence boundary

Build 283 does not invent consent. The staff control that confirms public-use approval is a deliberate assertion that actual customer/public-use consent and media-privacy review have been completed. It still does not publish the row; publication is a second explicit action.

Bundled sample placeholders remain clearly marked `sample` and `proof_kind=sample`. They may keep the Gallery usable as fallback but never count as real Rosie proof.

## Database impact

**There is no database migration in Build 283.** New Gallery state/context fields live inside the existing `before_after_gallery` editable-setting JSON. Existing `gallery_media_candidates` and job-media authorities are reused.

## Validation

- `scripts/build283_release_check.py`
- `.github/workflows/build283-source-gate.yml`
- retained Build 282 guard
- cumulative `scripts/release_check.py`
- `scripts/seo_h1_check.py`
- route-copy parity and source conflict/whitespace checks
- feature preview before `dev`
- exact-SHA Development acceptance after `dev` fast-forward

## Release boundary

Production remains closed. `main` stays on the existing Build 274 Production line. Build 283 may advance `dev` only after the exact feature SHA is green.
