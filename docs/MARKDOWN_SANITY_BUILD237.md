# Build 237 Markdown Sanity and Retirement Plan

**Updated:** 2026-07-28

## Two living direction documents

1. `AI_PROJECT_HANDOFF.md` — current architecture, deployment, migrations, safeguards and immediate operating context.
2. `MASTER_VALUE_ROADMAP.md` — current business direction, prioritized roadmap and next-cycle choices.

## Canonical operating documents

- `STARTUP_GO_LIVE_BLOCKERS.md` — ordered go-live blockers and exact instructions.
- `KNOWN_GAPS_AND_RISKS.md` — current unresolved technical/operational risk register.
- `SANITY_CHECK.md` — current build sanity result.
- `IMAGES.md` — visual replacement requirements.
- `SUPABASE_SCHEMA.sql` and `DATABASE_STRUCTURE_CURRENT.md` — canonical schema/reference.

## Retained historical documents

All other Markdown remains retained for audit, release-guard and historical context. Build 237 adds a synchronization footer to every Markdown file so a new AI/chat knows that historical files are not competing roadmaps. Do not delete them until release checks are changed from brittle historical text markers to current feature/route/API tests.

## Retirement sequence

1. Inventory every Markdown dependency in `scripts/*.py`.
2. Replace historical content-marker checks with current functional checks.
3. Move superseded documents to `docs/archive/` in small batches.
4. Update `DOC_INDEX.md`.
5. Run the complete release suite after each batch.
6. Delete only exact duplicates after hashes, references and release guards are verified.

---

> **Build 237 synchronization (2026-07-28):** This file is retained for current operational reference, release evidence, specialist detail, or history. Current direction lives in `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`; launch blockers and exact instructions live in `STARTUP_GO_LIVE_BLOCKERS.md`.

---

> **Build 238 synchronization (2026-07-30):** Retained for current operational reference, specialist detail, release evidence, or history. Current architecture lives in `AI_PROJECT_HANDOFF.md`; current direction lives in `MASTER_VALUE_ROADMAP.md`; exact launch blockers live in `STARTUP_GO_LIVE_BLOCKERS.md`.

<!-- BUILD239_SYNC: 2026-08-01 | Current launch interface: /admin-startup-guide.html | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md -->
