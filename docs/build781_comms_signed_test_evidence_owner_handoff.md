# Rosie Dazzlers Build 781 — Signed Nonproduction Handshake Evidence Workbench, Connection Status Verification & Owner Authorization Handoff

## What this release does

The Admin **I.T. Connections** page links to `/admin-comms-hub-v781.html`, a responsive, accessible source-owned workbench. It exposes a strictly **owner-session** `GET /api/admin/comms_hub_connection_status_v781` describing Rosie's own connection boundary. No external Comms Hub/AI Data Platform/Windows calls occur on this route. POST/PUT/PATCH/DELETE are denied; nothing is saved in a database.

- The source code still deliberately returns **503 HOLD** for `/api/integration/v1/shell/health` and `/api/integration/v1/shell/capabilities`. These are **not** the legacy HMAC-gated `/api/integration/v1/{health,capabilities}` business endpoints. Rosie is currently the first child of a *proposed* auto-detailing shell, not a migrated and verified multi-child platform.
- The new page can locally inspect an independently obtained **nonsecret** Comms Hub QL-341 six-peer private readback. It accepts exactly six known original peer identities, all `DISCONNECTED / HOLD`, no grants, and denies connected/elevated/foreign or secret-bearing assertions. File content stays **browser-local**, with no upload or local storage. Even a structurally valid, claimed original heartbeat is *not* authenticated by this page.
- The page downloads only an **unsigned, non-authorizing** scoped TEST handoff packet. It retains the `rosiedazzlers` shell, nonproduction-only GET paths, a future maximum fifteen-minute window, two proposed positive read-only GETs, and seven original denial cases. `owner_test_approved`, `source_test_approved`, `connected`, `receiver_activated` and all network/write flags remain **false**. No cryptographic key, pretend signature, trusted pin, nonce, external original receipt or owner decision is created.
- The backend reports six separate HOLD gates: original signed source Proof-B; original backup/child isolation; broker trust and nonce/KMS custody; independent original receiver-OFF issuer evidence; separate original-owner/source-owner decisions; and original signed GET/denial receipts.

## Original Comms Hub truth as observed for this build

The Comms Hub `main` inspected at source commit `6e87a334fbea9b6b45542b5f509464a0817e2f1a` contains QL-344's receiver-OFF observation workflow and QL-341's six-private-peer readback. Those sources explicitly report **receiver OFF**, **six peers HOLD**, **zero authenticated external GETs**, and no signed/authorized Rosie connection. An original QL-344 status/capture on Ree's real Windows machine is still owner work; a CI fixture does not prove live process state. Jack's distinct original-issuer review and signing decision must remain separate. Do not claim QL-345 has independently completed just because a later source PR exists.

The original `docs/integration/ql246-source-proof.json` remains **absent** in Rosie's source. Source CI GREEN, a readback file in the browser, a source SHA or an HTTP 503 is never the signed Proof-B, an enrolled key, a real test consent decision, or a signed source-to-broker receipt.

## Private owner next steps (not performed here)

1. Ree independently reviews the original QL-344 Windows receiver-OFF observation and source-signer provenance; Jack separately authenticates the original issuer, signed evidence and public request on his own computer. Keep private keys and credentials separate and private.
2. Resolve original source Proof-B, actual source backup/migration and cross-child RLS, isolated nonproduction origin/workload, durable atomic nonce claims, original broker/source signer key handles and independent public pinning.
3. Only after both distinct original-owner and source-owner decisions are independently signed, request a bounded private nonproduction TEST authorization. Inspect exact action and expiry; no customer data, production booking/Gift/payment or device actions.
4. Only the separately authorized broker may execute the scope-limited signed GET challenge, verify the source Ed25519 receipt and original seven denials, and write an immutable independent receipt. Until then Rosie and Comms Hub both remain **DISCONNECTED / HOLD**.

## Regression

`node scripts/build781_comms_handshake_workbench_test.mjs` tests QL-341 local-only readback, forged and elevated peer denial, role/scope isolation, unsigned owner packet, API no-mutation and original proof-B absence. `bash scripts/current_booking_wizard_regression.sh`, `bash scripts/current_source_gate_contracts.sh`, and `bash scripts/current_optional_authority_triggers.sh` retain protected release checks.

This build deploys safe verification software only. **Production GREEN is not a declaration of active Comms Hub connectivity or TEST authority.**
