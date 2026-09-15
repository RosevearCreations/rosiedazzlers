# Build 406 — Go-Live Evidence & Provider Readiness Convergence

Build 406 turns the retained go-live blocker inventory into one current, authenticated readiness surface under **Admin → I.T.**. It does not invent provider outcomes, does not create a second deployment/payment/business authority, and does not authorize schema or Production business-data mutation.

## Readiness classifications

Every readiness item is classified as exactly one of:

- `source_ready` — required source/configuration authority is present, but runtime/provider outcome is not implied.
- `runtime_proven` — a bounded read-only check observed the current deployed runtime successfully.
- `provider_dependent` — definitive evidence must come from an external provider outcome; source/config presence is insufficient.
- `owner_action` — evidence requires an explicit human review or controlled action outside normal source/runtime checks.
- `unavailable` — the requested evidence cannot currently be observed from this surface.

**Unavailable is not failure.** An unavailable item may still block a particular launch decision when that evidence is required, but the system must not convert missing evidence into fabricated failure or fabricated success.

## Single current readiness surface

`/admin/it.html` is the current operator-facing readiness cockpit. It combines:

1. Build 406 go-live readiness evidence from `/api/admin/go_live_readiness`;
2. retained Build 379 production diagnostics from `/api/admin/production_diagnostics`;
3. explicit next-evidence/corrective-action language;
4. manual refresh only — no recurring polling or background replay.

The Build 406 endpoint is authenticated through the existing staff I.T. diagnostics capability and is GET/HEAD-only apart from CORS/options handling. It performs bounded read-only checks only.

## Truth boundaries

- Server/runtime state is authoritative for runtime evidence.
- Exact GitHub/Cloudflare release acceptance remains authoritative for Development/Production promotion.
- Configuration presence may be `source_ready`; it never proves a provider transaction, capture, webhook, refund, email/SMS delivery, Search Console result or Google Business Profile state.
- Stripe/PayPal provider outcomes remain `provider_dependent` until definitive current-release evidence is independently observed.
- Search Console/GBP, backup/export proof and representative phone/tablet/desktop visual-browser proof remain `owner_action` where automation cannot truthfully establish them.
- Source checks are not mislabeled as visual browser proof.
- No secret value is returned to the browser; only safe presence/mode/result metadata may be exposed.

## Runtime evidence

The readiness endpoint may prove, by bounded read-only observation:

- exact Cloudflare Pages runtime identity when available;
- the authenticated Admin/I.T. authorization boundary;
- Supabase reachability through a bounded read;
- R2 media reachability through a bounded list request.

A runtime dependency that cannot be observed is `unavailable` with actionable remediation. The endpoint never repairs bindings, writes schema, uploads media or changes provider state.

## Provider and owner evidence

Build 406 intentionally keeps the following fail-closed:

- Stripe controlled checkout/webhook/refund/final-balance outcomes;
- PayPal controlled authorization/capture/webhook/refund outcomes;
- email/SMS queued/delivered/failed evidence;
- Search Console / Google Business Profile proof;
- backup/export recovery proof;
- independent representative phone/tablet/desktop visual acceptance.

These may be listed and explained by the readiness cockpit, but they may not become `runtime_proven` merely because repository code, environment-variable names or configuration presence exists.

## Release acceptance

The Build 406 candidate must pass:

1. focused Build 406 authority;
2. retained Build 405 capstone authority;
3. Current Source Gate;
4. exact Cloudflare feature-preview acceptance;
5. exact-SHA Development deployment/runtime acceptance after non-force fast-forward to `dev`;
6. protected-main pull-request requirements including `source checks`;
7. exact resulting `main` SHA Production deployment/runtime/business acceptance;
8. a final exact-SHA sweep with zero failed, zero queued and zero in-progress required workflows.

Any source write after an accepted SHA invalidates that acceptance and requires revalidation of the new exact SHA.

## Mutation boundary

Build 406 authorizes **no schema migration, Production business-data mutation, destructive R2 mutation, DNS/secret mutation, payment/provider transaction, charge/refund, accounting/inventory posting, customer mutation, automatic outreach, automatic booking, or hidden background replay queue**.

## Forward handoff

After Build 406 is independently GREEN in Production, the next bounded roadmap item is **Build 407 — Payment Provider Live-Outcome & Reconciliation Acceptance** under `FORWARD_BUILD_ROADMAP_405_415.md`. Build 407 may gather controlled provider evidence only under its own explicit mutation/acceptance authority; Build 406 itself performs no provider transaction.
