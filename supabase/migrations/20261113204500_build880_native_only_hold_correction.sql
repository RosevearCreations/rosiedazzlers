-- Rosie 880: retain original native delivery evidence even when financial SLA has no open case.
-- Such observations are explicitly HOLD, never a fabricated source acknowledgment.
alter table public.rosie_roadside_native_watch_v880 alter column source_check_id drop not null;
alter table public.rosie_roadside_native_watch_v880
 drop constraint if exists rosie_roadside_native_watch_v880_owner_sla_state_check;
alter table public.rosie_roadside_native_watch_v880
 add constraint rosie880_watch_sla_state_check
 check(owner_sla_state in ('OWNER_SLA_RENEWAL_REQUIRED','CURRENT_SOURCE_ACKNOWLEDGED','OWNER_SLA_RENEWAL_HOLD'));
alter table public.rosie_roadside_native_watch_v880
 add constraint rosie880_watch_sla_source_consistency
 check((owner_sla_state='OWNER_SLA_RENEWAL_HOLD' and source_check_id is null)
    or (owner_sla_state<>'OWNER_SLA_RENEWAL_HOLD' and source_check_id is not null));
create or replace function public.rosie880_append_native_watch(
 p_id uuid,p_draft_id uuid,p_actor text,p_delivery_state text,
 p_source_chain_sha256 text,p_latest_signed_event_at timestamptz,
 p_sla_state text,p_source_check_id uuid
) returns table(outcome text,record_id uuid,record_sha256 text,recorded_at timestamptz)
language plpgsql security invoker set search_path='' as $$
declare prior text; t timestamptz:=clock_timestamp(); digest_value text;
begin
 if p_id is null or p_draft_id is null
  or coalesce(length(trim(p_actor)),0) not between 3 and 140
  or p_delivery_state not in ('ORIGINAL_DELIVERY_CURRENT_SNAPSHOT','ORIGINAL_DELIVERY_AGED_REVIEW')
  or p_sla_state not in ('OWNER_SLA_RENEWAL_REQUIRED','CURRENT_SOURCE_ACKNOWLEDGED','OWNER_SLA_RENEWAL_HOLD')
  or (p_sla_state='OWNER_SLA_RENEWAL_HOLD' and p_source_check_id is not null)
  or (p_sla_state<>'OWNER_SLA_RENEWAL_HOLD' and p_source_check_id is null)
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
grant execute on function public.rosie880_append_native_watch(uuid,uuid,text,text,text,timestamptz,text,uuid) to service_role;
