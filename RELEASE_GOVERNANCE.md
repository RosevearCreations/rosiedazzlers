# Release Governance

## Authority

This document is the durable release-governance contract for RosieDazzlers beginning with Build 387.
It replaces build-number-specific release assumptions with release-number-independent rules and reflects the active GitHub default-branch ruleset.

## Canonical release path

1. Feature/build work starts from the currently accepted `dev` SHA.
2. The candidate SHA is validated without rewriting history.
3. `dev` may advance only by a non-force fast-forward to the exact accepted candidate SHA.
4. Development deployment/runtime acceptance must prove that exact Development SHA.
5. Production promotion is proposed by pull request from the accepted Development line to protected `main`.
6. The protected-main checks must pass for the PR head. Merge commits are preferred so the accepted Development SHA remains an explicit parent/ancestor of the Production merge commit.
7. After the PR merges, the resulting `main` head is the exact Production source SHA. Production deployment/runtime/business acceptance must prove that exact `main` SHA.
8. A release is GREEN only when the accepted Development SHA, the protected-main PR/merge evidence, and the exact Production SHA/runtime evidence form one continuous release chain.

A protected-main merge may create a new commit SHA. Exact-SHA authority is therefore stage-specific: the Development candidate is proved exactly on `dev`, and the resulting protected `main` merge SHA is proved exactly in Production. The release must not be rebuilt, cherry-picked into an unrelated commit, or silently substituted between those stages.

## Branch posture

### `main`

GitHub reports the active repository ruleset **`rd main protection`** on the default branch. The intended and observed posture is:

- branch deletion: blocked;
- non-fast-forward / force updates: blocked;
- pull request required before `main` changes;
- required status check: `source checks`;
- no bypass actor is part of the canonical release path.

### `dev`

`dev` remains the accepted Development line. It may advance only by the repository release workflow's non-force fast-forward to an accepted candidate SHA. A missing hosted protection rule on `dev` never authorizes force-pushing or history rewriting.

Repository rulesets/branch protection are GitHub-hosted settings. Source workflows may observe and report them, while repository API evidence remains the authority for whether hosted protection is actually enforced.

## Check authority

### Blocking release evidence

- `Current Source Gate` validates the candidate source SHA.
- Development deployment/runtime acceptance validates the exact `dev` SHA.
- protected-main PR checks validate the proposed Production change before merge;
- `Production Business Acceptance` validates the exact resulting `main` SHA and Production runtime/business boundary.

A historical workflow, a check from another SHA, a cancelled run, or a check whose trigger no longer matches the active release branch is not release proof.

### Advisory evidence

Older build-specific authority workflows may remain useful as bounded regression tests. They are advisory for release governance unless the current roadmap explicitly names them as a blocking authority.

## Stale-check discrimination

Before treating a failing or missing check as a release blocker, verify all four facts:

1. the check belongs to the applicable exact SHA or protected-main PR head;
2. the workflow is still triggered for the active branch/ref;
3. the workflow is named by the current release contract rather than only by historical documentation;
4. the failure represents current source/runtime state rather than an obsolete build-number assertion.

If any fact is false, classify the check as stale/advisory, repair the stale trigger or authority text, and rerun the current authority. Never force-promote around it.

## Operator recovery paths

### Non-fast-forward or stale `dev`

Stop promotion. Fetch/compare `dev` and the candidate SHA. Establish safe ancestry by a normal merge or a new candidate branch, rerun the candidate gates, then retry a non-force fast-forward. Never force-push an accepted release branch.

### Protected `main` rejection

Do not disable or bypass `rd main protection` merely to make a release pass. Confirm the pull request is based on the accepted Development line, resolve the actual failing required check, and merge only when GitHub reports the protected-main requirements satisfied.

### Missing required check

Confirm the workflow trigger includes the candidate branch/ref or PR event. If a required context was renamed or retired, update the ruleset only after confirming the replacement is the current canonical check. Rerun the check on the applicable exact SHA before promotion.

### Stale historical check

Keep the failure visible as historical evidence, but do not treat it as current release authority. Repair or retire the stale workflow in source so future operators are not misled.

### Platform-protection visibility unavailable

Classify GitHub-hosted protection as AMBER/unknown, not GREEN. Source and runtime release gates may still be GREEN, but platform protection must be separately proven from repository branch/ruleset state.

## Build 387 protection observation

GitHub repository evidence now reports `main` as protected by the active **`rd main protection`** ruleset. The ruleset targets the default branch, blocks deletion and non-fast-forward updates, requires a pull request, and requires the `source checks` status context. Build 387 therefore treats protected-main release governance as an enforced external boundary rather than an aspirational source-only setting.

## Safety boundary

Release-governance work does not authorize database migrations, Production business-data mutation, payment/provider mutation, R2 writes/deletes, DNS changes, database restores, secret rotation, or history-rewriting release updates.
