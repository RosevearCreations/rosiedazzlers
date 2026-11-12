# Rosie Dazzlers Build 867 — Original Owner Signed Custody Renewal Aging, Independent Plane Receipt Exception Routing & Protected HOLD History Retention Audit

**Contract:** `rosie.ai-data.comms.owner-renewal-routing-retention-hold.v867`

**Source is never transport:** Original independent signed *offline reference rows* from 863/866 and private digest chains do **not** demonstrate a new original-owner digital signature, an independent Master receipt, delivery, receiver ACK, CONNECTED, owner consent restoration, or incident closure. The original owner remains in **HOLD** even if software Production is GREEN.

## Original owner endpoint

`GET /api/admin/jobday_retention_867`: exact original booking/post/owner case/incident/transaction references plus current original Rosie owner session/capability `manage_staff`, no legacy fallback. The protected v866 GET revalidates v865→v855 original incident/consent lineage before v867 reads private original 866 history. It returns current owner custody renewal age, optional `plane=ai-data-platform|rosevear-comms-hub` route preview, protected metadata-only chain audit, and latest bounded v867 histories; if any v866 history reaches 25 rows, the request fails closed. No raw bundle or customer media is returned.

`POST /api/admin/jobday_retention_867`: same five exact references, unique `review_nonce` (20–100 characters), non-closing `owner_action` of `maintain_hold`, `request_fresh_custody_witness`, or `route_offline_exception_for_independent_review`; require `confirm_original_owner_incident_open:true`, `acknowledge_offline_references_not_master_ack:true`, and `confirm_no_retention_deletion_or_external_send:true`.

Actions are:

- `record_original_owner_signed_custody_renewal_aging` — independently track latest immutable original 866 private snapshot rotation age. 24h aging is **due**; 48h is **overdue**. Missing rotation or original 863 per-plane signed offline references (including a missing signer reference or a reference older than 24h) remain HOLD. The action **records a manual review only**, never renews a signature or key.
- `route_independent_plane_receipt_exception` — select exactly one plane (`ai-data-platform` or `rosevear-comms-hub`). Cross-check latest original 866 SLA correlation and two-plane recheck, exact plane reference, 24h freshness, and outstanding discrepancy. The route is **an internal, owner-only immutable review queue reference**; the endpoint does not send emails, events or remote notifications, and cannot interpret an offline reference as operational ACK.
- `audit_protected_hold_history_retention` — independent metadata-only 866 per-kind predecessor ID/SHA chains, missing/duplicate/broken-link and capped-history detection. Checks local retained rows; **does not assert physical storage, WORM backups, independently anchored retention, a scheduled deletion or document destruction**.

## Original RosieDazzlers Supabase

`supabase/migrations/20261112235900_build867_owner_renewal_route_retention_hold.sql` applies **only** to the original RosieDazzlers project after Build 866. It adds private `rosie_owner_history_v867` with RLS enabled, browser roles and PUBLIC revoked, service-role SELECT/INSERT, immutability trigger and atomic invoker RPC `rosie867_append_private_hold`. Database RPC rechecks original open incident/revoked consent, exact immutable 866 predecessor and current 863 signed offline reference tips, source ages, exact 24h/48h statuses, per-plane routing status, and local complete chain structure. Unique nonce and per-kind/per-plane prior SHA pointers prevent replay or lost review history. No raw media, signing key, export payload, signed ACK, external delivery or incident-close action.

## Verification / release

Run `node scripts/build867_owner_renewal_route_retention_test.mjs` and `bash scripts/current_jobday_custody_regression.sh` (retained 850–867). Protected feature→dev→main; exact Cloudflare production SHA; four business-acceptance suites; combined business gate; deployed-SHA verification and release-health PASS are mandatory for **software Production GREEN**. All Master/owner operational incidents remain HOLD.

**Next proposed Build 868 — Camera-First New Booking Intake:** An authenticated staff **New Booking → Take Photo(s)/Video** creation point that saves a non-reserving detailing intake draft with an auto-generated ID as temporary title, resumable notes, and a private upload policy. A draft must never invent a customer booking, reserve availability, authorize photo publication, or trigger payment. Existing Rosie Supabase/Cloudflare infrastructure should be reused; no new consumer cloud account is required.
