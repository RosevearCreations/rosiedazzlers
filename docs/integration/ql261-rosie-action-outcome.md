# Rosie Dazzlers — QL-261 source-app evidence return (HELD)

**Owner-safe return prepared for Rosevear Comms Hub.** Exact QL-258 schema, all progress fields honestly NOT_REPORTED except Rosie tenant isolation NOT_APPLICABLE:

- Public JSON: docs/integration/ql261-rosie-owner-return.json
- Strict generator: node scripts/ql261_rosie_owner_packet.mjs
- Allowed owner-only self-report overrides: --step privateCustodian=OWNER_REPORTS_IN_PROGRESS, and the other six enumerated steps. An entered self-report is *never* an independently authenticated identity, witness, key pin, authorization or gateway call.
- QL-258 snapshot A at 69afa528d28ee1df3ad200cc5da0cf4a3c2acbf9: original docs/integration/ql246-source-proof.json publicly returned 404 on 29 October 2026; independently retried on 29 October 2026, still 404.
- Build 704 main e9f2abf49cb2f243daf469ca58e87ccacfd15a0f: exact original proof path independently fetched and returned HTTP 404 on 29 October 2026. This is separate from the older QL-258 snapshot required by the packet schema.

## Genuine remaining source blockers

1. Owner has not submitted an authenticated private custodian nomination; no independent witnessed signing key presence or public SPKI pin challenge is available. Status is **SIGNER_STATUS_UNKNOWN**, not SIGNER_NOT_PROVISIONED or verified.
2. Only an authorized owner/operator on an approved restricted persistent private machine may inspect or provision a real unique Ed25519 signer via scripts/ql256_rosie_signer_custody.mjs. Do not run provisioning from public CI, browser, static Cloudflare assets or this chat; keep private role identities and signing material out of the repository.
3. Distinct, privately authenticated witness and reviewer must verify key custody and source/CI ancestry. A genuine signed proof A→B is then required at docs/integration/ql246-source-proof.json. No fake proof is published in this release.
4. An isolated, privately controlled nonproduction GET-only /api/integration/v1/health and /api/integration/v1/capabilities target must be independently checked before any trial. The source's existing production handler remains fail-closed. The offline QL-261 regression tests affirm denial without making a real request.
5. The owner has **NOT_GIVEN** separately authenticated, bounded nonproduction TEST authorization. No live GET, SMS, quote acceptance, booking, payment, Gift resend or cross-business pilot was attempted.

## Separation of application software

Build 705 also improves the ordinary staff quote editor: a five-step ephemeral booking-readiness checklist gates the in-page booking handoff link until the saved accepted quote has a positive amount and staff mark scope, vehicle, capacity, site/waiver and terms reviewed. It does not persist the checklist, book time, send a message or collect a deposit. Gift testing remains paused by owner direction.

**Connection: DISCONNECTED / HOLD. Software release GREEN never changes that decision.**
