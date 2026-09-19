# Rosie Dazzlers — Current Project Handoff

This is the living restart authority. Historical release evidence belongs in Git history/workflows; exact accepted identities come from live refs and exact-SHA evidence.

## Current release boundary

The completed reliability, performance and cost-capacity release is the retained predecessor.

**Build 424 — Security, Privacy & Recovery Drill** is the active bounded release.

**Build 425 — Production Learning & Roadmap Renewal** is next only after the current release is independently GREEN on protected `main`.

Current contract: `BUILD424_SECURITY_PRIVACY_RECOVERY_DRILL.md`. Active roadmap: `FORWARD_BUILD_ROADMAP_416_425.md`. Retained predecessor contract: `BUILD423_RELIABILITY_PERFORMANCE_COST_CAPACITY.md`.

This release authorizes no schema migration, secret rotation, Production restore, customer/booking mutation, staff role/capability change, consent mutation, provider contact, accounting/inventory posting, destructive R2 mutation, DNS mutation, automatic outreach or permanent polling.

## Security, privacy & recovery contract

- `/api/admin/security_privacy_recovery_drill` is staff-only, manual-refresh and read-only.
- Security posture is reduced to aggregate risk/RLS/browser-grant counts; table rows, customer records and secret values are excluded.
- Staff/customer opaque session tokens remain hash-backed, bounded and rotating; the snapshot reports dedicated session-secret configuration only as present/absent.
- Legacy admin fallback remains visible as an operator compatibility risk rather than being silently accepted.
- Customer communication remains current-explicit-consent gated. Changed channels/recipients and opt-out states fail closed; consent is never inferred.
- Provider acceptance remains distinct from definitive delivery.
- Retained recovery and rollback authorities remain observation-only and fail-closed.
- Source/runtime success does not prove a real Production restore, secret rotation, DNS/R2 recovery or provider recovery.
- Any separately authorized real recovery requires exact Production SHA re-acceptance.

## Retained reliability contract

The retained reliability/capacity view stays staff-only, manual-refresh and read-only. Its first-party traffic and diagnostics evidence does not infer Cloudflare billing, CPU usage, provider quotas or future capacity, and it performs no automatic retry, cache, scaling or provider mutation.

## Retained operating contract

- Protected `main` PR and exact Cloudflare Production acceptance remain mandatory.
- Production support diagnostics remain read-only and manual-refresh.
- Public SEO remains one meaningful H1 per indexable page with truthful local proof.
- Role/capability boundaries remain fail-closed.
- Database migrations remain separate explicit acceptance boundaries.
- Provider/business mutations remain separately authorized.

## Release mechanics

- `dev` is Development; protected `main` is Production source.
- Feature candidates require focused authority, Current Source Gate and exact feature-preview acceptance before `dev` moves.
- `dev` advances only by non-force fast-forward to the exact accepted candidate and must independently pass exact-SHA Development deployment/runtime acceptance.
- Production is proposed by PR from accepted Development to protected `main`; `rd main protection` is not bypassed.
- The resulting `main` SHA must independently pass exact Production deployment/runtime/business acceptance.
- Production deployment/runtime/business acceptance must independently prove that exact SHA.
- Missing deployment identity, required check, Functions metadata or runtime smoke is a blocker.
- Any post-acceptance source write invalidates exact-SHA acceptance and requires revalidation.

## Durable authorities

- `AUTONOMOUS_RELEASE_QUEUE.md`
- `FORWARD_BUILD_ROADMAP_416_425.md`
- `BUILD424_SECURITY_PRIVACY_RECOVERY_DRILL.md`
- `BUILD423_RELIABILITY_PERFORMANCE_COST_CAPACITY.md`
- `.github/workflows/development-source-gate.yml`
- `.github/workflows/security-privacy-recovery-drill-authority.yml`
- `.github/workflows/production-business-acceptance-authority.yml`
- `scripts/security_privacy_recovery_drill_check.py`
- `scripts/backup_restore_release_recovery_drill_check.py`
- `scripts/release_rollback_recovery_check.py`
- `scripts/performance_accessibility_security_check.py`
- `scripts/release_authority_documentation_convergence_check.py`
- `RELEASE_GOVERNANCE.md`

## Restart point

Resolve live `dev`/`main` refs and exact-SHA workflow evidence first, then read this file, the queue, current contract, active roadmap and go-live blockers. Preserve feature → Development → protected-main PR → exact Production acceptance discipline.
