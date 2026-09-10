# Build 373 — Fleet Account Operations

Build 373 adds the staff-only operational layer that follows the Build 372 Fleet Business Rulebook.

## Scope

The workbench supports the six roadmap capabilities:

1. **Business contacts** — multiple named contacts per fleet account while preserving the existing primary contact fields on `fleet_accounts`.
2. **Vehicle rosters** — account-owned unit/reference records with optional year, make, model, body style and plate reference.
3. **Per-vehicle service history** — dated service summaries that can optionally reference an existing canonical booking or fleet request job.
4. **Grouped requests/jobs** — fleet request groups can contain one or more vehicle work-planning rows and can optionally link those rows to an existing canonical booking.
5. **PO/reference support** — a fleet request group may carry a customer-supplied PO/reference string.
6. **Invoice grouping** — a fleet request group may carry an internal invoice-group reference so Finance can later collect related work together.

## Authority boundary

Build 373 is operational organization, not commercial activation.

- It does **not** create or mutate `bookings`.
- It does **not** calculate or apply fleet rates, discounts, minimums, travel charges or cancellation charges.
- It does **not** create an accounting invoice or a Stripe/PayPal/provider invoice.
- It does **not** charge a customer, capture a payment or enable recurring billing.
- `po_reference` and `invoice_group_reference` are metadata only.
- A `booking_id` on a fleet request job/history row is a reference to a booking that already exists under the canonical booking workflow.
- Build 372 remains the commercial rule authority; unresolved fleet economics remain unresolved.

## Access and data protection

The Fleet Operations API requires staff `manage_bookings`/Operations authority. Database tables are RLS-enabled and direct `anon` and `authenticated` table privileges are revoked. Cloudflare Functions use the existing server-side Supabase service-role path after staff authorization.

## Tables

Build 373 uses the existing `fleet_accounts` master and adds:

- `fleet_account_contacts`
- `fleet_account_vehicles`
- `fleet_request_groups`
- `fleet_request_jobs`
- `fleet_vehicle_service_history`

The applied Supabase migration is `20260910171324_build373_fleet_account_operations` and is mirrored in source under `supabase/migrations/`.

## Operator workflow

1. Open **Fleet Operations** from Admin.
2. Create or select the business account.
3. Add contacts and roster vehicles using business-owned unit/reference labels.
4. Create a request group for a batch of requested work. Add PO/reference and invoice-group reference only when supplied/needed; neither field changes pricing or billing.
5. Add vehicle jobs to the group. Link an existing booking only after that booking has been created through the canonical booking flow.
6. Add service-history evidence after work is known to have occurred, optionally referencing the existing booking/request job.

Build 373 does not infer completion, price, payment, or customer consent from these records.
