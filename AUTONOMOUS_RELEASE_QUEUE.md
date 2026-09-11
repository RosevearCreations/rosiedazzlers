# Rosie Dazzlers — Autonomous Development Queue

This queue records current actionable work. Completed implementation history belongs in Git history and release summaries. The durable numbered sequences are `FORWARD_BUILD_ROADMAP_356_377.md` and the approved continuation `FORWARD_BUILD_ROADMAP_378_385.md`.

## Accepted checkpoint

**Build 375 — Payment Reconciliation & Month-End Closure** is the accepted synchronized source boundary at SHA `8d1d52e4d9d53e38544fe0a9ff1a4a336a1d58ab` before Build 376 begins. Build 375 preserved read-only/fail-closed month-end close authority, manual approval, existing Finance authorities and the exact-SHA Development-before-main release discipline.

## Current — Build 376

Scope: **Performance, Accessibility & Security Hardening**.

The Build 376 bounded implementation focuses on shared response/security boundaries plus low-risk public performance/accessibility improvements:

- preserve public origin/Pages cache policy instead of forcing every editor-eligible public page to `no-cache`;
- add an additive keyboard-focus, reduced-motion and forced-colors accessibility baseline to public content pages;
- centralize conservative response headers (`nosniff`, referrer policy, limited permissions policy and cross-domain policy);
- force authenticated/private/customer/staff and cookie-bearing responses to `Cache-Control: no-store`;
- deny framing of private/authenticated surfaces;
- retain existing booking/payment/provider behavior and do not introduce an unproven Content Security Policy;
- add focused exact-SHA source/regression proof.

Exact `dev` SHA must pass Current Source Gate, the dedicated Build 376 authority and Cloudflare Development acceptance before `main` promotion.

## Next — Build 377

Scope: **Production Business Acceptance / Launch Readiness**.

Prove the end-to-end business path from anonymous acquisition through booking, payment, customer account, vehicle, staff work, completion, proof, final finance, genuine review, rebook and maintenance/fleet paths, including rollback and exact-SHA Production evidence. Never infer missing Production runtime identity proof from source promotion alone.

## Approved continuation — Builds 378–385

After Build 377, continue with the approved autonomous roadmap in `FORWARD_BUILD_ROADMAP_378_385.md`:

1. Build 378 — Release Authority & Documentation Convergence.
2. Build 379 — Production Observability & Self-Diagnostics.
3. Build 380 — Booking Recovery & Failure Handling.
4. Build 381 — Operations Daily Command Centre.
5. Build 382 — Customer Account & Retention UX Convergence.
6. Build 383 — Mobile Detailer Field Workflow Hardening.
7. Build 384 — Finance Cockpit & Month-End UX.
8. Build 385 — Backup, Restore & Release Recovery Drill.

## Continuing rule

Never call a Rosie Dazzlers release GREEN from source changes alone. Preserve exact tested SHAs through Development and authorized Production promotion; keep database migrations as separate acceptance boundaries. Promote `main` by non-force fast-forward to the same Development-GREEN SHA. When Production exact-SHA runtime identity is not externally exposed, report that limitation rather than weakening the evidence standard.
