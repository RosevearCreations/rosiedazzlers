# Build 926 — Original Windows runtime and independent certification: operator guide

## 1. First action only — original Windows server, after software Production GREEN
This is a read-only discovery. No reboot, service restart, task launch, credentials, owner signatures or changes are required. Use the original Rosevear AI Hub Windows server (not a client PC). Open Windows PowerShell as Administrator so process metadata can be read. If Git is unavailable stop and report the error. Run these commands one line at a time:

```powershell
$repo = Join-Path $env:LOCALAPPDATA 'Rosie926-source'
if (-not (Test-Path $repo)) { git clone https://github.com/RosevearCreations/rosiedazzlers.git $repo }
Set-Location $repo
git status --short
git pull --ff-only origin main
git log -1 --oneline
powershell.exe -NoProfile -ExecutionPolicy RemoteSigned -File .\scripts\build926-windows-runtime.ps1 -Mode Inventory
```

If the checkout is dirty or pull fails, stop; do not force reset. Copy the inventory JSON to the private support conversation after reviewing it. It contains only hostname, boot time, listener ports, process names/IDs, candidate task/service names, SIDs and hashes; no raw commands, tokens or keys. You may redact hostname/SIDs for initial diagnosis. If a candidate says UNKNOWN, report it unchanged. Do not start tasks or change services to make it pass. Inventory is not signed attestation.

## 2. Server configuration — only after independent review of actual inventory
The original Rosie Admin, database and Cloudflare Pages deployment must be verified. Apply the source migration and verify grants/RLS. The operator with Cloudflare access opens Workers & Pages > rosiedazzlers > Settings > Variables and Secrets > Production. Existing Build 920/923/924/925 pins must be independently reconciled. Set ROSEVEAR_ROSIE925_EXPECTED_PRODUCTION_SHA to the independently verified current deployed main SHA, not a dev SHA; never substitute a guessed receipt. Create server-only ROSEVEAR_ROSIE926_RUNTIME_PIN_JSON and ROSEVEAR_ROSIE926_CERTIFICATION_PIN_JSON: each contains staffId, expectedCommit, fingerprintSha256, publicKeySpkiBase64. Separate active staff and private keys are required, distinct from all five 925 roles and the app signer; no shared or fictitious identities. If no independent eligible person is available, certification remains HOLD. ROSEVEAR_ROSIE926_EXPECTED_RUNTIME_JSON contains four entries hub/caddy/mqtt/ollama, each mode (SCM/SCHEDULED_TASK), identity (exact service name/full task path), principalSid, definitionSha256, runtimeSha256, commandSha256 and port. Review approved known-good definitions and binaries independently before pinning; do not blindly approve discovery hashes. Never add private keys or passwords to Cloudflare or chat. Redeploy only after settings are authorized and validated. Do not create a fake original observation.

## 3. Guided physical witness key enrollment (before any short-lived runtime challenge)
Use the approved original trusted Windows device for the witness. Their existing Build 925 PHYSICAL_WITNESS key and staff account must match the independently reviewed server pin. Prepare owner-only JSON config under %LOCALAPPDATA% with role PHYSICAL_WITNESS, staffId and sourceCommit (the approved checkout revision). Keep the Ed25519 private PEM under that user's own protected local folder; never transfer it. Set the three environment paths as below, replacing placeholders with the actual private file paths:

```powershell
$env:ROSEVEAR_ROSIE926_CONFIG_PATH = Join-Path $env:LOCALAPPDATA 'Rosie926-private\config.json'
$env:ROSEVEAR_ROSIE926_PRIVATE_KEY_PATH = Join-Path $env:LOCALAPPDATA 'Rosie926-private\signer.pem'
$env:ROSEVEAR_ROSIE926_INPUT_PATH = Join-Path $env:LOCALAPPDATA 'Rosie926-private\input.json'
node .\scripts\build926-sign.mjs --public-pin
```

Public pin output may be shared with authorized administrator for comparison; never share signer.pem. On https://rosiedazzlers.ca/admin-sysop-926.html an enrolled owner clicks Issue enrollment challenge. Save only the returned binding in input.json as {"binding":{...}}. Witness runs node .\scripts\build926-sign.mjs --confirm-my-enrollment before the five-minute challenge expires. In their own Rosie staff session, paste {"challengeId":"<issued id>","envelope":<entire signed output>} into step 2 and click Admit my witness enrollment. Save enrollmentId. This proves key possession, not physical presence. Expired challenge: issue a new one, do not reuse a signature. Configuration changes require re-enrollment.

## 4. Original source evidence and runtime case (only once configuration is complete)
Collect original 921 signed Windows sample and both live native read-only receiver GETs in /admin-sysop-921.html; use /admin-sysop-923.html for the original app challenge and /admin-sysop-925.html for the two-owner signed review. Follow the source-controlled 921/923/925 guides and pre-stage private inputs before starting. All original rows must be fresh at both issue and admission (five minutes). Only the old SCM/task identity HOLD can be reconciled; physical, owner, receiver or production HOLDs are not bypassed. No field certification is possible without a genuine physical witness and independent reviews. If the procedure cannot be completed within freshness windows, stop and schedule the coordinated ceremony rather than inventing data.

## 5. Runtime inspection and final authority
Owner opens 926 console, enters original 925 reviewId and enrollmentId, then clicks Issue runtime challenge. On original server use a separately approved RUNTIME_INSPECTOR private configuration with role, staffId, sourceCommit, windowsHostName, hostId, originalBootId, originalBootTimeMs and identities mapping each component to mode, identity and port. Use the same environment-path pattern from step 3 on that role's trusted Windows account. Save {"binding":{...}} to input.json; run node .\scripts\build926-sign.mjs. It reads process lineage, principal SID, task definition hash, executable hash, command hash and TCP listener ownership, rechecking process and task identity; UNKNOWN remains HOLD. A listener is not application protocol health.

Independent CERTIFICATION_AUTHORITY on their own trusted device uses separate config and key. Review the exact runtime envelope and genuine original 925 physical/owner/provider evidence, save {"binding":{...},"runtime":{...},"decision":"APPROVE"} (or HOLD) in their input.json and run node .\scripts\build926-sign.mjs --confirm-my-certification. In their own staff session paste {"caseId":"<case id>","runtime":<signed runtime>,"approval":<signed authority>} into step 4 and click Record my signed decision. Store certificationId. A successful result is historical, scoped to original runtime at the observation time, not proof of ongoing application health or seven-source CONNECTED. No service or customer/finance actions are authorized. On HOLD or missing authority stop; no substitute identity or synthetic result is permitted.

## 6. Release checks
CI runs 926, 925, 924 tests. The dedicated Windows collector requires original hardware testing; hosted CI cannot certify physical recovery. Software deployment GREEN is separate from field certification.
