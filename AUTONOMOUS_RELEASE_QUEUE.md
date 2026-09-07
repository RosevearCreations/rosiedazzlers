# Rosie Dazzlers — Autonomous Development Queue

This queue records only current actionable work. Completed implementation history belongs in Git history and release summaries. The durable numbered forward sequence is recorded in `FORWARD_BUILD_ROADMAP_356_377.md`.

## Accepted checkpoint

**Build 358 — Per-Vehicle Service Timeline** is implemented and Development GREEN at runtime SHA `1a84273f28f01b477d4697b2035c1562dfd59dd8`. Current Source Gate #490 and Cloudflare Development Acceptance #167 passed on that exact SHA, all retained same-SHA workflows completed without failure, and `main` was fast-forwarded non-force to the same runtime commit.

The repository still exposes no separate Production exact-SHA acceptance workflow or public build-identity endpoint, so that evidence limitation remains explicit. The accepted release required no database migration and created no duplicate service-history authority or write path.

## Next — Build 359

Scope: **Customer Retention Dashboard**.

Give Operations a customer-level retention view using existing customer, saved-vehicle, booking, completed-service, maintenance-interest and fleet-interest authorities. This should be an evidence-backed operational read model, not a duplicate CRM ledger or automated outreach engine.

### Acceptance checklist

- Reuse canonical customer identity and existing customer-scoped booking/service authorities.
- Show evidence-backed first service, most recent completed service, completed-service count/repeat activity, saved-vehicle count and open/upcoming booking context.
- Surface maintenance interest and fleet interest only when existing authoritative records support them.
- Keep customer and vehicle linkage deterministic; no fuzzy household/customer merging.
- Preserve server-authoritative Admin/Operations access and prevent customer data from leaking to public or unauthorized staff routes.
- Do not expose payment secrets, staff-private notes, internal credentials or unrelated customer records.
- Define retention indicators from source facts; do not fabricate lifecycle labels or infer outreach consent.
- Keep the dashboard read-focused and on-demand/event-driven. No permanent polling, scheduler or automatic communications.
- No duplicate CRM/customer-history ledger unless a later explicit business requirement proves one is necessary.
- Add focused regression proof for authorization, customer isolation, completed-service metrics, vehicle counts, open bookings, maintenance/fleet indicators and empty-state behavior.
- Exact `dev` SHA must pass Current Source and retained focused gates.
- Exact `dev` SHA must pass Cloudflare Development deployment/HTTP acceptance before Production promotion.
- Promote `main` only by non-force fast-forward to the exact same Development-GREEN SHA.

## Continuing rule

Never call a Rosie Dazzlers release GREEN from source changes alone. Preserve exact tested SHAs through Development and authorized Production promotion; keep database migrations as a separate acceptance boundary. When Production exact-SHA runtime identity is not externally exposed, report that limitation rather than weakening the evidence standard.