-- Rosie 860 — source-bound, immutable independent external intake observations
-- and owner daily continuity exception reviews; HOLD-only, never CONNECTED.
create table public.rosie_external_intake_custody_v860(
 id uuid primary key default gen_random_uuid(),
 project_id uuid not null references public.creative_projects(id) on delete restrict,
 booking_id uuid not null references public.bookings(id) on delete restrict,
 post_id uuid not null references public.social_post_queue(id) on delete restrict,
 transaction_review_id uuid not null references public.rosie_master_transaction_review_v855(id) on delete restrict,
 handoff_858_id uuid not null references public.rosie_recovery_custody_v858(id) on delete restrict,
 owner_decision_859_id uuid not null references public.rosie_incident_continuity_v859(id) on delete restrict,
 checkpoint_859_id uuid references public.rosie_incident_continuity_v859(id) on delete restrict,
 return_859_id uuid references public.rosie_incident_continuity_v859(id) on delete restrict,
 kind text not null check(kind in ('signed_external_intake_correlation','owner_continuity_exception_review')),
 plane text check(plane in ('ai-data-platform','rosevear-comms-hub')),
 source_revision text not null check(source_revision ~ '^[a-f0-9]{40}$'),
 receipt_sha256 text check(receipt_sha256 is null or receipt_sha256 ~ '^[a-f0-9]{64}$'),
 signer_id text check(signer_id is null or signer_id ~ '^[A-Za-z0-9][A-Za-z0-9_-]{5,95}$'),
 observed_at timestamptz,
 review_digest_sha256 text not null check(review_digest_sha256 ~ '^[a-f0-9]{64}$'),
 review_nonce text not null unique check(review_nonce ~ '^[A-Za-z0-9_-]{20,100}$'),
 exception_codes text[] not null default '{}'::text[],
 owner_action text check(owner_action in
  ('maintain_external_hold','request_new_independent_receipts','escalate_incident_continuity')),
 previous_exception_id uuid references public.rosie_external_intake_custody_v860(id) on delete restrict,
 previous_exception_sha256 text check(previous_exception_sha256 is null or previous_exception_sha256 ~ '^[a-f0-9]{64}$'),
 open_conflict_count integer not null check(open_conflict_count between 1 and 80),
 conflict_aging_status text not null check(conflict_aging_status in
  ('OPEN_WITHIN_TARGET','OPEN_ESCALATION_DUE')),
 review_day date,
 actor_staff_email text not null check(char_length(actor_staff_email) between 3 and 140),
 recorded_at timestamptz not null default clock_timestamp(),
 constraint rosie860_kind_shape check(
  (kind='signed_external_intake_correlation' and plane is not null and
   checkpoint_859_id is not null and return_859_id is not null and
   receipt_sha256 is not null and signer_id is not null and observed_at is not null and
   cardinality(exception_codes)=0 and owner_action is null and
   previous_exception_id is null and previous_exception_sha256 is null and review_day is null)
  or (kind='owner_continuity_exception_review' and plane is null and return_859_id is null and
   receipt_sha256 is null and signer_id is null and observed_at is null and
   cardinality(exception_codes) between 1 and 6 and owner_action is not null and
   review_day is not null)),
 constraint rosie860_previous_pair check(
  (previous_exception_id is null and previous_exception_sha256 is null) or
  (previous_exception_id is not null and previous_exception_sha256 is not null))
);
create unique index rosie860_return_observation_hash
 on public.rosie_external_intake_custody_v860(return_859_id,receipt_sha256)
 where kind='signed_external_intake_correlation';
create unique index rosie860_daily_owner_exception
 on public.rosie_external_intake_custody_v860(transaction_review_id,review_day)
 where kind='owner_continuity_exception_review';
create index rosie860_source_timeline on public.rosie_external_intake_custody_v860
 (project_id,recorded_at desc);
create index rosie860_transaction_custody on public.rosie_external_intake_custody_v860
 (transaction_review_id,kind,recorded_at desc);
create index rosie860_plane_freshness on public.rosie_external_intake_custody_v860
 (transaction_review_id,plane,source_revision,recorded_at desc);
alter table public.rosie_external_intake_custody_v860 enable row level security;
revoke all on public.rosie_external_intake_custody_v860 from public,anon,authenticated,service_role;
grant select,insert on public.rosie_external_intake_custody_v860 to service_role;

