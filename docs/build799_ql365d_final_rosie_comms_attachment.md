# Build 799 — final Rosie Dazzlers QL-365D Comms attachment report

**Scope:** Rosie Dazzlers owned-business shell, source `rosiedazzlers`, repository
`RosevearCreations/rosiedazzlers`. This is one of six distinct integration
sources, not a customer, vehicle, booking, detailer or payment account.

## Software acceptance completed

- Protected source route: `GET /api/integration/v1/shell/health`.
- Cloudflare Pages route: `functions/api/integration/v1/shell/health.js`.
- Source dispatch: `functions/api/_lib/ql336-owned-shell.mjs`.
- Source-owned original QL-364 handler:
  `functions/api/_lib/ql364-source-health.mjs`.
- Immutable independently fetchable handler baseline commit:
  `83b03717b828ac70984a5f9279cd05d9f163faae` (Build 798 `main`).
- Original QL-364 handler raw SHA-256:
  `43c99b4270a3894cd48bf626a032652b16fb61bc67770f60c937550d742a46ee`.
- Discovery manifest: `.well-known/rosevear-integration-manifest.json`,
  `audience=rosevear-master`, `tenant_boundary=owned_business_legacy`,
  `source_revision=<immutable handler baseline above>`.
- A new read-only QL-365D inspector computes current Git commit, original
  handler SHA and public manifest SHA from local bytes. It validates the
  release's exact identity, pinned prior source revision, route wiring,
  QL-363 contract schemas and discovery restrictions.
- `scripts/ql364-source-health.test.mjs` is now an explicit required release
  regression. `scripts/build799_ql365d_rosie_attachment_test.mjs` includes
  malicious-source/tenant/manifest drift and unauthenticated request denials.

Run at a trusted Rosie checkout:

```powershell
node .\scripts\ql799_ql365d_rosie_attachment_audit.mjs --status
```

This is a **software-only** audit. Its `mainCommitSha` is the checkout's Git
commit, not an independently signed original release or live enrollment.
The manifest's 40-character immutable source revision deliberately identifies
the already-promoted QL-364 handler baseline, not the mutable HEAD of a
subsequent dashboard or documentation release. The handler's byte hash must
remain identical before that baseline can be used for QL-363 signing.

## Connection state and exact missing independent evidence

**DISCONNECTED / HOLD.** Software code and CI signatures are not original
field approval. The public discovery manifest remains **unsigned and HELD**;
its now-immutable revision is not itself a signed QL-363 contract. The
independent master registry still must verify and pin all of the following:

1. The exact source manifest SHA-256 and original QL-364 handler bytes at the
   pinned immutable source commit, plus an approved private HTTPS origin and
   independently verified TLS public key (do not infer from GitHub or DNS).
2. A source-owned, separately pinned Ed25519 signer and a QL-363 contract
   signed with that key, bound to Rosie, the manifest SHA, release revision,
   origin, `TEST`, `GET`, path, 4096-byte cap, no redirect, no persistent
   connection and no customer/device data.
3. Independent original owner and reviewer QL-365A/B/C/D evidence: Ree and
   Jack separately verify the same public digest and sign a single named
   source-specific offline review. This review is **not a private GET grant**.
4. Original QL-355 issuer and independent witness authentication; QL-354
   restricted enrollment; receiver/Tailnet isolation and original signed
   TEST/STOP evidence, independent database authority and durable one-use
   QL-362 claim. These cannot be replaced by a generated record or CI.
5. If those independently verified original controls exist, the protected
   operator may execute **one** owner-authorized private Rosie source GET over
   pinned TLS, with a four-second timeout, maximum 4096 bytes, no redirects,
   no retries, and independent source-signed QL-363 receipt verification.
   Confirm receiver STOP and all six database peers still HELD afterward.
6. Separate affirmative production authorization would be required for any
   persistent `CONNECTED` status. A signed read-only TEST cannot grant it.

No provider/customer messages, device actions, data exchange, original
receiver activation or connection state transition are performed by 799.

## Original-device read-only commands

Run these commands on **each original computer**, using the local Comms Hub
checkout and the already-installed local Node.js. The output may be shared
after redacting nonpublic information. Do not send key files, passphrases,
source receipts, private candidate JSON or database credentials through chat.

### Ree — original source owner

On `DESKTOP-AE894KC` under Windows account `ree`:

```powershell
cd C:\Users\ree\rosevear-comms-hub-current
node .\runtimes\hub-relay\ql365a-first-time-trust-cli.mjs --status
node .\runtimes\hub-relay\ql365b-original-review-cli.mjs --status
node .\runtimes\hub-relay\ql365c-original-preflight-cli.mjs --status
node .\runtimes\hub-relay\ql365d-original-test-cli.mjs --status
powershell.exe -NoProfile -ExecutionPolicy RemoteSigned -File .\runtimes\hub-relay\ql344-windows-off-observer.ps1 -Status
```

### Jack — independent master owner

On `TEMPLAR` under Windows account `jfros`:

```powershell
cd C:\Users\jfros\comms-current
node .\runtimes\hub-relay\ql365a-first-time-trust-cli.mjs --status
node .\runtimes\hub-relay\ql365b-original-review-cli.mjs --status
node .\runtimes\hub-relay\ql365c-original-preflight-cli.mjs --status
node .\runtimes\hub-relay\ql365d-original-test-cli.mjs --status
```

Check the actual checkout directory before running, and update it if the
Comms Hub was installed elsewhere. Both computers must contain the current
protected QL-365D files. `--status` is read-only and does **not** sign a
review, enroll a receiver or authenticate an issuer.

### When original proof is complete

Only after separate human verification of actual QL-365A/B/C evidence and
independent reviewer custody, use:

```powershell
node .\runtimes\hub-relay\ql365d-original-test-cli.mjs --help
```

Its `--prepare`, `--inspect`, `--sign`, `--assemble` and `--inspect-signed`
commands require original private input artifacts, a 90-second owner window
and interactive confirmation on the correct Windows account. The first
argument to `--prepare` is exactly `rosiedazzlers`. The prepared and signed
review is for **offline inspection only**, not permission to run a live TEST.
If any required original artifact is missing or expired, stop and leave HOLD.

## Authoritative contract

[QL-365D six-app attachment handoff](https://github.com/RosevearCreations/rosevear-comms-hub/blob/main/docs/handoffs/QL365D_SIX_APP_COMMS_ATTACHMENT_VALIDATION_HANDOFF.md)

This completes Rosie-specific code and release validation for QL-365D. The
remaining steps are original owner/issuer/witness and private operator work,
not a request for another series of preparatory software builds.
