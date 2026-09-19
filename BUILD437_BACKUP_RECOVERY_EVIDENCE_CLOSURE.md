# Build 437 — Backup & Recovery Evidence Closure

## Purpose
Converge current backup/export artifact, retention and bounded recovery-drill evidence without creating recovery activity merely to satisfy readiness.

## Implemented evidence refresh
The release retains the existing backup/restore/accountant-export operational-proof authority and adds a dated read-only classification layer.

- A current backup artifact is observed only when the retained verified evidence already reports an artifact and attributable verification timestamp.
- Backup retention is observed only when that same retained authority records a retention/storage location.
- A recovery/rollback drill is observed only when the retained authority already reports a separately verified bounded drill and timestamp.
- Accountant-export runtime usability and retained export-artifact observation remain supporting evidence; they do not replace the backup/recovery requirements.
- Missing required evidence remains `owner_action`; an unreachable authorized source remains `unavailable`.
- All three required recovery evidence classes must be observed and dated before the report becomes a `closure_candidate`.

The new read-only endpoint is `/api/admin/backup_recovery_evidence_closure`. The existing Launch Readiness panel renders the same bounded report on manual refresh.

## Canonical HOLD boundary
`STARTUP_GO_LIVE_BLOCKERS.md` remains the single canonical HOLD inventory. A runtime `closure_candidate` never edits or removes the recovery/backup HOLD automatically. It means the required dated retained evidence is currently observed and the row may be narrowed only through an explicit operator-reviewed evidence update.

## Recovery mutation boundary
This release performs no Production restore, rollback, DNS mutation, secret rotation, destructive R2 operation, provider mutation, schema migration, business-data mutation, export generation or permanent polling merely to obtain evidence. Any real recovery mutation must be followed by normal exact-SHA Development/Production acceptance before the resulting boundary is called GREEN.

## Privacy boundary
The dated closure report exposes classification, timestamp, age and counts only. It does not return launch-evidence note contents, customer identities, accountant-package contents, credentials or secret values.

## Acceptance
The exact candidate must pass focused Backup & Recovery Evidence Closure authority, retained recovery/export, rollback/recovery and security/privacy/recovery authorities, Current Source Gate, exact feature-preview acceptance, exact Development deployment/runtime acceptance, protected-main PR checks and independent exact resulting `main` Production deployment/runtime/business acceptance.

Missing provider/owner/observed evidence remains a truthful HOLD or unavailable state. Source/runtime GREEN never fabricates recovery evidence.

## Next bounded release
**Build 438 — Authenticated Device & Visual Acceptance** begins only after this release is independently GREEN on protected `main`.