create function public.rosie860_no_rewrite()
 returns trigger language plpgsql security invoker set search_path='' as $$
begin raise exception 'Build 860 original incident evidence is immutable' using errcode='42501'; end $$;
revoke all on function public.rosie860_no_rewrite() from public,anon,authenticated;
create trigger rosie860_immutable before update or delete on public.rosie_external_intake_custody_v860
 for each row execute function public.rosie860_no_rewrite();

create function public.rosie860_append_intake_exception(
 p_project_id uuid,p_booking_id uuid,p_post_id uuid,p_transaction_review_id uuid,
 p_handoff_858_id uuid,p_owner_decision_859_id uuid,p_checkpoint_859_id uuid,
 p_return_859_id uuid,p_kind text,p_plane text,p_source_revision text,
 p_receipt_sha256 text,p_signer_id text,p_observed_at timestamptz,
 p_review_digest_sha256 text,p_review_nonce text,p_exception_codes text[],
 p_owner_action text,p_previous_exception_id uuid,p_previous_exception_sha256 text,
 p_open_conflict_count integer,p_conflict_aging_status text,p_actor_staff_email text)
 returns table(outcome text,review_id uuid,accepted_at timestamptz)
 language plpgsql security invoker set search_path='' as $$
declare inserted uuid; stamped timestamptz; actual_conflicts integer;
 tip_id uuid;tip_sha text; latest_checkpoint uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_transaction_review_id::text,860));
 if not exists(select 1 from public.rosie_master_transaction_review_v855 t
  where t.id=p_transaction_review_id and t.project_id=p_project_id
   and t.booking_id=p_booking_id and t.post_id=p_post_id)
 or not exists(select 1 from public.creative_projects p
  where p.id=p_project_id and p.source_booking_id=p_booking_id
   and (p.consent_status<>'approved_public' or p.public_publish_allowed is distinct from true))
 or not exists(select 1 from public.social_post_queue q
  where q.id=p_post_id and q.booking_id=p_booking_id)
 or not exists(select 1 from public.rosie_recovery_custody_v858 h
  where h.id=p_handoff_858_id and h.kind='conflict_escalation_handoff'
   and h.transaction_review_id=p_transaction_review_id and h.project_id=p_project_id
   and h.booking_id=p_booking_id and h.post_id=p_post_id)
 or not exists(select 1 from public.rosie_incident_continuity_v859 d
  where d.id=p_owner_decision_859_id and d.kind='owner_recovery_decision'
   and d.transaction_review_id=p_transaction_review_id and d.project_id=p_project_id
   and d.booking_id=p_booking_id and d.post_id=p_post_id
   and d.handoff_858_id=p_handoff_858_id)
 then raise exception 'Exact original 855, 858, 859 owner lineage and revoked consent required'; end if;

 select count(*)::integer into actual_conflicts
 from public.rosie_delivery_conflict_evidence_v856 c
 where c.transaction_review_id=p_transaction_review_id and c.kind='replay_conflict_review';
 if actual_conflicts<>p_open_conflict_count or actual_conflicts=0 or actual_conflicts>80
 then raise exception 'Still-open original source conflict count changed; HOLD'; end if;
 if p_source_revision !~ '^[a-f0-9]{40}$' then
  raise exception 'Exact source revision required'; end if;
 select c.id into latest_checkpoint from public.rosie_incident_continuity_v859 c
  where c.transaction_review_id=p_transaction_review_id and
   c.kind='incident_continuity_checkpoint'
  order by c.recorded_at desc,c.id desc limit 1;
 if latest_checkpoint is distinct from p_checkpoint_859_id then
  raise exception 'Immutable original 859 checkpoint tip changed; HOLD'; end if;
 if p_checkpoint_859_id is not null and not exists (
  select 1 from public.rosie_incident_continuity_v859 c
  where c.id=p_checkpoint_859_id and c.transaction_review_id=p_transaction_review_id
   and c.kind='incident_continuity_checkpoint'
   and c.owner_decision_859_id=p_owner_decision_859_id)
 then raise exception 'Original owner checkpoint lineage invalid'; end if;

 if p_kind='signed_external_intake_correlation' then
  if p_plane not in ('ai-data-platform','rosevear-comms-hub') or
   p_checkpoint_859_id is null or p_return_859_id is null or
   p_receipt_sha256 !~ '^[a-f0-9]{64}$' or
   p_signer_id !~ '^[A-Za-z0-9][A-Za-z0-9_-]{5,95}$' or
   p_observed_at is null or p_observed_at < clock_timestamp()-interval '5 minutes' or
   p_observed_at > clock_timestamp()+interval '5 minutes' or
   p_owner_action is not null or cardinality(p_exception_codes)<>0 or
   p_previous_exception_id is not null or not exists(
     select 1 from public.rosie_incident_continuity_v859 r
     where r.id=p_return_859_id and r.kind='signed_escalation_return'
      and r.transaction_review_id=p_transaction_review_id
      and r.handoff_858_id=p_handoff_858_id and r.plane=p_plane)
  then raise exception 'Independent cryptographic intake observation and return custody required'; end if;
 elsif p_kind='owner_continuity_exception_review' then
  if p_plane is not null or p_return_859_id is not null or
   p_receipt_sha256 is not null or p_signer_id is not null or
   p_observed_at is not null or p_owner_action not in
    ('maintain_external_hold','request_new_independent_receipts','escalate_incident_continuity')
   or not ('UNRESOLVED_ORIGINAL_CONFLICT'=any(p_exception_codes))
   or p_exception_codes is null or cardinality(p_exception_codes)>6 or
   exists(select 1 from unnest(p_exception_codes) as code
    where code not in('MISSING_INDEPENDENT_INTAKE','STALE_INTAKE_CORRELATION',
     'STALE_OR_MISSING_859_RETURN','MISSING_CONTINUITY_CHECKPOINT',
     'CONTINUITY_GAP_OVER_48H','UNRESOLVED_ORIGINAL_CONFLICT'))
  then raise exception 'Owner exception must retain bounded non-authorizing conflict HOLD'; end if;
  select e.id,e.review_digest_sha256 into tip_id,tip_sha
   from public.rosie_external_intake_custody_v860 e
   where e.transaction_review_id=p_transaction_review_id and
    e.kind='owner_continuity_exception_review'
   order by e.recorded_at desc,e.id desc limit 1;
  if tip_id is distinct from p_previous_exception_id or
   tip_sha is distinct from p_previous_exception_sha256
  then raise exception 'Owner exception predecessor changed; recheck source tip'; end if;
 else raise exception 'Unsupported private intake/exception kind'; end if;

 insert into public.rosie_external_intake_custody_v860(
  project_id,booking_id,post_id,transaction_review_id,handoff_858_id,owner_decision_859_id,
  checkpoint_859_id,return_859_id,kind,plane,source_revision,receipt_sha256,
  signer_id,observed_at,review_digest_sha256,review_nonce,exception_codes,
  owner_action,previous_exception_id,previous_exception_sha256,
  open_conflict_count,conflict_aging_status,review_day,actor_staff_email)
 values(p_project_id,p_booking_id,p_post_id,p_transaction_review_id,p_handoff_858_id,
  p_owner_decision_859_id,p_checkpoint_859_id,p_return_859_id,p_kind,p_plane,p_source_revision,
  p_receipt_sha256,p_signer_id,p_observed_at,p_review_digest_sha256,p_review_nonce,
  p_exception_codes,p_owner_action,p_previous_exception_id,p_previous_exception_sha256,
  p_open_conflict_count,p_conflict_aging_status,
  case when p_kind='owner_continuity_exception_review'
   then (clock_timestamp() at time zone 'UTC')::date else null end,p_actor_staff_email)
 on conflict do nothing returning id,recorded_at into inserted,stamped;
 if inserted is null then return query select 'REPLAY_OR_CONFLICT'::text,null::uuid,null::timestamptz;
 else return query select 'INSERTED'::text,inserted,stamped; end if;
end $$;
revoke all on function public.rosie860_append_intake_exception(
 uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,text,text,text,text,text,timestamptz,
 text,text,text[],text,uuid,text,integer,text,text)
 from public,anon,authenticated;
grant execute on function public.rosie860_append_intake_exception(
 uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,text,text,text,text,text,timestamptz,
 text,text,text[],text,uuid,text,integer,text,text) to service_role;
comment on table public.rosie_external_intake_custody_v860 is
 'Immutable, original-owner private independent signed intake observation and exception review. Never source of external runtime connected, operational ACK or incident resolution.';
