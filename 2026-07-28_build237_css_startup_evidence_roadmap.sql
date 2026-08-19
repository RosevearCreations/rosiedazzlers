-- Build 237 — CSS/startup stabilization, shared launch evidence, and current roadmap cycle.
begin;

create table if not exists public.app_launch_readiness_evidence (
 id uuid primary key default gen_random_uuid(),
 evidence_key text not null unique check (evidence_key ~ '^[a-z0-9_:-]{4,80}$'),
 title text not null check (char_length(title) between 4 and 180),
 detail text not null check (char_length(detail) between 8 and 1200),
 severity text not null check (severity in ('block','warn')),
 status text not null default 'pending' check (status in ('pending','verified','failed','waived')),
 sort_order integer not null default 100 check (sort_order between 1 and 10000),
 evidence_note text null check (evidence_note is null or char_length(evidence_note)<=2000),
 verified_at timestamptz null,
 verified_by_staff_email text null,
 updated_by_staff_email text null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.app_launch_readiness_evidence_audit (
 id uuid primary key default gen_random_uuid(),
 evidence_key text not null,
 event_type text not null check (event_type in ('created','updated','status_changed','note_added')),
 status text not null check (status in ('pending','verified','failed','waived')),
 actor_staff_email text null,
 safe_note text not null check (char_length(safe_note) between 3 and 800),
 created_at timestamptz not null default now()
);
insert into public.app_launch_readiness_evidence(evidence_key,title,detail,severity,status,sort_order) values
('booking_e2e','Booking end-to-end','Complete a customer booking from availability through confirmation and verify the admin record.','block','pending',10),
('stripe_live','Stripe live payment','Complete and refund a small live payment; confirm webhook, receipt and accounting evidence.','block','pending',20),
('email_delivery','Email delivery','Verify booking, payment and staff notifications arrive outside the development inbox.','block','pending',30),
('environment','Production environment','Verify Cloudflare production variables, bindings, domain and branch settings.','block','pending',40),
('backups','Backup and restore','Confirm database backup coverage and document a tested restore procedure.','block','pending',50),
('legal','Policies and consent','Review privacy, terms, cancellation, refund, photo/media consent and cookie wording.','block','pending',60),
('mobile','Mobile workflow','Test booking, payment, contact, inventory and staff workflows on a real phone.','warn','pending',70),
('accessibility','Accessibility review','Keyboard-test customer pages and verify labels, focus, contrast and error messages.','warn','pending',80),
('analytics','Analytics and conversions','Confirm analytics, booking conversion and payment events in production.','warn','pending',90),
('search','Search preflight','Submit sitemap, verify canonical URLs, robots rules and Search Console property.','warn','pending',100),
('business_profile','Google Business Profile','Confirm hours, service area, phone, website and primary categories.','warn','pending',110),
('security','Security review','Verify staff permissions, session logout, protected APIs and security headers.','block','pending',120),
('monitoring','Monitoring and incident path','Confirm production logs, failure alerts and a written response path.','warn','pending',130),
('operations','First-week operations','Prepare pricing, supplies, scheduling capacity, customer support and escalation ownership.','warn','pending',140),
('css_roadmap','Roadmap CSS and dependencies','Verify /admin-roadmap-execution loads site.css, AdminShell and its current-cycle data with no fallback warning.','block','pending',5),
('migration_237','Build 237 migration','Apply and verify shared launch evidence and current roadmap-cycle schema.','block','pending',6),
('block_calendar','Block Calendar','Verify full-date, AM and PM block save/remove behaviour against public booking.','block','pending',7),
('inventory_cleanup','Inventory cleanup','Correct suspicious names, categories, costs and duplicate/inactive state before relying on inventory.','warn','pending',150),
('product_images','Product images','Complete featured/gallery image sets and metadata for sellable products.','warn','pending',160),
('pricing_tax','Pricing, HST and totals','Verify public, booking, checkout, receipt and accounting totals match.','block','pending',55)
on conflict(evidence_key) do update set title=excluded.title,detail=excluded.detail,severity=excluded.severity,sort_order=excluded.sort_order,updated_at=now();

alter table public.app_roadmap_execution_items add column if not exists cycle_key text not null default 'build227';
alter table public.app_roadmap_execution_items add column if not exists is_current_cycle boolean not null default false;
alter table public.app_roadmap_execution_items add column if not exists action_path text null check (action_path is null or char_length(action_path)<=2400);
update public.app_roadmap_execution_items set is_current_cycle=false where cycle_key<>'build237';
insert into public.app_roadmap_execution_items(item_key,title,workstream,priority,status,target_build,sort_order,source_document,cycle_key,is_current_cycle,action_path) values
('b237_01','Deploy Build 237 CSS and admin-page dependency repair to preview','reliability','critical','in_progress',237,1,'STARTUP_GO_LIVE_BLOCKERS.md','build237',true,'Deploy the preview branch, hard-refresh /admin-roadmap-execution, and confirm site.css plus AdminShell load with no 404 or ReferenceError.'),
('b237_02','Apply Build 237 roadmap-cycle and launch-evidence migration in staging','reliability','critical','planned',237,2,'STARTUP_GO_LIVE_BLOCKERS.md','build237',true,'Run sql/2026-07-28_build237_css_startup_evidence_roadmap.sql in Supabase SQL Editor, then refresh the schema cache and open both Roadmap Execution and Launch Readiness.'),
('b237_03','Verify Block Calendar full-date, AM and PM save/remove behaviour','booking','critical','planned',237,3,'STARTUP_GO_LIVE_BLOCKERS.md','build237',true,'Create and remove one future full-date block, one AM block and one PM block; verify the public booking wizard reflects each change immediately.'),
('b237_04','Complete a production-like end-to-end booking and admin verification','booking','critical','planned',237,4,'STARTUP_GO_LIVE_BLOCKERS.md','build237',true,'Use a test customer, select date/vehicle/package/add-ons, finish the booking, then verify booking, calendar, customer and staff records.'),
('b237_05','Complete and refund a small live Stripe transaction','payments','critical','planned',237,5,'STARTUP_GO_LIVE_BLOCKERS.md','build237',true,'Confirm live key mode, complete a small payment, verify webhook and receipt evidence, issue a refund, and reconcile the result.'),
('b237_06','Verify booking, payment, staff and consent email delivery','reliability','critical','planned',237,6,'STARTUP_GO_LIVE_BLOCKERS.md','build237',true,'Send each notification type to an external inbox, inspect spam and mobile rendering, and record provider/message evidence without storing secrets.'),
('b237_07','Audit Cloudflare production variables, bindings, domains and branch settings','reliability','critical','planned',237,7,'STARTUP_GO_LIVE_BLOCKERS.md','build237',true,'Compare production and preview environment names, verify Supabase/Stripe/R2 bindings, and document the exact location of each required variable.'),
('b237_08','Conduct and document a Supabase backup-and-restore rehearsal','reliability','critical','planned',237,8,'STARTUP_GO_LIVE_BLOCKERS.md','build237',true,'Confirm backup coverage, restore a safe staging copy or selected records, validate row counts and permissions, and record the recovery steps.'),
('b237_09','Review and publish customer policies and consent wording','customer','critical','planned',237,9,'STARTUP_GO_LIVE_BLOCKERS.md','build237',true,'Review privacy, terms, cancellation, refund, media consent, cookie and service-condition wording; link them from booking, checkout and footer.'),
('b237_10','Complete real-device mobile workflow testing','reliability','high','planned',237,10,'STARTUP_GO_LIVE_BLOCKERS.md','build237',true,'Test home, services, booking, payment, customer progress, Block Calendar, inventory and uploads on at least one iPhone-size and one Android-size viewport/device.'),
('b237_11','Complete accessibility keyboard, focus, contrast and form-error review','reliability','high','planned',237,11,'STARTUP_GO_LIVE_BLOCKERS.md','build237',true,'Keyboard-test public and critical admin flows, verify visible focus, labels, error announcements, touch targets, heading order and contrast.'),
('b237_12','Submit sitemap and validate canonical URLs and structured data','seo','high','planned',237,12,'STARTUP_GO_LIVE_BLOCKERS.md','build237',true,'Verify Search Console ownership, submit sitemap.xml, inspect index coverage, test home/local/service structured data, and correct canonical inconsistencies.'),
('b237_13','Verify Google Business Profile service-area information and local proof','seo','high','planned',237,13,'STARTUP_GO_LIVE_BLOCKERS.md','build237',true,'Confirm business name, category, service area, hours, phone, website, services, photos and review link match the live site and real-world business.'),
('b237_14','Clean suspicious inventory names, categories, costs and inactive duplicates','operations','high','planned',237,14,'STARTUP_GO_LIVE_BLOCKERS.md','build237',true,'Use Inventory Workbench filters, correct customer-facing names, complete costs/categories, archive true duplicates and preserve rows with operational history.'),
('b237_15','Complete featured and gallery image metadata for sellable products','media','high','planned',237,15,'STARTUP_GO_LIVE_BLOCKERS.md','build237',true,'For each sellable product set one featured image and up to seven ordered gallery images, then complete descriptive alt text, captions, role and consent/provenance notes.'),
('b237_16','Replace high-value public visual placeholders with approved local proof','seo','high','planned',238,16,'IMAGES.md','build237',true,'Prioritize homepage, ceramic coating, paint correction, interior, local town pages, gallery and booking trust areas using Rosie-owned approved images.'),
('b237_17','Add reviewed duplicate inventory merge and transfer workflow','operations','high','planned',238,17,'MASTER_VALUE_ROADMAP.md','build237',true,'Design a preview-only merge that transfers references and stock history, records audit evidence and never hard-deletes an item with operational links.'),
('b237_18','Replace sequential bulk inventory saves with a transactional RPC','operations','high','planned',238,18,'MASTER_VALUE_ROADMAP.md','build237',true,'Create a validated all-or-nothing Supabase RPC with per-row errors, actor audit, rollback behaviour and a dry-run preview.'),
('b237_19','Run invite-only soft launch and inspect every early transaction','operations','critical','planned',238,19,'STARTUP_GO_LIVE_BLOCKERS.md','build237',true,'Accept a small known-customer group, watch bookings/payments/messages/media/inventory/logs daily, and stop expansion if any critical workflow fails.'),
('b237_20','Modernize historical release guards and archive redundant Markdown safely','documentation','medium','planned',238,20,'MASTER_VALUE_ROADMAP.md','build237',true,'Map every release-guard dependency, replace historical text-marker checks with current feature checks, then move obsolete docs to docs/archive without deleting evidence.')
on conflict(item_key) do update set title=excluded.title,workstream=excluded.workstream,priority=excluded.priority,target_build=excluded.target_build,sort_order=excluded.sort_order,source_document=excluded.source_document,cycle_key=excluded.cycle_key,is_current_cycle=true,action_path=excluded.action_path,updated_at=now();

create index if not exists app_launch_readiness_status_idx on public.app_launch_readiness_evidence(status,severity,sort_order);
create index if not exists app_launch_readiness_audit_idx on public.app_launch_readiness_evidence_audit(evidence_key,created_at desc);
create index if not exists app_roadmap_execution_cycle_idx on public.app_roadmap_execution_items(is_current_cycle,cycle_key,sort_order);
alter table public.app_launch_readiness_evidence enable row level security;
alter table public.app_launch_readiness_evidence_audit enable row level security;
revoke all privileges on table public.app_launch_readiness_evidence,public.app_launch_readiness_evidence_audit from public,anon,authenticated;
grant all privileges on table public.app_launch_readiness_evidence,public.app_launch_readiness_evidence_audit to service_role;
comment on table public.app_launch_readiness_evidence is 'Build 237 shared, audited go-live evidence. Replaces browser-only launch checklist state while retaining a local fallback during migration/outage.';
comment on column public.app_roadmap_execution_items.action_path is 'Exact safe route/instruction path for the current roadmap item; must not store secrets or private evidence URLs.';
commit;
