# Build 616 — Photo Studio Autosave Failure Recovery

## Scope and operating mode

Photo Management Studio currently saves metadata by an explicit Save button;
there is **no background metadata autosave** to retry. The old endpoint used
an unconditional update. This build gives that save the same safety expected
of recovery from failed autosave: a previously observed server revision is
mandatory, and PostgREST applies the `id` and `updated_at` filters as one
conditional database operation. A zero-row update is HTTP 409, not success.

Only managed photo metadata is covered. Existing assignment, R2 upload,
rename, delete, and synchronization endpoints retain their separate explicit
operator controls and must never be retried automatically. Build 617 handles
R2 sync reconciliation, including any concurrently edited metadata; do not
describe 616 as proof that every R2 workflow is conflict-safe.

## Recovery

1. When Save fails (503, upstream response failure, uncertain network state,
   409 stale revision, or missing expected revision), the editor retains its
   fields and shows a copyable recovery JSON draft. The original revision is
   included for diagnosis but cannot force an overwrite.
2. **Check current saved version** makes a *read-only* authenticated GET for
   that photo and compares the server `updated_at` with the loaded revision.
3. If unchanged, staff may choose to press Save again after examining the
   failure; there is no timer, exponential retry or implicit write.
4. If changed, the UI warns that another edit or the earlier uncertain save
   may already have succeeded. Staff can copy the form draft, deliberately
   discard/reload the confirmed saved version, then re-enter selected changes.
5. Changing photo, closing the editor, refreshing the library or leaving the
   page asks before discarding an unsaved form. A confirmed save supplies the
   next server revision; even if the follow-up library refresh fails, the
   client does not send another write.

## Boundaries and verification

- No database migration or new production secret is needed; existing
  `app_media_library.updated_at` is used for optimistic concurrency.
- The save route removes two redundant schema-probe fetches; it performs one
  bounded PostgREST PATCH after staff authentication. The recovery read is one
  bounded GET. Neither route automatically retries.
- 1102 is a Worker resource-limit indication, not proof of a specific single
  root cause. Client messaging also recognizes 429/502/503/504 and Worker HTML
  error bodies. Consult Cloudflare Workers runtime metrics for exact diagnosis.
- Read-only source tests simulate 428/409/503, unknown write outcome, the
  returned server revision, and an unavailable review GET. No production
  photo, R2 file, assignment, or customer data is mutated by acceptance tests.
- Protected `main` and exact-sha Cloudflare Production evidence are recorded
  separately, once actually observed. Source tests alone do not imply GREEN.

Authoritative references:

- Cloudflare Workers limits: https://developers.cloudflare.com/workers/platform/limits/
- Cloudflare Worker error 1102: https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-1xxx-errors/error-1102/
- Supabase filtered updates: https://supabase.com/docs/reference/javascript/update
