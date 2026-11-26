# Build 931 — original capture, pin enrollment and first receipt

After protected main and exact production deployment, run on the original Windows Hub server in Administrator PowerShell:

```powershell
Set-Location (Join-Path $env:LOCALAPPDATA 'Rosie926-source')
git status --short
git pull --ff-only origin main
git log -1 --oneline
Test-Path .\scripts\build931-original-evidence.ps1
powershell.exe -NoProfile -ExecutionPolicy RemoteSigned -File .\scripts\build931-original-evidence.ps1
```

Stop on local changes, a failed pull, or a missing script. The collector uses the previous 929 read-only diagnostics, hashes the original VirtualBox UUID, samples stable listener executable hashes and hashes the bounded existing boot log. No credentials, raw UUIDs, raw logs, private IPs or command lines are emitted. Nothing is restarted or enrolled automatically. The output is unsigned: a stable listener and binary hash are not a retained launch receipt. Existing Hub Build 263 launcher evidence may be reviewed independently, if genuine and applicable; do not run a restart to obtain a passing receipt. Existing Hub MQTT status is not by itself guest-owned broker proof.

Open /admin-sysop-931.html after signing in. Paste the original capture into the local analyzer. Separately provision approved public pins and expected identities using the existing Build 930 server-side configuration and independently operated staff accounts. No keys are auto-created or approved by this release. Each witness signs in as their own staff account, issues their own short-lived enrollment challenge, saves the returned binding in a protected local JSON file as {binding,evidence:{decision:"ENROLL",scope:"KEY_POSSESSION_ONLY"}} and invokes the existing scripts/build930-sign.mjs with --confirm-independent-observation and existing private signer configuration. For the authority enrollment the updated signer accepts --enroll-key-possession instead; use that flag along with --confirm-independent-observation for every enrollment. Submit only the signed envelope in the same session. The proof is key possession, not physical identity.

All three enrollments must match the active configuration digest. The 931 receipt path delegates case issuance and receipt admission to the existing 930 server verification; Build 932 also enforces all three active enrollments in the legacy 930 API itself; neither route can bypass enrollment. Obtain genuine fresh AIDP and Comms native witnesses through 928/921 first. Use the three independently signed original observations as documented in Build 930; the first durable receipt is admitted only on actual signature, case and receiver validation. No artificial receipts are seeded. If source evidence or independent signers are absent, remain HOLD.

Apply the reviewed additive SQL in sql/2026-11-25_build931_original_pin_enrollment.sql only to the verified Rosie database. RLS and insert/select service-role custody are mandatory. Original host/guest physical certification remains separate from software production release.
