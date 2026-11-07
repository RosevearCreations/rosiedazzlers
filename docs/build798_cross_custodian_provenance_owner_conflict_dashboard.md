# Rosie Dazzlers Build 798 — original cross-custodian receipt renewal and HOLD eligibility

## Release versus original-device evidence

This release adds a **private-adapter-only evidence evaluator**, an expiry-aware
HOLD dashboard, a read-only QL-364 original-Windows preflight and synthetic
negative-case CI. It does not install a source signing key, enroll a receiver,
perform an original TEST, import a private receipt or connect ChatGPT to Comms.

The six source-owned QL-364 health handler distributions exist, but the
[QL-364 original-owner status](https://github.com/RosevearCreations/rosevear-comms-hub/blob/main/docs/QL364_SOURCE_OWNED_HEALTH_DISTRIBUTION.md)
still records **zero independently verified original enrollments** and **zero
signed original TEST receipts**. A successful source-handler software check does
not establish operational trust or an authenticated connection.

## Read-only checklist for Ree and Jack

1. On Ree's original **DESKTOP-AE894KC** under the `Ree` Windows account, open
   PowerShell at the Rosie checkout and enter:

   ```powershell
   powershell.exe -NoProfile -ExecutionPolicy RemoteSigned -File .\scripts\inspect-rosie-original-ql364-798.ps1 -CommsCheckout 'C:\path\to\rosevear-comms-hub'
   ```

   Replace only the Comms checkout path with the actual repository folder. This
   helper verifies that the known QL-364 release ancestor and files are locally
   present, then reads the QL-362 status; it performs no authorization or GET.
   It supersedes the Build 797 inspector, whose old QL-363 HEAD pin cannot
   authenticate a later QL-364 checkout. It is **not** a signature validator.

2. Repeat on Jack's separate **TEMPLAR** laptop under `jfros` using his local
   checkouts. Both devices must remain distinct; one cannot sign for the other.
   Never send a password, private key, receipt bytes or database credential in chat.
   Only share redacted, nonsecret status fields if troubleshooting.

3. Use the original Comms Hub
   [QL-362 operator handoff](https://github.com/RosevearCreations/rosevear-comms-hub/blob/main/docs/build-records/QL-362_SOURCE_OWNER_OFFLINE_AUTHORIZATION_AND_FIRST_GET_GATE.md)
   to verify the original issuer, independent witness, QL-340B owner decisions,
   QL-359 STOP proof, QL-360 independent archive and QL-361 redaction-audited
   owner-only handoff. No synthetic fixture can replace those original records.

4. If original owners separately authorize it, an authenticated source operator
   may perform the single, time-bound QL-362 **nonproduction source-only GET**
   against Rosie. The QL-364 handler requires an original approval callback,
   a durable one-use operation claim and an original nonexportable source signer.
   Without those original private adapters, it fails closed. Record the original
   source-signed receipt and independent STOP/closure evidence, not customer data.

5. After a verified QL-797 custody and audit, the Build 798 private operator
   must independently read the QL-364 source revision and original receipt-byte
   hashes. Two **distinct** independent custodians then sign renewal attestations
   against the exact receipt, archive head, audit decision, source commit and
   handler hash, with separate immutable archive-anchor readbacks.

6. If the original decision register contains any unresolved conflict, stop at
   `HOLD_UNRESOLVED_OWNER_DECISION_CONFLICT`. Reconcile it with independently
   signed fresh decisions from Ree and Jack, plus separate signer custody proofs.
   This release accepts **HOLD-only** decisions (acknowledge, request more
   evidence, or reject). It expressly rejects permission to connect.

7. After an independent original database readback confirms all six app rows
   remain HOLD and unauthorized, the evaluator may display the earliest expiry
   across both custodian renewals, archive-retention deadlines and both owner
   decisions. It raises `URGENT_90_SECONDS` or `RENEW_WITHIN_24_HOURS` before
   expiry. Missing, expired, revoked, contradictory or replayed evidence restores
   the HOLD dashboard; it never auto-renews signatures or enables transport.

## Operator contract and strict boundaries

Import `createQl798OriginalRenewalDashboard` from
`scripts/ql798_cross_custodian_provenance_owner_eligibility.mjs` only inside a
trusted original, private operator with an already authenticated Build 797
adapter and these nine independent original callbacks:

- `readOriginalQl798SourceByteProvenance`
- `readOriginalQl798IndependentRenewal`
- `resolveOriginalQl798PinnedSigner`
- `readIndependentQl798SignerCustody`
- `readIndependentQl798CustodianAnchor`
- `readOriginalQl798OwnerConflictRegister`
- `readOriginalQl798OwnerResolutionSignatures`
- `readIndependentQl798OwnerResolutionCustody`
- `readIndependentQl798SixPeersAfterRenewal`

No original callback implementations, original keys, network transport or
database privilege is provisioned by this build. Inspect the software-only
HOLD posture with:

```shell
node scripts/ql798_cross_custodian_provenance_owner_eligibility.mjs --status
node scripts/build798_cross_custodian_provenance_owner_eligibility_test.mjs
```

The CI test signs **synthetic** Ed25519 payloads with temporary keys and
confirms failure for forged signatures, mismatched source identity, independent
custodian failure, owner conflict, expiry, duplicate attempt, tenant leakage and
unauthorized peer activation. A passing test is not original attestation.

## Authentication of ChatGPT is a separate future operation

A trusted operator must first establish the real Comms owner and issuer/witness
chain. To let a conversational assistant access the Hub thereafter, configure a
**separate supported, owner-approved, scoped connector/service identity** and
its authenticated private API boundary. Start with a revocable, time-limited,
read-only TEST grant with explicit audit receipts. Do not grant this conversation
owner signing authority, nonexportable keys, device control, customer messages or
general database access; never put credentials in the chat transcript. Until
such a connector is deployed and authenticated, the assistant has **no Comms
login or network access** and cannot run the original ceremony from chat.

## Next proposed build

**Rosie Dazzlers 799 — Original QL-364 Private TEST Enrollment Assistance,
Source-Signed GET Acceptance and Independently Witnessed Connection Readiness.**
The source-only GET remains a separately authorized nonproduction operation,
not a persistent connection or customer-data permission.
