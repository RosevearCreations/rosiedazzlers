# Rosie Dazzlers — Forward Builds 613–621

Created after the owner-approved Build 612 Standard Theme release. This is a
**nine-build planned batch**, not a claim that future code or owner decisions
exist. At the start: **one active build (613), eight queued (614–621)**.

| Build | Planned scope | Completion boundary |
| --- | --- | --- |
| **613 — Condition-Aware Quote Guidance Preview** | Explain service discussions and quote-required concerns in the isolated wizard. | No price/booking side effect; regression and Production source release proof. |
| **614 — Live Pricing Source Parity & Owner Review** | Read-only comparison of bundled, App Management, customer and staff-visible catalog fields; surface Basic Detail discrepancy. | Owner resolution required before price changes; do not infer Supabase/runtime truth from source. |
| **615 — Quote Intake & Staff Handoff Acceptance** | Accessible mobile inquiry-to-staff review, opt-in consent, disabled-intake messaging, duplicate/retry tests. | No automatic booking, charge, real inquiry activation or marketing consent without owner approval. |
| **616 — Photo Studio Autosave Failure Recovery** | Bound 503/1102/subrequest failures, show honest retry/conflict states and manual recovery. | Never overwrite newer photo records or auto-retry destructive writes; verify Cloudflare limits. |
| **617 — R2 Media Sync & Publication Reconciliation** | Repair staff-owned media lookup/sync and provenance, validate image permissions and previews. | No unauthorized public use of private/customer images or inferred consent. |
| **618 — Admin Inventory Visual & Selection Recovery** | Correct inventory primary image, card alignment and editing feedback across screen widths. | Preserve quantities, IDs and role boundaries; no stock mutation from visual actions. |
| **619 — Partial Consumable Usage & Job Cost Traceability** | Consistent stock/usage units, partial consumption, job usage and cost-per-unit reporting. | Atomic, audited quantities; no negative stock, repeat debit or implicit order. |
| **620 — Owner Theme Manager Preview & Approval** | Preview and clone versioned themes with distinct managed/static image slots and accessible selection UI. | No public activation from a preview or unapproved asset. |
| **621 — Theme Activation, Rollback & Cross-Viewport Acceptance** | Owner-governed theme activation history, safe rollback and broad public/Admin responsive audit. | Activation requires explicit owner authorization and independent exact-main Production verification. |

## Ordering

- **613–615:** quote-first and actual price/source trust, with no inferred
  consent or price policy change.
- **616–617:** Photo Studio/R2 reliability and privacy.
- **618–619:** inventory, consumables and per-job usage.
- **620–621:** owner theme lifecycle.

After **Build 613** reaches verified Production GREEN, **8 planned builds**
remain in this batch. After Build 621, assess actual field acceptance and
create the next batch; do not automatically invent business acceptance.

Every build travels through feature review if needed, `dev`, a protected
`main` pull request, Cloudflare deployment and exact-SHA Production proof.
Only truthfully observed results close a HOLD.
