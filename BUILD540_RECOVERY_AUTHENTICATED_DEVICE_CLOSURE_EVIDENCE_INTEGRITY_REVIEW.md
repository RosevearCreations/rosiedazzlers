# Build 540 — Recovery & Authenticated Device Closure Evidence Integrity Review

## Purpose
Verify that retained Build 530 recovery/authenticated-device freshness evidence still maps to the exact bounded non-Production recovery trace and the exact direct authenticated role/device/browser trace, with current explicit operator review for each population.

Build 540 is read-only and fail-closed. Recovery and authenticated-device evidence remain separate populations with separate owning HOLDs. Missing, stale, negative, drifted or unavailable evidence never becomes closure because source/runtime checks are GREEN.

## Recovery integrity contract
Recovery is integrity-current only when Build 530 freshness remains current, the retained recovery observation is dated, successful and explicitly bounded to non-Production, the recovery evidence trace still matches the retained Build 520 manual-closure trace, and the explicit operator review remains current and trace-matched.

Missing or mismatched recovery identity retains the Recovery / backup evidence HOLD. Build 540 performs no Production restore and no recovery drill.

## Authenticated-device integrity contract
Authenticated-device evidence is integrity-current only when Build 530 freshness remains current, direct dated observations still cover Customer, Detailer, Operations and Admin, representative phone/tablet/desktop coverage remains present, browser identity remains present, no current regression exists, and the reconstructed observation trace still matches the retained Build 520 manual-closure trace.

A current negative observation is never overridden by historical acceptance. Missing or mismatched role/device/browser identity retains the Independent device / visual evidence HOLD.

## Operator-review identity
Each population requires its own explicit current trace-matched operator review. Recovery review cannot close authenticated-device evidence and authenticated-device review cannot close recovery evidence.

## Mutation and storage boundary
Build 540 performs no Production restore, recovery drill, authenticated login, session/role change, browser-farm execution, screenshot capture, provider action, customer/booking mutation, canonical-HOLD mutation, Supabase table/schema/storage-object creation, persistent telemetry/event stream or permanent polling.

## Acceptance
The exact candidate must pass the focused Build 540 checker/test, retained Build 530/520/510/500 authorities, Current Source Gate, exact feature-preview acceptance, exact-SHA Development deployment/runtime acceptance, protected main PR governance and independent exact resulting-main Production deployment/runtime/business acceptance.

Source promotion alone is never Production GREEN.

## Next bounded release
**Build 541 — Maintenance & Fleet Continuation Evidence Integrity Review** begins only after Build 540 is independently GREEN on protected main.
