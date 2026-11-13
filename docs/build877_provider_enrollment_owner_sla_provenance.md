# Rosie Dazzlers Build 877 — Original Provider Enrollment, Owner Refund SLA & Independent-Key Closure Provenance

## Purpose and trust boundaries
Build 877 adds three **owner-only, read-only verification** surfaces. Release GREEN must not be presented as external vendor enrollment, actual customer delivery, physical device acceptance, owner sign-off, or financial clearance. No new Supabase migration or external customer contact is performed.

### Original native provider enrollment evidence
- Owner GET: `/api/admin/roadside_provider_enrollment_v877`. Requires an original signed-in Admin session (no legacy password fallback). When `ROSIE_ROADSIDE_NATIVE_PROVIDER=resend_svix`, a valid original Resend API key and the original webhook signing secret are configured, the Worker calls the original Resend API `GET https://api.resend.com/webhooks/<original ID>` if `ROSIE_ROADSIDE_RESEND_WEBHOOK_ID` is supplied; otherwise bounded `GET /webhooks?limit=100`.
- To reach `REGISTRATION_VERIFIED`, the original account must yield exactly one registration (or the explicit original webhook ID), matching **exact** production callback `https://rosiedazzlers.ca/api/roadside_native_resend_v875`, status `enabled`, and event subscriptions for `email.delivered`, `email.bounced`, and `email.failed`. Incomplete pagination, duplicate endpoints, mismatched ID, disabled registration or unavailable API stay `ENROLLMENT_HOLD`.
- Resend API readback might omit `signing_secret`. In that case `signing_key_binding_verified=false`. If the original provider returns it, the server compares digest-equivalence with the deployed original callback secret without disclosing either key. A matching registration is NOT proof of a real signed event, which still requires the independently verified Build 876 native callback and original provider readback. No webhook is created, enabled, replayed or rotated.
- The app supports a provider-neutral original outbound notification bridge; only activate native Resend verification after the **actual original vendor** is confirmed. Leave the code disabled for other vendors. No provider key or signed event is stored in GitHub source.
- Public references: Resend webhook API `GET /webhooks` and `GET /webhooks/{id}` at https://github.com/resend/resend-openapi/blob/main/resend.yaml ; provider management https://resend.com/changelog/managing-webhooks-via-api .

### Owner refund SLA audit
- Owner GET `/api/admin/roadside_sla_audit_v877?draft_id=<original UUID>` makes an original live Stripe/PayPal source readback (using existing Build 871/874 code), compares the last exact original deposit check, loads original private `rosie_roadside_refund_cases_v872` history and assesses the Build 876 owner urgency.
- The **original unresolved exception `opened_at`** provides an immutable deadline anchor; a page refresh NEVER resets the clock. Recommended response targets: CRITICAL 1 hour, HIGH 4 hours, REVIEW 24 hours. Returns `SLA_BREACHED`, `SLA_WITHIN_POLICY`, `NO_CURRENT_ALERT`, or `SLA_UNANCHORED_HOLD`. No original case means no authoritative case timestamp: report UNANCHORED, not “within SLA”. This checks evidence and calculates a target, not a claim the owner was notified or a payment has cleared.
- Existing scheduled Build 876 refund-watch can still create/update one private GitHub issue only when its original matching secret and explicit scheduler opt-in are configured. Build 877 does not silently activate it.

### Closure dossier provenance renewal
- The owner selects a previously downloaded original Build 874 historical closure JSON, then clicks **Renew signed closure provenance** in Admin Booking (both main and index copies).
- Owner-only POST `/api/admin/roadside_provenance_renew_v877` first reuses the exact Build 876 authorization, historical digest check and original Supabase closure, dispatch, device, refund and signed receipt/case source equality. Without a legitimately recorded closure it returns HOLD.
- Only after all checks pass, a **separate private Ed25519 issuer key** signs a compact JSON provenance sidecar naming the exact historical SHA-256 artifact digest, original draft/closure references, issuance time and dedicated owner issuer key fingerprint. The public JWK is included so the signature can be independently verified offline; trust in that public key must still be established outside the generated file. The issuer key must be explicitly enrolled in Cloudflare environment secrets:
  - `ROSIE_CLOSURE_ISSUER_ED25519_PRIVATE_JWK` = independently controlled private OKP/Ed25519 signing JWK, never committed or exposed to clients
  - `ROSIE_CLOSURE_ISSUER_ED25519_PUBLIC_JWK` = matching pinned public OKP/Ed25519 JWK (and preferably separately published fingerprint)
- Signing key enrollment is **HOLD** until provisioned. This is an independently keyed OWNER issuer attestation, NOT an independent third-party witness or offsite timestamp, NOT a statement that the owner reviewed this latest output, and NOT proof of current refund totals. No original dossier bytes, customer details or credentials are included in the sidecar.
- New owner exports include original `provider_message_id` in receipts; older Build 874 exports can still be checked against all fields historically present. The verification function still checks original receipt event IDs, types, and status. Any changed content/digest is rejected.

### Release and operator verification
1. `node scripts/build877_provider_sla_provenance_test.mjs` and original Build 876 and source/business acceptance suites. Negative cases cover nonexistent provider registration, disabled/missing events, signing-key mismatch, missing original case anchor, elapsed SLA, tampered signature, and different pinned issuer key.
2. Commit through feature → `dev` → protected `main`. Independently confirm exact final SHA, Cloudflare Pages live site/Functions smoke and **Release Health Dashboard GREEN**. This confirms deployment, not external vendor acceptance.
3. Provider registration review, independent-key issuance and actual original roadside field evidence are manually owner-gated. Existing original Supabase rows must not be fabricated. All missing original evidence stays HOLD.

**Next proposed Build 878 — Original Vendor-Native Webhook Event Delivery Evidence, Persisted Owner SLA Acknowledgment & Pinned Provenance Verification/Rotation Readiness.**
