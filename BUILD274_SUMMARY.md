# Rosie Dazzlers — Build 274 Summary

**Status: ACTIVE**  
**Started:** 2026-08-30  
**Source branch:** `build274-full-closure-queue`  
**Accepted starting point:** `3cd7f8ac2f1b5639ade16d192569e0259189f0f7`  
**Promotion target:** `dev` only after the Build 274 source chain is green  
**Production rule:** `main` remains untouched.

## Build 274 purpose

Build 274 is the broader current-release closure queue. The I.T./contextual-help work in this checkpoint is a completed source slice inside that queue; it does **not** replace or close the remaining Build 274 1–10 work.

This slice establishes two permanent application systems:

1. **I.T. Connections** as the authoritative catalogue for external/runtime integrations; and
2. **shared contextual help** for authenticated work screens and user-editable fields.

## I.T. Connections foundation

`admin-integrations.html` is now the I.T. connection centre instead of a social/analytics-only status page.

The server registry in `functions/api/_lib/integration-registry.js` reports safe configuration metadata for:

- Supabase;
- Cloudflare R2;
- Stripe;
- PayPal;
- email delivery;
- SMS delivery;
- Web Push;
- Google Analytics / Ads and other consented measurement providers already registered by Rosie;
- Facebook / Instagram / X / TikTok / LinkedIn / YouTube publishing readiness already represented in source;
- Google Business Profile;
- Google Search Console as an external/prepared integration;
- Google Maps as prepared work until an approved adapter defines the exact API/restriction boundary;
- GitHub as a development/deployment control-plane integration rather than an invented Rosie runtime secret.

Each registered runtime requirement can report:

- exact variable, secret or binding name;
- configured/missing presence only;
- storage type/location;
- acquisition path;
- purpose;
- optional/conditional/alternative-set status;
- safe test direction;
- callbacks/scopes where relevant;
- troubleshooting guidance.

Raw credential values are never returned by this registry or accepted by the I.T. page.

### Payment readiness semantics

A green payment card is deliberately stronger than “an API client credential exists”:

- Stripe requires `STRIPE_SECRET_KEY` plus one accepted current webhook signing secret (`STRIPE_WEBHOOK_SECRET` or retained `STRIPE_WEBHOOK_SECRET_QUOTES`).
- PayPal requires the canonical capture credentials `PAYPAL_CLIENT_ID` + `PAYPAL_CLIENT_SECRET` plus `PAYPAL_WEBHOOK_ID` for the current verified settlement path.

Sandbox/test acceptance remains external evidence and is not manufactured by a presence check.

## Shared contextual help foundation

New shared assets:

- `assets/contextual-help-catalog.js` — central help catalogue;
- `assets/contextual-help.js` — accessible runtime;
- `assets/contextual-help.css` — shared controls/dialog styles.

Every help entry must answer at least:

1. what this is;
2. what it changes;
3. why Rosie needs it;
4. where the value comes from.

Important entries can additionally describe expected format, accounting/operational implications, security sensitivity, related records/systems and the I.T. connection path.

The runtime provides:

- page-level `ⓘ Page help`;
- accessible field-level `ⓘ` controls;
- keyboard/Escape-close dialog behavior;
- dynamic-field coverage through `MutationObserver`;
- a safe four-question fallback for fields that do not yet have bespoke catalogue wording;
- direct linkage back to I.T. Connections when integration guidance is relevant.

### Protected-screen reach

Two common protected-screen entry points now carry contextual help:

- `assets/admin-page-init.js` covers the modern shared initialization path;
- `assets/admin-menu.js` provides a non-blocking bridge for older protected pages that still initialize authentication/menu behavior directly.

Help loading is intentionally non-blocking: a help-asset failure must not prevent authentication or normal page operation.

`admin-site-settings.html` is the first legacy/dynamic-field proof surface and has explicit catalogue guidance for its advanced raw-JSON repair field in addition to generic field coverage.

## Source protection

New `scripts/build274_release_check.py` protects:

- JavaScript syntax for the registry/help/shared loaders;
- inline I.T. page JavaScript syntax;
- the four-question help contract and accessibility hooks;
- dynamic-field support;
- protected HTML coverage through a shared help bridge;
- exact I.T. variable/binding names against current source authorities;
- secret non-disclosure behavior;
- Stripe/PayPal readiness semantics;
- retained public tracking compatibility;
- read-only credential behavior on the I.T. page;
- Build 274 documentation/workflow synchronization.

The existing `.github/workflows/cloudflare-development-acceptance.yml` now runs the Build 274 focused guard after the Build 273 guard and, after deliberate promotion to `dev`, will smoke-check:

- `/api/admin/integration_status` as a protected non-5xx route;
- `/admin-integrations.html` HTTP availability;
- the Build 274 I.T. page marker.

## Validation completed on the feature queue

Before/while committing this slice:

- `node --check` passed for the expanded integration registry, contextual-help catalogue/runtime, shared initializer and shared menu bridge;
- the rebuilt I.T. page inline JavaScript passed `node --check` after extraction;
- an executable Node behavior check confirmed all seven fully supplied core integrations report ready;
- serialized integration status did not contain supplied sentinel secret values;
- Stripe does not report ready with only its API key, but does accept the retained current webhook-secret alias;
- PayPal does not report ready without its webhook ID;
- public Google Analytics tracking configuration remains compatible.

The exact full repository Build 274 focused guard will be authoritative when the branch is run in the repository/CI environment; exact-SHA Cloudflare Development acceptance intentionally waits for deliberate promotion to `dev`.

## Current acceptance boundary

This checkpoint does **not** claim:

- authenticated browser acceptance of every contextual-help placement;
- real Stripe test settlement acceptance;
- PayPal sandbox acceptance;
- provider email/SMS/Web Push delivery acceptance;
- Google/Meta/social OAuth or publishing acceptance;
- Search Console/GBP external evidence;
- completion of the rest of the Build 274 1–10 queue;
- Production promotion.

Those remain current-release work/evidence and must not be backdated into an older build.
