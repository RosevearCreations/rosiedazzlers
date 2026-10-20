# Build 589 — Independently Anchored Operator Exception Register & Review Escalation Ledger

## Delivered
- Read-only independently anchored **Ed25519-signed operator exception register** verification. Every revision binds the exact Build 588 independently verified rotation-register digest and sequence, GitHub repository/issue, ordered owner-exception receipts, exception decision digest head, predecessor register digest, revision number, issue time and external evidence reference.
- Requires three **different** separately pinned Ed25519 trust roots: rotation register signer, human owner exception signer, and external exception-register signer. Public-key fingerprints and exception register HEAD/digest/sequence pins must be established independently of the mutable GitHub repository and hosted document.
- Independently replays the Build 588 signed rotation register, all GitHub handoff receipts, and their detached signed archive/owner evidence before accepting an exception-register proof. No reliance on an unverified caller-supplied `status: VERIFIED`.
- An exception register revision must increment sequence without gaps, link the prior revision's digest, increase issue timestamp and **preserve earlier signed exception entries as an identical prefix**. A snapshot/revision omitting previous history, rewriting a decision, changing signer identity, or mismatching a separately pinned digest is rejected with HOLD.
- Signed operator exceptions allow only `OPEN_REVIEW`, `ACKNOWLEDGE_HOLD`, or `DEFER_FOLLOWUP`; there is no exception override, automatic closure, retention bypass, account impersonation or unapproved rotation.
- A read-only **owner escalation ledger** groups independently verified signed decisions by incident and flags any incident whose last review exceeds a bounded `reviewAfterDays` threshold. A due flag is advisory: `automaticEscalation:false`, `automaticClosure:false`, and `externalWritePerformed:false`.

## Security and operations
The source implements a provider-neutral verification *contract* with deterministic test-only ephemeral keys and synthetic evidence. No external exception register, signer identity, WORM provider, archive document, owner approval, outbound alert, customer booking or payment transaction has been configured or created. No scheduled workflow writes evidence. To operate against real records, the owner must independently provision and manage an off-repository signed register and pins and separately authorize any real owner decision. An external HTTPS endpoint by itself is **not** an independent trust root.

The verification API accepts:
`verifyExceptionRegisterHistory({revisions,continuityArguments,ownerReceipts,ownerPublicKeyPem,pinnedOwnerFingerprint,pinnedSourceRegisterFingerprint,pinnedExceptionSignerFingerprint,now})`
where each revision contains `signedRegister`, `publicKeyPem`, `pinnedSignerFingerprint` and `externalPin`, and `continuityArguments` contains the complete Build 588 independently pinned source rotation-register revisions, GitHub comments and detached signed owner/archive evidence. The adapter deliberately performs **no** mutations.

Use `ownerEscalationLedger({verifyArguments,now,reviewAfterDays})` with the full separately pinned arguments required by `verifyExceptionRegisterHistory`. It **re-runs signature and continuity verification**, refusing a caller-supplied `status: VERIFIED` object. This is an advisory ledger; actual owner review is still required.

## Tests and production gate
- `node scripts/release_incident_external_exception_register_test.mjs`
- `node scripts/release_health_monitor_test.mjs` includes the Build 589 tests in the protected Current Source Gate.
- After protected `main` merge, separately verify exact-SHA Cloudflare Production deploy, exact production verification checks, and business acceptance. A successful merge alone does not certify Production GREEN.

**Next proposed Build 590 — Owner Escalation Receipt Provenance & Exception Review Continuity Governance.**
