-- Build 873: independently evidenced roadside pilot closure; no provider or payment writes.
create table if not exists public.rosie_roadside_pilot_closures_v873 (
 id uuid primary key,
 draft_id uuid not null unique references public.rosie_detailing_intake_v868(id) on delete restrict,
 dispatch_id uuid not null references public.rosie_roadside_dispatches_v872(id),
 device_challenge_id uuid not null references public.rosie_roadside_device_challenges_v872(id),
 net_check_id uuid not null references public.rosie_roadside_net_deposit_checks_v871(id),
 owner_actor text not null check(length(owner_actor) between 3 and 140),
 owner_note text not null check(length(owner_note) between 12 and 500),
 closed_at timestamptz not null default clock_timestamp(),
 outcome text not null default 'original_roadside_pilot_closed' check(outcome='original_roadside_pilot_closed')
);
alter table public.rosie_roadside_pilot_closures_v873 enable row level security;
revoke all on public.rosie_roadside_pilot_closures_v873 from public,anon,authenticated;
grant select,insert on public.rosie_roadside_pilot_closures_v873 to service_role;

create or replace function public.rosie873_close_roadside_pilot(
 p_id uuid,p_draft_id uuid,p_dispatch_id uuid,p_device_challenge_id uuid,
 p_net_check_id uuid,p_owner_actor text,p_owner_note text)
returns table(outcome text)
language plpgsql security invoker set search_path='' as $$
declare d record;s record;c record;n record;t timestamptz:=clock_timestamp();
begin
 select * into d from public.rosie_detailing_intake_v868 where id=p_draft_id for update;
 if d.id is null or d.linked_booking_id is null or d.quote_share_withdrawn_at is not null
  or d.private_capture_withdrawn_at is not null or d.private_photo_permission is distinct from true
  or d.contact_permission is distinct from true then
  raise exception 'Original active consent and canonical booking required';end if;
 select * into s from public.rosie_roadside_dispatches_v872 where id=p_dispatch_id and draft_id=p_draft_id;
 if s.id is null or s.state<>'delivery_confirmed' or s.receipt_at is null
  or not exists(select 1 from public.rosie_roadside_provider_receipts_v872 r
   where r.dispatch_id=s.id and r.effective_state='delivery_confirmed' and r.signature_verified=true)
  or not exists(select 1 from public.rosie_roadside_quote_shares_v870 q
   where q.id=s.share_id and q.revoked_at is null and q.expires_at>t) then
  raise exception 'Independent original provider delivery receipt required';end if;
 select * into c from public.rosie_roadside_device_challenges_v872
 where id=p_device_challenge_id and draft_id=p_draft_id;
 if c.id is null or c.state<>'owner_accepted' or c.owner_accepted_at is null then
  raise exception 'Original witnessed field-device acceptance required';end if;
 select * into n from public.rosie_roadside_net_deposit_checks_v871
 where id=p_net_check_id and draft_id=p_draft_id and booking_id=d.linked_booking_id;
 if n.id is null or n.id is distinct from (
    select id from public.rosie_roadside_net_deposit_checks_v871
    where draft_id=p_draft_id and booking_id=d.linked_booking_id
    order by checked_at desc,id desc limit 1)
  or n.checked_at<t-interval '15 minutes' or n.checked_at>t
  or n.net_verified is distinct from true
  or n.source not in ('stripe_live','paypal_live')
  or n.state not in ('net_deposit_intact','partial_refund_verified','full_refund_verified')
  or n.gross_cents is null or n.refunded_cents is null or n.net_cents is null
  or n.gross_cents<1 or n.refunded_cents<0 or n.net_cents<0
  or n.gross_cents<>n.refunded_cents+n.net_cents then
  raise exception 'Fresh exact original provider refund source confirmation required';end if;
 if exists(select 1 from public.rosie_roadside_refund_cases_v872
   where draft_id=p_draft_id and booking_id=d.linked_booking_id
   and state in ('open','reviewed_hold')) then
  raise exception 'Original refund exception remains open';end if;
 if coalesce(length(trim(p_owner_actor)),0) not between 3 and 140 or
  coalesce(length(trim(p_owner_note)),0) not between 12 and 500 then
  raise exception 'Authenticated owner explanation required';end if;
 insert into public.rosie_roadside_pilot_closures_v873
 (id,draft_id,dispatch_id,device_challenge_id,net_check_id,owner_actor,owner_note)
 values(p_id,p_draft_id,p_dispatch_id,p_device_challenge_id,p_net_check_id,p_owner_actor,trim(p_owner_note));
 return query select 'ORIGINAL_PILOT_CLOSED'::text;
end $$;
revoke all on function public.rosie873_close_roadside_pilot(uuid,uuid,uuid,uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.rosie873_close_roadside_pilot(uuid,uuid,uuid,uuid,uuid,text,text) to service_role;
