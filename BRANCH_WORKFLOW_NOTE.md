# Rosie Dazzlers — Branch and Release Workflow

This is the current branch authority. Historical branch names and old release sequences belong in Git history, not this living note. `RELEASE_GOVERNANCE.md` owns the durable protection, stale-check and operator-recovery contract.

## Branch roles

- `main` — accepted Production source until another authorized Production promotion is fully proven.
- `dev` — accepted Development line and base for sequential new builds.
- Active build branch — isolated implementation created from exact `dev` until its candidate SHA is source-green.

## Current promotion rule

Promote the same exact commit SHA through the authorized Development path. Do not recreate changes separately and do not call a branch current merely because it has a newer timestamp.

Sequence:

1. Create the active feature branch from exact `dev`.
2. Implement and commit the bounded release there.
3. Require successful exact-SHA focused authority, Current Source Gate validation and feature-preview acceptance.
4. Fast-forward `dev` to that exact SHA with `force=false`.
5. Require Development source and deployment/runtime acceptance on the identical SHA.
6. Mark the release GREEN for Development only after those checks succeed.
7. Promote `main` only from that same Development-GREEN SHA by non-force fast-forward when Production promotion is authorized by the active release flow.
8. Require the durable Production exact-SHA authority to observe a successful Production deployment/runtime/business path before calling Production GREEN.
9. Start the next sequential build only from the latest accepted Development boundary.

## Protection and check posture

- GitHub-hosted branch protection/rulesets are platform settings, not something prose or workflow source may claim to enforce by itself.
- Intended `dev`/`main` posture blocks force pushes and branch deletion while preserving direct non-force fast-forward promotion.
- Do not configure a required status check whose own trigger can only occur after the protected push; that creates an impossible release dependency.
- A check is current blocking evidence only when it belongs to the candidate exact SHA, still triggers for the active ref, and is named by the current release contract.
- Historical/build-specific checks remain useful regression evidence but must not silently become permanent release blockers.
- If protection state is absent or unobservable, classify platform protection AMBER rather than inferring GREEN.
- Recovery from stale branches, protected-branch rejection, missing checks and stale historical checks follows `RELEASE_GOVERNANCE.md`; never solve those conditions by force-pushing or bypassing evidence.

## Safety boundaries

- A source promotion does not authorize a database migration.
- Database migrations, when required, are applied deliberately to Development first and receive their own acceptance evidence.
- Production business data must not be copied, replaced or mutated as a side effect of Development source work.
- Payment-provider readiness must never expose credentials or perform charges merely to inspect configuration.
- Production deployment acceptance is observation-only; it must not deploy, retry, delete, roll back or mutate provider/business data.
- Failed or missing current checks, deployment identity or runtime evidence are blockers, not warnings to route around.
- Temporary build branches may be deleted only after accepted promotion and confirmation that they contain no unique unmerged work.

## Repository hygiene

Current shared workflows and living documents must remain release-number independent wherever the rule is intended to survive future builds. Living documents should point to Git refs and workflow evidence rather than embedding commit SHAs that become stale. Cloudflare deployment/recovery workflows and canonical migrations are operational authorities, not historical clutter.
