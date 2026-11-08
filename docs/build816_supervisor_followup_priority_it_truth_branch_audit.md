# Rosie Dazzlers Build 816 — Supervisor follow-up priority, ownership, and I.T. truth

## Customer and staff behavior

- The existing staff follow-up board now offers **Priority inbox**, **Awaiting an owner**, and **Assigned to me**. Unanswered escalation without an owner sorts first, then overdue unowned, overdue owned, escalated owned, 24-hour attention, and recent items.
- The 24-hour and 48-hour bands are **internal review guidance**, never a contractual response promise. An operations manager/admin with signed staff session and the assignment-management action can assign an eligible, active staff reviewer or update the private follow-up owner and optional future review target (up to 30 days).
- Each assignment is tied to the actual signed-in staff actor and an incrementing revision. The database appends ownership decision events, retaining prior owner and timestamp without granting browser, customer, anonymous, or authenticated direct table access. Audit events cannot be edited or deleted.
- Customers receive an accessible ordered progress list in My Account: submitted, actual supervisor review when available, staff response, and customer confirmation. Only recorded facts get timestamps. No private owner, internal notes, or staff IDs enter customer UI.
- Fail closed if staff permission, source, ownership state, or version verification is unavailable. No email/SMS is sent; appointment, booking, payment, staff dispatch, and original worksite resolution remain untouched.

## I.T. truth audit

The Startup Command Center active-process catalog previously still included **deploy-260** as a blocking prerequisite, although the historical Build 260 deployment already had a verified evidence row and newer Build 815 main production releases passed mandatory checks. Build 816 retires only **deploy-260** from the *active* catalog. The historical evidence row is retained for audit, and previously retired migration steps stay retired.

The I.T. and startup screens continue to distinguish **repository release health** from **actual service launch readiness**. Unverified live-payment, backup/restore, legal/waiver, email/provider delivery, mobile live-device, accessibility, end-to-end customer booking, and other business-operational proofs remain visible and cannot be marked verified merely because CI is green. There is no automatic waiver or fabricated evidence.

## Branch cleanup inventory and limit

- GitHub read-only branch listing on 2026-11-08 showed **360 branches**, including protected targets **dev** and **main**; 358 other branch names need ancestry/reachability review.
- Branch deletion is **not authorized by the available GitHub connector** (no delete-branch/ref operation). The local Git remote also refused authenticated deletion, including a dry run, because GitHub credentials were unavailable. No branches were deleted; no unmerged changes were discarded.
- A follow-on privileged cleanup should classify each branch against both dev and main, delete only merged/reachable branches through an authenticated workflow, and preserve all unmerged branches pending an owner decision. Delete branch refs only; do not erase releases, tags, evidence, or source history.

## Acceptance and release

1. Run the Build 816 dedicated server/UI/database/IT audit test and all active booking regression tests.
2. Validate RLS, audit trigger immutability, active-versus-retired startup catalog, and existing unfinished business prerequisites in hosted Supabase.
3. Promote through the protected dev and main pull request workflows. Verify exact main SHA after merge, all required checks, and post-merge production workflows. No manual override of failing or pending checks.
