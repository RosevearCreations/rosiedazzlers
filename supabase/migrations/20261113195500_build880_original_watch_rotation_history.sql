-- Rosie 880 — append-only server-side original native watch and supervised issuer readback.
-- Private service role only. Source verification happens in owner-authenticated Functions before RPC.
create table if not exists public.rosie_roadside_native_watch_v880 (
 id uuid primary key,
 draft_id uuid not null references public.rosie_detailing_intake_v868(id) on delete restrict,
 owner_actor text not null check (length(owner_actor) between 3 and 140),
 delivery_state text not null check (delivery_state in ('ORIGINAL_DELIVERY_CURRENT_SNAPSHOT','ORIGINAL_DELIVERY_AGED_REVIEW')),
 source_chain_sha256 text not null check (source_chain_sha256 ~ '^[a-f0-9]{64}$'),
 latest_signed_event_at timestamptz not null,
 owner_sla_state text not null check (owner_sla_state in ('OWNER_SLA_RENEWAL_REQUIRED','CURRENT_SOURCE_ACKNOWLEDGED')),
 source_check_id uuid not null,
 previous_entry_sha256 text check (previous_entry_sha256 ~ '^[a-f0-9]{64}$'),
 entry_sha256 text not null unique check (entry_sha256 ~ '^[a-f0-9]{64}$'),
 observed_at timestamptz not null default clock_timestamp()
);
create index if not exists rosie880_native_watch_draft_time on public.rosie_roadside_native_watch_v880(draft_id,observed_at desc,id desc);

create table if not exists public.rosie_roadside_rotation_receipts_v880 (
 id uuid primary key,
 draft_id uuid not null references public.rosie_detailing_intake_v868(id) on delete restrict,
 owner_actor text not null check (length(owner_actor) between 3 and 140),
 original_artifact_sha256 text not null check (original_artifact_sha256 ~ '^[a-f0-9]{64}$'),
 previous_issuer_key_id text not null check (previous_issuer_key_id ~ '^ed25519-sha256:[A-Za-z0-9_-]{43}$'),
 active_issuer_key_id text not null check (active_issuer_key_id ~ '^ed25519-sha256:[A-Za-z0-9_-]{43}$'),
 owner_note_sha256 text not null check (owner_note_sha256 ~ '^[a-f0-9]{64}$'),
 grace_issued_before timestamptz not null,
 grace_verify_until timestamptz not null,
 previous_receipt_sha256 text check (previous_receipt_sha256 ~ '^[a-f0-9]{64}$'),
 receipt_sha256 text not null unique check (receipt_sha256 ~ '^[a-f0-9]{64}$'),
 observed_at timestamptz not null default clock_timestamp(),
 unique(draft_id,previous_issuer_key_id,active_issuer_key_id,original_artifact_sha256),
 check(previous_issuer_key_id<>active_issuer_key_id),
 check(grace_verify_until>grace_issued_before)
);
create index if not exists rosie880_rotation_draft_time on public.rosie_roadside_rotation_receipts_v880(draft_id,observed_at desc,id desc);
create index if not exists rosie880_rotation_expiry on public.rosie_roadside_rotation_receipts_v880(grace_verify_until);

alter table public.rosie_roadside_native_watch_v880 enable row level security;
alter table public.rosie_roadside_rotation_receipts_v880 enable row level security;
revoke all on public.rosie_roadside_native_watch_v880 from public,anon,authenticated;
revoke all on public.rosie_roadside_rotation_receipts_v880 from public,anon,authenticated;
revoke all on public.rosie_roadside_native_watch_v880 from service_role;
revoke all on public.rosie_roadside_rotation_receipts_v880 from service_role;
grant select,insert on public.rosie_roadside_native_watch_v880 to service_role;
grant select,insert on public.rosie_roadside_rotation_receipts_v880 to service_role;
-- True append-only even under elevated application credentials: no UPDATE or DELETE.
create or replace function public.rosie880_reject_history_mutation()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
 raise exception 'Rosie 880 original custody is append-only';
end $$;
revoke all on function public.rosie880_reject_history_mutation() from public,anon,authenticated;
drop trigger if exists rosie880_no_native_edit on public.rosie_roadside_native_watch_v880;
create trigger rosie880_no_native_edit before update or delete on public.rosie_roadside_native_watch_v880
 for each row execute function public.rosie880_reject_history_mutation();
drop trigger if exists rosie880_no_rotation_edit on public.rosie_roadside_rotation_receipts_v880;
create trigger rosie880_no_rotation_edit before update or delete on public.rosie_roadside_rotation_receipts_v880
 for each row execute function public.rosie880_reject_history_mutation();

