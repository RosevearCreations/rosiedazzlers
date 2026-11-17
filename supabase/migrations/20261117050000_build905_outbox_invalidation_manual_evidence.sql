-- Rosie 905: append-only observation of consent invalidation, source-bound
-- manual contact staff attestation, and independent evidence review. NEVER delivery proof.
create table if not exists public.rosie_manual_contact_evidence_v905 (
 id uuid primary key default gen_random_uuid(),
 client_request_id uuid not null unique,
 booking_id uuid not null references public.bookings(id) on delete restrict,
 exception_id uuid not null references public.rosie_jobday_events_v901(id) on delete restrict,
 manual_authority_id uuid not null references public.rosie_manual_outbox_reviews_v904(id) on delete restrict,
 related_contact_id uuid references public.rosie_manual_contact_evidence_v905(id) on delete restrict,
 event_kind text not null check (event_kind in ('invalidate','attest_contact','verify_contact')),
 channel text check (channel in ('email','sms','phone')),
 occurred_at timestamptz,
 outcome text check (outcome in ('attempted','reached','voicemail')),
 evidence_basis text check (evidence_basis in ('call_log','sent_folder','sms_log','customer_ack')),
 evidence_reference text check (evidence_reference ~ '^[A-Za-z0-9._:-]{8,80}$'),
 decision text check (decision in ('corroborated','hold')),
 source_state text not null check (char_length(source_state) between 3 and 95),
 preference_id uuid references public.customer_communication_preference_versions(id) on delete restrict,
 staff_user_id uuid not null references public.staff_users(id) on delete restrict,
 note text not null check (char_length(note) between 12 and 350),
 recorded_at timestamptz not null default now(),
 internal_only boolean not null default true check(internal_only),
 automatic_send_enabled boolean not null default false check(not automatic_send_enabled),
 provider_delivery_claimed boolean not null default false check(not provider_delivery_claimed),
 customer_contact_proven boolean not null default false check(not customer_contact_proven),
 physical_safety_certified boolean not null default false check(not physical_safety_certified),
 check (
  (event_kind='invalidate' and related_contact_id is null and occurred_at is null and decision is null and evidence_reference is null)
  or (event_kind='attest_contact' and related_contact_id is null and channel is not null and occurred_at is not null
      and outcome is not null and evidence_basis is not null and evidence_reference is not null and decision is null)
  or (event_kind='verify_contact' and related_contact_id is not null and decision is not null and
      channel is not null and evidence_basis is not null and occurred_at is null and evidence_reference is null)
 )
);
create index if not exists rosie905_history_idx on public.rosie_manual_contact_evidence_v905(booking_id,exception_id,recorded_at desc);
create unique index if not exists rosie905_one_attestation_per_authority_idx on public.rosie_manual_contact_evidence_v905(manual_authority_id) where event_kind='attest_contact';
create unique index if not exists rosie905_one_review_per_attestation_idx on public.rosie_manual_contact_evidence_v905(related_contact_id) where event_kind='verify_contact';
create unique index if not exists rosie905_one_invalidation_per_authority_idx on public.rosie_manual_contact_evidence_v905(manual_authority_id) where event_kind='invalidate';
alter table public.rosie_manual_contact_evidence_v905 enable row level security;
revoke all on table public.rosie_manual_contact_evidence_v905 from public,anon,authenticated;
grant select,insert on table public.rosie_manual_contact_evidence_v905 to service_role;
create trigger rosie905_immutable before update or delete on public.rosie_manual_contact_evidence_v905
 for each row execute function public.rosie899_reject_record_mutation();
create trigger rosie905_no_truncate before truncate on public.rosie_manual_contact_evidence_v905
 for each statement execute function public.rosie899_reject_record_mutation();
comment on table public.rosie_manual_contact_evidence_v905 is 'Internal original-staff contact claim, independent staff review and invalidation observation; no automatic send, provider delivery proof or customer receipt asserted.';
