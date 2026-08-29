# Rosie Dazzlers Documentation Index — Build 268

**Updated:** 2026-08-29

## Living planning authorities — only these two

1. `AI_PROJECT_HANDOFF.md` — current implemented/deployed state and hard boundaries.
2. `MASTER_VALUE_ROADMAP.md` — ordered next work.

Do not reconstruct current state from old commits or historical Build summaries.

## Current specialist references

- `STARTUP_GO_LIVE_BLOCKERS.md` — Development/go-live acceptance checklist.
- `DATABASE_STRUCTURE_CURRENT.md` — schema reference; actual Development schema remains authoritative when drift is discovered.
- `docs/ACCESS_CONTROL.md` — authorization reference.
- `docs/modular-app/README.md` — current module architecture, roles, navigation and wake/sleep model.
- `CLOUDFLARE_OBSERVABILITY_BUILD262.md` — CPU/Workers Logs procedure until reliability evidence is closed.
- `DAIP_R2_MEDIA_SETUP_GUIDE.md` — private R2 setup guidance.
- `docs/digital-asset-intelligence-platform/` — DAIP specialist architecture/governance.
- `BUILD267_SUMMARY.md` — immediate predecessor release evidence only.

## Documentation/archive policy

Git history is now the archive. Retired planning aliases, old Build summaries, competitor snapshots, duplicate documentation folders and compatibility-marker documents were intentionally removed from the working tree during Build 268 repository hygiene.

Going forward:

- update the two living authorities instead of appending another historical “CURRENT” section;
- keep specialist documentation only when it remains operationally useful;
- do not create a `docs/archive/` copy of files already preserved by Git;
- do not create build-numbered copies of current module/navigation registries;
- release history belongs in Git commits/tags, not duplicate source files.
