# Build 843 — Per-Platform Published-Post Confirmation, Consent Recall & Owner Mobile Closure

Status: **software Production GREEN** — [dev #947](https://github.com/RosevearCreations/rosiedazzlers/pull/947), [main #948](https://github.com/RosevearCreations/rosiedazzlers/pull/948), [six-job exact-SHA Cloudflare Production #42957786112](https://github.com/RosevearCreations/rosiedazzlers/actions/runs/42957786112). Code GREEN never means a social provider, original owner device, customer consent or independently verified takedown is GREEN. This documentation closure itself needs a separate exact-main Production proof.

## Bounded release contract

- `GET /api/admin/jobday_platform_recall_843?booking_id=<uuid>` is owner-only and returns sanitized tagged-post per-platform state, previous owner observations, external-recall flags and original-device owner closure evidence. Private customer uploads and credentials never leave the server.
- `POST` action `confirm_platform_post` records an append-only `owner_observed_live_post` attempt **only** when a booked DAIP-tagged item is genuinely marked `posted`, it has a `posted_at`, a matching known external provider ID and URL, an HTTPS URL on that platform's exact allowlisted host, a non-sensitive evidence reference, and current public-use approval. This is an owner observation, **not** an independent social API receipt, and it does not initiate posting.
- `POST` action `revoke_public_consent` requires an explicit reason, private evidence reference and external-removal acknowledgement. It first records a durable `Build 843 consent revoked:` project audit, then declines the project's public-use consent and marks tagged queue rows failed while retaining the original public-post URL/ID and timestamp. It adds `recall_required` social attempt records and returns an external-post takedown worklist. Existing published posts and public Photo Studio derivatives need separate **manually verified recall**. No platform deletion is claimed.
- The shared Build 842 source/publish gate reads the revocation audit directly. Reverting an old `creative_projects` approval flag is insufficient to restore publishing; a separate customer/owner-reviewed consent episode must be modeled independently before ever allowing reuse.
- `POST` action `close_mobile_accessibility` needs a recent same-device Build 842 owner-observed PASS plus fresh non-sensitive accessibility, recovery and owner-review references. It writes an append-only owner closure note; **independent device acceptance stays HOLD**.
- All routes require staff capability plus owner authority, use the existing service-only Supabase database privileges, and preserve the established DAIP/private-media, business and Master Shell boundaries. No new database migrations, social service credentials, generic tenant data reads or background Windows tasks are introduced.

## Guardrails and operator follow-up

1. A customer/owner withdrawal disables future public-use automation. Review the returned worklist against each actual Facebook, Instagram, X, TikTok, YouTube, LinkedIn or Google Business Profile post. Capture authenticated external removal proof separately. A queue `failed` status alone is **not** takedown confirmation.
2. A distinct Photo Studio public derivative must be reviewed for recall; removal of private source evidence is **not** authorized.
3. Never claim original customer consent, provider-confirmed delivery, owner-device acceptance or Master integration based on tests or owner-entered checkboxes. Those external acceptance gates are independent of Software Production GREEN.

## Local software checks

```sh
node scripts/build842_owner_device_derivative_delivery_test.mjs
node scripts/build843_platform_recall_mobile_closure_test.mjs
bash scripts/current_booking_wizard_regression.sh
python scripts/release_check.py
python scripts/release_authority_documentation_convergence_check.py
```

Next conditional Build **844 — Provider-Verified Post/Takedown Receipt Reconciliation, Public Derivative Recall & Independent Device Acceptance**. External provider/owner proof is mandatory before marking any real-world outcome accepted.
