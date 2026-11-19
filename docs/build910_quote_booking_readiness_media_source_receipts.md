# Rosie Dazzlers Build 910 — Customer Quote Readiness, Private Media Source Receipts and Cross-device Review

## Customer-facing implementation
- `GET /api/client/quote_readiness_v910?quote_id=<original UUID>` requires an active verified customer account. Original quote is filtered by staff-sent original customer email, then original related booking is checked with Build 908 account ownership.
- Only staff-accepted, hash-matched original CAD terms can proceed to fresh canonical server pricing via `resolveCurrentQuotePrice` and `compareAcceptedTermsToCurrentPrice`.
- `READY_FOR_SCHEDULE_RECHECK` means **price match only**. Slot/date, duration, service area/address, driveway/power/water, cancellation waiver, deposit and existing authoritative checkout MUST still be verified. There is deliberately no booking creation, payment, hold, notification or auto-acceptance.
- Existing booking source links produce `BOOKING_EXISTS` instead of repeating the flow. Stale/requoted/expired/missing terms fail closed.
- My Account desktop/mobile now contains a select-and-check panel. The same authenticated server route works for browser widths; this is **not** an original phone/tablet/desktop witnessed acceptance claim.

## Private media source snapshot receipts
- Staff-original verified linked quote-photo/video source rows are read under the verified customer's quote ownership.
- SHA-256 revision receipt includes only original media identity/review/proof metadata. Response has count, count of originally reviewed `approved_private` items and non-sensitive digest; it never contains bucket, object path, media URL, filename, customer identity or storage write authority.
- **Important evidence limitation:** original `photo_estimate_uploads` currently does not have retained `retention_policy`, `retention_expires_at` or independent object deletion witness columns. Returned state remains `HOLD_RETENTION_SOURCE_NOT_WITNESSED` and `storage_deletion_witnessed=false`. This build cannot certify actual expiry/deletion or record retention closure.

## Tests and release gates
- New tests verify price drift, stale/hash-mismatched terms, expiry, existing booking, account ID filtering, private-source digest, zero checkout action, and account script presence. Build 909 regression re-runs.
- Protected `dev` then `main` is the release path. Exact SHA Cloudflare Development/Production Pages and Functions plus live HTTPS, Production Business Acceptance, Release Health GREEN and CI pending=0 need independent check.
- The Build 909 source-of-truth 69.5% score is a planning baseline; do not award a forced 5–10 percentage point overall gain without deployed scope and original customer/device/payment evidence. Score may increase after measured gate closure, not in place of it.
- Existing cross-app Build 423 telemetry endpoints are code-present but only connected after separate server-side token, key, original-host receiver enrollment, signed ACK and freshness/replay verification. Unknown metrics and reboot witness remain null/HOLD.

## Remaining P0/P1 acceptance
1. Original booked quote and confirmed payment/refund reconciliation; no repeat deposit.
2. Independent original tablet, desktop and mobile customer + worker journey receipts.
3. Retention/consent withdrawal to object expiry/deletion evidence and lawful retention holds.
4. Recovery email independent provider delivery witness.
5. Accountant/HST/payroll original signoffs and external three-Master/four-app read-only source activation.

**Next proposed: Build 911 — Provider Settlement, Invoice/HST, Refund Corroboration and Supervised Original-Device Readiness.**
