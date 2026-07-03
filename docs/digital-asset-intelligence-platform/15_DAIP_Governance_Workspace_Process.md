# DAIP Governance Workspace Process — Rosie Dazzlers

**Status:** Build 219 implemented in governance mode only.  
**Purpose:** Record the owner decisions and test evidence needed before a separate future DAIP private-storage/worker design can be reviewed.

## What Build 219 does

`/admin-daip-governance.html` is an administrator-only decision and promotion-gate workspace. It records the twelve DAIP-0 decisions from `11_DAIP_Decision_Register.md` with:

- accountable owner or delegate;
- plain-language decision summary;
- business and cost impact;
- privacy and safety impact;
- review date;
- draft or owner-approved state;
- revision number, actor, timestamp, and audit event.

An owner-approved decision requires the exact displayed approval phrase. This protects against an accidental click being treated as approval.

## What Build 219 cannot do

It cannot and does not create or authorize:

- a storage bucket, prefix, key, URL, signed URL, or direct file upload;
- a worker, queue execution, FFmpeg, proxy, thumbnail, contact sheet, AI, vision, transcription, or rendering process;
- a customer media page, Gallery/Social/GBP/website handoff, public derivative, or publication;
- a bypass of Build 218 test controls, Supabase RLS, or Cloudflare Functions as the application boundary.

Never place a secret, URL, signed link, storage path, bucket name, customer name, VIN, address, payment information, private media description, or incident/dispute content into a decision or audit note.

## Correct use

1. Apply `sql/2026-07-02_build219_daip_governance_workspace.sql` in development/staging only after the Build 214 and Build 218 migrations.
2. Record the three Build 218 Test Centre results before treating Gate B as usable evidence.
3. Select one DAIP-0 decision and save a draft with a plain-language answer and a review date.
4. Discuss the draft with the owner(s), especially cost ceiling, stop rule, consent separation, retention, and responsibility boundaries.
5. Choose **Approved by owner** only after the decision is real and agreed; type the exact approval phrase.
6. Refresh and confirm the decision has an approved state, revision, review date, and audit entry.
7. Confirm Gates C–F remain **Held**. They cannot advance in Build 219.
8. Record the three Build 219 Guided Production Test Centre cases.

## Gate interpretation

- **Gate A — owner decisions:** Ready only when all twelve DAIP-0 decisions are approved.
- **Gate B — Build 218 safety evidence:** Ready only when the internal test control stays safe and all three Build 218 Test Lab checks have a latest recorded Pass.
- **Gate C — private storage/upload design:** Held until a separate reviewed future migration and acceptance record exist.
- **Gate D — private processing MVP:** Held until a separate non-public worker design is built and tested.
- **Gate E — privacy/export proof:** Held until a later explicit review/consent/export system is implemented and accepted.
- **Gate F — controlled production pilot:** Held until Gates A–E pass with a written rollout, rollback, cost dashboard, daily review, and zero automatic publishing.

## Production promotion rule

A completed decision register is necessary but not sufficient. The next technical phase must be independently designed, security-reviewed, costed, tested in staging, and approved. No DAIP artifact may publish automatically at any phase.
