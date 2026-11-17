-- Rosie 904 — append-only original-source manual supervisor review and consent snapshots.
-- An internal authority receipt is never a provider dispatch permission or delivery assertion.
create table if not exists public.rosie_manual_outbox_reviews_v904 (
 id uuid primary key default gen_random_uuid(),
 client_request_id uuid not null unique,
 booking_id uuid not null references public.bookings(id) on delete restrict,
 exception_id uuid not null references public.rosie_jobday_events_v901(id) on delete restrict,
 draft_id uuid not null references public.rosie_exception_routing_outbox_v903(id) on delete restrict,
 related_receipt_id uuid references public.rosie_manual_outbox_reviews_v904(id) on delete restrict,
 event_kind text not null check (event_kind in ('submit','review','authorize','revoke')),
 decision text check (decision in ('approved','hold')),
 channel text not null check (channel in ('email','sms','phone')),
 purpose text not null default 'service' check (purpose='service'),
 customer_profile_id uuid not null references public.customer_profiles(id) on delete restrict,
 preference_id uuid not null references public.customer_communication_preference_versions(id) on delete restrict,
 profile_updated_at timestamptz not null,
 staff_user_id uuid not null references public.staff_users(id) on delete restrict,
 note text not null check (char_length(note) between 12 and 350),
 recorded_at timestamptz not null default now(),
 internal_only boolean not null default true check(internal_only),
 provider_send_enabled boolean not null default false check(not provider_send_enabled),
 automatic_send_enabled boolean not null default false check(not automatic_send_enabled),
 customer_contact_executed boolean not null default false check(not customer_contact_executed),
 delivery_claimed boolean not null default false check(not delivery_claimed),
 physical_safety_certified boolean not null default false check(not physical_safety_certified),
 check(
   (event_kind='submit' and decision is null and related_receipt_id is null) or
   (event_kind='review' and decision in ('approved','hold') and related_receipt_id is not null) or
   (event_kind='authorize' and decision is null and related_receipt_id is not null) or
   (event_kind='revoke' and decision is null and related_receipt_id is not null)
 )
);
create index if not exists rosie904_booking_issue_history_idx on public.rosie_manual_outbox_reviews_v904(booking_id,exception_id,recorded_at desc);
create unique index if not exists rosie904_one_submit_per_draft_idx on public.rosie_manual_outbox_reviews_v904(draft_id) where event_kind='submit';
create unique index if not exists rosie904_one_review_per_submit_idx on public.rosie_manual_outbox_reviews_v904(related_receipt_id) where event_kind='review';
create unique index if not exists rosie904_one_authority_per_review_idx on public.rosie_manual_outbox_reviews_v904(related_receipt_id) where event_kind='authorize';
create unique index if not exists rosie904_one_revoke_per_authority_idx on public.rosie_manual_outbox_reviews_v904(related_receipt_id) where event_kind='revoke';
alter table public.rosie_manual_outbox_reviews_v904 enable row level security;
revoke all on table public.rosie_manual_outbox_reviews_v904 from public,anon,authenticated;
grant select,insert on table public.rosie_manual_outbox_reviews_v904 to service_role;
create trigger rosie904_immutable before update or delete on public.rosie_manual_outbox_reviews_v904
 for each row execute function public.rosie899_reject_record_mutation();
create trigger rosie904_no_truncate before truncate on public.rosie_manual_outbox_reviews_v904
 for each statement execute function public.rosie899_reject_record_mutation();
comment on table public.rosie_manual_outbox_reviews_v904 is 'Original signed independent manual review + explicit consent version snapshot. Prepared readiness is 15-minute holdable internal evidence only, NEVER a send grant, message or delivered claim.';
