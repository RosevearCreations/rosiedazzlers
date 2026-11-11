# Rosie Dazzlers 845 — Real Provider Enrollment, Recall Escalations and Device Pilot

Release state: **software release candidate**. Protected `dev`/`main` checks and exact-SHA Cloudflare Production verification are required before declaring this code GREEN. Real account credentials, customer consent, external recall, independent device witness and Master Shell trust remain separate evidence gates.

## Implemented scope

1. Owner-only `GET/POST /api/admin/jobday_provider_pilot_845` with existing private role boundary and existing service-role-backed `creative_projects`, `creative_project_audit`, `social_post_queue` and `social_dispatch_attempts` ledgers. The job-scoped Socials workspace includes an accessible Build 845 panel on both canonical admin URLs. All actions require a non-sensitive case ID; no token entry in the browser.
2. **Real, authenticated, read-only Meta account enrollment:** an explicitly configured `META_GRAPH_VERSION`, `FACEBOOK_PAGE_ID`/`META_FACEBOOK_PAGE_ID` plus `FACEBOOK_PAGE_ACCESS_TOKEN`/`META_PAGE_ACCESS_TOKEN`, or Instagram Business account ID plus `INSTAGRAM_ACCESS_TOKEN`/eligible Page token, are required in the protected runtime. The owner requests a fixed-origin HTTPS `GET` of the exact expected account with `fields=id`, with a bearer token in the request header, no redirects, strict ID matching, bounded response, 8-second timeout and no logged tokens. Only an HTTP 200 matching account is durably recorded in the per-job audit with a SHA-256 response digest and owner case ID. This does **not** attest permission scope for every operation or establish a global provider connector.
3. **Authenticated post visibility:** for enrolled job/provider accounts, read-only Meta Graph `GET` checks the recorded Facebook Page post or Instagram Business media ID and validates an HTTP 200, same external post ID, and permitted HTTPS provider permalink. Source ID, queue ID and owner record remain linked in the durable attempt ledger. This proves a read-only API response from the configured credential at that moment; it is **not a native provider signature** and is distinct from Build 844's independently signed witness. HTTP 404, expired permissions, ID/permalink mismatch or network failure are HOLD; none constitute verified deletion. Revoked content may be checked for remaining public visibility but cannot be republished.
4. **Recall outcome escalations:** the private job worklist distinguishes consent-revoked `recall_required`, independently witnessed removal, origin R2 deletion, and unresolved 24/72-hour cases. An owner may open a case-bound route to provider support, customer follow-up, privacy supervisor or legal review. Repeat case admission, non-revoked content and post-removal false escalation are blocked. The action only records follow-up; it does **not** call a provider DELETE, claim actual takedown, invalidate CDN caches or delete private DAIP sources.
5. **Original-device acceptance pilot:** a job-scoped owner review must cite a recent actual Build 844 signed independent device-witness audit (which in turn is tied to Build 842 original observation and Build 843 owner closure), exact device type and two specific acknowledgements. Its immutable private record can only affirm a scoped owner pilot review, **not** cryptographic hardware attestation, broader customer-device acceptance or production business signoff.

## Security and operational setup

- Source/provider configuration must be installed by an authorized runtime operator in protected Cloudflare settings (never committed, logged, pasted into forms or repurposed from other suite apps). `META_GRAPH_VERSION` must be explicitly set to a provider-supported `vN.N` value. Source-known Facebook and Instagram credential names are reused. Tokens remain server-side; adapter responses return config booleans and safe outcome references only.
- External calls are fixed to `https://graph.facebook.com` with strict account/media ID shapes and no redirects. They cannot be directed to caller-supplied URLs. The recorded platform permalink is checked against permitted hostnames; no provider body/token is returned to the browser or retained in the audit, only an SHA-256 digest and narrow assertions.
- Owner review is scoped to an existing DAIP-linked booking with private staff authorization; no tenant/cross-business routing, media upload, social publication, platform deletion, new table, Supabase migration, or Windows scheduled task.
- Account enrollment, post visibility, 844 independent removal/device witnesses, R2 origin deletion, provider takedown, physical hardware and AI Data/Comms master ingestion are **distinct** statuses. Do not project CONNECTED, approved, removed or globally accepted without independent evidence from the original system and a separate owner acceptance decision.

## Verification

```sh
node scripts/build845_provider_adapter_recall_device_test.mjs
bash scripts/current_booking_wizard_regression.sh
python scripts/release_check.py
python scripts/release_authority_documentation_convergence_check.py
```

The deterministic test uses a fake private DB and intercepted Graph endpoint (never real customer credentials) to verify negative authorization, missing/expired provider configuration, authenticated 200, 401/404, malicious permalink, mismatched ID, tokens not exposed, revoked-consent visibility, escalation duplication, original-device witness and both UI paths. The real external adapter/account/device pilot remains HOLD unless runtime enrolled and independently observed.

**AI Data Platform coordination:** No Master-side write/contract is necessary to implement this scoped Rosie owner workflow. AI Data must **not** mark the Rosie social, source signer or Master connection `CONNECTED` on this software release alone. A future authorized Master feed must consume only source-bound redacted state with original receipt evidence and explicit consent/owner decisions, never social provider tokens, public/private customer media or cross-tenant records.

Next proposed **Build 846 — Provider Account Capability Verification, Recall SLA Closure & Master Intelligence Source Projection**, conditional on authenticated provider ownership, durable takedown evidence, original device acceptance and separately authorized AI Data consumer contract; otherwise HOLD-first supervised read-only review.
