# Rosie Dazzlers Build 904 — Supervisor Outbox Review, Manual Delivery Authority & Consent Revalidation (Still No Auto-Send)

## Scope
An additive source-only, private supervisor review workflow for the original 903 internal UNSENT notification draft. Builds 901–903 and original job-day dispatch remain unchanged. This release lets two different signed Rosie supervisors independently assess a proposed manual service contact without ever automating or performing contact.

## Source-linked procedure
1. The Build 903 current original verified owner selects their original active UNSENT internal draft, a proposed manual service channel (email/SMS/phone) and a signed reason. New 904 submit is linked to the exact 903 draft UUID. A current valid customer profile linked from that original booking, a versioned original 743/897 communication preference, and explicit true service-channel consent are mandatory. Do not infer consent from staff forms or unversioned default preferences.
2. A different signed Admin/Operations Manager supervisor independently records original review as APPROVED or HOLD. APPROVED requires the same original booking/customer/preference version, unchanged profile update revision and live channel consent; changed consent remains HOLD. No self-approval.
3. The original owner, not reviewer, may record authorize internal manual-readiness evidence against the exact independently APPROVED review only while review is within 15 minutes, live consent and unchanged profile/preference revisions, original owner, active UNSENT draft and source incident still match. No auto-send. This does not authorize this application to send or assert any human contacted the customer.
4. Either original owner or independent reviewer can revoke the exact original authority receipt. State becomes HOLD on withdrawal, latest preference or customer-profile change, draft suppression, owner change, closure, expiry or revocation. The server rechecks live consent on every selected-job read and on mutations.

## Privacy and data policy
Source link is bookings.customer_profile_id, never supplied by client. Read private active customer_profiles opt-in/channel and latest customer_communication_preference_versions version ID and channel opt-ins. Reuse the existing evaluateConsent743 function for purpose/channel checks, with an additional stricter explicit service preference version requirement. Purpose is service only; marketing is outside scope. Browser shows only allow/HOLD reasons, version time and signed staff IDs. Customer emails/phones, addresses, free-form message bodies and original contact details stay on server.

The rosie_manual_outbox_reviews_v904 table is server-only append-only evidence with original booking/901 issue/903 draft/904 reviewer relationships, original staff/customer/preference foreign keys, customer preference and profile revision snapshot, idempotent UUID, unique submit per draft, review per submission, authority per review, revocation per authority, RLS enabled, revoke all anon/authenticated, grant service_role SELECT/INSERT only, reject UPDATE/DELETE/TRUNCATE triggers. DB CHECKs forbid provider sends, automatic sending, contact-executed and delivery claims or independent physical safety certification.

The protected endpoint /api/admin/outbox_manual_review_v904 requires original signed staff session (never legacy fallback), original Admin/Operations Manager and operations.assignment.manage, same origin for writes, strict action-field allowlists. The /admin-manual-outbox.html workspace is a responsive navy/gold angular control panel with selected original booking/exception, live consent summary, independent review, internal readiness, revocation, audit and bounded source review index. All manual authority remains internal readiness only. No message sending, provider calls, master messages, automatic retries, invented consent proof or external delivery assertions.

Future customer contact needs a separately approved consent-aware communications process that independently rechecks original consent at the time of contact. It is not part of Build 904. Actual staff approval and any physical safety inspections remain BUSINESS ACCEPTANCE HOLD until performed and signed by real people.

## Release evidence required
- Migration applied to Rosie Supabase, independently read role privileges, RLS/triggers/indexes, zero fabricated original owner or contact receipts.
- Build 904 strict tests and Builds 899–903 regression tests; dev current source gate, Cloudflare Development acceptance, protected PR current source and Build 904 gate.
- Merge protected dev → main, exact production SHA Cloudflare Pages + Functions and canonical/immutable HTTPS runtime smoke, full production business-source acceptance.
- Independent release-health GREEN and zero pending violations, CI WITHIN_BUDGET. Branches only dev/main; no fabricated safety or contact approvals.

**Next proposed Build 905 — Consent Invalidation Receipts, Supervisor Outbox Reconciliation & Verified Manual-Contact Evidence (No Auto-Send).**
