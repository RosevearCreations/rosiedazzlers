# Build 296 — My Account Maintainability Extraction

## Purpose

Build 296 moves the mature inline `/my-account` JavaScript into a dedicated versioned module without changing customer behavior, customer API authority, privacy boundaries or maintenance-plan authority.

## Delivered

- adds `assets/my-account-v296.js` as the dedicated My Account module;
- preserves the accepted Build 295 inline module byte-for-byte in that versioned asset;
- replaces the inline module in both `my-account.html` and `my-account/index.html` with the same parser-positioned `<script type="module" src="/assets/my-account-v296.js"></script>` tag;
- keeps both My Account route copies exact;
- keeps the existing module execution position after `chrome.js` and `client-auth.js`;
- keeps current customer dashboard/profile/vehicle/media/gift/review API calls unchanged;
- retains Builds 288, 294 and 295 as privacy, maintenance-authority and static-source defense in depth;
- makes the account JavaScript directly syntax-testable and easier to maintain without duplicating a large inline module across route copies.

## Behavior and authority boundary

Build 296 is an extraction only. It introduces:

- no customer behavior change;
- no API contract or endpoint authority change;
- no new customer/staff field authority;
- no maintenance price, cadence, discount, perk, priority, appointment, subscription or recurring billing rule;
- no new polling or background work;
- no schema migration.

The accepted Build 295 Production source at `73556e1f41dc204290409294c5e38ad0b2090fb7` is the exact comparison baseline. `scripts/build296_release_check.py` proves that the asset equals the former inline module and that the page differs from that baseline only by the external module tag.

## Validation

- `node --check assets/my-account-v296.js`
- `scripts/build296_release_check.py`
- `scripts/build296_http_smoke.sh`
- `.github/workflows/build296-source-gate.yml`
- `.github/workflows/build296-development-acceptance.yml`
- cumulative Development source gate through Build 296
- retained Builds 271–295 guards, including forward-compatible Build 295 source-authority validation
- one-H1 and route-copy parity guards

Production remains closed until the exact Build 296 candidate passes feature source/Cloudflare preview, exact `dev` passes Development source/runtime/Cloudflare acceptance, and a deliberate later Production promotion is requested and accepted.
