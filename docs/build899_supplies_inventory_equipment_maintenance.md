# Rosie Dazzlers Build 899 — Supplies, Inventory & Equipment Maintenance

## Production feature scope
Original Rosie catalog and purchasing remain canonical. Existing source tables catalog_inventory_items, catalog_purchase_orders, and catalog_inventory_movements provide supplies, tools, thresholds, open purchase orders and bounded stock movement context. The new private Admin Supplies & Equipment screen offers an original-category stock list, explicit reorder review, 14-day maintenance schedule, staff-reported service entries, and physically observed count review without changing the counted catalog quantity.

New additive database tables rosie_equipment_service_v899 and rosie_inventory_count_reviews_v899 store **append-only source observations** with unique idempotent client request keys. No table duplicates stock, purchase orders, inventory movements or the accounting ledger. The new migration is supabase/migrations/20261116225000_build899_private_inventory_equipment_review.sql and is owner-governed. The companion supabase/migrations/20261116231000_build899_immutable_staff_evidence_guard.sql adds immutable UPDATE/DELETE/TRUNCATE triggers, because the inherited Supabase service_role may have broader privileges despite explicit revocation. Both migrations were applied to the original Rosie Supabase project and their privacy/trigger metadata verified. Database RLS is enabled with no anon/authenticated policies; direct user grants are explicitly revoked. Only the server service_role has SELECT and INSERT grants, with no UPDATE or DELETE. Check constraints keep independent owner approval and physical service certification false. Staff report status never becomes signed owner evidence.

## Staff operations
- Signed-in Rosie Admin or authorized Operations Manager with operations.assignment.manage can read the bounded private source dashboard and append original review records. The legacy password and header bridge do not qualify; POST requires same origin.
- Maintenance is restricted to active tool assets; an exact existing item UUID and idempotent request UUID are required. Staff may plan an inspection/cleaning/filter service/calibration/repair/preventive visit up to 365 days ahead, or log work they actually report up to 365 days in the past. This is staff-reported until independent original verification.
- A physical consumables or tool count records only proposed quantity and the original qty_on_hand snapshot plus observed date, reason and bounded staff note. It does not patch catalog_inventory_items, inventory movements, cost or GL.
- Low stock is compared to the existing reorder threshold; existing draft/requested/ordered PO only indicates open purchasing paperwork, never delivery. No automated ordering, receiving, customer charges or accounting postings.
- The data windows are bounded to items 150, purchase orders 100, movements 150, equipment service events 80 and stock-count reviews 80. If a window fills, the UI signals possible truncation. An unscheduled tool merits a schedule review, not an unsupported declaration that the equipment is unsafe.
- Customer identity, supplier contact details, provider secrets, labor/payroll records and purchase URLs are not returned to the browser. Only brief equipment/location identifiers and operational counts are shown.

## Owner/physical acceptance
Staff notes can be genuine observations but no original physical receipt, actual ordered delivery, witnessed inventory adjustment, signed service completion, calibration certificate, purchase invoice, owner approval or accountant posting is inferred. Existing supervised inventory-posting/reversal and catalog-stock APIs remain the only mutation owners. There is **no automatic write** to those APIs from Build 899. Until original review and controls pass, BUSINESS ACTIVATION HOLD remains truthful.

## Independent seven-application contracts
Normal additive changes stay under protocol 1.1 with backward 1.0 compatibility. No synchronized Vercel deployments for AI Data Platform, iCamp or Yard Workers, no Comms handoff, no service identity enrollment and no original Windows server receiver activation are made here.

## Release verification
Run node --test tests/build899_supplies_equipment.test.mjs and node --check functions/api/admin/supplies_equipment_v899.js, plus retained scripts/build409_inventory_job_cost_operational_evidence_test.mjs. Verify the new tables exist with RLS, service-role read/insert and direct anon/authenticated access revoked. Protected PR, Cloudflare preview, exact dev Deployment, protected main, Cloudflare exact-main Pages+Functions and canonical HTTPS smoke, release-health GREEN and queue WITHIN_BUDGET must succeed before announcing software Production GREEN.

The test rows are synthetic and never count as field evidence. Builds 892–898 original owner/provider/device acceptance HOLDs are unchanged.

**Next proposed Build 900 — Workforce, Equipment Safety & Job Preparation**, with assignable tool readiness, role-isolated signoff and equipment-maintenance evidence linked to actual work.
