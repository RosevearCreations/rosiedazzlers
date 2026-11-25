# Build 929 — original guest MQTT, detached launcher custody and receiver acceptance readiness

## Original Windows server — after protected main and production deployment are verified

Open PowerShell as Administrator on the existing Rosevear server. No reboot or task restart is requested.

```powershell
Set-Location (Join-Path $env:LOCALAPPDATA 'Rosie926-source')
git status --short
git pull --ff-only origin main
git log -1 --oneline
powershell.exe -NoProfile -ExecutionPolicy RemoteSigned -File .\scripts\build929-original-guest-custody.ps1
```

Stop if Git reports changes or the pull fails. The script reads only exact existing tasks, recognized local script hashes, bounded existing boot log classifications, current listeners and the named VirtualBox guest property. It never prints IP addresses, paths, credentials, raw logs, raw command lines or VM identifiers. The default Hub checkout is the existing user's rosevearaihub directory; use -HubRoot only if the actual active task definitions refer to another reviewed checkout. An exact matching action path/hash is diagnostic, not proof of live detached process custody. A PID alone cannot establish custody. The historical boot code 2 can correspond to multiple holds; only a single bounded matching time-window log entry is surfaced, never attributed causally when ambiguous. Disabled Task Scheduler history stays unchanged.

## Original guest and existing MQTT authentication

In the existing VirtualBox Home Assistant console, inspect its actual IPv4 address (do not create a VM, change networking or change firmware). Home Assistant OS console may display it or show it using the existing `ha network info` command. Keep the address private. If it is a private IPv4, optionally rerun the script with -ProbeGuest -GuestIPv4 followed by that exact address. It refuses public IPv4 and conflicts with a reported guest property; only ports 80 and 1883 are tested. No scanning, MQTT publish, new subscription, credential export or new connection using copied credentials. If the guest property is absent, the operator-supplied address remains unverified.

On the same Windows machine open the existing Hub at http://127.0.0.1:5173/ (or the previously trusted private HTTPS gateway if that is the active frontend). Sign in with the existing account, open MQTT and click Refresh MQTT. Record only online/reconnecting/not configured, and whether username and password are configured. Confirm the existing configured broker endpoint privately corresponds to the original guest, without revealing credentials. The Hub uses its existing authenticated MQTT status endpoint; do not paste tokens, browser cookies, passwords, topics or payloads. A browser observation is not independently signed authentication proof, and online plus configured credentials does not independently prove anonymous access is disabled. A missing hostname resolution is not a reason to add a second broker or change credentials automatically.

Open https://rosiedazzlers.ca/admin-sysop-929.html after signing into Rosie admin. Paste the sanitized diagnostic JSON, select only actually observed MQTT facts, and refresh private receiver status. For original AIDP and Comms receiver enrollment follow the existing 928/921 authenticated original native GET workflow. Server-side status reflects existing database and configuration evidence; two fresh native readbacks are not final original field certification or seven-source connectivity.

## Release boundaries

No database writes in the new API; no new credential storage, automatic network activation, service/task/VM changes, synthetic signatures or certification bypass. Existing 925/926 certification and 921 independent native receipt gates remain intact. The remaining independent guest identity and detached-launcher custody require separately pinned signed original source evidence. Hosted CI validates source logic and collector syntax only. Original field acceptance must remain HOLD until real evidence exists.
