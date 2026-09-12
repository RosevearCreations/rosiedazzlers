# Rosie Dazzlers Documentation Index

This index separates living release/planning authority from retained specialist and historical references. Exact release identity comes from live Git refs and workflow evidence, not pinned commit prose.

## Living authorities

1. `AI_PROJECT_HANDOFF.md` — current implementation, deployment and release truth.
2. `AUTONOMOUS_RELEASE_QUEUE.md` — accepted/current/next bounded work.
3. `FORWARD_BUILD_ROADMAP_386_395.md` — active forward sequence and cross-build rules.
4. `STARTUP_GO_LIVE_BLOCKERS.md` — current acceptance gaps and evidence still requiring proof.
5. `README.md` — repository entry point and canonical source locations.

Do not reconstruct current state from old Build summaries, old chat handoffs or historical roadmap phases.

## Current specialist references

- `DATABASE_STRUCTURE_CURRENT.md` — schema reference; actual accepted environment schema remains authoritative when drift is discovered.
- `docs/ACCESS_CONTROL.md` — authorization reference.
- `docs/modular-app/README.md` — module architecture, roles, navigation and wake/sleep model.
- `docs/BACKUP_RESTORE_RELEASE_RECOVERY.md` — retained observation-only recovery evidence matrix and authorization boundaries.
- `DAIP_R2_MEDIA_SETUP_GUIDE.md` — private R2 setup guidance.
- `docs/digital-asset-intelligence-platform/` — DAIP specialist architecture/governance.
- `BRANCH_WORKFLOW_NOTE.md` — release branch/promotion operating contract.

## Historical planning references

- `FORWARD_BUILD_ROADMAP_356_377.md` — completed earlier growth/release phase.
- `FORWARD_BUILD_ROADMAP_378_385.md` — completed release/recovery phase.
- Build-numbered summaries that remain in source are historical evidence only and must not override living authority.

## Documentation policy

Git history is the release archive. Keep specialist documentation only when it remains operationally useful and update the living authorities rather than appending another competing “current” document.

Going forward:

- keep accepted/current/next release state in the queue and handoff;
- keep the active bounded sequence in the current forward roadmap;
- keep runtime/provider/database evidence fail-closed rather than converting assumptions into documentation facts;
- do not create a `docs/archive/` copy of files already preserved by Git;
- do not create build-numbered copies of current module/navigation registries;
- release history belongs in Git commits/tags and retained workflow evidence, not duplicate source files.