# Rosie Dazzlers Build 276 — Reliability & Release Mechanics

**Status: ACTIVE — feature-source validation**  
**Feature branch:** `build276-release-reliability`  
**Production/main:** CLOSED

## Release baseline

Build 275 is the accepted Development baseline at `7d4c8689ed4c8fa1bac25a0b124122df254fed18`.

Build 276 is deliberately narrow. It does not add customer-facing service scope, change pricing, alter D1/R2 schema/data, or promote Production. It hardens the path used to prove future releases.

## 1. Close the Cloudflare readiness race

Build 275 exposed a real acceptance race: the Development workflow detected the exact Cloudflare Pages deployment record and immediately started HTTP smoke even though that deployment had not yet reached a successful stage. The first Build 275 acceptance attempt therefore failed before Cloudflare completed, while a rerun on the exact same SHA passed.

Build 276 changes the Development acceptance contract:

- finding the exact `dev` commit in Cloudflare is necessary but no longer sufficient;
- the workflow polls the matching Pages deployment until `latest_stage.status` is `success`;
- explicit failed/cancelled terminal states fail immediately;
- a deployment that is visible but never reaches success fails with a distinct readiness error;
- HTTP smoke begins only after exact-SHA deployment success;
- the Cloudflare wait is bounded to 24 attempts at 10-second intervals and remains inside the existing workflow timeout.

This prevents the false-red condition that delayed Build 275 without hiding genuine deployment failures.

## 2. Replace stale Build-number ownership on `dev`

The historical `.github/workflows/build274-source-gate.yml` incorrectly continued to trigger on every `dev` push. That made a Build 275 promotion display `Validate Build 274 source` as the apparent current source gate.

Build 276 makes the ownership explicit:

- Build 274 Source Gate returns to its historical feature branch only;
- Build 275 Source Gate remains its historical feature gate;
- Build 276 gets its own feature-source gate;
- new `.github/workflows/development-source-gate.yml` becomes the current source-only authority for pushes to `dev`;
- the Development Source Gate reruns retained focused guards through Build 275, the current Build 276 focused guard, the cumulative guard, relevant JS syntax checks, whitespace checks and conflict-marker protection;
- Cloudflare Development acceptance remains separate so a source-green result is never mistaken for deployment acceptance.

## 3. Production promotion boundary

Git history sanity showed that `main` and `dev` are intentionally divergent histories around their retained Build 274 merge boundary. Production promotion must therefore not be implemented as a blind or forced ref move.

After Development smoke is successful, the Build 276 Development acceptance workflow now records a read-only Production promotion boundary:

- exact accepted `origin/dev` SHA;
- current `origin/main` SHA;
- merge base;
- dev-only commit count;
- main-only commit count;
- an explicit statement that this is Development evidence only and Production remains closed.

The workflow fails if `dev` moves while its acceptance run is still in progress. The documented promotion rule is to deliberately reconcile/merge the exact accepted Development tree when Production promotion is separately authorized; never force-move `main` to `dev`.

No Build 276 workflow mutates `main`.

## 4. Build 276 focused regression protection

`scripts/build276_release_check.py` protects the reliability/release mechanics themselves. It verifies that:

- Development acceptance waits for exact Cloudflare success;
- terminal Cloudflare failure/cancellation states are recognized;
- Build 276 participates in Development acceptance;
- Build 274 no longer triggers on `dev`;
- the Development Source Gate exists and runs the current guard chain;
- the Build 276 feature source gate exists;
- the Production promotion boundary remains non-mutating and explicitly prohibits force-moving `main`.

## Acceptance sequence

1. Build 276 feature branch source gate must pass.
2. Cloudflare feature preview must deploy the exact Build 276 feature SHA successfully.
3. Only then may that exact feature SHA be fast-forwarded to `dev`.
4. The new Development Source Gate must pass on the exact promoted SHA.
5. Cloudflare Development Acceptance must wait for exact-SHA deployment `success`, then pass HTTP smoke and record the Production boundary.
6. Only after all of the above may Build 276 be called Development-green.
7. Production/main remains closed unless separately and explicitly authorized.

## Next release group

After Build 276 is Development-green, Builds 277–280 move to the agreed customer-facing service/SEO depth group: remaining specialist/add-on content, service proof placement, local SEO depth, internal linking and structured/technical SEO protection without reopening already-converged Build 275 service pages unnecessarily.
