# Rosie Dazzlers 876 — Original Signed Native Provider Field Readback, Automated Refund Drift Escalation Policy & Owner Closure Artifact Revalidation

## Release scope
- No new Supabase schema, no new customer messaging, no original booking/payment writes.
- Existing Rosie Supabase original service role, staff sessions and source-readback permissions continue. Code/Cloudflare release GREEN is separate from real third-party enrollment and physical-device pilot acceptance.

## 1. Original signed native provider field readback
- Original `POST /api/roadside_native_resend_v875` continues to require **verified native Resend/Svix HMAC** over the unmodified body, fresh timestamp, original provider message ID, consented recipient hash and existing accepted one-shot quote dispatch. Build 876 stamps successfully authenticated webhook event IDs as `native-resend:<svix-id>` in the original private signed-receipt ledger. The generic Build 872 relay is prohibited from writing that reserved provenance prefix. Earlier unmarked provider receipts **cannot be retroactively certified as native**.
- Owner-only `GET /api/admin/roadside_native_field_v876?draft_id=<UUID>` reads exact private draft, quote share, original dispatch and signed receipts. Only when the original Resend integration is explicitly configured (`ROSIE_ROADSIDE_NATIVE_PROVIDER=resend_svix`, original `ROSIE_ROADSIDE_RESEND_WEBHOOK_SECRET` and original `RESEND_API_KEY`) does it also perform read-only `GET https://api.resend.com/emails/<original ID>`. Server compares original email ID, single consented recipient hash, live `last_event=delivered`, active original share and a **native-prefixed, independently signed original delivered receipt**. Missing, stale, revoked, changed or non-native sources remain HOLD.
- An email's provider-reported delivery is NOT inbox-read/customer-confirmed. Original provider account setup and a genuinely signed field event cannot be installed or simulated from a code commit. Never send a test email to a real customer without fresh authorization.

## 2. Automated original refund drift escalation
- The Build 875 owner-only on-demand original Stripe/PayPal check now emits a deterministic owner policy: **CRITICAL (1-hour target)** for changed source amounts/booking mismatch; **HIGH (4-hour target)** for missing/inconsistent original provider source; **REVIEW (24-hour target)** for stale or missing baseline; and **NONE** for a fresh complete matching source. Targets are operator recommendations, not a claimed delivered alert.
- An **opt-in scheduled watcher** at `POST /api/roadside_drift_watch_v876` requires `ROSIE_ROADSIDE_ESCALATION_ENABLED=true` on original Cloudflare and a separately provisioned `ROSIE_ROADSIDE_ESCALATION_JOB_SECRET` (at least 32 characters). The **same secret** must be stored as the private GitHub Actions repository secret. The scheduled `rosie876-refund-owner-watch.yml` runs every two hours (UTC) and, when configured, checks at most eight distinct original booking deposits from the latest 24 hours of saved source checks. It performs original provider readbacks sequentially. Limited coverage is explicitly marked PARTIAL and escalated for owner attention.
- `scripts/build876_refund_watch_runner.mjs` raises or updates one **private GitHub owner issue** on owner-actionable states, without names, addresses, booking IDs, phone numbers, secrets or deposit amounts. It avoids duplicate issues for an unchanged severity; it never closes the issue on its own. If the secret is not provisioned, the workflow reports **NOT ENROLLED** and does not imply a live monitor.
- No actual refund, invoice adjustment, payment transfer, customer message, new booking, auto closure or external owner approval is performed. A source conflict blocks independent acceptance until resolved.

## 3. Owner historical closure artifact revalidation
- After an actual Build 873 original owner-accepted closure is saved, the Build 874 download produces a private JSON dossier. Build 876 adds a file picker and **Revalidate downloaded owner dossier** control inside both Admin Booking page copies. It POSTs to `/api/admin/roadside_artifact_revalidate_v876` with the original draft ID, using a signed-in Admin session. It accepts JSON only with bounded sizes.
- The server validates the original Build 874 envelope and SHA-256 digest and **independently reads the exact original private closure, dispatch, accepted physical-device record, net deposit snapshot and signed provider receipt/case history** from the original Rosie Supabase project. Every exported row must match its actual saved source. Later cases can coexist with the historical artifact but remain disclosed as current HOLD.
- `HISTORICAL_ARTIFACT_REVALIDATED` means a point-in-time saved artifact still corresponds to the original source records. SHA-256 is not an independent digital signature; it does NOT prove current financial clearance, a new signed provider callback, future refund absence, or offsite owner approval. Invalid, missing, stale-source identities or tampered artifacts fail closed.

## Release verification / owner activation
1. `node scripts/build876_native_escalation_artifact_test.mjs` and existing current source/business acceptance. Promote feature → protected `dev` → protected `main` with exact head SHA, and independently check final Cloudflare Production deployment, live contextual smoke, and Release Health Dashboard GREEN.
2. To activate *real* provider-native readback, verify the original email vendor is Resend. Only then provision the original native webhook receiver and secret, original API key and actual signed callback into the original private ledger. Do not add genuine secrets to GitHub source or clients.
3. To activate the scheduled watch, configure both identical owner scheduler secrets outside source; the scheduled workflow is a code capability, not proof that an owner issue has been sent. GitHub Actions issues write permission must be enabled. Review alerts and source records as the original authorized owner.
4. Pilot closures stay HOLD if no authentic native event, independently accepted real device, verified financial snapshot or explicit original owner decision exists.

Verification references:
- Resend provider email readback and `last_event`: https://resend.com/changelog/message-id-for-sent-emails
- Resend authenticated native webhook: https://resend.com/changelog/managing-webhooks-via-api
- GitHub scheduled workflow configuration: https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax
- Supabase server-side RLS: https://supabase.com/docs/guides/database/postgres/row-level-security

**Next proposed Build 877 — Authenticated Original Provider Enrollment Evidence, Owner Refund Escalation SLA Audit & Independent Closure Dossier Provenance Renewal.**
