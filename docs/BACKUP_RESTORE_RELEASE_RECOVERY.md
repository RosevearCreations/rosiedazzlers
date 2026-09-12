# Rosie Dazzlers — Backup, Restore & Release Recovery Drill

## Purpose

This runbook is the operator authority for Build 385 — Backup, Restore & Release Recovery Drill. It proves that a bad release or operational failure can be diagnosed and recovered from without using Production business data as test material.

The drill is observation-only. It may inspect Git history, release evidence, Cloudflare deployment metadata, database backup/readiness evidence, media/bucket configuration and documented configuration inventories. It does **not** move Git refs, deploy or delete Cloudflare deployments, restore a database, write or delete R2 objects, change DNS, rotate secrets, run a database migration, charge or refund a customer, or mutate provider state.

## Fail-closed recovery rule

Recovery state is `NOT VERIFIED` whenever required evidence is missing, stale, ambiguous or inaccessible. A missing backup, unknown migration boundary, unresolved media inventory, unknown secret/config source, or unproven exact deployment SHA is a blocker. Never infer recovery readiness from source promotion alone.

A real restore, rollback or provider/configuration mutation requires explicit operator authorization outside this drill. Production mutation is forbidden by the Build 385 authority.

## Recovery evidence matrix

| Surface | Evidence required by the drill | Drill mutation |
| --- | --- | --- |
| Git / source | Current exact `dev` and `main` SHAs, prior known-good ancestor, compare/ancestry evidence | None |
| Cloudflare Pages | Exact successful deployment SHA, branch/environment, Functions metadata, immutable preview/Production URL smoke | None |
| Supabase / PostgreSQL | Environment/project identity, backup or PITR capability/status as actually available, current migration/schema boundary, restore procedure owner | None |
| R2 / public media | Expected bucket/binding names, critical object inventory or sample evidence, publication path/binding ownership | None |
| Configuration / secrets | Required variable/secret **names and owners only**; never values in source or drill output | None |
| DNS / domain | Expected production hostname/custom-domain relationship and recovery owner | None |
| Payments / providers | Configuration/readiness evidence only; no charge, capture, refund, settlement or paid-state mutation | None |
| Business data | Preserve current records and capture incident evidence before any authorized restore decision | None |

## Recovery objectives

RTO and RPO are operational targets, not promises and not fabricated by source code. For every real incident, the operator must record the applicable RTO target, RPO target, most recent independently verified backup/recovery point, and the evidence timestamp. If any of those are unknown, recovery readiness remains `NOT VERIFIED` until resolved.

## Drill sequence

1. **Identify the incident boundary.** Record environment, exact source SHA, observed deployment identity, first known failure and affected surfaces.
2. **Freeze mutation.** Stop optional release/data changes. Do not improvise a schema, media, DNS or provider change while evidence is incomplete.
3. **Preserve evidence.** Retain logs, deployment IDs, exact Git SHAs, current migration/schema boundary, media/bucket observations and configuration names. Never copy secret values into the incident record.
4. **Select a known-good source candidate.** The candidate must be an ancestor of the current release and have successful immutable deployment evidence. The retained Development rollback authority performs this check without mutation.
5. **Verify application rollback viability.** Confirm source ancestry, successful Cloudflare deployment, preview/production environment identity as appropriate, Functions metadata and HTTP smoke. This drill does not move a branch or redeploy.
6. **Verify database boundary.** Identify the current migration/schema boundary and the restore point actually offered by the configured Supabase plan. Do not run restore SQL or migrations during the drill.
7. **Verify media preservation.** Confirm required R2 bindings/buckets and critical asset paths can be identified. Do not copy, overwrite or delete objects during the drill.
8. **Verify configuration recovery.** Confirm required environment-variable/secret names and ownership locations are documented. Values remain outside source and drill output.
9. **Verify DNS/domain recovery ownership.** Confirm who may change the production hostname/custom domain if a real incident requires it. No DNS mutation occurs in the drill.
10. **Choose the smallest authorized recovery action.** Prefer source rollback before data restore when the incident is source-only. A database restore is never the default response to an application release failure.
11. **Require explicit authorization.** A real Git ref move, Cloudflare repair/redeploy, database restore, R2 write/delete, DNS change, secret rotation or payment/provider action requires a named operator decision and separate mutation procedure.
12. **Re-accept the recovered boundary.** After any real recovery, rerun cumulative source authority, exact Development or Production deployment identity, Functions metadata, protected/public runtime smoke and the relevant business acceptance gates before declaring GREEN.
13. **Close the incident.** Record root cause, selected recovery point, actual RTO/RPO outcome, irreversible actions, follow-up prevention work and the final exact accepted SHA.

## Retained recovery authorities

- `.github/workflows/development-rollback-readiness.yml` — manual, read-only prior-SHA Development rollback-candidate proof.
- `.github/workflows/cloudflare-pages-recovery.yml` — narrowly bounded Development-only Cloudflare repair path with exact-SHA confirmation; Production mutation remains forbidden.
- `scripts/cloudflare_development_rollback.sh` — read-only Development rollback candidate verifier.
- `scripts/cloudflare_pages_development.sh` — exact Development deployment acceptance and separately guarded Development recovery mechanics.
- `scripts/cloudflare_pages_production_acceptance.sh` — read-only exact Production deployment/runtime acceptance.
- `scripts/release_rollback_recovery_check.py` — retained rollback/recovery source safety authority.
- `.github/workflows/production-business-acceptance-authority.yml` — Production business path plus exact-SHA deployment/runtime authority.

## Restore decision boundaries

### Application-only failure

Use a previously proven exact source/deployment boundary. Do not restore database or media merely because an application deployment is bad.

### Database or schema failure

Stop application/schema mutation first. Verify the current migration boundary, available backup/PITR point and data-loss window before authorizing any restore. Restore execution is outside Build 385 and requires explicit operator authorization.

### Media failure

Preserve current R2 evidence and identify the smallest affected object set. Never bulk overwrite/delete during diagnosis. Recovery execution is outside Build 385.

### Configuration, secret or DNS failure

Recover from the authorized external source of truth. Never place secret values in Git, workflow summaries or incident notes. DNS/secret mutations are outside this drill.

## Build 385 acceptance boundary

Build 385 is GREEN only when its focused source authority, Current Source Gate, feature-preview acceptance, exact Development deployment/runtime acceptance, non-force exact-SHA Production promotion and exact Production business/deployment/runtime acceptance all pass on the same candidate SHA.

Build 385 introduces no database migration and performs no Production business-data, payment, provider, R2, DNS, secret or restore mutation.