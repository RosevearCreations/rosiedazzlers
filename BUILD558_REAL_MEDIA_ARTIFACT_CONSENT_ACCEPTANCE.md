# Build 558 — Real Media Artifact and Consent Acceptance

The protected DAIP media workspace can now check a selected uploaded project's raw original against the actual private Cloudflare R2 object. A staff-authenticated read-only endpoint uses Supabase-verified project and asset ownership to look up the object key; it only executes R2 HEAD. Neither the key nor media bytes nor a download URL are returned. Positive object size must match the stored byte count; a recorded ETag must match if present.

The operator may provide a sanitized signed-consent document reference and dated privacy/audio review. These declarations are not independent verification of the signature, of the rendered derivative, or of inspection of raw media content. Recorded project/asset consent status is reported but does not by itself release a video. Expired/declined consent remains a blocker.

**Truth boundary:** Object existence is confirmed only when an actual authorized R2 HEAD succeeds. This never creates an output artifact, dispatches a worker, edits a database, changes HOLD state, makes a public object, or posts social content. Rendered derivative inspection, actual signed-customer-consent proof, redaction and channel authorization remain HOLD. DAIP owner decisions on worker platform, budgets and rights remain open.

Regression: `node scripts/daip_real_artifact_consent_558_test.mjs` and `python scripts/daip_real_artifact_consent_558_check.py`. Promote through protected feature, dev and main workflows and verify exact Cloudflare production SHA.

**Next:** Build 559 — Rendered Derivative Inspection and Private Approval Evidence.
