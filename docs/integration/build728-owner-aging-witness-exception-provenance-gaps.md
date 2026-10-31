# Rosie Dazzlers Build 728 — owner aging, witness exception and evidence gap review

**Public site release may be GREEN. Independent security gate remains HELD.**
The following functions create on-demand local signed review receipts. They do
not deliver messages, authenticate outside people, publish Proof-B, run SQL,
create a private database ledger, access backups or verify purge compliance.

| Admin action | Original signed evidence | Local receipt only |
| --- | --- | --- |
| `review_owner_followup_aging` | Build 727 owner follow-up queue, 726 owner exception, 725 reconciliation | Original owner audits age of local queue receipt against 24/72/168-hour window; not an actual delivery timestamp |
| `review_witness_audit_exception` | Build 727 witness priority audit, 726 priority, 725 aging | Separately pinned auditor documents absent independent witness disposition and identity |
| `track_nonproduction_provenance_gaps` | Build 727 source recheck, 726 source intake, 725 trial readiness | Separately pinned reviewer lists missing original artifacts, custodial approval, RLS/GRANT checks, backup observations; even matching local SHA remains unverified |

Two new server-only staff UUID bindings must be assigned to genuine separate
active administrator accounts before those reviewer actions can sign:

- `ROSIE_EXPORT_WITNESS_AUDIT_EXCEPTION_REVIEWER_STAFF_ID` — distinct from
  Build 727 witness auditor, 726 priority reviewer, 725 aging reviewer, custody
  reviewer, and signer.
- `ROSIE_LEDGER_NONPROD_EVIDENCE_GAP_REVIEWER_STAFF_ID` — distinct from
  Build 727 provenance reviewer, 726 intake reviewer, 725 readiness reviewer,
  execution and security reviewers, and signer.

The original owner administers the aging review with the original authenticated
admin staff session. Each function requires the *actual current-key signed*
original source receipts with exact SHA-256 ancestry and a live server signer
audit. All actions require an explicit acknowledgement that they are local and
held. An invalid signature, broken chain, wrong role, rejected upstream decision
or production project reference must fail closed. Source documents and identity
records must not be uploaded into these forms.

Authentic outside evidence still needed:

1. Real original owner-to-custodian delivery and reviewer challenge receipts.
2. Independently authenticated human witness identity and disposition.
3. Disposable project authorization and observed original provenance, RLS,
   grants, Data API isolation, restore/rollback, retention and backup purge.

No approval, external artifact, retention compliance or ledger activation is
inferred from a signed local Build 728 receipt or a passing deployment.
