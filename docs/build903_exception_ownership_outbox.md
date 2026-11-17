# Rosie Dazzlers Build 903 — Exception Ownership, Escalation Routing & Consent-Aware Supervisor Notification Outbox (No Auto Send)

## Scope and source of truth
Build 903 extends Production GREEN Build 902 without modifying Build 901 canonical dispatch/start/resume gates, customer communication workflows, or other applications.

- Original reporting crew must have a **verified two-person Build 902 handoff**: the reporting crew's source offer and the nominated active supervisor's independent ACCEPTED receipt are required before that exact receiving supervisor may claim the exception.
- Claims are signed and unique per original exception. Only a verified current owner may route an open exception to a **different active** original Admin/Operations Manager supervisor. The nominated supervisor signs ACCEPTED/REJECTED against the exact pending route receipt. A rejected route leaves existing owner intact. Owner transfer requires an independent accepted receipt; no self-approval.
- The private source queue displays OPEN original Build 901 exceptions, original SLA status/deadlines from Build 902, verified owner, pending route, and internal outbox-draft state. Incomplete or conflicting source results fail closed; no phantom ownership/communications.
- A current owner can prepare an **internal_task-only UNSENT preview** based on an allowlisted template and a short source exception ID, not on free-text customer notes or personal contact information. The owner can suppress that exact active draft using a separate immutable receipt; older drafts are not resurrected when the latest is suppressed.
- Admin screen: /admin-exception-routing.html. Responsive, source-linked operator tools, original job and exception selector, queue, signed action notes, draft preview, suppression and audit history.

## Consent, communications and privacy
This is a strictly internal staff work-item *draft outbox*, **not a sending service**. The Postgres table and APIs enforce:
- channel = internal_task only;
- send_authorized=false, delivery_attempted=false, customer_contact_authorized=false, customer_consent_claimed=false, physical_safety_certified=false;
- no customer address/email/phone lookup, no provider API call, no notification delivery trigger, no customer consent inference;
- outbound communication must stay blocked until some independently authorized future consent-aware sending workflow is explicitly designed and verified. Nothing from this build should be interpreted as customer contact consent.
- Signed, same-origin, current Rosie staff session + Admin/Operations Manager role and operations.assignment.manage + original job and exception IDs. Strict request field allowlists, UUID replay keys, server-side original source verification and original supervisor roster.

## Source database
Migration supabase/migrations/20261117030000_build903_exception_routing_internal_outbox.sql adds a private append-only table public.rosie_exception_routing_outbox_v903 linked to original booking, Build 901 escalation, Build 902 signed handoff ACK, and original staff IDs. The table has UUID client_request_id uniqueness, unique claim per exception, single acknowledged receipt per route and single suppression per draft, strict event kinds/column checks, RLS enabled, no anon/authenticated rights, server-only service_role SELECT/INSERT, existing reject-UPDATE/DELETE/TRUNCATE original trigger. Source readback is required before the API confirms any signed receipt.

## Operational boundaries
No dispatch, cancellation, stock adjustment, customer messaging, consent grant, actual SLA scheduler/notification, finance, employee payroll, security admin, or cross-app Master mutation. Real-world owner verification and safety/field evidence remain independently BUSINESS HOLD. The 901 dispatch gate and customer consent protections remain in place.

## Release acceptance
1. Apply/verify private schema, role grants, reject mutation triggers, original FK and uniqueness; no fabricated live business rows.
2. Run Build 903 dedicated strict tests + retained Build 899–902 tests; normal full source check, Cloudflare dev acceptance.
3. Protected dev→main PR and source gates; exact GitHub SHA deployment to Cloudflare Pages+Functions, immutable and canonical HTTP smokes, production business source acceptance.
4. Independent release-health GREEN + CI queue WITHIN_BUDGET with pending=0, no synthetic/faked production gates.

**Next proposed Build 904 — Supervisor Outbox Review, Manual Delivery Authority & Consent Revalidation (Still No Auto-Send).**
