# Rosie Dazzlers Build 828 — source lineage, decision trace and freshness review

**Release scope:** Read-only, authenticated supervisor projection over the existing Build 826 append-only event ledger and Build 827 stable module scope IDs. This is **not** a completed AI Data Platform contract, independent device attestation, real owner approval or connection to Comms Hub.

## Delivered

1. **Stable source-to-requirement mapping:** Each of 45 Build 827 scope IDs retains its `rd-req-v1-*` shared definition and its own `rd-scope-v1-*` device/role variant. Build 828 maps each recent local `module_review` event to that exact scope and, when present, follows `target_event_id` to a signed-supervisor `signoff` event and original operator `observation` event. Shared criteria **never** let one device's observation prove another device.
2. **Bounded decision timeline:** At most the **latest 100** source events are loaded through the existing private supervisor GET; the display shows at most eight most recent module decisions for each scope. Original append-only rows remain unchanged, no migration/backfill or artificial records. A target outside the retrieved window is `PARTIAL_RECENT_HISTORY`, not evidence of a nonexistent event or failure. The source window is **not a complete audit**.
3. **Provenance/integrity signals:** Every linked candidate is checked for target IDs/kinds, an accepted-for-review signoff, distinct recording/reviewing actors, chronological order, valid role/device/browser/outcome/date and agreement with explicit phone/tablet/desktop scope. Duplicate event IDs and impossible chains are surfaced as `CONFLICT`; staff IDs are used internally for independent-actor comparison but never copied into the new report.
4. **Draft freshness review:** The real operator-observed time anchors an optional **30-day local triage advisory**. It reports `DRAFT_WITHIN_REVIEW_WINDOW`, `DRAFT_REVIEW_DUE`, or `UNKNOWN` with a suggested review date. **Thirty days is not owner-approved retention, evidence expiry, SLA, readiness scoring or authorization**; no record is deleted or rejected by elapsed time.
5. **Decision/reopen guidance:** A more recent `hold` or `needs_evidence` after an earlier candidate produces an **inferred reopen advisory**, not an append-only `reopen` action or a canonical HOLD transition. Conflicts and missing evidence require real supervisor/owner review.
6. **Accessible UI:** Authenticated supervisor `/admin-handoff-acceptance` offers manual refresh, search, local chain/conflict/partial/freshness/reopen filters and expandable sanitized event trace. Mirrored `.html`/directory routes remain identical; no stored browser data, polling, outbound requests or user-facing notification is introduced.

## Authority boundaries

- Source identity: `rosiedazzlers`, owned-business shell; not one source per booking or customer.
- The **current** `CF_PAGES_COMMIT_SHA`, if present and valid, identifies the report's current deployment. The Build 826 event schema does **not** capture the historic deployment SHA for each observation, signoff or decision. Build 828 returns the individual event release revision as `null` rather than falsely attaching the current production SHA.
- Existing signed-supervisor staff session, operations permission and no-store privacy headers are inherited from `functions/api/admin/worksite_field_evidence_v826.js`. Raw actor IDs are **not** present in the Build 828 derived projection. The original private events response remains under its existing supervisor gate.
- No product-owner acceptance, original source signer, physical device verification, provider result, accountant review, master scoring numerator/denominator, cross-application envelope, network publisher, Comms notification or QL-365D receipt is asserted. `dataSentToAIPlatform=false`, `dataSentToCommsHub=false`, `connectionState=DISCONNECTED / HOLD`.
- The existing RLS-guarded ledger remains append-only; the new code is a read model only. Do not use a source report, review candidate or expired advisory to close `STARTUP_GO_LIVE_BLOCKERS.md`.

## Test and acceptance procedure

- `node scripts/build828_evidence_provenance_test.mjs`: complete chain; independent actors; role/device isolation; old target ambiguity; invalid kind/timestamp; duplicate IDs; redacted references; 30-day advisory; inferred reopen; zero score/trust changes; authenticated/denied GET; mirrored accessible routes.
- `node scripts/build827_module_requirements_registry_test.mjs` and `node scripts/build826_guided_field_evidence_test.mjs` preserve previous source contracts.
- `bash scripts/current_booking_wizard_regression.sh`, `python3 scripts/release_check.py` and `git diff --check` preserve the cumulative booking and Cloudflare/IT/privacy gates.
- After protected dev/main, require independent exact main SHA Cloudflare static/contextual HTTP acceptance before code release GREEN. That does not prove the 45 modules' business acceptance.

**Owner follow-up:** Review one original signed-in observation and separate supervisor chain on a real phone/tablet/desktop, inspect the original source history if a target falls outside the last 100, resolve conflicts and provide the approved freshness/expiry policy. AI Data must approve source/audience/schema and denominator authority separately before an integration adapter is published.

**Next proposed Build 829:** AI Data Reporting Contract Compatibility & Read-Only Source Adapter — remains **CONTRACT REVIEW HOLD** until both AI Data Platform and Comms owners approve the shared source schema, audience/tenant scope and permitted reader. Source-only compatibility work must remain nonpublishing without that authority.
