# Rosie Dazzlers Build 923 — Original Windows application challenge and field acceptance

## Scope
This release adds a **read-only** original Windows Node24 agent, private Admin page `/admin-sysop-923.html`, authenticated `/api/admin/sysop_923` GET/POST, append-only original Supabase evidence tables, fail-closed source verification, and protected CI. **It does not enroll an original device, reset Windows, start services, certify a physical reboot, prove independent application identity, or mark seven applications CONNECTED.**

## Required private database rollout
Apply `sql/2026-11-23_build923_original_app_challenge_evidence.sql` to the **original Rosie Supabase project** through approved original database migration process. Independently verify two tables, RLS enabled, anon/authenticated denied, service_role SELECT/INSERT permitted but UPDATE/DELETE denied, guard trigger and challenge expiry enforcement. Do not seed demo originals. The migration is shipped in source; committing is **not** evidence it was applied.

## Original Windows operator workflow
1. Original Rosie Admin logs into production and opens `/admin-sysop-923.html`. An original **Build 921 signed sample** must be present; no sample means HOLD.
2. The Admin issues a 60-second original one-time challenge for the original sample. Copy its JSON to an owner-only file under the real Windows machine's `%LOCALAPPDATA%`.
3. Locally install Node24 and use owner-approved original Ed25519 signer. Place private key and owner-managed configuration under `%LOCALAPPDATA%`; never submit keys to the Admin screen, GitHub or public logs. Set `ROSEVEAR_ROSIE923_ORIGINAL_CONFIG_PATH`, `ROSEVEAR_ROSIE923_ORIGINAL_PRIVATE_KEY_PATH`, and `ROSEVEAR_ROSIE923_CHALLENGE_PATH` to owner-only file paths. Original config needs `windowsHostName`, `samplerCommit` (40-character source commit), `originalBootId`, `originalBootTimeMs`, `hostId`, and optionally `localProtocolEndpoints`. The original signer public pin must be independently enrolled server-side as `ROSEVEAR_ROSIE923_APP_SIGNER_PIN_JSON` with `hostId`, `expectedCommit`, `fingerprintSha256` and `publicKeySpkiBase64`. Do not generate real original evidence in CI.
4. Run `node scripts/build923-original-windows-app-challenge.mjs` **on the original Windows PC** before expiry. The agent only probes preconfigured loopback HTTP challenge paths; absent/unrecognized services are marked UNKNOWN. TCP listener success is not treated as authenticated application health. Treat a matching local HTTP challenge as a self-reported app-protocol observation, **not** independent service identity or external monitoring.
5. Paste the agent's single JSON object into the Admin page immediately. The private API checks original 921 sample correlation, challenge, expiry, signer pin, Ed25519 signature and append-only record uniqueness. A reused or stale challenge fails. Cross-session browser calls and unprivileged accounts fail. The DB's guards enforce original sample, per-challenge uniqueness and expiry at insert time.

## Independent final acceptance
Only real original AIDP and Comms native receiver witnesses, separate original Windows boot/health review, original owner signatures, independent physical observation and exact-SHA production GREEN can be considered for field review. Build 922 `finalFieldGate922` never grants autonomous field certification. Service identity is not independently proved by a local HTTP nonce reflection, so field approval remains **HOLD** until independently witnessed. No customer, job or financial write is made.

## Release checks
`node tests/build923_original_agent_evidence.test.mjs` plus 922, 921, 920, 919, 918 protected tests; source review; migration apply and RLS readback; exact deployed Cloudflare Pages/Functions main SHA, canonical routes and release health. **No Production GREEN claim until these have passed.** Original Windows machine does not need a restart just because a web release was deployed.

Next proposed: **Build 924 — Independent Original Windows Service-Identity Proof, Provider Receiver Live Compatibility Tests, and Owner-Signed Final Field Review.**
