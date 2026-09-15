# Rosie Dazzlers

Current source direction: **Build 406 — Go-Live Evidence & Provider Readiness Convergence**.

Rosie Dazzlers is one platform with a static-first public website and independently authorized/sleeping Customer, Detailer, Operations, Administration, I.T., Finance, DAIP and Socials & Promotion modules.

## Start here

1. `AI_PROJECT_HANDOFF.md` — current implementation/deployment/release truth.
2. `AUTONOMOUS_RELEASE_QUEUE.md` — current/next bounded work.
3. `FORWARD_BUILD_ROADMAP_405_415.md` — active evidence-driven sequence.
4. `BUILD406_GO_LIVE_EVIDENCE_PROVIDER_READINESS_CONVERGENCE.md` — current readiness contract.
5. `BUILD405_FULL_RESPONSIVE_PRODUCTION_ACCEPTANCE_ROADMAP_RENEWAL.md` — retained capstone from **Build 405 — Full Responsive Production Acceptance & Roadmap Renewal**.
6. `STARTUP_GO_LIVE_BLOCKERS.md` — current evidence/HOLD inventory.

Git history is the release archive. `DOC_INDEX.md` is for specialist references.

## Current readiness framework

`/admin/it.html` is the single current operator-facing readiness surface. It combines authenticated read-only `/api/admin/go_live_readiness` evidence with retained `/api/admin/production_diagnostics` troubleshooting.

Readiness is classified as `source_ready`, `runtime_proven`, `provider_dependent`, `owner_action`, or `unavailable`. Unavailable evidence is not automatically failure. Configuration presence can establish source readiness but cannot prove provider transaction/delivery outcomes, Search Console/GBP proof, backup/export recovery proof, or independent phone/tablet/desktop visual acceptance.

The readiness endpoint performs bounded read-only checks only. It does not write schema/business data, upload/delete R2 objects, create/refund payments, send messages, infer consent, automatically book work or run background replay.

## Retained platform contract

The retained capstone still governs visitor → booking/checkout → Customer → Detailer → Operations → payment/accounting → exact Production runtime. Reliability recovery remains read-safe and non-authoritative; canonical checkout/server state owns business outcomes. Public SEO remains one meaningful H1 per indexable page with unique metadata/canonical/structured data and truthful Oxford/Norfolk proof.

Run focused/current authorities with:

```bash
python scripts/build406_go_live_evidence_provider_readiness_convergence_check.py
python scripts/build405_full_responsive_production_acceptance_roadmap_renewal_check.py
python scripts/build404_error_recovery_weak_connection_reliability_check.py
python scripts/release_authority_documentation_convergence_check.py
python scripts/release_check.py
```

## Release authority

Feature candidates must pass focused authority, Current Source Gate and exact feature-preview acceptance before `dev` moves. Development must prove the identical SHA; `dev` advances only by non-force fast-forward.

Production promotion uses protected-main pull-request mechanics. Required `source checks` must pass and protection is not bypassed. After merge, the resulting `main` head is the exact Production SHA and Production deployment/runtime/business acceptance must independently prove it before GREEN. Any post-acceptance source write requires revalidation. Database migrations and provider/business mutations remain separate explicit boundaries.

## Next bounded release

**Build 407 — Payment Provider Live-Outcome & Reconciliation Acceptance** follows only after the current release is fully GREEN in Production; controlled provider evidence/mutation requires its own explicit authority.
