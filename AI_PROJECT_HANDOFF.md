# Rosie Dazzlers — Current Project Handoff

This file is the living operational authority for restarting work. Git history and workflow summaries remain the historical evidence. The durable numbered forward sequences are `FORWARD_BUILD_ROADMAP_356_377.md` and `FORWARD_BUILD_ROADMAP_378_385.md`.

## Current release boundary

- Repository: `RosevearCreations/rosiedazzlers`.
- **Build 384 — Finance Cockpit & Month-End UX** is the accepted synchronized Production boundary before the current release. Resolve its exact identity from synchronized `dev`/`main` refs and exact-SHA workflow evidence rather than copying a stale SHA into this living file.
- **Build 385 — Backup, Restore & Release Recovery Drill** is the active bounded release. It proves a fail-closed, observation-only recovery path across Git/source, Cloudflare Pages, Supabase/PostgreSQL, R2/media, configuration/secrets, DNS/domain and payment/provider dependencies without using Production business data as test material.
- **Build 386 — Post-Recovery Baseline & Forward Roadmap Renewal** is the next approved release after current-release acceptance is complete.
- The current release is schema-neutral. It does not authorize a database migration, database restore, R2 write/delete, DNS mutation, secret rotation, customer charge/refund, provider mutation or business-data mutation.
- A real rollback, restore or recovery mutation requires explicit operator authorization outside the drill. Recovery remains `NOT VERIFIED` whenever required evidence is missing, stale, ambiguous or inaccessible.

## Accepted operating contract

- `dev` is the accepted Development line; `main` is the accepted Production source line.
- A feature candidate must pass its focused authority, Current Source Gate and feature-preview acceptance before `dev` moves.
- `dev` must pass the retained exact-SHA Development source/runtime authorities before Production promotion.
- When Production promotion is authorized, `main` moves by non-force fast-forward to the same Development-GREEN SHA.
- Source promotion alone is never Production proof. The Production exact-SHA authority must independently observe the successful Cloudflare deployment and canonical runtime.
- Missing deployment identity, Functions metadata or runtime smoke is a blocker, not permission to infer GREEN.
- Database migrations remain separate explicit acceptance boundaries and are never incidental runtime side effects.
- Database backup/PITR capability, migration boundary, media preservation and configuration ownership must be observed as they actually exist; source checks must never fabricate recovery evidence.
- Payment, provider, consent, review, accounting, tax and customer evidence must remain genuine and server-authoritative.
- Public SEO remains constrained to one meaningful H1 per indexable page, current catalog/pricing authority and truthful local/service content.
- Dormant modules remain event-driven; permanent polling requires a demonstrated operational need.

## Durable release and recovery authorities

- `AUTONOMOUS_RELEASE_QUEUE.md` — accepted/current/next release state.
- `FORWARD_BUILD_ROADMAP_378_385.md` — approved forward sequence and continuation marker.
- `docs/BACKUP_RESTORE_RELEASE_RECOVERY.md` — current recovery evidence matrix, drill sequence and authorization boundaries.
- `.github/workflows/development-source-gate.yml` — cumulative source authority.
- `.github/workflows/cloudflare-development-acceptance.yml` — exact-SHA Development deployment/runtime acceptance.
- `.github/workflows/development-rollback-readiness.yml` — manual read-only prior-SHA Development rollback candidate proof.
- `.github/workflows/cloudflare-pages-recovery.yml` — narrowly guarded Development-only Cloudflare repair path.
- `.github/workflows/backup-restore-release-recovery-drill-authority.yml` — focused current recovery drill authority.
- `.github/workflows/production-business-acceptance-authority.yml` — durable Production business-path and exact-SHA authority.
- `scripts/cloudflare_development_rollback.sh` — read-only Development rollback candidate verifier.
- `scripts/cloudflare_pages_production_acceptance.sh` — read-only Cloudflare Production deployment identity and HTTP smoke helper.
- `scripts/backup_restore_release_recovery_drill_check.py` — fail-closed current recovery source authority.

## Restart point

Start from the latest exact synchronized `dev`/`main` checkpoint reported by GitHub, not a SHA copied into prose. Read this handoff, `AUTONOMOUS_RELEASE_QUEUE.md` and the recovery runbook, then continue the active bounded release. Preserve exact-SHA feature → Development → non-force Production promotion discipline and require observed Production runtime proof before calling a release fully GREEN.