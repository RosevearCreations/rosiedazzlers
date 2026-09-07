# Rosie Dazzlers — Autonomous Development Queue

This queue records only current actionable work. Completed implementation history belongs in Git history and release summaries. The durable forward sequence is recorded in `FORWARD_BUILD_ROADMAP_356_377.md`.

## Accepted checkpoint

**Build 357 — Rebook Catalog & Pricing Revalidation** is accepted at exact SHA `8c7b438bd12179a68c9be838992318eafe453a66`. Current Source and Cloudflare Development acceptance passed on that exact SHA, and `main` was fast-forwarded non-force to the same commit. `dev` and `main` are synchronized.

The live homepage and `/book` are responding after promotion. Exact Production runtime SHA identity remains unexposed by the current repo workflow/public runtime, so that evidence limitation remains explicit.

## Next — Build 358

Scope: **Per-Vehicle Service Timeline**.

Present completed customer services grouped by canonical saved vehicle, using the existing authenticated dashboard/service-history authority. Do not create a second service-history ledger or heuristic vehicle-matching authority.

### Acceptance checklist

- Use canonical saved vehicle IDs from `customer_vehicles` and the existing customer-isolated dashboard path.
- Consume the existing completed-service authority; no duplicate service-history table, migration or write path.
- Group/timeline entries only when canonical vehicle linkage is known and belongs to the authenticated customer.
- Ambiguous, missing or invalid vehicle linkage must fail closed rather than blending household vehicles.
- Show customer-safe service facts only: service/package, completion date, canonical vehicle context, and approved public/customer evidence where already authorized.
- Do not expose staff-private checklist rows, private notes, internal margins/costs, payment secrets or unrelated customer data.
- Preserve deterministic descending chronology and stable deduplication.
- Preserve the general completed-service history view while adding vehicle-specific navigation/presentation.
- Keep rebook actions on eligible completed-service entries and preserve current-catalog/pricing revalidation.
- No polling, scheduler, recurring billing, provider mutation or background loop.
- Add focused regression proof for vehicle isolation, invalid-link fail-closed behavior, chronology, deduplication and existing response compatibility.
- Exact `dev` SHA must pass Current Source and retained focused gates.
- Exact `dev` SHA must pass Cloudflare Development deployment/HTTP acceptance before Production promotion.
- Promote `main` only by non-force fast-forward to the exact same Development-GREEN SHA.

## Continuing rule

Never call a Rosie Dazzlers release GREEN from source changes alone. Preserve exact tested SHAs through Development and authorized Production promotion; keep database migrations as a separate acceptance boundary. When Production exact-SHA runtime identity is not externally exposed, report that limitation rather than weakening the evidence standard.
