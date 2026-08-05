# Build 230 — Creative Project Costs, Templates and Output Governance

This build keeps ordinary client bookings lightweight and unchanged. Only explicitly created or opted-in creative projects use the following controls.

## Project-only accounting

Material, labour and other-cost lines are stored in dedicated creative-project tables. They do not decrement ordinary booking inventory or change existing job costing. Inventory references are optional metadata until a separately reviewed transaction workflow is approved.

## Templates and applicability

Templates prefill purpose, audience, project type and before/after applicability. Before/after remains `not_reviewed`, `applicable` or `not_applicable`. Consent is recorded separately as not reviewed, internal only, approved public, declined or expired.

## Governed drafts and approvals

Each requested output can have a story outline, platform copy, commerce copy or report outline. Batch approval changes review state only; it never publishes. Platform destinations remain separate and require their own approved connection and consent checks.

## Reversible controls

Booking unlink preserves both records. Archive preserves all sessions, cost lines, drafts and audit evidence and can be restored. No hard-delete control is introduced.

## DAIP boundary

Project-to-DAIP association is server blocked until the latest Gate C review is accepted and the protected DAIP policy has both `gate_c_held=false` and `technical_capability_enabled=true`. The association itself is metadata-only and database constraints prohibit media bytes and public destinations.

---

> **Build 237 synchronization (2026-07-28):** This file is retained for current operational reference, release evidence, specialist detail, or history. Current direction lives in `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`; launch blockers and exact instructions live in `STARTUP_GO_LIVE_BLOCKERS.md`.

---

> **Build 238 synchronization (2026-07-30):** Retained for current operational reference, specialist detail, release evidence, or history. Current architecture lives in `AI_PROJECT_HANDOFF.md`; current direction lives in `MASTER_VALUE_ROADMAP.md`; exact launch blockers live in `STARTUP_GO_LIVE_BLOCKERS.md`.

<!-- BUILD239_SYNC: 2026-08-01 | Current launch interface: /admin-startup-guide.html | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md -->

<!-- BUILD240_SYNC: 2026-08-05 | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md | Inventory posting: /admin-inventory-posting.html -->
