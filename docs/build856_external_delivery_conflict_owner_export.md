# Rosie Dazzlers 856 — External Delivery HOLD Witness, Replay Conflict Triage and Owner Closure Evidence Export

## Core boundary

This build implements **original-source evidence review**. A signed receiver-side report is *not* proof that a message was actually delivered, that a remote transaction committed, that source or destination records were independently reconciled, that social-platform mirrors were removed, or that owner incident closure is authorized. All API results remain `master_connection:HOLD`, `master_runtime_ack:false`, `owner_operational_incident_closed:false` until a separate independently verified operational acceptance process is implemented.

## Immutable local witness and conflict ledger

Migration `supabase/migrations/20261112090000_build856_delivery_conflict_custody.sql` creates RLS-enabled `rosie_delivery_conflict_evidence_v856`, service-role-only RPC `rosie856_append_evidence`, unique nonce constraint, unique once-per-855-transaction-and-plane witness admission, unique incident-conflict reference, and append-only rewrite trigger. The RPC checks exact private Rosie booking/project/post and Build 855 signed-review lineage including the selected AI Data or Comms plane's original signed SHA-256.

New owner endpoint `/api/admin/jobday_delivery_856` requires original signed-in Rosie owner, not staff bridge or legacy admin. Exact original booking, unique linked project, original Build 843 explicit consent revocation, original Build 853 incident audit, complete Build 852/853 routing, <=20 posts, <200 dispatch attempts per post and untruncated private audit (250 rows), transaction (100 rows) and custody (100 rows) windows must be present.

### POST `admit_external_delivery_witness`

Request: `booking_id`, `post_id`, `owner_case_reference`, `incident_reference`, `transaction_reference`, `plane`, `action:"admit_external_delivery_witness"`, detached signed `receipt` and `signature`, `confirm_independent_receiver_signature:true`, `acknowledge_remote_delivery_unverified:true`.

The signed receipt requires exact 856 scalar schema/domain, same currently deployed Rosie source revision and source booking/project/post/case/incident/transaction/plane as the existing 855 atomic review, and that plane's prior signed receipt SHA-256/nonce plus distinct fresh receiver signer/nonce, bounded timestamps, original owner identity separation, receiver receipt reference, `receiver_claim:"signed_receiver_observation_review_only"`, `disposition:"delivery_evidence_hold"`, `permissions:"review_only_no_delivery_grant"`.

Independent public-only signer keys:
- `ROSIE_AIDATA_DELIVERY_WITNESS_ED25519_PUBLIC_KEY_856`
- `ROSIE_COMMS_DELIVERY_WITNESS_ED25519_PUBLIC_KEY_856`

They must differ from one another and original 851–855 pins; never store private signing keys in the repository or browser. The response deliberately says `remote_receiver_delivery_verified:false`. An evidence admission is a **local record of a signed claim**, not independent proof of that claim's real-world accuracy.

### POST `record_replay_conflict_recovery`

Requires exact original source transaction and plane, owner approvals `confirm_original_owner_recovery_review:true`, `acknowledge_no_automatic_provider_retry:true`, and safe `conflict_reference`, `evidence_nonce`, 64-hex `evidence_sha256`, supported `conflict_kind`, and `recovery_action`.

Supported conflicts: `duplicate_transaction_replay`, `mismatched_master_receipt`, `missing_delivery_ack`, `stale_delivery_witness`. Supported *local* responses: `quarantine_for_owner_review`, `request_independent_receiver_recheck`, `maintain_external_hold`. The digest is **owner-reported review evidence** unless independently corroborated; no external retry, routing, provider deletion, permission grant, conflict resolution or Master CONNECTED claim is made.

### GET and original-owner closure evidence export

`GET /api/admin/jobday_delivery_856?booking_id=<UUID>` returns safe counts and bounded owner custody history. `GET /api/admin/jobday_delivery_856?booking_id=<UUID>&mode=closure_export&incident_reference=<safe-ref>&transaction_reference=<safe-ref>` yields a downloadable private JSON evidence package with domain-separated SHA-256 checksum, original source IDs, 855 transaction source hash/SLA status, signed witness digest references, and local conflict/owner triage history. It excludes staff email, customer data, raw receipt signatures and bearer credentials. The SHA-256 is an **integrity check only**, not a cryptographic signature or third-party attestation.

Even if both signed observer claims exist and no conflicts are locally recorded, the export always explicitly reports external transport/delivery, Master atomicity, SLA resolution, and operational owner closure **unverified**. It is appropriate as a *candidate evidence handoff*, not as automatic closeout.

## Verification and release controls

Run `bash scripts/current_jobday_custody_regression.sh`, including Build 856 Ed25519 tamper/freshness/replay/conflict/owner export tests. Independently apply and check migration in the **Rosie Dazzlers** Supabase project, verify the RLS/no-browser-role surface, unique indexes and immutability trigger, and keep live original customer/project records unmodified. No fabricated production delivery receipts.

Promote feature -> `dev` with protected checks GREEN, then protected `dev` -> `main` and verify the exact `main` SHA Cloudflare Production deployment and six production acceptance jobs before declaring **software** Production GREEN. A software-green deployment is not operational CONNECTED.

## Next proposed build

Rosie Dazzlers 857 — Independent Delivery Custody Revalidation, Incident Conflict Escalation Aging & Master Owner Acceptance Readback.
