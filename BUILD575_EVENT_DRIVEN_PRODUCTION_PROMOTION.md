# Rosie Dazzlers — Build 575: Event-Driven Production Promotion & Exact-SHA Release Visibility

## Scope and implementation
- Extend the **trusted default-branch** guarded release workflow with `workflow_run: completed` for **Current Source Gate** and **Cloudflare Development Acceptance**. Retain PR-trigger and hourly fallback; no continuous polling, provider mutation or unreviewed branch push.
- Require the open Production PR to target `main`, originate from the exact current `dev` head and not be a draft. Re-read both branch heads immediately before a promotion to reject races.
- Require successful Cloudflare Pages, `Verify Development deployment`, and `source checks` for **exact dev SHA**.
- Also require successful Cloudflare Pages, `Verify exact Production deployment`, and `Validate Production business acceptance source contract` on the **currently deployed main SHA** before any next promotion. This preserves one release at a time, including genuine runtime/business acceptance.
- Check the newest check-run **by ID** for each exact-SHA required context, rather than accepting a superseded successful check while a newer run fails.
- Emit an explicit GitHub Actions step summary and HOLD reason on every invocation.

## Production Actions trigger safety
GitHub documents that merges created using a workflow's built-in `GITHUB_TOKEN` do not automatically trigger other GitHub Actions push workflows. An apparently successful auto-merge could therefore suppress exact-main Production acceptance.

The guarded workflow now **forbids direct merges with the built-in token**:
- If GitHub reports a PR is blocked waiting for protection, request **native GitHub auto-merge**. GitHub makes the later protected merge; GitHub remains responsible for the required checks.
- If GitHub reports a clean PR, merge automatically **only** when a separately scoped `ROSIEDAZZLERS_RELEASE_TOKEN` has been installed by the owner as a GitHub App installation token or fine-grained PAT, with repository Contents and Pull requests write permissions. This token is never printed. It must be scoped to this repository.
- If neither safe route is available, report a truthful HOLD and require owner intervention or token setup. **Never** substitute `GITHUB_TOKEN` for a direct merge.
- Source and Cloudflare merges **never** declare GREEN by themselves. After merge, Production CI/Cloudflare must independently verify the exact new main SHA.

## Deterministic tests
`node scripts/build575_release_promotion_test.mjs` simulates: native auto-merge for a blocked PR, allowed clean merge with scoped token, fail-closed missing token, stale head, main race, missing Development or previous Production acceptance, and latest-run failure after earlier success. The feature preview and Current Source Gate run this test on exact candidate refs.

## Environment/configuration boundary
No database migration, Cloudflare account setting, new billing account or production data mutation is part of this build. Cloudflare remains wired to the existing `main` branch. The optional release-token secret must be configured separately through GitHub's Secrets UI before clean-PR unattended merges can occur; this task cannot prove the secret exists by inspecting source. A missing token remains a visible HOLD rather than an unsafe fallback.

## Promotion acceptance
1. Feature SHA: passing Build 575 test, Current Source Gate, exact Cloudflare feature-preview acceptance.
2. Development SHA: matching deployment, exact Development acceptance and passing source gates.
3. Protected-main PR: current head, required source check and merge through ruleset, no force push.
4. Production merge SHA: Cloudflare Pages success, exact Production deployment and business acceptance for same SHA.
5. Report final SHA and Cloudflare/CI evidence; no GREEN if any part is missing.

**Next proposed build: Build 576 — Release Health Dashboard, Drift Detection & Operator Alerting**, to be confirmed from the current roadmap after Build 575 Production GREEN.