create or replace function public.rosie880_append_native_watch(
 p_id uuid,p_draft_id uuid,p_actor text,p_delivery_state text,
 p_source_chain_sha256 text,p_latest_signed_event_at timestamptz,
 p_sla_state text,p_source_check_id uuid
) returns table(outcome text,record_id uuid,record_sha256 text,recorded_at timestamptz)
language plpgsql security invoker set search_path='' as $$
declare prior text; t timestamptz:=clock_timestamp(); digest_value text;
begin
 if p_id is null or p_draft_id is null or p_source_check_id is null
  or coalesce(length(trim(p_actor)),0) not between 3 and 140
  or p_delivery_state not in ('ORIGINAL_DELIVERY_CURRENT_SNAPSHOT','ORIGINAL_DELIVERY_AGED_REVIEW')
  or p_sla_state not in ('OWNER_SLA_RENEWAL_REQUIRED','CURRENT_SOURCE_ACKNOWLEDGED')
  or p_source_chain_sha256 !~ '^[a-f0-9]{64}$'
  or p_latest_signed_event_at is null or p_latest_signed_event_at>t+interval '5 minutes'
  or not exists(select 1 from public.rosie_detailing_intake_v868 where id=p_draft_id)
  then raise exception 'Original native source and owner state must be independently verified'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('rosie880watch:'||p_draft_id::text,0));
 select x.entry_sha256 into prior from public.rosie_roadside_native_watch_v880 x
 where x.draft_id=p_draft_id order by x.observed_at desc,x.id desc limit 1;
 digest_value:=pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
  pg_catalog.concat_ws('|','rosie880watch',p_id::text,p_draft_id::text,trim(p_actor),
   p_delivery_state,p_source_chain_sha256,p_latest_signed_event_at::text,p_sla_state,
   p_source_check_id::text,coalesce(prior,''),t::text),'UTF8')),'hex');
 insert into public.rosie_roadside_native_watch_v880
 (id,draft_id,owner_actor,delivery_state,source_chain_sha256,latest_signed_event_at,
  owner_sla_state,source_check_id,previous_entry_sha256,entry_sha256,observed_at)
 values(p_id,p_draft_id,trim(p_actor),p_delivery_state,p_source_chain_sha256,
 p_latest_signed_event_at,p_sla_state,p_source_check_id,prior,digest_value,t);
 return query select 'ORIGINAL_NATIVE_WATCH_APPENDED'::text,p_id,digest_value,t;
end $$;
revoke all on function public.rosie880_append_native_watch(uuid,uuid,text,text,text,timestamptz,text,uuid)
 from public,anon,authenticated;
grant execute on function public.rosie880_append_native_watch(uuid,uuid,text,text,text,timestamptz,text,uuid)
 to service_role;

create or replace function public.rosie880_append_rotation_receipt(
 p_id uuid,p_draft_id uuid,p_actor text,p_original_artifact_sha256 text,
 p_previous_issuer_key_id text,p_active_issuer_key_id text,
 p_owner_note text,p_grace_issued_before timestamptz,p_grace_verify_until timestamptz
) returns table(outcome text,record_id uuid,record_sha256 text,recorded_at timestamptz)
language plpgsql security invoker set search_path='' as $$
declare prior text; t timestamptz:=clock_timestamp(); digest_value text; existing record; note_hash text;
begin
 if p_id is null or p_draft_id is null
  or coalesce(length(trim(p_actor)),0) not between 3 and 140
  or coalesce(length(trim(p_owner_note)),0) not between 12 and 500
  or p_original_artifact_sha256 !~ '^[a-f0-9]{64}$'
  or p_previous_issuer_key_id !~ '^ed25519-sha256:[A-Za-z0-9_-]{43}$'
  or p_active_issuer_key_id !~ '^ed25519-sha256:[A-Za-z0-9_-]{43}$'
  or p_previous_issuer_key_id=p_active_issuer_key_id
  or p_grace_issued_before is null or p_grace_verify_until is null
  or p_grace_issued_before>=p_grace_verify_until or p_grace_verify_until<=t
  or not exists(select 1 from public.rosie_detailing_intake_v868 where id=p_draft_id)
  then raise exception 'Original supervised operator pin evidence invalid'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('rosie880rotation:'||p_draft_id::text,0));
 select x.id,x.receipt_sha256,x.observed_at into existing from public.rosie_roadside_rotation_receipts_v880 x
 where x.draft_id=p_draft_id and x.previous_issuer_key_id=p_previous_issuer_key_id
 and x.active_issuer_key_id=p_active_issuer_key_id and x.original_artifact_sha256=p_original_artifact_sha256
 limit 1;
 if existing.id is not null then
  return query select 'EXISTING_VERIFIED_ROTATION_READBACK'::text,existing.id::uuid,
   existing.receipt_sha256::text,existing.observed_at::timestamptz;
  return;
 end if;
 select x.receipt_sha256 into prior from public.rosie_roadside_rotation_receipts_v880 x
 where x.draft_id=p_draft_id order by x.observed_at desc,x.id desc limit 1;
 note_hash:=pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(trim(p_owner_note),'UTF8')),'hex');
 digest_value:=pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
  pg_catalog.concat_ws('|','rosie880rotation',p_id::text,p_draft_id::text,trim(p_actor),
   p_original_artifact_sha256,p_previous_issuer_key_id,p_active_issuer_key_id,
   note_hash,p_grace_issued_before::text,p_grace_verify_until::text,coalesce(prior,''),t::text),'UTF8')),'hex');
 insert into public.rosie_roadside_rotation_receipts_v880
 (id,draft_id,owner_actor,original_artifact_sha256,previous_issuer_key_id,
  active_issuer_key_id,owner_note_sha256,grace_issued_before,grace_verify_until,
  previous_receipt_sha256,receipt_sha256,observed_at)
 values(p_id,p_draft_id,trim(p_actor),p_original_artifact_sha256,p_previous_issuer_key_id,
  p_active_issuer_key_id,note_hash,p_grace_issued_before,p_grace_verify_until,
  prior,digest_value,t);
 return query select 'SUPERVISED_ROTATION_READBACK_APPENDED'::text,p_id,digest_value,t;
end $$;
revoke all on function public.rosie880_append_rotation_receipt(uuid,uuid,text,text,text,text,text,timestamptz,timestamptz)
 from public,anon,authenticated;
grant execute on function public.rosie880_append_rotation_receipt(uuid,uuid,text,text,text,text,text,timestamptz,timestamptz)
 to service_role;