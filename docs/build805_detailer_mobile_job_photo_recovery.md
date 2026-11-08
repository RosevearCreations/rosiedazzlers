# Rosie Dazzlers Build 805 — Mobile staff job checklist, before/after proof and recovery

## Delivered

- Existing assigned-job Detailer App `/app/detailer/` now shows seven direct, keyboard-accessible field checkpoints, with links to the original secured controls. The checklist is a *view* of source-backed evidence, not a new approval path or stored offline draft.
- Before/after camera workflow displays separate original private-photo counts and opens the existing consent-checked, original-file/SHA-256, staff-only upload controls. No customer publication, marketing permission, automatic camera action or new gallery is created.
- Staff can explicitly refresh the current assignment, recheck onsite evidence and the private feed, and inspect a previously unresolved signed upload session. No background polling or automatic upload/action replay is introduced.
- A stale or failed feed read invalidates the field-ready signals; a response for a former job or revision is discarded. Switching jobs during an upload aborts the current transfer and leaves the prior job's unresolved session available only in that job for manual inspection.
- Rapid refresh/selection changes now share one lazy field-module mount, then reconcile the currently selected booking instead of racing two initial panels.
- Authorized **read-only** onsite intake/consent retrieval is now permitted while the original assigned job is `detailing` or `paused`, enabling private after-photo capture after a page reload. Onsite edits remain `arrived`-only, with unchanged session, same-origin, assignment and optimistic revision checks.
- Local previews revoke obsolete temporary object URLs, reducing photo-memory growth on long mobile sessions.
- Before requesting a signed original-photo upload, the app checks that the browser can hold the minimal existing session-recovery metadata. Storage failure prevents a new file transfer and surfaces an Operations help message.

## Evidence and limitations

- `node scripts/build805_mobile_job_guide_test.mjs` tests UI-derived progress under normal, stale, offline and pending-upload cases, the after-Start read-only consent path and denied edits, anonymous access and cross-site requests.
- All pre-existing Build 745–749 staff, photo, QC and offline tests continue to run in `scripts/current_booking_wizard_regression.sh` alongside Build 805.
- Production deployment and private device/camera acceptance remain separate from synthetic tests. Neither the app nor this build creates customer consent, a customer signature, payment approval or live Comms activation.

## Staff acceptance walkthrough

1. Sign in as an assigned Detailer and open **Detailer Mobile App** from the app shell. Select an assigned job and refresh/reconcile.
2. After **Arrived**, finish audited safe setup and genuine customer private-photo permission. Use **What's done, what's next** to complete the before photo and service checklist.
3. Start only when the existing server gate permits. Record approved scope, product use and completion evidence. Use **Prepare after capture** for private originals; check privacy before uploading.
4. If connectivity drops or a photo is uncertain, reconnect, manually **Refresh assigned jobs first**, then **Recheck job evidence** and **Inspect pending photo**. Select the exact original file for existing guarded recovery; never duplicate an unconfirmed upload.
5. Check the independent Build 749 QC decision and obtain the separate genuine customer handoff. The guide does not sign or complete the job.
