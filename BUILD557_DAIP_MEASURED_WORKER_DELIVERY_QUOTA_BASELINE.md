# Build 557 — DAIP Measured Worker Delivery & Quota Baseline

On the protected DAIP Large Media Intake page, a selected real Creative Project has an on-demand read-only worker delivery and quota evidence review. It joins actual processing-job metadata returned by the authenticated DAIP dashboard with optional locally supplied operator delivery receipts and provider quota observations.

A receipt must match a completed job ID from the selected project, provide dated source and worker references, finite nonnegative CPU, elapsed time, private output bytes and CAD cost, and declare succeeded. Duplicate, foreign-project, future-dated or conflicting entries fail closed. The quota observation supplies an explicit time window, source reference and CPU/storage/dispatch/cost ceiling; utilization is calculated only against supplied figures.

**Truth boundary:** These are operator-typed records, not independently signed worker receipts, verified Cloudflare billing API data, or an inspected rendered media file. No worker is dispatched, no database or R2 object is written, no customer details or private raw media keys belong in input/export, and no publishing is performed. Owner-approved hosting, budget, actual delivery proof, media inspection, consent, privacy/redaction and channel publishing authorization stay gated.

Example receipt JSON:
[{"job_id":"known-completed-job-id","outcome":"succeeded","source_reference":"worker-log-001","worker_reference":"worker-001","observed_at":"2026-10-14T14:00:00Z","cpu_ms":200,"elapsed_ms":400,"private_output_bytes":2000,"cost_cad":0.10}]

Example quota JSON:
{"window_start":"2026-10-14T00:00:00Z","window_end":"2026-10-15T00:00:00Z","observed_at":"2026-10-14T14:00:00Z","source_reference":"provider-quota-001","cpu_limit_ms":1000,"storage_limit_bytes":10000,"dispatch_limit":5,"cost_ceiling_cad":10}

Source regression: node scripts/daip_worker_delivery_quota_557_test.mjs and python scripts/daip_worker_delivery_quota_557_check.py. Protected feature/dev/main PR and exact-SHA Cloudflare development and independent production deployment/runtime/business acceptance are required before Production GREEN.

**Next:** Build 558 — Real Media Artifact and Consent Acceptance.
