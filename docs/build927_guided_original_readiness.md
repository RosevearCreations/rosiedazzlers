# Build 927 — Original inventory-guided readiness and assisted certification

## 1. Start here after Build 927 Production GREEN

Use the original Windows server, not a client PC. Open Windows PowerShell as Administrator, then run these lines individually:

```powershell
Set-Location (Join-Path $env:LOCALAPPDATA 'Rosie926-source')
git status --short
git pull --ff-only origin main
git log -1 --oneline
powershell.exe -NoProfile -ExecutionPolicy RemoteSigned -File .\scripts\build927-windows-guided-inventory.ps1
```

If git status lists changes or git pull fails, stop; do not reset. Copy the inventory JSON after reviewing it, or paste it into the local-only analyzer on https://rosiedazzlers.ca/admin-sysop-927.html. Hostname/SIDs may be redacted for initial support. Do not share passwords, private keys, tokens or raw command lines. No changes, reboot, network scanning or task history enablement are performed.

### How to interpret the original inventory

A Python listener at 8765, Caddy at 8443 and Ollama at 11434 are process observations, not application health. A Node listener on 5173 is auxiliary, not a fourth required service. No listener on 1883 means MQTT was not listening on that scanned Windows port; it may be on a different port, inside a VM, or elsewhere. The 927 collector checks common alternate ports, broker processes, virtualization hints, matching registered tasks/services (including non-running), and existing Task Scheduler history. Task history can explain a detached launcher, but cannot certify a still-running process or establish current health. UNKNOWN stays HOLD. Do not start or change anything just to obtain a passing report.

A configuration draft appears only for unique, stable, verified SCM/task candidates. Even a complete draft needs independent approval of known-good task definitions, principal, executable and command digests. Do not paste observed hashes into production configuration blindly. No draft is persisted by the local analyzer.

## 2. Open original Admin readiness

Sign in at https://rosiedazzlers.ca/admin-sysop-927.html as an active admin. Click Refresh actual readiness. Review the missing original evidence and server-side configuration presence. The response contains your own staff UUID, configured/not configured indicators (not secrets), and readiness of the two fixed receiver APIs. Presence does not establish pin validity, original authority or live health. Use the original 919/920/921/923/925/926 guides for the identified missing steps.

## 3. Local signer proposal — only after existing keys and roles have been reviewed

The 926 roles must match existing independent 925 identities and their keys. Do not create a new key when a previously pinned original key exists. On the actual role holder's Windows account, use a clean approved source checkout and Node 24. For a genuinely new, not-yet-enrolled role only (and after authority has approved that role and the key proposal), the helper creates a user/SYSTEM-only local directory and an Ed25519 key without overwriting an existing key or config:

```powershell
# Example only: replace UUID with the actual verified role holder staff UUID.
powershell.exe -NoProfile -ExecutionPolicy RemoteSigned -File .\scripts\build927-provision-local-signer.ps1 -Role PHYSICAL_WITNESS -StaffId '<actual staff UUID>' -Mode Create -ConfirmNewUnenrolledKey
```

Use the role that actually belongs to that independently authorized person (PHYSICAL_WITNESS, RUNTIME_INSPECTOR or CERTIFICATION_AUTHORITY). Do not generate all roles on one account to bypass independence. New files are under %LOCALAPPDATA%\Rosie927-private\<role>. To read the public proposal again for this exact local role and UUID, run the same command with -Mode Inspect and omit -ConfirmNewUnenrolledKey. Inspect does not rotate a key or update the existing config revision. The printed public pin is a proposal, not enrollment. The existing 925 roster must independently approve the same key before it may be used in 926; an existing pin must be reused, or rotated by explicit independent approval. Existing private files outside this new directory are not imported or copied by the helper. Never send signer.pem or passwords. The 926 operator guide explains exact server pin settings and signed challenges; do not configure server pins until the original roster is reviewed.

## 4. Receiver activation — explicit original native read, never synthetic

The 927 console uses the original 921 route for the selected AI Data Platform or Comms Hub receiver. A fixed HTTPS origin, scoped read-only token, independent API and ledger pins, matching receiver revision and original manifest must already be configured in original Rosie production. The original 919 ACK and 920 signed ledger must exist. If either is missing, complete the original source receipt, ACK and ledger workflow before retrying. The 927 status page reports missing prerequisites and disables its read buttons. It does not create a receiver credential, forge an ACK or call an arbitrary URL. When the button is enabled, the operator can explicitly request the live read. The original 921 route verifies a fresh challenge-bound signed GET and stores the genuine native witness. Inspect returned state and refresh; it is not seven-source CONNECTED.

## 5. Assisted certification

Use the original 925 review and 926 certification links only once the original host, samples, receiver witnesses, independent physical witness, owners and production authority are ready. Signed runtime certification is historical and scoped, not continuous health. No operational authorization is granted. Do not restart for this inventory. Any separately required supervised reboot ceremony must be planned independently with owner consent and a tested recovery plan. Existing database tables are reused; no new migration or synthetic evidence is needed.

## 6. Verification

Run node tests/build927_guided_readiness.test.mjs on Node 24. The regression gate covers the 925/926 contracts. The Windows script parser is checked in hosted CI; live original hardware observations must come from the original server. 
