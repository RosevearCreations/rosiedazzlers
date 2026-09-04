# Rosie Dazzlers — Branch and Release Workflow

This is the current branch authority. Historical branch names and old release sequences belong in Git history, not this living note.

## Branch roles

- `main` — accepted release source only.
- `dev` — exact Development candidate after feature-source acceptance.
- Active build branch — isolated implementation until its exact SHA is source-green.

## Promotion rule

Promote the same exact commit SHA through the release path. Do not recreate a change separately on `dev` or `main`, and do not call a branch current merely because it has a newer timestamp.

Sequence:

1. Implement and commit on the active build branch.
2. Require successful exact-SHA feature source validation.
3. Fast-forward `dev` to that exact SHA.
4. Require Development source and Cloudflare/runtime acceptance on that SHA.
5. Fast-forward `main` to the same SHA.
6. Require exact-main source and deployment evidence.
7. Mark GREEN only after those checks succeed.

## Safety boundaries

- A source promotion does not authorize a database migration.
- Database migrations are applied deliberately, Development first, with the same migration promoted only after verification.
- Production business data must not be copied, replaced or mutated as a side effect of source cleanup.
- Cloudflare deployment/recovery workflows and canonical SQL migrations are operational authorities and are not historical clutter.
- Failed or missing checks are blockers, not warnings to route around.
- Temporary build branches may be deleted only after accepted promotion and confirmation that they contain no unique unmerged work.

## Repository hygiene

Current shared workflows and living documents must be release-number independent wherever the rule is meant to survive future builds. Historical numbered checks can be retained as evidence until their useful protection has been absorbed into a durable authority; once obsolete and unreferenced, they can be removed separately without deleting migration or recovery history.
