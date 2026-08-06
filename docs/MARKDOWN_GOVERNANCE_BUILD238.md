# Markdown Governance — Build 238

## Authoritative files

- `AI_PROJECT_HANDOFF.md` — architecture and current engineering handoff.
- `MASTER_VALUE_ROADMAP.md` — business/product direction and ordered work.
- `STARTUP_GO_LIVE_BLOCKERS.md` — exact operational go-live instructions.

## Retained operational references

`DEVELOPMENT_ROADMAP.md`, `KNOWN_GAPS_AND_RISKS.md`, `CURRENT_IMPLEMENTATION_STATE.md`, `SANITY_CHECK.md`, schema/database docs and current build docs remain synchronized.

## Historical files

Do not delete historical Markdown yet. Release scripts still use some old markers as regression evidence. First map every dependency, replace marker-only tests with current capability/route/schema tests, generate an archive manifest, run the complete suite, then move approved files to `docs/archive/`. Keep Git history and migration evidence.

## Build synchronization rule

Every Markdown file carries a Build 238 synchronization note so a future AI knows the current authority order. A marker does not make a historical document authoritative.

---

> **Build 238 synchronization (2026-07-30):** Retained for current operational reference, specialist detail, release evidence, or history. Current architecture lives in `AI_PROJECT_HANDOFF.md`; current direction lives in `MASTER_VALUE_ROADMAP.md`; exact launch blockers live in `STARTUP_GO_LIVE_BLOCKERS.md`.

<!-- BUILD239_SYNC: 2026-08-01 | Current launch interface: /admin-startup-guide.html | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md -->

<!-- BUILD240_SYNC: 2026-08-05 | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md | Inventory posting: /admin-inventory-posting.html -->

<!-- BUILD241_SYNC: 2026-08-05 | Startup Command Center initialization/cache hotfix | No DDL required -->
