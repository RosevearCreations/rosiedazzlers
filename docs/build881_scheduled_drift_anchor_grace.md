# Rosie Dazzlers Build 881 — Scheduled Native Drift Owner Alerts, Independently Signed External Digest Anchors & Proactive Issuer Grace Escalation

## Delivered source vs operational truth
Build 881 provides hourly-scale scheduled **historical** original native delivery and issuer-grace review (GitHub schedule every 2h at :23), signed external digest anchoring to a distinct provider (GitHub every 6h at :37), and an original owner Admin Booking read-only risk status. **Build 880 stores source-verified observation snapshots, not continuously live vendor event readbacks.** Any changing original signed event chain is an escalation for source review, not automatic fraud or a customer-open claim.

As of initial rollout, original Rosie Supabase has **zero** Build 880 native observation rows and **zero** supervised rotation receipts. Production code GREEN must not be misrepresented as live monitoring healthy or externally anchored. Without original receipts and secret enrollment, scheduled operations fail closed and do not assert successfully delivered GitHub alerts or anchors.

## Secure operator enrollment required
Two independent Cloudflare Pages Production bindings for the scheduled original source watch:
- `ROSIE881_OWNER_WATCH_ENABLED=true` and a random 32+ character `ROSIE881_OWNER_WATCH_JOB_SECRET`.
- `ROSIE881_EXTERNAL_ANCHOR_ENABLED=true`, random 32+ character `ROSIE881_ANCHOR_JOB_SECRET`, and `ROSIE881_EXTERNAL_ANCHOR_PUBLIC_JWK`, an independently enrolled Ed25519 **public-only** JWK distinct from every original Cloudflare closure issuer key in `ROSIE_CLOSURE_TRUSTED_ED25519_KEYS_JSON`.

Two repository GitHub Actions secrets (not committed to code or stored in admin UI) must match the corresponding Cloudflare bearer strings:
- `ROSIE881_OWNER_WATCH_JOB_SECRET`.
- `ROSIE881_ANCHOR_JOB_SECRET`, plus `ROSIE881_EXTERNAL_ANCHOR_PRIVATE_JWK`: separately held Ed25519 private JWK matching the Cloudflare public pin. This separate signing key never goes to the original Cloudflare worker.

The scheduled workflows use repository-scoped short-lived `github.token` with issue write permission and exact repo gate. No GitHub Actions secret can be read or set by code; verify configuration via original deployment and a successful supervised `workflow_dispatch` after populating genuine Build 880 records. Do not claim an existing scheduled action has sent an alert before reading its original successful job logs.

## Owner evidence, risk and privacy
Original bearer POST `/api/roadside_operational_watch_v881` reads at most 61 original private native observations and 61 rotation receipts from the existing Rosie Supabase project; it sends only redacted bounded counts and severity to GitHub. No original draft, booking, financial, contact, issuer secrets, or source receipt digests are posted in alert issues. When fewer than two comparable observations exist or evidence is missing, no successful live-provider validation is asserted. Drift triggers review; broken in-window chain, expired grace, revoked/removed/mismatched operator pin, or incomplete coverage triggers elevated review. Grace thresholds: 7 days and 72 hours before expiration.

Workflow `.github/workflows/rosie881-scheduled-watch.yml` publishes/updates one owner-review issue only when `severity != NONE`, reuses identical existing issue state without repetitive comments, and never silently auto-closes an unresolved owner exception. Scheduler can be delayed or dropped by GitHub Actions and is not equivalent to uninterrupted uptime. An original owner can manually review the bounded source-history rollup on Admin Bookings via `/api/admin/roadside_operational_watch_v881`.

## Independent external receipt anchoring
Original bearer POST `/api/roadside_anchor_candidates_v881` serves at most 25 SHA-256 digests of *actually persisted* original 880 supervised readback records, with a distinct Cloudflare-pinned Ed25519 **public verification** JWK. No original draft IDs or customer data go to GitHub. The separate GitHub worker signs each exact receipt SHA-256 with the privately provisioned independent signing key, appends a redacted signed comment to a dedicated GitHub issue, and **reads the exact comment back** before returning success. A repeated action validates the existing signature rather than forging a new anchor. A changed signature, duplicate, missing trust, over-cap inventory, or GitHub error is HOLD. This is distinct GitHub-provider storage + separate Ed25519 signing authority, not immutable WORM storage or independent third-party human witnessing. It proves only that the original database digest was externally recorded, not that key rotation physically happened.

Workflow `.github/workflows/rosie881-independent-anchor.yml` supports supervised `workflow_dispatch` and a 6h schedule. A missing original receipt or signer produces a visible failed scheduled action, never a fabricated external anchor. A successful CI build alone does not establish independently anchored real owner evidence.

## Release
Protected Build 881 source regression plus Builds 880/879/878/877/876; feature → `dev` → `main`. Require exact main SHA, Cloudflare Pages Functions-aware production, source and business acceptance GREEN, Release Health GREEN and CI queue budget WITHIN_BUDGET. Observe live scheduled acceptance separately after real key and origin evidence enrollment. No new Supabase tables or unsafe permissions were added.

Sources: https://docs.github.com/en/actions/reference/events-that-trigger-workflows ; https://supabase.com/docs/guides/api/securing-your-api ; https://developers.cloudflare.com/pages/functions/bindings/ ; https://nodejs.org/api/crypto.html .
