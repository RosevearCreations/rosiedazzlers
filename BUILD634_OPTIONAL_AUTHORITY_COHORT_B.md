# Rosie Dazzlers — Build 634: Optional Authority Trigger De-duplication, Cohort B

## Goal
Reduce duplicate GitHub Actions runs without bypassing required release checks or weakening safety. Build 633 passed Source Gate and exact-SHA Cloudflare Production GREEN on main SHA `57b366869570bc52908a241c641eee835df00dab`; Build 634 extends its narrowly reviewed strategy.

## Scoped implementation
The file list is enumerated in `scripts/build634_optional_authority_cohort_b_test.mjs`. It comprises exactly **15 historical, non-required optional authority workflows** covering booking-funnel learning, detailer UX, fleet account operations, maintenance plans and provider/local-search evidence.

For each workflow, remove only the broad `build*` selector from `on.push.branches`. Keep protected `dev` and `main` push runs, `pull_request` to either, manual `workflow_dispatch`, and all existing job/test/permission definitions. Do not remove scoped `buildNNN*` selectors in other workflows.

Modify only the stable `scripts/current_optional_authority_triggers.sh` to call both Build 633 and Build 634 regression scripts. Maintain `set -euo pipefail` and the existing Source Gate step `Validate optional authority workflow trigger regression`. This avoids direct numbered-build invocations in an active workflow rejected by release hygiene.

The dev branch additionally receives the **main-approved stable Source Gate source** (same preserved required suites A-D, aggregate, current_source_gate_contracts.sh and optional authority wrapper), reconciling previously divergent CI definitions without replacing live booking code.

## Evidence and limits
- Before release: explicit checks of 15 edited files and no user-facing website, price, deposit, booking, payment, provider intake, data migration or Cloudflare configuration changes.
- The original workflow job bodies remain byte-identical; only broad feature-push triggers are removed.
- Estimated potential duplicate run reduction: up to 15 optional runs per `build*` push after the default-branch workflow definitions update, not a guarantee of runner capacity or queue time.
- Already queued GitHub Actions jobs cannot be deleted or dismissed by these code edits.
- Protected `source checks` aggregate **must require all A-D suites successfully**. Never bypass branches or invent GREEN.

## Validation
Run `bash scripts/current_optional_authority_triggers.sh` and `bash scripts/current_source_gate_contracts.sh`; confirm the exact change diff and PR checks. After protected main merge, confirm successful Cloudflare Pages Production deployment for the exact resulting main SHA, Functions metadata, immutable deployment static/contextual smoke and canonical `https://rosiedazzlers.ca` smoke. A GitHub merge or HTTP 200 alone does not establish GREEN.

Further workflow reductions, particularly around real customer privacy, security, payment or deployment, need separate review rather than blanket cancellation.
