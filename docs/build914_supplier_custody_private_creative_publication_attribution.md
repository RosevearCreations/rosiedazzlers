# Rosie Dazzlers Build 914 — Supplier Custody, Consent-Gated Creative and Attribution

## Source behavior

Original authenticated Rosie DAIP-authorized staff can attest received VEVOR supplier equipment with private evidence reference and receipt date, linked to the existing Build911 private supplier draft. A mismatched acquisition status is rejected. A custody attestation is not an independently witnessed invoice or physical inventory movement.

The approval API reads the **original** linked DAIP project, media, sessions, and processing jobs, applies the existing workflowFor consent/public-hand-off contract, and requires the explicit selected approved asset IDs, channel, review timestamp, separate consent record ID, DAIP-authorized staff session, and material-connection disclosure for gifted/loaned/review-sample goods. It writes an immutable private approval record marked `approved_pending_provider`. No raw DAIP object keys or media URLs enter the approval row.

**Critical deployment boundary:** This build does NOT send videos to YouTube, Meta or Instagram, does NOT certify an external publication, and does NOT record legitimate measured conversion until an independent channel-provider published receipt and original first-party events exist. Channel providers need owner-enrolled credentials, applicable API permissions, and original channel acceptance. An approval is not a public video. External posting remains HOLD. The attribution table is private and schema-prepared; there is not yet a live original observed attribution ingestion/aggregation or channel-verification consumer. Do not credit verified attribution or count an empty table as an observed performance sample.

## Original database schema

- `rosie_supplier_custody_v914`: private staff receipt attestation and evidence locator, no auto-posting.
- `rosie_supplier_publication_v914`: explicit consent-reviewed channel approval pending provider receipt. Revocation and verification statuses are reserved but not automatically asserted.
- `rosie_supplier_attribution_v914`: private event primitives for future non-identifying measured campaign statistics. No IP address, cookies, customer identity or secret media URLs stored.
- RLS enabled on all three; zero grants for anon and authenticated; service-role operations only.

### Endpoint

`GET /api/admin/supplier_custody_publication_v914?supplier_review_id=<UUID>`: staff-only readback of original private custody and publication approval states.

`POST /api/admin/supplier_custody_publication_v914` JSON `{action:'custody',data:{supplier_review_id,custody_kind,evidence_reference,received_at,custody_note}}` or `{action:'approve',data:{supplier_review_id,custody_id,channel,consent_record_id,creative_reviewed_at,disclosure_confirmed,asset_ids,approved:true}}`. Requires same-origin, signed staff session with DAIP management permission, original DB evidence and release gating. No public endpoints created.

## Release and independent acceptance criteria

1. Protected implementation PR into dev, Node24 original test suite and backward Build911–913 regression green.
2. Apply **original Rosie Supabase migration** and verify RLS on every table; confirm zero anon/authenticated privileges.
3. Original private staff custody and approved consent pilot with *real* sample evidence; prove cross-staff authorization, stale consent, wrong asset and replay denials.
4. Explicit original account/channel publication integration with verified provider receipt, independent live test, revocation and disclosure capture (not implemented in this build).
5. Original first-party event ingestion with privacy-safe deduplication, reporting and reproducible attribution to a verified provider publication (not implemented in this build).
6. Exact-SHA protected main, Cloudflare Pages+Functions prod deployment, HTTPS smoke, Release Health GREEN, Business Acceptance GREEN and budget within bounds, pending=0.

Completion percentages must not be inflated for unverified provider publication or real supplier receipt. The full business has more work than this single source increment.

## Next proposed

Build 915 — Live Supplier Channel Provider Handshake, Verified Published-Video Receipts, Privacy-Safe Attribution Pipeline and Original Cross-Device Creative Acceptance.

References: `docs/build913_retail_finance_invoice_refund_pos_handoff.md`; `functions/api/admin/daip_media_workflow.js`; [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security); [YouTube Data API](https://developers.google.com/youtube/v3); [Meta Graph API](https://developers.facebook.com/docs/graph-api/).
