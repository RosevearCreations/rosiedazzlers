# AIDP Build 423 — Rosie Dazzlers Sysop telemetry source handoff

Rosie exposes `GET /internal/rosevear/sysop/telemetry/v1` only after server-side telemetry enrollment. The source uses a dedicated read token, Ed25519 signer and exact deployed source commit.

Only non-sensitive aggregate counters and coarse Sysop observations are eligible. Customer names, vehicles, addresses, bookings, quotes, media, payment data, messages, worker identities and device details stay inside Rosie. Unknown metrics are null rather than guessed.

Rosie cannot report a Windows host boot and this envelope authorizes no booking, quote acceptance, message, payment, job mutation, restart, recovery or data export. Missing enrollment remains NOT_ENROLLED/HOLD. Coordination issue: #1136.
