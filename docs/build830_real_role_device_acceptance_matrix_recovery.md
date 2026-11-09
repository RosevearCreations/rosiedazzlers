# Rosie Dazzlers Build 830 — Customer, Detailer & Admin Role × Device Acceptance Matrix and Recovery

**Scope:** A source-owned, signed-supervisor, read-only twelve-cell field acceptance and recovery **workbench**. Build 830 does **not** create original customer/detailer/operations/admin sessions, perform physical device testing, issue cryptographic device attestations or replace the separately permissioned I.T. acceptance authority. Actual operator/owner acceptance remains **HOLD** until independently witnessed field evidence exists.

## Twelve explicit role/device cells

The matrix combines four source roles (`customer`, `detailer`, `operations`, `admin`) with three device classes (`phone`, `tablet`, `desktop`) for **12 deterministic IDs** `rd-role-device-v1-{role}-{device}`. It reads only the latest 100 existing Build 826 append-only source events, preserving its authenticated supervisor gate, no-store response, server-only Supabase service access and zero added database grants/migrations.

The projection in `assets/build830-role-device-recovery.mjs`:

- distinguishes a *local* recent pass, separate supervisor signoff, returned/rejected review, failure/blocked observation, later retest, aged observation, source-data conflict and missing recent observation;
- requires distinct original observer and reviewer identities and valid chronological evidence before labeling any local review candidate;
- never clears a prior negative just because a later pass/retest exists, and never moves an owner HOLD;
- treats duplicate event IDs, malformed records, inconsistent timestamps/route/width/browser, impossible observation times and conflicting signoff as source conflicts;
- accepts genuine PostgREST timestamp offsets/microsecond fractions but never assumes historical records older than the bounded window are absent;
- distinguishes a proposed 30-day follow-up **reminder** from an owner-approved freshness/expiry policy;
- emits no staff ID, private source reference, customer name, booking details, approved denominator, inferred score or AI Data/Comms event.

The additive `role_device_recovery_preview` is returned by **existing private** `GET /api/admin/worksite_field_evidence_v826`. It inherits the real signed supervisor session, `operations.customer.manage` and `operations.assignment.manage` plus supervisor role requirement. Unsigned, detailer and unauthorized requests remain denied; missing source returns 503 with no inferred matrix.

## Guided real-world walkthrough

The new ninth section on `/admin-handoff-acceptance.html` and its mirrored route shows the matrix with role/recovery filters and a keyboard-accessible recovery explanation per cell. **Prepare observation form** only chooses the role/device in the preexisting Step 1; it clears previously selected browser/route/viewport/outcome/date/reference values to require fresh entries. No click launches a browser farm, claims to inspect a device, submits a record or changes an account.

To obtain *actual* field evidence:

1. Use the correct **original signed-in role account** on an actual phone/tablet/desktop and test the route, weak-connection/error return, keyboard/screen-reader interaction and safe recovery.
2. An authorized Rosie supervisor records the genuine role, device, browser, viewport, route, observed time, outcome and nonpersonal reference using Build 826's existing append-only form.
3. A **different** authenticated supervisor records the independent *local review* of the original source observation; returned/failed cases require diagnosis and another real test.
4. Reconcile separately permissioned I.T. device evidence and explicit product-owner signoff. A positive local review is not an original signed owner receipt or approval of any Master Completion denominator.

**Evidence freshness:** The most recent 100 records can omit earlier failed tests and reviews. A later positive observation is only a **retest candidate** when an earlier negative appears in this bounded history; owner-led reconciliation must trace older source history as necessary. The projected `genuineFieldDeviceAcceptanceCount` and `independentlyVerifiedRoleDevicePairs` are `null`, never fabricated as zero or twelve.

## Tests and release meaning

`node scripts/build830_role_device_recovery_test.mjs` checks all twelve pairs, role/device isolation, independent reviewer decision, returned signoff, current failure, retest, stale reminders, duplicate/conflicting timestamps/routes, PostgREST timestamps, 100-row truncation, private role rejection, source failures, no actor leakage and mirrored accessible UI. Cumulative regression and exact-SHA Cloudflare production checks establish software release integrity only.

**Software deployment verification (November 9, 2026):** [Feature/dev PR #890](https://github.com/RosevearCreations/rosiedazzlers/pull/890), [protected main PR #891](https://github.com/RosevearCreations/rosiedazzlers/pull/891) and [exact-SHA Cloudflare Production workflow](https://github.com/RosevearCreations/rosiedazzlers/actions/runs/42676277050) verify feature `main` SHA `c07c2e09c0a3d44246d2e8063793591d03448bd2`. The original CI attempt was not accepted after GitHub abandoned two shards; a retry on the **identical source tree** passed all 118 feature checks. Production alias, immutable static and contextual HTTP smoke passed. This is not a witness statement about real phone/tablet/desktop usage.

**External HOLDs unchanged:** Original device owner/witness adoption, physical field acceptance, provider/payment/booking proof, AI Data shared reader/signing authority and QL-364/365D Comms private trust are not completed by source deployment.

**Next proposed Build 831:** Booking-to-Worksite-to-Payment Evidence Pilot & Exception Handoff — conditional on a genuine consented booking, real worksite execution and provider-authenticated payment/exception receipts. If original business evidence is unavailable, stage source-only pilot diagnostics without synthetic transactions.
