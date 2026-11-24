# Build 928 — Original Scheduled Task history, MQTT location and guided receiver closure

## Start here — only after Build 928 production GREEN

On the original Windows server, open PowerShell as Administrator. Run the following lines individually:

```powershell
Set-Location (Join-Path $env:LOCALAPPDATA 'Rosie926-source')
git status --short
git pull --ff-only origin main
git log -1 --oneline
powershell.exe -NoProfile -ExecutionPolicy RemoteSigned -File .\scripts\build928-original-correlation.ps1 -ProbeOriginalMqtt
```

If Git shows local changes or pull fails, stop and report it. The diagnostic is read-only except for a bounded TCP connection to the documented original Home Assistant target, after resolving exactly one RFC1918 IPv4 address. It queries ports 80 and 1883 only, does not authenticate or send MQTT messages, and does not change VirtualBox, tasks, services or event log settings. No public network scan is performed. It outputs only task summaries, definition hashes, allowlisted script basenames, process IDs/creation times and broker boolean/status information. Do not share secrets, raw command lines or VM settings. Paste the JSON into the private support conversation or the local browser analyzer at https://rosiedazzlers.ca/admin-sysop-928.html.

## What the previous original inventory established

The six registered Hub tasks were discovered. The current enabled recovery/startup/gateway tasks had reported successful prior runs, but Unattended Boot reported nonzero last result 2, and the legacy AI Server Startup task was Disabled. Do not enable the legacy task or start the boot task merely to obtain a passing report. The Task Scheduler Operational history channel was disabled, so no historical process association was available. Existing Python, Caddy and Ollama listeners were not proven to belong to live SCM/task roots. VirtualBox headless processes were present, but the specific guest and broker had not been independently observed. These are diagnostic observations, not field certification.

The Hub's own source-controlled [Build 106 Home Assistant/MQTT recovery record](https://github.com/RosevearCreations/rosevear-ai-hub/blob/ce3c5e4e8329ed8d6e7c43fbd1845c5f32493862/docs/BUILD_106_HA_MQTT_POST_REBOOT_ACCEPTANCE.md) identifies the previously observed guest named Home Assistant, homeassistant.local:80 and broker homeassistant.local:1883. [Hub recovery script](https://github.com/RosevearCreations/rosevear-ai-hub/blob/ce3c5e4e8329ed8d6e7c43fbd1845c5f32493862/scripts/hub-recovery.ps1) uses detached launchers and verifies existing listeners rather than restarting healthy processes. Those documented behaviors are a lead, not proof of the actual original task definitions or current broker health.

## Interpret the results

- LAST_RUN_REPORTED_SUCCESS: task metadata reports zero on its most recent run after this boot; no process ownership or functional health inferred.
- LAST_RUN_NONZERO_REVIEW_REQUIRED: inspect actual task/recovery logs before any change.
- DISABLED_PRESERVED: leave disabled. Do not re-enable legacy tasks.
- HISTORICAL_PID_TIME_CORRELATION_ONLY: retained task launch event aligns with a current process ID and creation time on this boot; not current independent SCM/task ownership proof. Disabled history is not changed by this release and historical evidence cannot be retroactively created.
- HOME_ASSISTANT_GUEST_AND_PRIVATE_TCP_OBSERVED: named guest reports running and documented private TCP broker endpoint answers. This does not prove guest ownership of the IP, broker protocol/authentication or integration health. Check the actual Hub MQTT page with existing configured credentials and original guest UI, not a new broker. A missing Windows-local listener must not be replaced by a fictitious Windows service.
- PRIVATE_TARGET_UNVERIFIED / UNREACHABLE: stop; inspect original guest/network manually. No fallback scan, firewall change, or new MQTT service.

## Configuration comparison and guided closure

The 928 console compares a complete diagnostic draft against separately approved public runtime pin definitions locally. Draft matches are not signed evidence, and no candidate approval is persisted. The current Build 926 certification contract still requires the four Windows-local SCM/task identities; a guest MQTT architecture and detached launchers cannot satisfy it without a future independently signed guest/launcher custody contract. Do not approve arbitrary hashes or bypass 926. Existing 925/926 evidence tables and independent role pins are retained.

Sign in to the 928 Admin console and click Refresh private status. It shows actual server-side configuration presence and the missing receiver enrollment steps with links. Complete original signed 918 receipt, 919 acknowledgement and 920 ledger review before requesting a 921 read. A receiver needs the existing server-approved HTTPS origin, scoped read-only token, separate API/ledger pins and compatibility manifest. The enabled receiver buttons invoke only the prior authenticated 921 live GET; a real signed response is admitted there. No synthetic receipt, token or automatic CONNECTED promotion is produced. Do not upload credentials into the console.

## Release boundaries

Tests exercise boot/time correlation, disabled history, private TCP posture, incomplete drafts and guided receiver dependencies. PowerShell syntax is checked in hosted CI; actual host/guest health requires the original operator. No database migration or live evidence insertion is necessary for this software release.
