-- Rosie Dazzlers Build 856: immutable local custody of external witness HOLD reviews
-- and operator replay-conflict triage. No remote transport or final closure.
create table public.rosie_delivery_conflict_evidence_v856 (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.creative_projects(id) on delete restrict,
  booking_id uuid not null references public.bookings(id) on delete restrict,
  post_id uuid not null references public.social_post_queue(id) on delete restrict,
  transaction_review_id uuid not null references public.rosie_master_transaction_review_v855(id) on delete restrict,
  case_reference text not null check(case_reference ~ '^[A-Za-z0-9][A-Za-z0-9_-]{5,79}$'),
  incident_reference text not null check(incident_reference ~ '^[A-Za-z0-9][A-Za-z0-9_-]{5,79}$'),
  transaction_reference text not null check(transaction_reference ~ '^[A-Za-z0-9][A-Za-z0-9_-]{11,95}$'),
  kind text not null check(kind in ('signed_delivery_hold_witness','replay_conflict_review')),
  plane text not null check(plane in ('ai-data-platform','rosevear-comms-hub')),
  evidence_nonce text not null unique check(evidence_nonce ~ '^[A-Za-z0-9_-]{20,100}$'),
  evidence_sha256 text not null check(evidence_sha256 ~ '^[0-9a-f]{64}$'),
  prior_855_sha256 text not null check(prior_855_sha256 ~ '^[0-9a-f]{64}$'),
  source_revision text not null check(source_revision ~ '^[0-9a-f]{40}$'),
  delivery_receipt_reference text check(delivery_receipt_reference is null or delivery_receipt_reference ~ '^[A-Za-z0-9][A-Za-z0-9_-]{11,95}$'),
  witness_observed_at timestamptz,
  conflict_reference text check(conflict_reference is null or conflict_reference ~ '^[A-Za-z0-9][A-Za-z0-9_-]{11,95}$'),
  conflict_kind text check(conflict_kind is null or conflict_kind in ('duplicate_transaction_replay','mismatched_master_receipt','missing_delivery_ack','stale_delivery_witness')),
  recovery_action text check(recovery_action is null or recovery_action in ('quarantine_for_owner_review','request_independent_receiver_recheck','maintain_external_hold')),
  actor_staff_email text not null check(char_length(actor_staff_email) between 3 and 140),
  recorded_at timestamptz not null default clock_timestamp(),
  constraint rosie856_kind_payload check(
    (kind='signed_delivery_hold_witness' and delivery_receipt_reference is not null and witness_observed_at is not null
      and conflict_reference is null and conflict_kind is null and recovery_action is null)
    or (kind='replay_conflict_review' and delivery_receipt_reference is null and witness_observed_at is null
      and conflict_reference is not null and conflict_kind is not null and recovery_action is not null)
  )
);
create unique index rosie856_once_per_plane_delivery_witness
  on public.rosie_delivery_conflict_evidence_v856(transaction_review_id,plane)
  where kind='signed_delivery_hold_witness';
create unique index rosie856_unique_conflict_case
  on public.rosie_delivery_conflict_evidence_v856(project_id,incident_reference,conflict_reference)
  where kind='replay_conflict_review';
create index rosie856_owner_history
  on public.rosie_delivery_conflict_evidence_v856(project_id,recorded_at desc);
alter table public.rosie_delivery_conflict_evidence_v856 enable row level security;
revoke all on public.rosie_delivery_conflict_evidence_v856 from public,anon,authenticated,service_role;
grant select,insert on public.rosie_delivery_conflict_evidence_v856 to service_role;

create function public.rosie856_deny_evidence_rewrite()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
  raise exception 'Rosie 856 signed witness and conflict custody is append-only' using errcode='42501';
end;$$;
revoke all on function public.rosie856_deny_evidence_rewrite() from public,anon,authenticated;
create trigger rosie856_immutable_evidence
  before update or delete on public.rosie_delivery_conflict_evidence_v856
  for each row execute function public.rosie856_deny_evidence_rewrite();

create function public.rosie856_append_evidence(
  p_project_id uuid,p_booking_id uuid,p_post_id uuid,p_transaction_review_id uuid,
  p_case_reference text,p_incident_reference text,p_transaction_reference text,
  p_kind text,p_plane text,p_evidence_nonce text,p_evidence_sha256 text,
  p_source_revision text,p_prior_855_sha256 text,
  p_delivery_receipt_reference text,p_witness_observed_at timestamptz,
  p_conflict_reference text,p_conflict_kind text,p_recovery_action text,
  p_actor_staff_email text
) returns table(outcome text,evidence_id uuid,accepted_at timestamptz)
language plpgsql security invoker set search_path='' as $$
declare inserted uuid; stamped timestamptz;
begin
  if not exists(select 1 from public.creative_projects p
      where p.id=p_project_id and p.source_booking_id=p_booking_id)
    or not exists(select 1 from public.social_post_queue s
      where s.id=p_post_id and s.booking_id=p_booking_id)
    or not exists(select 1 from public.rosie_master_transaction_review_v855 t
      where t.id=p_transaction_review_id and t.project_id=p_project_id
      and t.booking_id=p_booking_id and t.post_id=p_post_id
      and t.case_reference=p_case_reference and t.incident_reference=p_incident_reference
      and t.transaction_reference=p_transaction_reference
      and (case when p_plane='ai-data-platform' then t.ai_data_sha256 else t.comms_sha256 end)=p_prior_855_sha256)
  then raise exception 'Original source and signed two-plane 855 lineage required'; end if;

  if p_source_revision !~ '^[0-9a-f]{40}$'
    or p_evidence_sha256 !~ '^[0-9a-f]{64}$'
    or p_evidence_nonce !~ '^[A-Za-z0-9_-]{20,100}$'
    or p_actor_staff_email is null or char_length(p_actor_staff_email) not between 3 and 140
  then raise exception 'Malformed source-bound evidence'; end if;
  insert into public.rosie_delivery_conflict_evidence_v856
    (project_id,booking_id,post_id,transaction_review_id,case_reference,
     incident_reference,transaction_reference,kind,plane,evidence_nonce,
     evidence_sha256,prior_855_sha256,source_revision,
     delivery_receipt_reference,witness_observed_at,
     conflict_reference,conflict_kind,recovery_action,actor_staff_email)
  values
    (p_project_id,p_booking_id,p_post_id,p_transaction_review_id,p_case_reference,
     p_incident_reference,p_transaction_reference,p_kind,p_plane,p_evidence_nonce,
     p_evidence_sha256,p_prior_855_sha256,p_source_revision,
     p_delivery_receipt_reference,p_witness_observed_at,
     p_conflict_reference,p_conflict_kind,p_recovery_action,p_actor_staff_email)
  on conflict do nothing returning id,recorded_at into inserted,stamped;
  if inserted is null then
    return query select 'REPLAY_OR_CONFLICT'::text,null::uuid,null::timestamptz;
  else
    return query select 'INSERTED'::text,inserted,stamped;
  end if;
end;$$;
revoke all on function public.rosie856_append_evidence(
 uuid,uuid,uuid,uuid,text,text,text,text,text,text,text,text,text,text,timestamptz,text,text,text,text)
 from public,anon,authenticated;
grant execute on function public.rosie856_append_evidence(
 uuid,uuid,uuid,uuid,text,text,text,text,text,text,text,text,text,text,timestamptz,text,text,text,text)
 to service_role;
comment on table public.rosie_delivery_conflict_evidence_v856 is
 'Original-owner-only local signed delivery HOLD witness and replay conflict custody; does not prove remote delivery or authorize operational incident closure.';
