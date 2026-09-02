# Build 304 — Accountant Export Integrity

**Release:** Build 304  
**Date:** 2026-09-02  
**Development-only:** yes  
**Production/main:** remains accepted Build 303 at `09442c53d385aca7995150ace4bde55abd51d7df`

## Purpose

Build 304 hardens the existing Finance accountant-export boundary without changing accounting/tax policy, database schema, payment-provider behavior or the retained Build 273 tax-support calculations.

The accepted pre-documentation Development implementation/evidence baseline is `6351321a2d33ed8489295a60d8de72adea81a859`. Documentation synchronization is intentionally allowed to advance `dev`; final Build 304 closure is determined from the exact documentation-synchronized `dev` SHA and its source/runtime/Cloudflare acceptance, not from this recorded baseline alone.

## Export integrity authority

Build 304 adds `functions/api/_lib/accounting-accountant-export.js` as the dedicated export-shaping authority for the accountant package.

The accountant JSON package now has:

- `schema_version: 2`;
- export contract `rosie_accountant_workpaper_json`;
- predictable `application/json`, UTF-8 format metadata;
- deterministic `rosie-accountant-package-YYYY.json` filenames;
- explicit evidence reference classification: `general`, `verified`, `unverified`, `unresolved`, `missing_related_id`, or `unsupported_type`;
- an `evidence_integrity` summary that requires review for unresolved/missing/unsupported references;
- safe evidence filenames reduced to sanitized basenames;
- masked-only business/tax identity export;
- an explicit privacy boundary stating that storage locators, staff identity and internal document notes are not exported.

The package intentionally omits raw `storage_path`, `file_url`, upload/signed URLs, internal document notes, staff user IDs/names and raw mileage rows/booking IDs. Stable document/reference IDs remain available for traceability. Accountant-facing notes remain available where explicitly part of the workpaper contract.

`functions/api/admin/accounting_accountant_package.js` remains read-only and protected by `finance.view`; it now delegates export shaping to the whitelist helper. `functions/api/admin/accounting_export.js` retains CSV behavior while sanitizing the dynamic payables-status filename token before it reaches `Content-Disposition`.

## Regression protection

Build 304 adds:

- `scripts/build304_export_contract_test.mjs` — hostile/private fixture regression test for storage URLs/paths, internal notes, staff identity, booking IDs, broken references and unsafe filenames;
- `scripts/build304_release_check.py` — focused export/privacy contract guard that also rejects Build 304 schema/migration changes and requires the Build 303 tax-support runtime authority to remain unchanged;
- `scripts/build304_http_smoke.sh` — read-only deployed smoke requiring anonymous accountant-package access to fail closed without leaking export content;
- `.github/workflows/build304-source-gate.yml`;
- `.github/workflows/build304-development-source-gate.yml`;
- `.github/workflows/build304-development-acceptance.yml`.

## Historical guard convergence repaired during acceptance

Build 304 exposed historical CI guards that were correct in intent but no longer forward-compatible with later extraction/history depth. These were repaired without weakening their semantic boundaries:

- Build 273 now follows accountant-export shaping into the Build 304 helper only when the endpoint actually imports/calls that helper; Finance/action/accountant-readiness requirements remain enforced.
- Build 290 rollback readiness now obtains complete history before proving the exact accepted Build 289 SHA/tree ancestry and still fails closed if that proof cannot be obtained.
- Build 291 and Build 292 release guards likewise obtain complete history before asserting their unchanged exact accepted ancestry anchors.
- Build 299 and Build 300 source-hygiene checks now inspect their frozen accepted release deltas rather than unrelated later byte-for-byte extraction files.

## Pre-documentation Development evidence

On exact Development SHA `6351321a2d33ed8489295a60d8de72adea81a859`:

- Build 304 Development Runtime Acceptance Run `33693718049`: **SUCCESS**;
- canonical Development Source Gate Run `33693718028`: **SUCCESS**;
- retained Build 290/291/292 runtime acceptance: **SUCCESS**;
- retained Build 301/303 source/runtime gates: **SUCCESS**;
- exact-SHA failure query: zero failures;
- Cloudflare Development Acceptance Run `33693718093`: **SUCCESS**;
- exact Cloudflare deployment `be586bf6-fc84-4030-a1c7-d534913bab0f`: `success`, `uses_functions=true`;
- immutable static smoke passed at `https://be586bf6.rosiedazzlers.pages.dev`;
- `https://dev.rosiedazzlers.pages.dev` full runtime/API alias smoke converged on the first attempt.

A queued historical Build 293 runtime run was still waiting for runner capacity when documentation synchronization began; the documentation commit triggers a fresh exact-SHA acceptance and its concurrency policy supersedes the stale queued run. Build 304 is not closed until the final documentation-synchronized `dev` acceptance is clean.

## Explicit non-changes

Build 304 introduces:

- no database/schema migration;
- no accounting or tax-policy change;
- no new tax judgment;
- no payment-provider mutation;
- no Production data mutation;
- no change to the retained Build 303 Tax Support browser controller;
- no Production promotion authority.

## Next item

**Build 305 — Finance authorization sweep** remains untouched until Build 304 final Development acceptance is clean.
