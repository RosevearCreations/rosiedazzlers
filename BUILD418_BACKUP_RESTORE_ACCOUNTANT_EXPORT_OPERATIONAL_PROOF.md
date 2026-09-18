# Build 418 — Backup, Restore & Accountant Export Operational Proof

Build 418 closes the recovery/export evidence gap without creating recovery activity merely to satisfy readiness. It composes the retained launch-evidence ledger, Build 385 recovery authority and Build 394 Finance close/accountant-export authority into one read-only operational-proof view.

## Evidence contract

- A repository route, runbook or export endpoint is **source evidence only**. It does not prove that a current backup or exported artifact exists.
- Current backup proof requires a verified launch-evidence record with a dated observation, artifact language and retention/storage-location language.
- The backup evidence note itself is never returned by the Build 418 proof payload.
- Retention location is observed only when explicitly recorded; it is never inferred from configured services or source paths.
- Recovery/rollback drill proof requires a separately recorded verified drill observation. Source acceptance never executes a restore or rollback.
- Build 394 remains the canonical accountant-export readiness authority. Build 418 consumes only its read-only acceptance result and export manifest.
- Accountant-export usability is `runtime_proven` only when the canonical Finance acceptance reports the accountant-export scenario ready and the retained package/CSV manifest is present.
- Export-route usability does not prove that a current accountant package or CSV has been generated and retained.
- A retained accountant-export artifact is owner-observed only when verified evidence records export/artifact and retention-location language.
- Missing evidence remains `owner_action` or `unavailable`; source/runtime GREEN never fabricates operational proof.

## Operator surface

`/admin-launch-readiness.html` retains the controlled soft-launch and provider-evidence panels and extends the existing recovery panel with:

- current backup-artifact observation;
- retention-location observation;
- separately observed recovery/rollback drill;
- canonical accountant-export runtime usability and export-family count;
- retained accountant-export artifact observation;
- the exact remaining recovery/export HOLDs.

No launch-evidence note contents, customer identity, accountant-package contents, provider credentials or secret values are returned.

## Recovery boundary

Build 418 does **not** perform a Production restore, Development rollback, database restore, R2 write/delete, DNS change, secret rotation, Cloudflare redeploy, provider mutation or schema migration.

A real recovery drill or restore remains a separately authorized operator action under `docs/BACKUP_RESTORE_RELEASE_RECOVERY.md`. After any real recovery mutation, the resulting boundary must pass the normal exact-SHA Development/Production acceptance path again before it is called GREEN.

## Export boundary

Build 418 does **not** generate or persist an accountant export. It reads the canonical Build 394 acceptance snapshot and export manifest only. Accountant approval, period close, accounting posting and file-retention decisions remain explicit operator actions.

## Release acceptance

The candidate must pass:

1. executable Build 418 operational-proof tests;
2. retained Build 385 backup/recovery safety authority;
3. retained Build 394 Finance/accountant-export authority;
4. the focused Build 418 workflow;
5. Current Source Gate and exact feature-preview acceptance;
6. exact-SHA Development deployment/runtime acceptance after non-force `dev` fast-forward;
7. protected-main PR requirements;
8. exact resulting Production SHA deployment/runtime/business acceptance.

Source/Production GREEN may coexist with an operational-proof HOLD until real backup/export/drill evidence is recorded truthfully.

Build 418 introduces no database migration, restore, export generation, Production business-data mutation, payment/provider mutation, accounting posting, destructive R2 mutation or permanent polling.

Build 419 — Customer & Staff Production Workflow Evidence is next only after Build 418 is independently GREEN on protected `main`.
