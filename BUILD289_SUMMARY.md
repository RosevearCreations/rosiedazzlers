# Rosie Dazzlers Build 289 — Account Accessibility & Weak-Network Resilience

**Status:** Development candidate  
**Baseline:** accepted Build 288 Development  
**Production:** remains closed

Build 289 is a migration-free reliability/accessibility slice for the authenticated customer account. Its explicit weak-network boundary is user-controlled recovery only. It does not change package pricing, availability, booking, deposit, checkout, Stripe, PayPal, referral economics, maintenance economics, or fleet economics.

## Customer account resilience

- `/my-account` retains the existing `ClientAuth` server-backed sign-in authority.
- A signed-out direct visit can recover in place with an accessible email/password sign-in form rather than being left at a generic dashboard error.
- Network/server-load failures expose a clear **Retry account load** action.
- Retry is explicitly user-initiated and uses a page reload; Build 289 introduces no background polling, timer loop, automatic replay, or write retry.
- Existing Build 288 customer/staff privacy suppression remains retained.

## Accessibility

- Account status is upgraded at runtime to a polite atomic ARIA status region.
- The recovery status is also announced through a polite live region.
- Rosie theme-token-based `:focus-visible` treatment is added for links, buttons, form controls, and other focusable elements in the account recovery surface.
- Mobile recovery actions stack at narrow widths.
- The existing one-H1 and viewport contracts remain unchanged.

## Acceptance

Build 289 adds:

- `assets/account-resilience-v289.js`
- `assets/account-accessibility-v289.css`
- `scripts/build289_release_check.py`
- `scripts/build289_http_smoke.sh`
- `.github/workflows/build289-source-gate.yml`
- `.github/workflows/build289-development-acceptance.yml`

The HTTP smoke is non-mutating. It checks deployed assets, signed-out dashboard/auth behavior, one-H1/viewport/bootstrap identity, retained Build 288 privacy code, and absence of Build 289 background polling.

## Boundary

There is **no schema migration** in Build 289. No provider/manual evidence is fabricated, and no physical-device acceptance is claimed by source/runtime automation alone.

**Production remains closed** until the exact Build 289 Development SHA is fully accepted and a later deliberate Production promotion is explicitly authorized.
