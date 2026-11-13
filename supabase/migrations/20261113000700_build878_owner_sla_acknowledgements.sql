-- Rosie Dazzlers 878: immutable original-owner refund SLA acknowledgement custody.
-- Private RLS, no customer/payment writes, no acknowledgement backdating.
create table if not exists public.rosie_roadside_sla_acks_v878 (
 id uuid primary key,
 case_id uuid not null references public.rosie_roadside_refund_cases_v872(id) on delete restrict,
 draft_id uuid not null references public.rosie_detailing_intake_v868(id) on delete restrict,
 booking_id uuid not null references public.bookings(id) on delete restrict,
 source_check_id uuid not null references public.rosie_roadside_net_deposit_checks_v871(id) on delete restrict,
 original_case_opened_at timestamptz not null,
 severity text not null check (severity in ('CRITICAL','HIGH','REVIEW')),
 owner_actor text not null check (length(owner_actor) between 3 and 140),
 owner_note text not null check (length(trim(owner_note)) between 12 and 500),
 acknowledged_at timestamptz not null default clock_timestamp(),
 unique (case_id,source_check_id,severity)
);
create index if not exists rosie878_ack_draft_case_time on public.rosie_roadside_sla_acks_v878
 (draft_id,case_id,acknowledged_at desc);
alter table public.rosie_roadside_sla_acks_v878 enable row level security;
revoke all on public.rosie_roadside_sla_acks_v878 from public,anon,authenticated;
grant select,insert on public.rosie_roadside_sla_acks_v878 to service_role;

-- Must be called by an original signed-in Admin through a service-role Worker.
-- Acknowledgement never resolves a case, extends its deadline or clears a refund.
create or replace function public.rosie878_ack_owner_sla (
 p_id uuid,p_case_id uuid,p_draft_id uuid,p_booking_id uuid,
 p_source_check_id uuid,p_severity text,p_actor text,p_note text
) returns table(outcome text,ack_id uuid,ack_at timestamptz)
language plpgsql security invoker set search_path='' as $$
declare c record; latest record; existing record; t timestamptz:=clock_timestamp();
begin
 if p_severity not in ('CRITICAL','HIGH','REVIEW')
  or coalesce(length(trim(p_actor)),0) not between 3 and 140
  or coalesce(length(trim(p_note)),0) not between 12 and 500 then
  raise exception 'Original owner, supported severity and explanation required';
 end if;
 select * into c from public.rosie_roadside_refund_cases_v872
  where id=p_case_id for update;
 if c.id is null or c.draft_id is distinct from p_draft_id
  or c.booking_id is distinct from p_booking_id
  or c.state not in ('open','reviewed_hold')
  or c.opened_at>t or p_id is null then
   raise exception 'Exact original unresolved refund case required';
 end if;
 select id,draft_id,booking_id into latest
  from public.rosie_roadside_net_deposit_checks_v871
  where booking_id=c.booking_id and draft_id=c.draft_id
  order by checked_at desc,id desc limit 1;
 if latest.id is null or latest.id is distinct from p_source_check_id
  or latest.draft_id is distinct from p_draft_id
  or latest.booking_id is distinct from p_booking_id then
   raise exception 'Exact latest original payment-provider check required';
 end if;
 insert into public.rosie_roadside_sla_acks_v878
  (id,case_id,draft_id,booking_id,source_check_id,original_case_opened_at,
   severity,owner_actor,owner_note)
 values(p_id,c.id,c.draft_id,c.booking_id,latest.id,c.opened_at,
        p_severity,trim(p_actor),trim(p_note))
 on conflict (case_id,source_check_id,severity) do nothing;
 select a.id,a.acknowledged_at into existing
  from public.rosie_roadside_sla_acks_v878 a
  where a.case_id=c.id and a.source_check_id=latest.id
    and a.severity=p_severity limit 1;
 if existing.id is null then raise exception 'Original owner SLA acknowledgement not stored'; end if;
 return query select 'ORIGINAL_OWNER_SLA_ACK_PERSISTED'::text,
  existing.id::uuid,existing.acknowledged_at::timestamptz;
end $$;
revoke all on function public.rosie878_ack_owner_sla(uuid,uuid,uuid,uuid,uuid,text,text,text)
 from public,anon,authenticated;
grant execute on function public.rosie878_ack_owner_sla(uuid,uuid,uuid,uuid,uuid,text,text,text)
 to service_role;
