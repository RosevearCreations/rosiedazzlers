# Rosie Dazzlers Build 727 — signed local review continuation

**Release scope:** owner exception follow-up queue, separate witness priority
disposition audit and nonproduction source-reference recheck.

**External security gate: HELD until independently verified.** A GREEN website
deploy does **not** mean the evidence ledger is enabled or that authentic
external approvals, source documents, witness identities or backup retention
observations have been received.

| Admin action | Requires original current-key signed receipts | Effect |
| --- | --- | --- |
| `followup_owner_exception_evidence` | Build 726 owner exception + 725 reconciliation + 724 owner handoff | Calculates local 24/72/168-hour follow-up priority, then signs one on-demand owner item; sends no message |
| `audit_witness_priority_disposition` | Build 726 priority + 725 aging + 724 reference | Separate auditor flags the absence of genuine independent witness disposition; cannot approve identity or custody |
| `recheck_trial_source_provenance` | Build 726 reference intake + 725 readiness + 724 handoff | Separate reviewer compares an observed nonpersonal label and SHA-256 with signed local metadata; drift is quarantined; a match is still **not** external proof |

New server-only configured admin UUID references:

- `ROSIE_EXPORT_WITNESS_DISPOSITION_AUDITOR_STAFF_ID` — distinct from the Build
  726 priority reviewer, 725 aging reviewer, 724 reference reviewer, custody
  reviewer and signing identity.
- `ROSIE_LEDGER_NONPROD_PROVENANCE_RECHECK_REVIEWER_STAFF_ID` — distinct from
  Build 726 intake reviewer, 725 trial reviewer, original owner, execution
  reviewer, ledger security reviewer and signing identity.

The original owner must record owner queue decisions with their original
authenticated admin staff session. All three endpoints require genuine
current-key signed source envelopes, the live server signer audit and exact
parent receipt SHA-256 matches. A role mismatch, source-drift mismatch,
production project reference, missing acknowledgement or unsafe note/reference
fails closed with HELD/409. The API produces a signed local JSON receipt for
manual download; there is no persistent queue, polling loop or document upload.

Still required outside this release:

1. Real independently authenticated owner-to-custodian handoff and receipt.
2. Real independent witness identity reference and challenge disposition.
3. Approved disposable nonproduction project, live grants/RLS/backup inventory,
   rollback/restore witness and actual retention/purge observation.

Do not place signer private keys, raw customer data, identity documents, URLs,
or unverified claims of successful execution in an administrative intake note.
No SQL migration is run, no backup is accessed, and no Proof-B authorization
is granted by this build.
