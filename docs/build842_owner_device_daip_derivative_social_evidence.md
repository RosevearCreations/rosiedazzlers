# Rosie Dazzlers 842 — Owner Device, DAIP Derivative & Social Delivery Evidence

**Verified software release (November 10, 2026):** [dev #943](https://github.com/RosevearCreations/rosiedazzlers/pull/943) → [main #944](https://github.com/RosevearCreations/rosiedazzlers/pull/944) → [six-job exact-SHA Production #42936417081](https://github.com/RosevearCreations/rosiedazzlers/actions/runs/42936417081), immutable feature `main` `bb12d7a7a234a175a481f93ece2aac3ddab64440`; 189 successful main checks, zero failures. **External original-device/owner/customer/provider acceptance remains HOLD.**

## Source contract

Build 842 continues the Build 841 customer/detailer job-day and Socials creator without changing canonical booking or original private-media storage. Software GREEN is **not** an original-device, customer-consent, provider, owner, DAIP consumer or public-post acceptance claim.

### Original-device owner observation

- Socials > Create from Job > **Job-day owner evidence** reads an authorized job's bounded observations and social queue status only on explicit refresh.
- Owners can record an observed phone/tablet/desktop outcome and non-sensitive evidence reference after affirming accessible controls and manual failure recovery. This writes a private Creative Project audit note; it does not alter global launch/device acceptance or independently validate that device.
- Owner can open existing original-device acceptance authority; no new Windows task, receiver, polling loop or automated test is introduced.

### DAIP → Photo Studio → Social Queue

1. Source job upload remains private. Build 841 source ID must already be tagged in the booking-bound Creative Project and a job-specific draft must exist.
2. The server re-evaluates the canonical DAIP media-workflow gate: selected uploaded media all approved for public use, current project public consent and publish permission, approved content package and session, required before/after stages, no failed/dead-letter media processing, and no expired project consent.
3. The owner selects one **existing active approved-public Photo Studio image** by its UUID, attests the edited derivative's lineage and privacy review, and supplies an internal export/consent reference. The server resolves the URL only from the approved R2 public-image prefix; arbitrary client URLs/private media keys cannot be supplied.
4. The service records a source/post/project/photo-bound handoff attempt in `social_dispatch_attempts` before updating only a `draft` social row. The row remains `needs_review` with all privacy confirmation flags false. Public image *provenance* is owner-attested here; it is **not independently proven** by the existing Photo Studio schema.
5. The Social Queue server refuses `approve_ready` until the current DAIP gate and matching handoff audit remain valid, explicit customer/plate/caption approvals are present, and the authorized owner confirms final review. Publish/API, webhook and manual mark-posted re-evaluate the same source-bound handoff gate and existing publishable/privacy criteria.

No private R2 object is copied or exposed. No automatic social publication occurs. A provider's API reported success, webhook accepted status or manual “posted” claim is recorded distinctly. None alone proves independent social-network visibility, and missing credentials/receipts remain HOLD.

### Distinct illustrative card artwork

`scripts/build842_generate_card_art.mjs` reproducibly generates **85 separately named static SVG illustrations** in `assets/card-art-842/`: 72 workflow cards, 7 launcher modules and 6 customer cards. Every card references its own asset; no external fonts, network image requests, customer photos or unapproved source proof. The icons use Rosie's dark/gold metallic palette. `--check` verifies the committed manifest/assets.

The canonical application-controlled image inventory is regenerated with `node scripts/build_application_static_image_catalog.mjs --write` and checked in; its count rises from 116 to 201 exactly. New Build 842 art is **appended after all original 116 IDs**, preserving every pre-existing image identifier. Builds 611 and 612 assert the extended count and the stable original sequence.

### Verification and deployment

- `node scripts/build842_generate_card_art.mjs --check`
- `node scripts/build842_owner_device_derivative_delivery_test.mjs`
- `node scripts/build_application_static_image_catalog.mjs --check` and `node scripts/build611_image_catalog_test.mjs`
- `bash scripts/current_booking_wizard_regression.sh`
- `python scripts/release_authority_documentation_convergence_check.py`
- Protected PR to `dev`, then protected PR to `main`, all required checks, exact-commit Cloudflare Production workflow GREEN. No force-push or unchecked branch promotion.

### Runtime owner follow-up, independent of software promotion

- Use a *real* authorized job and its original owner device; inspect focus/keyboard/voice support, loss-of-network and explicit recovery. Provide a non-sensitive observation reference. A test harness does not count as original-device proof.
- Confirm the *actual* customer's current public-use rights, selected DAIP media, edited public derivative and export provenance. Revoke consent if withdrawn and verify publish blocking.
- Independently inspect the live social provider post ID/URL after actual API/webhook/manual publication; receipt status must not be inferred from a deployed source file.

**Proposed next Build 843:** *Per-Platform Published-Post Confirmation, Consent Revocation Recall & Owner-Verified Mobile Accessibility Closure.* Only proceed after Build 842 exact-main source promotion and independent gate status disclosure.
