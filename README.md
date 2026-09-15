# Rosie Dazzlers

Current source direction: **Build 406 — Go-Live Evidence & Provider Readiness Convergence**.

Rosie Dazzlers is one platform with a static-first public website and independently authorized/sleeping Customer, Detailer, Operations, Administration, I.T., Finance, DAIP and Socials & Promotion modules.

## Start here

For a new chat, AI or developer, read:

1. `AI_PROJECT_HANDOFF.md` — current implementation/deployment/release truth.
2. `AUTONOMOUS_RELEASE_QUEUE.md` — accepted/current/next bounded work.
3. `FORWARD_BUILD_ROADMAP_405_415.md` — active evidence-driven forward sequence and continuing release rules.
4. `BUILD406_GO_LIVE_EVIDENCE_PROVIDER_READINESS_CONVERGENCE.md` — current go-live/provider-readiness convergence contract.
5. `BUILD405_FULL_RESPONSIVE_PRODUCTION_ACCEPTANCE_ROADMAP_RENEWAL.md` — retained capstone Production-acceptance contract.
6. `BUILD404_ERROR_RECOVERY_WEAK_CONNECTION_RELIABILITY.md` — retained recovery/weak-connection authority.
7. `BUILD403_CUSTOMER_RETENTION_REBOOKING_SERVICE_GUIDANCE_SEO_GROWTH.md` — retained customer/service/SEO authority.
8. `BUILD402_ADMIN_OPERATIONS_COCKPIT_GROWTH_EXPERIMENTS.md` — retained Operations cockpit authority.
9. `BUILD401_JOB_HANDOFF_COMMERCIAL_EVIDENCE.md` — retained field-to-office handoff/commercial evidence authority.
10. `STARTUP_GO_LIVE_BLOCKERS.md` — current evidence/HOLD inventory feeding the I.T. readiness cockpit.

Git history is the release archive. `DOC_INDEX.md` is for specialist references.

## Build 406 readiness framework

`/admin/it.html` is the single current operator-facing readiness surface. It combines the new authenticated read-only `/api/admin/go_live_readiness` evidence endpoint with retained `/api/admin/production_diagnostics` troubleshooting evidence.

Readiness is classified explicitly as `source_ready`, `runtime_proven`, `provider_dependent`, `owner_action`, or `unavailable`. Unavailable evidence is not automatically failure. Configuration presence can establish source readiness, but it cannot prove a Stripe/PayPal transaction, webhook/refund, email/SMS delivery, Search Console/Google Business Profile result, backup/export recovery proof, or independent phone/tablet/desktop visual acceptance.

The readiness endpoint performs bounded read-only runtime checks only. It does not write schema/business data, upload/delete R2 objects, create/refund payments, call providers to manufacture acceptance, send messages, infer consent, automatically book work or run a background replay queue. Provider-sensitive evidence remains fail-closed until directly observed under the appropriate later acceptance authority.

## Retained capstone, recovery and service framework

Build 405 remains the retained complete visitor → booking/checkout → Customer → Detailer → Operations → payment/accounting → Production-runtime capstone authority. Representative phone/tablet/desktop support remains mandatory and source checks are not mislabeled as independent visual-browser proof.

`/assets/reliability-recovery-v404.js` remains a non-authoritative reliability layer: honest offline/weak-network messaging, bounded retry for GET/HEAD reads only, expiring tab-scoped protected drafts, explicit duplicate-submit locking, upload progress/failure/manual retry states and partial-result labeling. It never queues or automatically replays business mutations.

`/api/client/retention` continues to resolve completed booking history through exact `customer_profile_id`; current catalog, vehicle condition, availability, scope and price remain server-authoritative. `/assets/build403-service-depth.js` retains condition-aware professional service guidance, including water-extraction/restoration depth.

Run focused/current authorities with:

```bash
python scripts/build406_go_live_evidence_provider_readiness_convergence_check.py
python scripts/build405_full_responsive_production_acceptance_roadmap_renewal_check.py
python scripts/build404_error_recovery_weak_connection_reliability_check.py
python scripts/build403_customer_retention_rebooking_service_guidance_seo_growth_check.py
python scripts/build402_admin_operations_cockpit_growth_experiment_check.py
python scripts/build401_job_handoff_commercial_evidence_check.py
python scripts/build400_detailer_mobile_qol_retention_check.py
python scripts/build397_responsive_ux_authority_check.py
python scripts/release_authority_documentation_convergence_check.py
python scripts/release_check.py
```

Retained customer journey, communication, pricing, responsive, Detailer mobile, Operations, field-handoff, payment and Production-business authorities remain mandatory. Production business acceptance remains governed by `.github/workflows/production-business-acceptance-authority.yml`.

## Release authority

Feature candidates must pass focused source authority, Current Source Gate and exact feature-preview acceptance before `dev` moves. Development must prove the identical SHA; `dev` advances only by non-force fast-forward.

Production promotion is governed by protected-main pull-request release mechanics. Accepted Development is proposed by PR to `main`; required `source checks` must pass and protection must not be bypassed. Prefer a merge commit so the accepted Development SHA remains explicit.

After merge, the resulting `main` head is the exact Production SHA and **Production deployment/runtime/business acceptance must independently prove that exact SHA**. Production is not considered GREEN from source promotion alone. Any source write after acceptance invalidates that exact-SHA acceptance and requires revalidation. Database migrations and business/provider mutations remain separate explicit boundaries.

## Next bounded release

**Build 407 — Payment Provider Live-Outcome & Reconciliation Acceptance** follows only after Build 406 is fully accepted on protected `main` and exact Production evidence is GREEN. Build 406 itself performs no provider transaction.

Public SEO remains constrained to one meaningful H1 per indexable page, unique metadata/canonical/structured data, truthful Oxford/Norfolk service content and genuine proof only.
