# Rosie Dazzlers Build 786 — original enrollment, owners and first genuine broker GET

## Deployment status versus actual connectivity

**A GREEN `main` deployment is not a trusted Comms Hub connection.** Build 786 provides strict offline readback parity and a source-specific original-system handoff. It does not sign the original requests, create public/private database access, start the receiver, run a private GET, or change Rosie source privileges. Rosie remains **DISCONNECTED / HOLD** until the private original systems verify all required enrollment, consent and signed receipts.

The [Comms Hub QL-355 original-owner runbook](https://github.com/RosevearCreations/rosevear-comms-hub/blob/main/docs/build-records/QL-355_INDEPENDENT_ISSUER_DUAL_OWNER_AND_FIRST_PRIVATE_TEST.md) explicitly confirms that even the first accepted **original Windows device** TEST does not authorize any of the six **application sources**. Rosie requires *its own* source enrollment and signed GET authorization afterward. See also [Build 785 nine-receipt source gate](build785_original_custody_dual_owner_first_broker_trial.md).

## Exactly what we must do next

1. **Ree's original Windows host (`DESKTOP-AE894KC`):** in a PowerShell window on the trusted machine, before pulling any updates, run:

   ```powershell
   cd C:\Users\ree\rosevear-comms-hub-ql340
   git status -sb
   ```

   If there are local changes, **STOP** and preserve them. Otherwise update the trusted original checkout with `git pull --ff-only origin main`, then inspect read-only:

   ```powershell
   powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\runtimes\hub-relay\ql354-windows-owner-handoff.ps1 -Status
   powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\runtimes\hub-relay\ql353-windows-original-readback.ps1 -Status
   ```

   Do not copy private keys, enrolled challenge nonces, cookies, encrypted database credentials, receiver URLs or personal information into a browser or public report. The original receiver remains OFF until genuinely authorized.

2. **Jack's independent laptop (`Templar`):** under `jfros`, in a different PowerShell session run `git status -sb` in `C:\Users\jfros\rosevear-comms-hub-ql340`; only fast-forward if clean. Then run the QL-354 `-Status` readback. Jack verifies the **same exact** enrollment payload digest and original independently sourced pins, and makes a separate master-owner decision. Do not merge signers or use a QL-345 REVIEW signature as enrollment consent.

3. **Independent issuer and field witness:** separately authenticate the actual original identity, custody and revocation state. Each original external authority signs the **same 64-hex** QL-340B original enrollment digest using its own previously trusted Ed25519 signer and a 20-minute bounded TEST-only attestation. This must use QL-355's original private independent pin and custody services — never keys from a packet itself. If either authority cannot be independently verified, **stop at HOLD**.

4. **Ree and Jack's genuine owner ceremony:** only after step 3, prepare a new exact QL-340B original request, sign source and master decisions **separately on their own machines**, then inspect/assemble through the original QL-354 protected operator workflow. The private process-local permit cannot be manufactured by this Rosie app.

5. **Original private database operator:** perform QL-355's one-shot original-device enrollment and exactly one device-signed 90-second TEST challenge under its independently authenticated operator, limited receiver role and verified Tailnet transport. Require **exactly one** original enrollment and **one** signed receipt; stop the receiver afterward. The dedicated receiver must never be given an administrator or `service_role` credential. See QL-355's protected read-only SQL guidance, which must be run by the approved private administrator only.

6. **Rosie source, separately:** only after the *device* is genuinely accepted, independently enroll `rosiedazzlers` / child `rosie-dazzlers`, establish its original source GET Ed25519 signer, two fresh source/master TEST-only decisions, scope `rosevear-comms-hub:nonproduction`, and a genuinely authorized private broker operator. Run the two signed read-only shell GETs plus seven denial tests under the limits from [Build 784](build784_source_signed_get_broker_owner_renewal.md) and [Build 785](build785_original_custody_dual_owner_first_broker_trial.md). Require original signed broker receipt readback and explicit final original private grant decision before changing any connected state.

### What the new Rosie admin workbench does

Admin → I.T. Connections → **Build 786** accepts three *sanitized* local-only public summaries for **format and reported-count consistency**:

- `rosevear.hub.ql355.original-authority-test-acceptance.v1` original-device status (source authorization must remain false);
- `rosie.comms.ql786.source-public-summary.v1` Rosie source/tenant, bounded freshness, key pin/digest and *claimed* enrollment/receipt counts;
- `rosie.comms.ql786.owner-public-continuity.v1` source/master public decision continuity and a fresh matching authorization digest.

The input schemas are **Rosie redacted review summaries**, not canonical private QL-355 receipts. No original operator is currently known to have produced such summaries; **do not fabricate them**. Copies of genuine private documents must remain in the protected original custody system. The page will not upload the files, activate a TEST, or transform a reported count or `APPROVED` string into trust.

Even when all three local summaries are mutually consistent, the checker returns `originalIssuerIndependentlyAuthenticated:false`, `privateDatabaseEnrollmentIndependentlyVerified:false`, `originalOwnerTestCeremonyVerified:false`, `originalBrokerGetIndependentlyAccepted:false` and `connected:false`. Only original independent issuer/owner/private-operator checks can resolve those. Invalid role, tenant, status, stale age, revoked source, extra secret fields, mismatched digest, unsigned status elevation, unapproved GET claim or owner expiry all fail closed.

## Local regression commands

```bash
node scripts/build786_original_enrollment_acceptance_test.mjs
bash scripts/current_booking_wizard_regression.sh
bash scripts/current_source_gate_contracts.sh
bash scripts/current_optional_authority_triggers.sh
```

No production booking, payment, staff, customer communications, device control or Comms Hub private database changes are part of this build. The first genuine broker GET remains **not executed** until the original authorized systems and external humans complete the ceremony.
