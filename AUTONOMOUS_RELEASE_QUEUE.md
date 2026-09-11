# Rosie Dazzlers — Autonomous Development Queue

This queue records current actionable work. Completed implementation history belongs in Git history and release summaries. The durable numbered sequences are `FORWARD_BUILD_ROADMAP_356_377.md` and the approved continuation `FORWARD_BUILD_ROADMAP_378_385.md`.

## Accepted checkpoint

**Build 375 — Payment Reconciliation & Month-End Closure** is the accepted synchronized source boundary at SHA `8d1d52e4d9d53e38544fe0a9ff1a4a336a1d58ab` before the current release begins. It preserved read-only/fail-closed month-end close authority, manual approval, existing Finance authorities and the exact-SHA Development-before-main release discipline.

## Current release

**Build 376 — Performance, Accessibility & Security Hardening** is the active bounded release.

Current scope:

- preserve public origin/Pages cache policy instead of forcing every editor-eligible public page to `no-cache`;
- add an additive keyboard-focus, reduced-motion and forced-colors accessibility baseline to public content pages;
- centralize conservative response headers (`nosniff`, referrer policy, limited permissions policy and cross-domain policy);
- force authenticated/private/customer/staff and cookie-bearing responses to `Cache-Control: no-store`;
- deny framing of private/authenticated surfaces;
- retain existing booking/payment/provider behavior and do not introduce an unproven Content Security Policy;
- add focused exact-SHA source/regression proof.

Exact `dev` SHA must pass Current Source Gate, the focused hardening authority and Cloudflare Development acceptance before `main` promotion.

## Next release

**Build 377 — Production Business Acceptance / Launch Readiness** remains next after the current release. Its durable acceptance scope is in `FORWARD_BUILD_ROADMAP_356_377.md`.

The approved autonomous continuation after that release is preserved in `FORWARD_BUILD_ROADMAP_378_385.md`; that roadmap is the authority for the subsequent eight-release phase and should be followed sequentially unless a new operational blocker requires an explicit reprioritization.

## Continuing rule

Never call a Rosie Dazzlers release GREEN from source changes alone. Preserve exact tested SHAs through Development and authorized Production promotion; keep database migrations as separate acceptance boundaries. Promote `main` by non-force fast-forward to the same Development-GREEN SHA. When Production exact-SHA runtime identity is not externally exposed, report that limitation rather than weakening the evidence standard.
