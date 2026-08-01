# DAIP-0 Decision Register — Rosie Dazzlers

**Status:** Planning gate — no DAIP production implementation authorized by this document.  
**Updated:** 2026-07-01  
**Read with:** `10_Rosie_Dazzlers_Integration_Plan.md` and `12_DAIP_Phase_1_Security_Acceptance.md`.

## Purpose

DAIP can create business value from one approved job, but it can also create privacy, cost, storage, and publication risks. This register is the owner decision gate before any DAIP worker, database migration, bucket, processing queue, AI model, Drive synchronization, or publishing integration is built.

A blank or undecided row means **do not implement that area yet**.

## Decision rules

- No customer-visible job update automatically becomes marketing consent.
- No customer-visible photo automatically becomes public-publishing consent.
- Original footage stays private, immutable, and access-controlled.
- A future DAIP system may propose work but cannot publish it automatically.
- Incident/dispute/legal-hold media remains excluded unless a separate written decision explicitly allows a limited workflow.
- Decisions must record the owner, date, reason, budget/cost implication, and a review date.

## Required owner decisions

| ID | Decision | Current status | Required answer before DAIP-1 | Owner / date | Review date |
|---|---|---|---|---|---|
| DAIP-0-01 | Worker hosting | Open | Choose a background platform suitable for FFmpeg/OpenCV/transcription; Cloudflare Pages Functions cannot be the long-running processing engine. | Unassigned | Unassigned |
| DAIP-0-02 | Monthly cost ceiling | Open | Set monthly maximums for storage, egress, transcription, vision, rendering, and failed-job retries. | Unassigned | Unassigned |
| DAIP-0-03 | Original storage | Open | Decide R2-only versus R2 plus controlled backup; define encryption/access and who can download originals. | Unassigned | Unassigned |
| DAIP-0-04 | Google Drive role | Open | Decide backup-only, operator-viewable export mirror, or deferred. Drive must not become a second uncontrolled source of truth. | Unassigned | Unassigned |
| DAIP-0-05 | Consent language | Open | Approve customer wording that distinguishes service proof, customer portal visibility, gallery reuse, social/marketing reuse, and platform publication. | Unassigned | Unassigned |
| DAIP-0-06 | Privacy-review roles | Open | Name who can start a job, review privacy, approve export, approve gallery reuse, and approve any future publication. | Unassigned | Unassigned |
| DAIP-0-07 | Retention | Open | Set retention for originals, proxies, rejected candidates, approved derivatives, legal hold, and customer-dispute material. | Unassigned | Unassigned |
| DAIP-0-08 | Incident/legal-hold handling | Open | Define hard exclusions and an exception process for incident, dispute, safety, or legal-hold media. | Unassigned | Unassigned |
| DAIP-0-09 | Internal test job | Open | Choose one staff-owned/internal booking and harmless media set for acceptance testing. Never begin with a customer job. | Unassigned | Unassigned |
| DAIP-0-10 | Human review SLA | Open | Decide how quickly a selected job should be reviewed and who resolves failed/blocked media jobs. | Unassigned | Unassigned |
| DAIP-0-11 | Public destination scope | Open | Confirm Phase 1 has no public destination. Gallery/website/GBP/social outputs remain review-only until a later decision. | Unassigned | Unassigned |
| DAIP-0-12 | Budget stop rule | Open | Define what automatically pauses DAIP processing when a monthly spend/storage/egress threshold is reached. | Unassigned | Unassigned |

## Decision completion record

For each approved decision, add a dated entry below. Keep secrets, service keys, customer names, and private links out of this document.

```text
Decision ID:
Decision:
Approved by:
Approval date:
Reason / business constraint:
Cost impact:
Privacy impact:
Operational owner:
Review date:
Related policy / consent document:
```

## DAIP-0 exit criteria

DAIP-0 is complete only when all twelve decisions above have a recorded owner-approved answer, the Phase 1 security acceptance template is reviewed, and an internal test job is selected. Until then, DAIP remains **documentation only**.


## Build 218 note — implementation boundary preserved

Build 218 does **not** close any DAIP-0 decision. It only permits a metadata-only internal test registry with fixed no-storage/no-worker/no-public-export controls. Every DAIP-0 row remains open until an owner enters and dates a decision completion record.

## Build 219 operational note

Build 219 adds `/admin-daip-governance.html` as the controlled place to save DAIP-0 drafts and owner approvals. The screen mirrors this register but does not close a decision automatically, enable production media capability, or replace the requirement for an owner-reviewed answer. The canonical decision questions remain the twelve rows above.

---

> **Build 237 synchronization (2026-07-28):** This file is retained for current operational reference, release evidence, specialist detail, or history. Current direction lives in `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`; launch blockers and exact instructions live in `STARTUP_GO_LIVE_BLOCKERS.md`.

---

> **Build 238 synchronization (2026-07-30):** Retained for current operational reference, specialist detail, release evidence, or history. Current architecture lives in `AI_PROJECT_HANDOFF.md`; current direction lives in `MASTER_VALUE_ROADMAP.md`; exact launch blockers live in `STARTUP_GO_LIVE_BLOCKERS.md`.

<!-- BUILD239_SYNC: 2026-08-01 | Current launch interface: /admin-startup-guide.html | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md -->
