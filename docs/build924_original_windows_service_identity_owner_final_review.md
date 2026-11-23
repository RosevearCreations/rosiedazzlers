# Rosie Dazzlers Build 924 — Independent original Windows service identity, live receiver compatibility and two-owner final field review

## Boundary of this release
Build 924 supplies an original Windows Service Control Manager (SCM) identity inspector, separately pinned Ed25519 evidence, actual prior original receiver-native GET witness correlation, append-only private challenge and review custody, Admin-only source UI, two independently signed owner decisions and protected regressions. It does **not** fabricate device output, provision original owner credentials, reboot Windows, restart Hub/Caddy/MQTT/Ollama, send customer communications, alter bookings or finances, or automatically mark seven-source CONNECTED. Software Production GREEN is independent of **original field certification HOLD**.

Admin page: `/admin-sysop-924.html`. Private API: `/api/admin/sysop_924`. The page requires an actual Rosie Admin session and uses only same-origin authenticated calls. There is no legacy admin bypass.

## Original database rollout
Apply `sql/2026-11-23_build924_independent_field_review.sql` to the **original RosieDazzlers Supabase project** with the approved change authority. Verify all three `rosie_sysop_*_v924` tables exist, have RLS enabled, no anon/authenticated read/write, service_role SELECT + INSERT but no UPDATE/DELETE, unique one-shot challenges, FK correlation, expired challenge rejection and identity guard. Do not insert demonstration originals. Migration text in source alone is not proof it was executed.

## Local Windows original identity proof
1. First collect genuine original signed Build 921 Windows samples and Build 923 one-shot app attestations. Without these source rows, Build 924 is HOLD. No substitute source can be auto-created.
2. An independent original inspector Ed25519 **public** pin must be enrolled in the Rosie server secret `ROSEVEAR_ROSIE924_INSPECTOR_PIN_JSON` containing `hostId`, `expectedCommit` (40 hex), `fingerprintSha256` (64 hex of DER SPKI) and `publicKeySpkiBase64`. It **must differ** from `ROSEVEAR_ROSIE923_APP_SIGNER_PIN_JSON`. Never place private material in GitHub, the browser, or chat.
3. On the genuine original Windows host, install Node 24 and store a private local JSON configuration in `%LOCALAPPDATA%` with `windowsHostName`, `hostId`, `inspectorCommit`, and `serviceNames` mapping `hub`, `caddy`, `mqtt`, `ollama` to **actual Windows service names**. If any component runs only as a user process or Scheduled Task rather than an SCM service, the corresponding service identity remains UNKNOWN/MISSING; a TCP port is not a substitute.
4. From the original Rosie Admin page, issue a 90-second identity challenge tied to a durable Build 923 app attestation and save its full JSON under `%LOCALAPPDATA%` on the original machine. Place the independent inspector private key there, accessible to the owner only.
5. Set environment paths `ROSEVEAR_ROSIE924_CONFIG_PATH`, `ROSEVEAR_ROSIE924_INSPECTOR_PRIVATE_KEY_PATH`, `ROSEVEAR_ROSIE924_CHALLENGE_PATH`. Run `node scripts/build924-original-windows-service-identity.mjs` from the trusted checkout on that host before challenge expiry. The fixed local PowerShell collector uses read-only `Win32_Service`, `Win32_Process`, SHA-256 executable hashes and Authenticode signature verification, returning no log content and issuing no service control actions.
6. Paste the one-shot signed JSON envelope into the Admin page. The private API verifies independent signer identity, original host/boot/app binding, nonce freshness, Ed25519 signature, ordered SCM records and durable uniqueness before recording a private review. Unsigned binaries or missing services remain HOLD and should never be upgraded to AUTHENTICATED based on a local listener.

## Both genuine provider live compatibility tests
Use `/admin-sysop-921.html` to perform an original server-side fixed-path, read-only signed native GET against **each** enrolled receiver: `ai-data-platform` and `rosevear-comms-hub`. Build 924 reads their original immutable `rosie_sysop_native_api_witness_v921` rows, requires one **fresh** witness per receiver (within 5 minutes), independent non-replayed nonces, deployed original receiver commit and enrolled signer fingerprint. The two manifests in server-only `ROSEVEAR_ROSIE924_RECEIVER_MANIFESTS_JSON` must match the strict Build 922 protocol, path, GET authorization, Ed25519 signer, non-sensitive payload limit, and each independently pinned `ROSEVEAR_ROSIE921_RECEIVER_API_PINS_JSON` entry. Static manifest checks alone are not a live test.

## Two genuine owner signatures
Original owner pins from `ROSEVEAR_ROSIE920_OWNER_PINS_JSON` must represent two different original authenticated staff IDs, different fingerprints and roles `PRIMARY_OWNER` and `SECOND_OWNER`. The server exposes the current immutable case digest and identity witness ID **only after both fresh live receiver witnesses**. Each owner copies these two fields into a private owner-only `%LOCALAPPDATA%` JSON file and explicitly chooses `decision: "APPROVE_REVIEW"` or `"HOLD"`. On their own trusted Windows identity and with their own original private key, set:
- `ROSEVEAR_ROSIE924_OWNER_CASE_PATH`
- `ROSEVEAR_ROSIE924_OWNER_PRIVATE_KEY_PATH`
- `ROSEVEAR_ROSIE924_OWNER_STAFF_ID`
- `ROSEVEAR_ROSIE924_OWNER_ROLE`
- `ROSEVEAR_ROSIE924_OWNER_SIGNER_COMMIT`

Run `node scripts/build924-original-owner-final-review.mjs` and submit the resulting signed envelope while **that owner** is logged in to the original Admin page. The API verifies Ed25519 signature, pinned source revision, role, session actor, case digest and freshness. Records are immutable and distinct per owner. The server never signs on an owner's behalf. A signature is an informed owner **review**, not an autonomous physical field certification.

## Final independent authority and production
`finalFieldReview924` is fail-closed. Even with all signed reviews and native receipts, it will not autonomously set `fieldCertified=true` or `sevenSourceConnected=true`. Independent physical observation, exact deployed Production SHA, database security and explicit original operational approval must be documented separately. The Rosie private API intentionally returns `exactShaProductionVerified:false` and `physicalObservationVerified:false` until an independent trust source is integrated.

Source validation: `node tests/build924_original_field_authority.test.mjs` under Node 24, plus Build 918–923 regressions in `.github/workflows/rosie924-independent-original-field-gate.yml`. To declare **software** GREEN, require protected dev/main checks, Cloudflare Pages/Functions exact SHA production receipt, canonical route smoke and release health. Production deployment does **not** require restarting the original Windows PC.

**Next proposed: Build 925 — Original Windows SCM/Task Identity Reconciliation, Independent Physical Witness Enrollment and Owner Final-Certification Closure.** This preserves the distinction between Windows services, user processes, scheduled tasks and independent witnessed recovery.
