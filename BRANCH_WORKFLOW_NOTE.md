# Rosie Dazzlers — Branch and Release Workflow

This is the current branch authority. Historical branch names and old release sequences belong in Git history, not this living note.

## Branch roles

- `main` — frozen accepted Production source until the user explicitly authorizes another Production promotion.
- `dev` — accepted Development line and base for sequential new builds.
- Active build branch — isolated implementation created from exact `dev` until its candidate SHA is source-green.

## Current promotion rule

Promote the same exact commit SHA through the authorized Development path. Do not recreate changes separately and do not call a branch current merely because it has a newer timestamp.

Sequence:

1. Create the active feature branch from exact `dev`.
2. Implement and commit the bounded release there.
3. Require successful exact-SHA Current Source Gate validation and Cloudflare feature preview.
4. Fast-forward `dev` to that exact SHA.
5. Require Development source and Cloudflare/runtime acceptance on the identical SHA.
6. Mark the release GREEN for Development only after those checks succeed.
7. Continue the next sequential release from the new `dev` head when appropriate.
8. Do not move `main` unless the user explicitly asks for Production promotion.
9. After an authorized non-force fast-forward of `main`, require the durable Production exact-SHA authority to observe a successful Cloudflare Production deployment with Functions metadata and pass immutable plus canonical runtime smoke before calling Production GREEN.

## Safety boundaries

- A source promotion does not authorize a database migration.
- Database migrations, when required, are applied deliberately to Development first and receive their own acceptance evidence.
- Production business data must not be copied, replaced or mutated as a side effect of Development source work.
- Payment-provider readiness must never expose credentials or perform charges merely to inspect configuration.
- Production deployment acceptance is observation-only; it must not deploy, retry, delete, roll back or mutate provider/business data.
- Failed or missing checks, deployment identity or runtime evidence are blockers, not warnings to route around.
- Temporary build branches may be deleted only after accepted promotion and confirmation that they contain no unique unmerged work.

## Repository hygiene

Current shared workflows and living documents must remain release-number independent wherever the rule is intended to survive future builds. Living documents should point to Git refs and workflow evidence rather than embedding commit SHAs that become stale. Cloudflare deployment/recovery workflows and canonical migrations are operational authorities, not historical clutter.
