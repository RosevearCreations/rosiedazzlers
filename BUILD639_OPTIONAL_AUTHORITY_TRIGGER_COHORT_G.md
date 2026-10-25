# Build 639 — Optional Authority Trigger De-duplication: Cohort G

## Scope

Following Builds 633–638, reduce seven redundant `build*` feature-push runs in historical authenticated-device and recovery-evidence authority workflows. The exact file list is enforced by `scripts/build639_optional_authority_cohort_g_test.mjs`.

Only the broad `build*` selector under `on.push.branches` changes. Protected `dev` and `main` pushes, PR checks targeting either branch, manual dispatch, complete job bodies, permissions, runners and test assertions remain intact. No required source gate, protected release rule or aggregate check is relaxed.

## Operational constraints

- Already queued workflows are not cancelled.
- No customer page, auth behaviour, scheduling, pricing, payments, media, schema, provider setting or Cloudflare deployment control changes.
- Device recovery and owner approval safety holds remain governed by the same tests; this build does not authorize recovery action or acceptance closure.
- Use a current-base scoped PR on `dev`, then a current-main scoped Production PR if those branches diverge.

## Acceptance

1. `bash scripts/current_optional_authority_triggers.sh` passes seven cohorts (633–639) in fail-closed mode.
2. Required current source-gate A–D and aggregate `source checks` pass on the exact protected PR head.
3. Review and merge the protected `dev` and `main` PRs without bypassing checks.
4. Confirm Cloudflare Pages `rosiedazzlers` success on the exact final main merge SHA, Functions active, immutable deployment URL, and `https://rosiedazzlers.ca` live smoke. Only then report Production GREEN.
