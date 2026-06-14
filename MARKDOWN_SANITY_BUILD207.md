# Build 207 Markdown Sanity Check

**Updated:** 2026-06-14

## Decision

The project now has two primary planning files:

1. `AI_PROJECT_HANDOFF.md`
2. `MASTER_VALUE_ROADMAP.md`

Older Markdown files are kept because they still provide release history and many release checks still verify that historical notes exist. They should not be deleted yet.

## What changes after this build

- Future strategy goes into the two main files first.
- `DEVELOPMENT_ROADMAP.md` and `KNOWN_GAPS_AND_RISKS.md` keep build-by-build summaries.
- `DOC_INDEX.md` explains which files are canonical, retained, or historical.
- Duplicate competitor/roadmap files are considered retired-for-editing but not removed.

## Retirement plan

When the release-check chain is modernized, move duplicate historical docs into `docs/archive/` with a manifest. Do not hard-delete them until all older checks and future-AI references are safe.
