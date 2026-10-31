# Rosie Dazzlers — Build 726 owner exception, witness priority and trial intake handoff

**State: HELD.** This build ships review-only signed local receipts; it does not
prove external delivery, independent witness identity, owner approval, backup
inventory, SQL safety or retention/purge compliance. No database migration or
schema dry-run is executed by this release. Proof-B and all six-app gateway
communications remain disconnected.

## Three on-demand admin actions

| Action | Signed source requirements | Authorized reviewer | Output |
| --- | --- | --- | --- |
| `followup_owner_handoff_exception` | original Build 725 owner reconciliation, 724 handoff, 723 checklist | same original owner admin | missing delivery and independent-approval exceptions; no message sent |
| `review_witness_conflict_priority` | original Build 725 local aging, 724 reference review, 723 identity disposition | separately pinned priority admin | **one local item** with urgent/high/review priority; no persistent or scheduled queue |
| `review_nonproduction_trial_evidence_intake` | original Build 725 readiness, 724 purge preconditions, 724 owner handoff | separately pinned intake admin | unverified reference ID and SHA-256 only; document is **not** uploaded |

Each source must be a genuine current-key signed server receipt of the expected
kind and build. The current server signer audit must pass; copied/modified JSON,
future-dated sources, the wrong staff identity and broken ancestry are rejected.
An authenticated live administrator staff session is mandatory. No password or
bridge-identity fallback is permitted.

## Configuration required before each action

- `ROSIE_EXPORT_WITNESS_PRIORITY_REVIEWER_STAFF_ID`: real UUID of an admin reviewer
  distinct from the Build 725 aging reviewer, Build 724 reference reviewer,
  Build 723 identity reviewer, custody reviewer and receipt signer.
- `ROSIE_LEDGER_NONPROD_EVIDENCE_INTAKE_REVIEWER_STAFF_ID`: real UUID of a separate
  admin reviewer, distinct from the trial reviewer, owner, execution reviewer,
  ledger security reviewer and signer.
- `ROSIE_LEDGER_NONPROD_PROJECT_REF`: genuine disposable project reference, never
  equal to the current `SUPABASE_URL` production project reference.
- Existing pinned signer/custody JWK and the previous Build 723–725 reviewer
  identities remain necessary. **Never put private keys or complete evidence
  documents into a public ticket or client-side input.**

## Independent evidence not yet received

1. Authenticated private owner-to-custodian delivery receipt and challenge
   response by the *actual* independent reviewer.
2. Independently authenticated witness identity and resolution of any conflicting
   reference; a matching SHA-256 is not human identity proof.
3. Disposable project ownership and separation approval, live RLS/grant and Data
   API verification, rollback/restore observation, and documented retention and
   backup expiry/purge observations from authorized providers.

The Build 726 intake accepts a constrained **non-personal reference label**, an
unverified SHA-256, source type, signed reviewer note and explicit disclaimer.
It cannot upload a file, verify a source, send a notification or authorize a
trial. A real independent reviewer must verify original artifacts separately.

The next build must preserve the distinction between a **GREEN website release**
and a **HELD external security approval gate**. Do not use a passing release
check as evidence that the private ledger is activated.
