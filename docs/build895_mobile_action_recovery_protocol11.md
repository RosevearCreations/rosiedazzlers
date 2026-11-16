# Rosie Dazzlers Build 895 — Mobile Detailer Action Recovery and Protocol 1.1 Independent Sync

## Concrete changes in the established /app/detailer/ workspace
- Retains the Build 745 signed-in, assigned-job-only read-only offline board and the Build 805 checklist, private photos, onsite proof and signed recovery gates; no second job database or offline queue.
- Captures one exact immutable `booking_id`, `updated_at`, canonical workflow stage and connectivity epoch before preparing a staff action.
- Disables all other workflow-action buttons during one in-flight action. A second click cannot schedule a second client request.
- Arrival location may take time to resolve. After the location lookup—and before sending **any** mutation—the app rechecks that the **same assigned job, revision, stage, allowed action and connection epoch** remain current. A job switch, offline/online event or concurrent manual refresh prevents a stale action.
- If the network outcome is uncertain, or the server response arrives after job/connection context changed, the app **does not replay** the action, freezes workflow writes and displays an accessible recovery panel.
- Detailer must manually refresh/reconcile the original signed-in assignments and stage. The panel reports whether the assignment disappeared, stage changed or revision changed; it never infers that payment, job work or notifications succeeded. Only after reviewing the current source does the staff member explicitly acknowledge the uncertain outcome to unlock *new* actions.
- Recovery state and original job snapshot remain **in the open tab's memory only**. No localStorage, IndexedDB, offline write queue, background sync, PII or automatic retry is added.
- Existing original server-side staff role, same-origin session, exact assignment, stage gates, quality checks and optimistic compare-and-swap still authorize or deny all changes; the client guard cannot grant any new access.

## Rosie communication contract, local only
- Add `releaseCoordination` for **protocol 1.1** to `.github/rosevear-master-communications.v1.json`, retaining compatibility with protocol **1.0** and the original `CONTRACT_READY` connection state.
- Independent local additive releases allowed; unavailable/incompatible Vercel-hosted peers hold **only dependent cross-app capabilities**, never the unrelated Rosie detailer job workspace.
- A local read-only capability compatibility function accepts only known `HEALTH_EVIDENCE` and `CORRELATION_EVENT` contracts for major version 1 peers (minor 0/1). Unknown capabilities and other major versions fail closed. **Contract compatibility is never a live connection or authorization.**
- No peer DB write, raw-key/secret sync, T4/T5 delegation, outbound cross-app request, or YW/iCamp/AI Data deployment. Signed transport, issuer audience, tenant, consent, replay ledger, independent ACK and owner authorization still gate actual communication.

## Source regression
`node --test tests/build895_detailer_mobile_sync.test.mjs`

`node scripts/build745_detailer_mobile_offline_continuity_test.mjs`

`node scripts/build805_mobile_job_guide_test.mjs`

`node --check apps/detailer/detailer-app.js`

All new tests use synthetic action contexts and do not create or alter bookings.

## Outstanding release acceptance
Full **Build 892** original Stripe/PayPal sandbox and both booking paths, **Build 893** genuine customer-account and vehicle-garage device acceptance, **Build 894** real Supabase/Cloudflare photo upload/recovery and **Build 895** real staff/device tests all remain independently gated. A protected feature/branch PR and `dev/main` test results do not alone prove exact-main deployed Cloudflare Pages/Functions SHA, release-health GREEN, queue WITHIN_BUDGET, authenticated inter-app CONNECTED, or T5 receiver activation.

**Ordered seven-app handoff (record only):** ai-data-platform → rosevear-ai-hub → rosevear-comms-hub → iCamp → YW → devilndove-site → rosiedazzlers. No lockstep release. YW, iCamp and AI Data Vercel quota blocks need not block an unrelated Rosie local release. Source: [AI Data Build 408](https://github.com/RosevearCreations/ai-data-platform/blob/main/docs/BUILD_408_FINE_GRAINED_AUTHORIZATION_CONSENT_INDEPENDENT_SYNC.md).

**Next queued build:** Rosie 896 — Scheduling Capacity, Territories & Availability; do not start before current release gate review.
