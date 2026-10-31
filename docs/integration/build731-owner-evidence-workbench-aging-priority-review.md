# Build 731 — Owner Evidence Workbench Simplification & Aging Priority Review

## Owner-facing layout

The protected `/admin-followup-workload/` page now starts its evidence work
with three compact review lanes: **owner**, **witness** and **nonproduction**.
The previous Build 723–729 `details` elements are **moved, not recreated or
deleted**, into three one-level-deep advanced lanes. Their input IDs, files,
buttons and API actions remain unchanged. The Build 730 local recovery console
is moved into a fourth advanced lane inside the authenticated Admin area.
When JavaScript is disabled, the original nested markup remains in place.

The simplified overview is intentionally blank until the owner supplies
original Ed25519-signed JSON files. A signed-in Admin may choose 1–24 originals
from Build 723–730. The current server signer custody audit rechecks the exact
current-key Ed25519 signatures, receipt kinds/builds, receipt freshness and
SHA-256 digests. Unknown, stale, modified, duplicated or unsafe receipts
fail closed; the entire batch is rejected. It does not infer a missing receipt
from an earlier screen, an unsigned JSON file or static page copy.

The overview displays only verified signed local review statuses, original
receipt/source hashes, bounded reviewer timestamps and separately labeled
historical queue-age readings where present. Local receipt age at verification
is categorized into **under 24h**, **24–71h**, **72–167h** and **168h+**.
These are *local signed receipt ages* and are never external delivery, witness
age, custody acceptance or an automated priority queue.

Owner/workflow scope and age filters operate solely on the verified in-memory
items. The filtered local export preserves receipt SHA-256, original source
SHA-256 map, verifier key fingerprint, review timestamp and explicit remaining
actions. It contains no raw evidence envelopes, customer contacts, bearer
tokens or database writes. No localStorage/sessionStorage is used.

## Remaining external approvals (unchanged)

- Owner: genuine external delivery receipt and independent owner handoff.
- Witness: human identity, independent original disposition and custody review.
- Nonproduction: authentic original provenance, independent custodian authority,
  disposable-project/RLS review and real retention/backup observations.

Production deployment GREEN is software release health only. Independent
evidence and Proof-B remain **HELD**. No SMS, email, SQL, migration, backup
access, record deletion, scheduler or ledger activation is authorized.
