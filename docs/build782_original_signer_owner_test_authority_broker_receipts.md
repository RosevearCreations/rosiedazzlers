# Rosie Dazzlers Build 782 — Original Signer & Owner TEST Authority Evidence Reconciliation, Scoped Broker Challenge Readiness & Independent Handshake Receipt Review

## Software release scope

The Build 781 owner-session protected workbench remains available at `/admin-comms-hub-v781.html`, now enhanced with two Build 782 panels. Admin **I.T. Connections** and **Catalogue** link to them. Public QL-345 challenge and two distinct original-owner review dispositions can be locally read without upload, persistence or network activity. An Ed25519 Web Crypto check verifies the **cryptographic mechanics only** against two user-entered distinct SPKI SHA-256 public fingerprints, which the owners must independently establish *out of band*. The page cannot authenticate the human owners or the original issuer based on the files or copied fingerprints alone.

An accepted QL-345 disposition is **review only** (`HOLD`, `REJECT`, `REVIEW_ACKNOWLEDGED_NO_ENROLLMENT`): even two valid acknowledgments neither authorize QL-340B TEST enrollment nor prove the original Windows receiver is OFF. The checks deny expired (>20-minute) or future-issued challenges; altered nested digests/IDs, secret or privileged keys, incorrect app/audience, reused owner pins, wrong role signatures and mismatched separately entered pins. Inputs stay in the current tab and the browser never receives a private key or passphrase.

The nine-slot receipt review is **unsigned**, with precisely two GET routes (`/api/integration/v1/shell/{health,capabilities}`) and seven original denial categories (missing, invalid, expired authentication; wrong tenant and audience; replayed nonce; mismatched independently pinned public signer). It clearly records the original source GET receipts, broker signatures, nonce/tenant/Proof-B verification, and independent witness receipts as **NOT RECEIVED / NOT RUN**. Downloading the local report is not original issuer evidence or test consent. No provider calls, database migration, KMS activation, receiver start, booking, payment, customer or device actions occur.

## Original external Comms Hub truth

Source inspected from `rosevear-comms-hub` `main` QL-345 (`e4d3c3f...`). The QL-345 script signs only private, *separate* original review dispositions. Its own `evaluateTestPreflight` always remains HOLD, even with two valid Ed25519 review signatures. QL-344 original issuer authentication, original owner supervision, real source Proof-B, independently verified broker/source public pinning, isolated child tenant, atomic nonce and actual signed GET/denial traces are **unproven**. Do not represent verified software delivery or a local cryptographic check as an active Comms Hub connection.

## Original-owner next action (not automated)

1. Ree privately captures a fresh original QL-344 Windows receiver-OFF observation and reconciles the original four evidence files and original issuer; Jack independently reviews actual issuer provenance and exact request on his own device.
2. Follow Comms Hub [QL-345 original instructions](https://github.com/RosevearCreations/rosevear-comms-hub/blob/main/docs/build-records/QL-345_ORIGINAL_ISSUER_AND_SEPARATE_OWNER_TEST_PREFLIGHT.md) to create a fresh **public review-only** 20-minute challenge and, if each owner chooses, sign a separate public **review** disposition without transmitting keys or passphrases.
3. Independently confirm each *public* SPKI fingerprint via a separately authenticated channel; use the locally held QL-345 JSONs and fingerprints in Build 782 for a format/cryptographic readback. Even successful checks remain `DISCONNECTED / HOLD`.
4. Only after issuer/source Proof-B, isolated nonproduction scope, real independent TEST owner enrollment decisions and broker nonce/key custody pass their separate authorization gates can the private broker conduct at most two signed GETs plus seven actual denials within 15 minutes, then independently attest genuine immutable receipts. This app cannot do so by itself.

## Verification

Run `node scripts/build782_comms_original_owner_review_test.mjs` and `bash scripts/current_booking_wizard_regression.sh` alongside the preserved source gate and optional authority verifier suites. Tests use ephemeral *synthetic* Ed25519 keys and never simulate real owner consent. `main` Production GREEN means deployed code checks pass; original Comms Hub connectivity remains **DISCONNECTED / HOLD**.
