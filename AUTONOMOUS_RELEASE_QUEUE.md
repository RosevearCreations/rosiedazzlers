# Rosie Dazzlers — Autonomous Development Queue

This queue records only current actionable Development work. Completed release history belongs in Git history and archived evidence.

## Accepted Development checkpoint

Build 321 is GREEN at exact SHA `09d4ba2e1986e1857c31451915d164fd7694e2c0`. Production `main` remains frozen at its last user-authorized checkpoint until the user explicitly requests another Production promotion.

## Active — Build 322

Scope: Release Rollback & Recovery Acceptance.

Acceptance checklist:

- Preserve the existing Cloudflare stuck-deployment recovery path as manual-only and Development-only.
- Recovery observe mode must remain non-mutating.
- Recovery repair must require the exact current `dev` SHA and independently prove the target is the exact non-terminal Development preview before mutation.
- Add a separate manual rollback-readiness workflow for a prior exact Development SHA.
- Rollback readiness must be read-only: no Git ref move, no Cloudflare POST/DELETE/PATCH/retry/rollback mutation and no Production mutation.
- Require the rollback candidate to be a full 40-character SHA, present in repository history, strictly older than current `dev`, and an ancestor of current `dev`.
- Resolve the real Cloudflare project Production branch and reject any rollback/recovery target that crosses the Production boundary.
- Require a successful exact-SHA Cloudflare deployment for the rollback candidate on branch `dev`.
- Require immutable deployment identity, `environment=preview`, `uses_functions=true`, static smoke and contextual-proof smoke.
- Record current `dev`, rollback candidate, candidate distance, immutable deployment evidence and current `main` without mutating either branch.
- Add `scripts/release_rollback_recovery_check.py` as a durable Current Source Gate authority.
- Harden the existing recovery workflow to run the same rollback/recovery contract checks before observe/repair.
- No database migration is introduced.
- Exact feature SHA must pass Current Source Gate and Cloudflare feature preview.
- The identical SHA must then be fast-forwarded to `dev` and pass Current Source Gate plus Cloudflare Development Acceptance.
- Stop after Development acceptance. `main` remains unchanged unless the user explicitly requests Production promotion.

## Next sequential Development scope

After Build 322 is exact-SHA GREEN on Development, implement the final remaining accepted roadmap item: a Production-readiness dashboard. It must report readiness/evidence only and must not itself authorize or perform Production promotion.

## Continuing rule

After the active build is GREEN on exact `dev`, implement the next sequential Development build from that SHA. Keep Production frozen unless the user changes the instruction.
