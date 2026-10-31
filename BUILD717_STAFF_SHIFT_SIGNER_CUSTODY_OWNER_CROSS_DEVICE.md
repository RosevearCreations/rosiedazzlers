# Rosie Dazzlers — Build 717

**Staff Shift Roster Verification, Export Signer Custody Audit & Owner Cross-Device Remediation Review**

## Source-backed staff shift readback

Build 716 verified protected absence blocks, **not** working hours. Build 717 introduces a separate optional operator-configured approved-shift feed. Configuration stays server-side in Cloudflare Pages:

- `ROSIE_STAFF_SHIFT_ROSTER_URL` — operator-approved HTTPS GET endpoint; no user-controlled URL, redirects or internal network targets.
- `ROSIE_STAFF_SHIFT_ROSTER_BEARER` — optional bearer **secret**, never returned to browsers.

The endpoint receives `staff_user_id`, `start_at`, `end_at` query parameters. Return HTTP 200 JSON:

```json
{
  "complete": true,
  "source_revision": "roster-version-from-the-real-provider",
  "generated_at": "2026-10-30T19:00:00Z",
  "shifts": [
    {
      "id": "real-approved-shift-id",
      "staff_user_id": "actual-staff-uuid",
      "start_at": "2026-10-31T13:00:00Z",
      "end_at": "2026-10-31T21:00:00Z",
      "status": "approved",
      "approved_by": "actual-roster-approver"
    }
  ]
}
```

The example demonstrates the **schema**, not a real shift. The provider must return only the requested staff member's matching approved shifts, confirm completeness, and set its genuine source revision. A returned roster must be no older than 12 hours, cover the **entire 60-minute** planned follow-up window, and contain fewer than 50 approved rows. Drafts, missing coverage, stale responses, an invalid feed, redirect or outage are a hard HOLD when the endpoint is configured. This is the operator-designated roster source, **not** an independent source signature or proof of physical ability.

Without `ROSIE_STAFF_SHIFT_ROSTER_URL`, existing manager reassignment remains possible only with a detailed note and explicit **unverified shift** acknowledgment. The event truthfully records `hours_or_shift_verified:false` and `unverified_shift_manager_acknowledged:true`; it never claims a verified shift. Actual recorded absences, firm capacity limits and consent rechecks still operate. POST rechecks the live feeds before writing.

No staff roster records are fabricated or created by this build. A real staff shift provider must be configured by the owner for source-backed verification; otherwise the UI visibly indicates **UNVERIFIED**.

## Signed export and custody audit

Managers can trigger `GET /api/admin/quote_followup_rebalance?audit=signer` under existing management authentication. The server tests the configured Ed25519 private key against its derived public key, then returns only signer ID, SHA-256 of public JWK, test result and a clear custody boundary. No key material, secret bearer, or customer record leaves the server.

Possible states: `unconfigured`, `invalid_or_unreadable_server_key`, or `server_key_self_test_passed`. **None** means independent custody, a witnessed signing ceremony, an authorized Proof-B original or independent reviewer acceptance. The signed export option is offered only when the real server key self-test passes.

## Genuine cross-device owner feedback

1. Import an actual unresolved Build 715/716 owner feedback file (from before the fix) into the existing remediation panel.
2. After the actual fix, test desktop and mobile. Download a separate **Accepted** owner feedback file from each, with all five checks complete.
3. Import each JSON file into its appropriate Build 717 device field; the browser computes each original file's SHA-256 locally and rejects duplicate files, differing owners, non-accepted findings and dates before the original issue.
4. Enter a 20–300-character actual remediation note; download a linked **local**, self-attested cross-device receipt.

The app cannot technically verify that two different devices were used or that the owner personally tested. The emitted receipt explicitly says so. No independent witness, server owner acceptance, audit closure, customer communication or consent change is invented.

## Release validation

`node scripts/build717_shift_roster_custody_crossdevice_test.mjs`, earlier Builds 714–716 tests, `bash scripts/current_booking_wizard_regression.sh`, route parity, admin UI and source checks. Deployment success and exact production SHA must be verified separately from the business/source gates. A **GREEN deployment** does not mean a roster provider or independent custody witness has been configured.

## Next planned Build 718

**Verified Shift Provider Connection Trial, Independent Export Key Custody Witness Intake & Real Owner Device Acceptance Closure** — connect a real provider, capture independently obtained custody evidence and review actual device feedback without weakening current permission/consent boundaries.
