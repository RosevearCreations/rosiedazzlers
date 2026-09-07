# Rosie Dazzlers — Current Project Handoff

This file is the living operational authority for restarting work. Git history and release summaries remain the historical record. The durable numbered forward sequence is `FORWARD_BUILD_ROADMAP_356_377.md`.

## Current release boundary

- Repository: `RosevearCreations/rosiedazzlers`.
- **Build 358 — Per-Vehicle Service Timeline** is implemented and Development GREEN at runtime SHA `1a84273f28f01b477d4697b2035c1562dfd59dd8`.
- Current Source Gate #490 passed on that exact runtime SHA.
- Cloudflare Development Acceptance #167 passed on that exact runtime SHA, including exact deployment confirmation and retained protected-route smoke.
- All retained same-SHA workflows completed without failure before promotion.
- The same runtime SHA was promoted to `main` by non-force fast-forward; `dev` and `main` were synchronized on the proven runtime boundary before documentation closure.
- The repository still exposes no separate Production exact-SHA acceptance workflow or public build-identity endpoint. Do not convert that missing runtime identity evidence into a stronger Production-GREEN claim.
- The accepted release introduced no database migration, duplicate service-history table, provider transaction, pricing change, scheduler, polling loop or Production business-data mutation.
- Next sequential scope: **Build 359 — Customer Retention Dashboard**.

## Accepted operating contract

- `functions/api/client/dashboard.js` remains the authenticated customer dashboard and canonical completed-service read authority.
- `service_history` remains derived from the authenticated customer's completed booking history and canonical saved vehicles; no second ledger was created.
- `assets/my-account-v355.js` now presents an additive per-vehicle timeline while preserving the general completed-service history.
- A per-vehicle timeline entry is accepted only when its `vehicle_id` resolves to one unique canonical saved vehicle in the authenticated dashboard payload.
- Unknown, missing, conflicting or ambiguous vehicle linkage fails closed and is never blended across household vehicles.
- Unlinked historical service records remain visible in the general completed-service history but are excluded from per-vehicle timelines.
- Timeline chronology is deterministic and duplicate projections of the same vehicle/booking identity are collapsed.
- Customer-visible timeline facts remain limited to approved service/date/vehicle context already present in the customer dashboard contract; no staff-private checklist rows, private notes, internal margins/costs or payment secrets are exposed.
- `assets/customer-rebook-v285.js` remains the authenticated rebook verifier. Eligible rebook actions remain on the general completed-service history and continue to require current-catalog/pricing revalidation before current booking controls can be selected.
- Current vehicle selection/size, availability, add-ons, pricing, deposit and payment rules remain authoritative.
- No new checkout, availability, provider, scheduler, polling or background loop was introduced.

## Durable authorities

- `functions/api/client/dashboard.js` — authenticated dashboard and canonical `service_history` response.
- `assets/my-account-v355.js` — completed-service presentation plus canonical per-vehicle timeline grouping.
- `assets/customer-rebook-v285.js` — authenticated historical package/date verification plus current-catalog revalidation.
- `scripts/my_account_service_history_test.mjs` — focused service-history and per-vehicle isolation/chronology/deduplication proof.
- `scripts/my_account_safe_rebook_test.mjs` — focused safe-handoff and current-catalog revalidation behavior proof.
- `scripts/booking_completion_retention_check.py` — cumulative completion/rebooking/service-history guard.
- `.github/workflows/development-source-gate.yml` — cumulative source authority.
- `.github/workflows/cloudflare-development-acceptance.yml` — exact-SHA Development deployment/HTTP acceptance.

## Next release boundary

The next release should add an Operations-facing customer retention dashboard using existing customer, canonical vehicle, booking, completed-service, maintenance-interest and fleet-interest authorities. It must remain evidence-backed and read-focused: no duplicate CRM ledger, fabricated retention state, broad customer-data leakage, permanent polling or automatic outreach.

## Restart point

Start from the latest exact synchronized `dev`/`main` checkpoint recorded by GitHub after documentation closure. Inspect the existing admin/customer lookup and retention-related authorities before implementing the next bounded release. Preserve the exact-SHA Source → Development → non-force `main` promotion discipline.