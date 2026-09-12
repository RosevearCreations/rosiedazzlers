# Rosie Dazzlers — Branch and Release Workflow

This is the current branch authority. Historical branch names and old release sequences belong in Git history, not this living note. `RELEASE_GOVERNANCE.md` owns the durable protection, stale-check and operator-recovery contract.

## Branch roles

- `main` — protected Production source. GitHub's active `rd main protection` ruleset governs changes to the default branch.
- `dev` — accepted Development line and base for sequential new builds.
- Active build branch — isolated implementation created from exact `dev` until its candidate SHA is source-green.

## Current promotion rule

Development remains exact-SHA and non-force. Production promotion must pass through the protected-main pull-request path; do not bypass the ruleset to preserve an obsolete direct-push model.

Sequence:

1. Create the active feature branch from exact `dev`.
2. Implement and commit the bounded release there.
3. Require successful exact-SHA focused authority, Current Source Gate validation and feature-preview acceptance.
4. Fast-forward `dev` to that exact candidate SHA with `force=false`.
5. Require Development source and deployment/runtime acceptance on that identical Development SHA.
6. Mark the release GREEN for Development only after those checks succeed.
7. Open a pull request from the accepted Development line to protected `main`.
8. Require the `rd main protection` ruleset and its required `source checks` context to pass. Prefer a merge commit so the accepted Development SHA remains directly visible in Production ancestry.
9. After merge, treat the resulting `main` head as the exact Production source SHA and require Production deployment/runtime/business acceptance on that exact SHA.
10. Start the next sequential build only from the latest accepted Development boundary after the prior release chain is resolved.

A protected-main merge can create a new SHA. The Development candidate SHA and Production merge SHA are both exact identities for their respective stages; PR/ancestry evidence links them into one release chain.

## Protection and check posture

- `main` is protected by the active GitHub ruleset `rd main protection`.
- That ruleset blocks deletion and non-fast-forward updates, requires a pull request, and requires `source checks`.
- `dev` remains governed by the repository's non-force exact-SHA release policy even when GitHub-hosted protection is absent there.
- A check is current blocking evidence only when it belongs to the applicable exact SHA or protected-main PR head, still triggers for the active ref, and is named by the current release contract.
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
