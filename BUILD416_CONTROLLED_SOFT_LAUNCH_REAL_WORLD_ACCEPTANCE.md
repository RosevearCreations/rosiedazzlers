# Build 416 — Controlled Soft Launch & Real-World Acceptance

Build 416 converts the retained launch capstone into a bounded pilot-observation surface without widening Production authority. It supports an invite-only operational acceptance using explicitly authorized internal or known-customer scenarios.

## Acceptance objective

The source release is complete when the Build 416 authority, Current Source Gate, exact feature preview, exact Development deployment/runtime and protected-main exact Production deployment/runtime/business acceptance all pass.

The **controlled pilot itself** is a separate evidence decision. It may remain `hold` after source/Production GREEN until real authorized evidence is observed.

## Real-world evidence stages

The Build 416 capstone evaluates:

- invite-only scope / operator ownership from explicit audited `operations` evidence whose note establishes controlled, internal, invite or known-customer scope;
- real booking path from audited `booking_e2e` evidence whose note establishes real/controlled Production use;
- consent-safe communication from audited `email_delivery` evidence;
- field/mobile workflow from audited `mobile` evidence plus at least one real eligible handoff job in the bounded observation window;
- completion/office handoff from at least one real job satisfying the retained before/field/completion/after evidence set;
- support observation from audited `monitoring` evidence with zero current critical support alerts;
- current legal/policy evidence;
- incident closeout evidence.

Weak, stale, missing or mismatched evidence remains `owner_action` or `unavailable`.

## Privacy and truth boundary

- Participant authorization is never inferred from source, an email address, a booking row or a successful deployment.
- Customer identity is not returned by the Build 416 launch-readiness payload; only aggregate job counts are composed.
- Evidence notes are reduced to presence/scope-match signals on the capstone and are not echoed to the browser.
- A source check never fabricates a customer journey, booking, communication delivery, field visit, completion, support outcome or incident closure.
- Provider configuration is not provider success.

## Mutation boundary

This release performs:

- no schema migration;
- no automatic Production booking or customer mutation;
- no automatic customer outreach;
- no payment/refund/provider transaction;
- no restore or export generation;
- no destructive R2 mutation;
- no DNS or secret mutation;
- no permanent polling.

Existing explicit business workflows remain separately authorized and keep their own role, consent, payment and server-authoritative controls.

## Operator surface

`/admin-launch-readiness.html` remains the single read-only capstone. Build 416 adds `controlled_soft_launch` status, aggregate real-job evidence counts, individual pilot stages and explicit HOLD actions. Manual refresh is retained.

## Promotion rule

Feature → exact Development → protected-main PR → exact Production acceptance remains mandatory. Build 417 does not begin until Build 416 source/Production is independently GREEN.
