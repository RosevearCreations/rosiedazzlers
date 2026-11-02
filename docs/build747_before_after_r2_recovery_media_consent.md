# Build 747 — Before/After Photo Capture, R2 Recovery & Media Consent

Build 747 extends the existing Build 383/746 detailer evidence, `job_media`,
`live_upload_sessions`, `booking_events` and public R2 Photo Studio. It does not
introduce a second photo ledger, publish private evidence or migrate customer
files into the public R2 bucket. Private original uploads use the existing
Supabase Storage signer; Photo Studio's *approved public* library uses R2.

## Staff private capture

1. Sign in, open the assigned job and record the current Build 746 onsite
   customer permission **for private job evidence**. Consent is rechecked on
   both signed upload creation and final media registration.
2. Choose Before, During, After, Issue or General; preview the actual original
   on-device. Confirm inspection for faces, plates and addresses and classify
   the file as clear or containing sensitive identifiers. **Both are private.**
3. A unique, booking/stage-scoped private upload path and durable upload
   session are created before the direct transfer. The browser calculates an
   original photo SHA-256; the server verifies storage object existence and
   size, stage, original session, staff scope and current consent before
   registering one `job_media` record. A new After record needs prior Before
   evidence. An identical photo hash cannot be reused as an authentic pair.
4. The provenance `booking_events` receipt includes original hash, path,
   consent receipt/revision, privacy classification and **no thumbnail**.
   Gallery and marketing remain `not_queued` / unapproved. The browser does
   not manufacture derivatives or claim a redacted copy exists.

## Explicit recovery, no automatic replay

- On an interrupted PUT or ambiguous DB commit, **Inspect / recover pending
  upload** reconciles the saved media row and storage object *without writing*.
  The session ID and non-image metadata survive a same-tab refresh; the file
  itself is **not** persisted. Re-select the same original file to register it.
- `media_saved` means stop: the record already exists. `uploaded_unregistered`
  means review the original then deliberately resume the existing session;
  `file_missing` means reselect and request a **new** signed upload. Unknown
  storage state means stop, not retry. A stuck `committing` session can be
  explicitly reopened only after three minutes and a verified read showing no
  saved media, with a revision-checked status change.
- Per-session status is claimed with a conditional `updated_at`/status check.
  Another request cannot silently duplicate that session. If an audit receipt
  fails after a DB insert, recovery discovers the saved media and requires
  owner investigation instead of a second transfer.

## R2/public approval boundary

- The approved-prefix R2 sync is bounded and keeps all new photos held for
  review. Its prefix/cursor checkpoint survives an admin tab refresh, but
  **Resume** remains an explicit operator action; no background retries.
- Activating a review-held public image requires verified public rights and
  consent notes, a faces/plates/addresses classification (clear or genuinely
  redacted copy), and attestation of original R2 key/ETag and authentic
  Before/After provenance. The review result is included in the saved license
  notes. The existing placement authority separately refuses private keys and
  reusing the same image as both sides of a public pair.
- These are **staff assertions**, not computer-vision verification, customer
  signatures or a live owner media review. Staff must inspect actual pixels,
  confirm the relevant person's consent and manually redact before public use.

## Verification

```sh
node scripts/build747_photo_r2_consent_test.mjs
node scripts/build746_onsite_setup_test.mjs
node scripts/build391_photo_studio_r2_reliability_test.mjs
node scripts/r2_media_sync_publication_617_test.mjs
node scripts/photo_studio_autosave_recovery_616_test.mjs
bash scripts/current_booking_wizard_regression.sh
python3 scripts/mobile_detailer_field_workflow_check.py
python3 scripts/release_check.py
```

No live customer photo was captured, customer consent granted, R2 object
transferred, public placement changed or owner acceptance asserted by these
source tests. The live staff/device and media-permission drill remains an
independent owner acceptance step.

**Next queued:** Build 748 — Staff Time, Breaks, Travel & Shift Reconciliation.
