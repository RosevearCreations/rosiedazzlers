# Rosie Dazzlers — Autonomous Release Queue

This queue records only current actionable work. Completed release history belongs in Git history and archived evidence.

## Last accepted — Build 316

The accepted release is GREEN at exact SHA `3bbd91f1ea4a4e9e285069b32ad7e38dc4edf87b`. Before current work began, both `dev` and `main` were verified on that exact SHA. No database migration was required.

## Active — Build 317

Scope: Final Balance Readiness & Manual Payment Handoff.

Acceptance checklist:

- A single operator-facing final-balance readiness cockpit reuses the existing booking, finance and final-balance authorities.
- Readiness distinguishes Ready, Blocked, Requested and Paid / Closed.
- Every blocked row explains why it is blocked.
- Calculated service balance uses the booking total and recorded finance entries without counting tips toward the service balance.
- The readiness API is GET/read-only and does not create requests, checkout sessions, notifications or charges.
- No automatic charge is permitted.
- No automatic final-balance request is permitted.
- No recurring billing is introduced.
- Request creation requires an explicit operator action and confirmation.
- Hosted-checkout creation/refresh requires an explicit operator action and confirmation.
- The cockpit passes `notify_customer: false`; customer communication remains a separate deliberate action.
- Existing final-balance request/checkout/payment infrastructure is reused rather than duplicated.
- Operating Help explains every readiness state and the manual workflow.
- The admin presentation remains usable on mobile, normal desktop and wide layouts.
- `scripts/final_balance_readiness_check.py` passes and is part of the Current Source Gate.
- The active release introduces no database migration.
- Exact feature SHA must pass the Current Source Gate before promotion.
- The identical SHA must pass Development/Cloudflare acceptance on `dev` before `main` promotion.
- Exact-main source and Cloudflare deployment evidence must be successful before GREEN is declared.

## Promotion status

The active release remains AMBER until the final feature SHA passes, the identical SHA is accepted on `dev`, and the identical SHA is verified on `main` including Cloudflare Production deployment evidence.

## After the active release

Select the next business/product scope only after this release is GREEN on exact `main`. Do not pre-allocate or promote later work while the current release has an unresolved gate.
