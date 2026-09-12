# Release Governance

## Authority

This document is the durable release-governance contract for RosieDazzlers beginning with Build 387.
It replaces build-number-specific release assumptions with release-number-independent rules.

## Canonical release path

1. Feature/build work starts from the currently accepted `dev` SHA.
2. The candidate SHA is validated without rewriting history.
3. `dev` may advance only by a non-force fast-forward to the exact accepted candidate SHA.
4. Development deployment/runtime acceptance must prove that same SHA.
5. `main` may advance only by a non-force fast-forward to that same Development-GREEN SHA.
6. Production deployment/runtime/business acceptance must prove that same SHA.
7. A release is GREEN only when source identity and runtime acceptance agree on the exact SHA.

## Branch posture

The intended GitHub platform posture for both `dev` and `main` is deliberately minimal so it does not break the direct exact-SHA fast-forward release path:

- force pushes: blocked;
- branch deletion: blocked;
- direct non-force fast-forward updates: allowed;
- required pull request: not required by this release model;
- required review count: not required by this release model;
- required status checks at push time: do not require post-push deployment/runtime checks that cannot exist before the branch advances;
- administrator bypass must never be used to rewrite accepted release history.

Repository rulesets/branch protection are GitHub-hosted settings. Source workflows can observe and report them, but source code alone cannot truthfully claim they are enforced.

## Check authority

### Blocking release evidence

- `Current Source Gate` validates the candidate source SHA.
- Development deployment/runtime acceptance validates the exact `dev` SHA.
- `Production Business Acceptance` validates the exact `main` SHA and Production runtime/business boundary.

A historical workflow, a check from another SHA, a cancelled run, or a check whose trigger no longer matches the active release branch is not release proof.

### Advisory evidence

Older build-specific authority workflows may remain useful as bounded regression tests. They are advisory for release governance unless the current roadmap explicitly names them as a blocking authority.

## Stale-check discrimination

Before treating a failing or missing check as a release blocker, verify all four facts:

1. the check belongs to the candidate exact SHA;
2. the workflow is still triggered for the active branch/ref;
3. the workflow is named by the current release contract rather than only by historical documentation;
4. the failure represents current source/runtime state rather than an obsolete build-number assertion.

If any fact is false, classify the check as stale/advisory, repair the stale trigger or authority text, and rerun the current exact-SHA authority. Do not force-promote around it.

## Operator recovery paths

### Non-fast-forward or stale branch

Stop promotion. Fetch/compare `dev`, `main`, and the candidate SHA. Establish safe ancestry by a normal merge or a new candidate branch, rerun the candidate gates, then retry a non-force fast-forward. Never solve this with `force: true`.

### Protected-branch rejection

Do not disable protection just to make a release pass. Confirm that the protection rule permits the canonical non-force fast-forward model. If the rule accidentally requires a post-push check before the push can happen, adjust the rule design rather than bypassing it, then rerun the exact-SHA release path.

### Missing required check

Confirm the workflow trigger includes the candidate branch/ref. If the check was renamed or retired, update the ruleset/branch-protection requirement to the current canonical check name. Rerun the check on the exact candidate SHA before promotion.

### Stale historical check

Keep the failure visible as historical evidence, but do not treat it as current release authority. Repair or retire the stale workflow in source so future operators are not misled.

### Platform-protection visibility unavailable

Classify GitHub-hosted protection as AMBER/unknown, not GREEN. Source and runtime release gates may still be GREEN, but platform protection must be separately proven from repository branch/ruleset state.

## Build 387 baseline observation

At the Build 386 accepted baseline, GitHub branch metadata reported `dev` and `main` as unprotected and the repository rulesets collection was empty. Build 387 therefore treats platform protection as a real outstanding repository-setting item until GitHub reports enforcement. The repository-side governance contract, audit, and observable workflow do not conceal that distinction.

## Safety boundary

Release-governance work does not authorize database migrations, Production business-data mutation, payment/provider mutation, R2 writes/deletes, DNS changes, database restores, secret rotation, or force-pushing release branches.
