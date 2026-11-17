-- Rosie 903: signed exception owner claims, two-person supervisor routing
-- and strictly internal UNSENT notification drafts. No customer consent inference or sends.
create table if not exists public.rosie_exception_routing_outbox_v903 (
 id uuid primary key default gen_random_uuid(),
 client_request_id uuid not null unique,
 booking_id uuid not null references public.bookings(id) on delete restrict,
 exception_id uuid not null references public.rosie_jobday_events_v901(id) on delete restrict,
 event_kind text not null check(event_kind in ('claim','route','accept_route','draft','suppress')),
 handoff_ack_id uuid references public.rosie_jobday_exception_receipts_v902(id) on delete restrict,
 related_receipt_id uuid references public.rosie_exception_routing_outbox_v903(id) on delete restrict,
 recipient_staff_user_id uuid references public.staff_users(id) on delete restrict,
 decision text check(decision in ('accepted','rejected')),
 template_key text check(template_key in ('sla_overdue','safety_hold','handoff_pending')),
 staff_user_id uuid not null references public.staff_users(id) on delete restrict,
 note text not null check(char_length(note) between 12 and 350),
 recorded_at timestamptz not null default now(),
 channel text not null default 'internal_task' check(channel='internal_task'),
 send_authorized boolean not null default false check(not send_authorized),
 delivery_attempted boolean not null default false check(not delivery_attempted),
 customer_contact_authorized boolean not null default false check(not customer_contact_authorized),
 customer_consent_claimed boolean not null default false check(not customer_consent_claimed),
 physical_safety_certified boolean not null default false check(not physical_safety_certified),
 check (
  (event_kind='claim' and handoff_ack_id is not null and related_receipt_id is null and
   recipient_staff_user_id is null and decision is null and template_key is null) or
  (event_kind='route' and handoff_ack_id is null and related_receipt_id is null and
   recipient_staff_user_id is not null and decision is null and template_key is null) or
  (event_kind='accept_route' and handoff_ack_id is null and related_receipt_id is not null and
   recipient_staff_user_id is null and decision is not null and template_key is null) or
  (event_kind='draft' and handoff_ack_id is null and related_receipt_id is null and
   recipient_staff_user_id=staff_user_id and decision is null and template_key is not null) or
  (event_kind='suppress' and handoff_ack_id is null and related_receipt_id is not null and
   recipient_staff_user_id is null and decision is null and template_key is null)
 )
);
create index if not exists rosie903_booking_exception_idx on public.rosie_exception_routing_outbox_v903(booking_id,exception_id,recorded_at desc);
create unique index if not exists rosie903_one_owner_claim_idx on public.rosie_exception_routing_outbox_v903(exception_id) where event_kind='claim';
create unique index if not exists rosie903_one_route_accept_idx on public.rosie_exception_routing_outbox_v903(related_receipt_id) where event_kind='accept_route';
create unique index if not exists rosie903_one_draft_suppression_idx on public.rosie_exception_routing_outbox_v903(related_receipt_id) where event_kind='suppress';
alter table public.rosie_exception_routing_outbox_v903 enable row level security;
revoke all on table public.rosie_exception_routing_outbox_v903 from public,anon,authenticated;
grant select,insert on table public.rosie_exception_routing_outbox_v903 to service_role;
create trigger rosie903_immutable before update or delete on public.rosie_exception_routing_outbox_v903
 for each row execute function public.rosie899_reject_record_mutation();
create trigger rosie903_no_truncate before truncate on public.rosie_exception_routing_outbox_v903
 for each statement execute function public.rosie899_reject_record_mutation();
comment on table public.rosie_exception_routing_outbox_v903 is 'Private append-only routing and UNSENT internal-task drafts only; no SMS/email/customer delivery, no proof of customer consent, no physical safety certification.';
