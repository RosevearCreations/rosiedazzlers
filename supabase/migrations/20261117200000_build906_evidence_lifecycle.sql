-- Build 906 — append-only independent audit of Build 905 manual staff attestation.
-- Evidence reference stays in private Build 905 table; no PII or provider claim is copied.
create table if not exists public.rosie_contact_evidence_audit_v906 (
 id uuid primary key default gen_random_uuid(),
 client_request_id uuid not null unique,
 booking_id uuid not null references public.bookings(id) on delete restrict,
 exception_id uuid not null references public.rosie_jobday_events_v901(id) on delete restrict,
 manual_authority_id uuid not null references public.rosie_manual_outbox_reviews_v904(id) on delete restrict,
 contact_receipt_id uuid not null references public.rosie_manual_contact_evidence_v905(id) on delete restrict,
 staff_user_id uuid not null references public.staff_users(id) on delete restrict,
 channel text not null check(channel in ('email','sms','phone')),
 decision text not null check(decision in ('corroborated','hold')),
 source_state text not null check(char_length(source_state) between 3 and 100),
 consent_preference_id uuid references public.customer_communication_preference_versions(id) on delete restrict,
 note text not null check(char_length(note) between 12 and 350),
 recorded_at timestamptz not null default now(),
 internal_only boolean not null default true check(internal_only),
 automatic_send_enabled boolean not null default false check(not automatic_send_enabled),
 provider_delivery_verified boolean not null default false check(not provider_delivery_verified),
 customer_contact_proven boolean not null default false check(not customer_contact_proven),
 physical_safety_certified boolean not null default false check(not physical_safety_certified)
);
create index if not exists rosie906_booking_source_idx on public.rosie_contact_evidence_audit_v906
 (booking_id,exception_id,recorded_at desc);
create unique index if not exists rosie906_one_independent_review_per_contact_idx on public.rosie_contact_evidence_audit_v906(contact_receipt_id);
alter table public.rosie_contact_evidence_audit_v906 enable row level security;
revoke all on table public.rosie_contact_evidence_audit_v906 from public,anon,authenticated,service_role;
grant select,insert on table public.rosie_contact_evidence_audit_v906 to service_role;
create trigger rosie906_immutable before update or delete on public.rosie_contact_evidence_audit_v906
 for each row execute function public.rosie899_reject_record_mutation();
create trigger rosie906_no_truncate before truncate on public.rosie_contact_evidence_audit_v906
 for each statement execute function public.rosie899_reject_record_mutation();
comment on table public.rosie_contact_evidence_audit_v906 is 'Private signed independent review of original staff attestation. Corroborated means reviewed source only, never provider delivery or customer receipt. No auto-send.';
