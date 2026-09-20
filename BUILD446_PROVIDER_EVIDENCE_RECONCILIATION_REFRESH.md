# Build 446 — Provider Evidence Reconciliation Refresh

## Purpose
Refresh dated provider payment/refund/message-delivery evidence through existing read-only authorities and make source age, reconciliation and missing-evidence gaps explicit.

## Boundary
No charge, refund, message, provider contact or provider mutation is authorized merely to obtain evidence. Missing provider evidence remains `provider_dependent`.

## Acceptance
Require focused authority, retained provider/reconciliation authorities, Current Source Gate, exact Development deployment/runtime acceptance, protected-main PR checks and independent exact Production deployment/runtime/business acceptance.

## Next
Build 447 begins only after this release is independently GREEN on protected `main`.
