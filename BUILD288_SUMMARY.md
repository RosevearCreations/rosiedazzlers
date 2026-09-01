# Rosie Dazzlers Build 288 — Customer/Staff Privacy + Authenticated Device Acceptance

**Status: Development-first**  
**Started from:** accepted Build 287 Development SHA `8e188489674da3a1f727ea410e202e62216f8880`  
**Production remains closed.**

## Why this release exists

Build 288 closes a customer/staff privacy boundary discovered in the authenticated My Account surface. Legacy customer forms displayed fields labelled **Admin-only notes**, while the customer profile and vehicle save APIs accepted `admin_private_notes` under service-role authority. Vehicle/dashboard reads also used broad `select=*` rows.

## Build 288 authority

- Customer profile, vehicle and review responses pass through explicit customer-safe projection helpers before leaving the Worker.
- `admin_private_notes` is not part of customer profile or vehicle write payloads, even when a crafted browser request includes it.
- Legitimate customer-owned fields such as general notes, client-private preferences, notes for the team and detailer-visible notes remain available.
- My Account disables and hides the two legacy admin-only controls through the Build 288 customer privacy helper.
- The dashboard reloads the authenticated profile and returns the customer-safe projection so legitimate saved account preferences remain visible after reload.
- Anonymous profile/vehicle/review mutation APIs remain fail-closed with 401 responses.
- Build 288 adds no database migration and changes no package, pricing, availability, booking, deposit, Stripe, PayPal or payment authority.

## Release mechanics

Build 288 also brings `.github/workflows/development-source-gate.yml` current through focused guard Build 288, including the previously separate Build 286 and Build 287 guards and HTTP helper syntax.

Feature acceptance requires the exact Build 288 feature SHA to pass:

1. Build 288 Source Gate;
2. Cloudflare feature preview;
3. then exact `dev` fast-forward only;
4. Development Source Gate;
5. Build 288 Development Runtime Acceptance;
6. Cloudflare `dev` deployment/full Development acceptance;
7. final `dev`/`main` branch sanity.

Production remains closed until a separate deliberate promotion decision.
