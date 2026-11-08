-- Build 815 hosted migration history version: 20261108165832.
-- Build 815: supervisor follow-up escalations remain private, manually managed,
-- and separate from the immutable Build 814 customer-response state machine.
-- Aging bands are advisory UI calculations, not a contracted response SLA.
create table public.customer_worksite_followup_escalations_v815 (
  id uuid primary key default gen_random_uuid(),
  followup_id uuid not null unique references public.customer_worksite_followups_v814(id) on delete restrict,
  reason text not null check (char_length(reason) between 12 and 600),
  status text not null default 'flagged' check (status in ('flagged','acknowledged','cleared')),
  flagged_at timestamptz not null default clock_timestamp(),
  flagged_by_staff_user_id uuid not null references public.staff_users(id) on delete restrict,
  acknowledged_at timestamptz,
  acknowledged_by_staff_user_id uuid references public.staff_users(id) on delete restrict,
  cleared_at timestamptz,
  cleared_by_staff_user_id uuid references public.staff_users(id) on delete restrict,
  updated_at timestamptz not null default clock_timestamp(),
  workflow_revision integer not null default 0 check (workflow_revision between 0 and 2147483646)
);
create index build815_escalation_queue on public.customer_worksite_followup_escalations_v815(status,flagged_at desc);

create table public.customer_worksite_followup_escalation_events_v815 (
  id uuid primary key default gen_random_uuid(),
  escalation_id uuid not null references public.customer_worksite_followup_escalations_v815(id) on delete restrict,
  escalation_revision integer not null check (escalation_revision >= 0),
  event_kind text not null check (event_kind in ('supervisor_flagged','supervisor_acknowledged','supervisor_cleared')),
  recorded_at timestamptz not null default clock_timestamp(),
  actor_staff_user_id uuid not null references public.staff_users(id) on delete restrict,
  previous_status text,
  current_status text not null,
  constraint build815_unique_escalation_event unique(escalation_id,escalation_revision,event_kind)
);
create index build815_escalation_audit on public.customer_worksite_followup_escalation_events_v815(escalation_id,recorded_at desc);

alter table public.customer_worksite_followup_escalations_v815 enable row level security;
alter table public.customer_worksite_followup_escalation_events_v815 enable row level security;
revoke all on public.customer_worksite_followup_escalations_v815 from public,anon,authenticated,service_role;
revoke all on public.customer_worksite_followup_escalation_events_v815 from public,anon,authenticated,service_role;
grant select,insert,update on public.customer_worksite_followup_escalations_v815 to service_role;
grant select,insert on public.customer_worksite_followup_escalation_events_v815 to service_role;

create function worksite_internal.audit_followup_escalation_v815()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare response_status text;
begin
  if tg_op = 'INSERT' then
    select status into response_status from public.customer_worksite_followups_v814 where id=new.followup_id;
    if response_status is distinct from 'awaiting_staff' or new.status <> 'flagged' or
       new.workflow_revision <> 0 or new.acknowledged_at is not null or
       new.acknowledged_by_staff_user_id is not null or new.cleared_at is not null or
       new.cleared_by_staff_user_id is not null then
      raise exception 'Escalation requires a genuine unanswered follow-up and original supervisor flag';
    end if;
    insert into public.customer_worksite_followup_escalation_events_v815
      (escalation_id,escalation_revision,event_kind,actor_staff_user_id,current_status)
    values(new.id,0,'supervisor_flagged',new.flagged_by_staff_user_id,new.status);
    return new;
  end if;
  if new.id is distinct from old.id or new.followup_id is distinct from old.followup_id or
     new.reason is distinct from old.reason or new.flagged_at is distinct from old.flagged_at or
     new.flagged_by_staff_user_id is distinct from old.flagged_by_staff_user_id or
     new.workflow_revision <> old.workflow_revision+1 or new.updated_at < old.updated_at then
    raise exception 'Escalation identity is immutable and revision must advance';
  end if;
  if old.status='flagged' and new.status='acknowledged' then
    if new.acknowledged_at is null or new.acknowledged_by_staff_user_id is null or
       new.cleared_at is not null or new.cleared_by_staff_user_id is not null then
      raise exception 'Supervisor acknowledgement requires actor and date';
    end if;
    insert into public.customer_worksite_followup_escalation_events_v815
      (escalation_id,escalation_revision,event_kind,actor_staff_user_id,previous_status,current_status)
    values(new.id,new.workflow_revision,'supervisor_acknowledged',new.acknowledged_by_staff_user_id,old.status,new.status);
  elsif old.status='acknowledged' and new.status='cleared' then
    if new.acknowledged_at is distinct from old.acknowledged_at or
       new.acknowledged_by_staff_user_id is distinct from old.acknowledged_by_staff_user_id or
       new.cleared_at is null or new.cleared_by_staff_user_id is null then
      raise exception 'Supervisor clearance must preserve the original acknowledgement';
    end if;
    insert into public.customer_worksite_followup_escalation_events_v815
      (escalation_id,escalation_revision,event_kind,actor_staff_user_id,previous_status,current_status)
    values(new.id,new.workflow_revision,'supervisor_cleared',new.cleared_by_staff_user_id,old.status,new.status);
  else
    raise exception 'Escalation transition is not permitted';
  end if;
  return new;
end;
$$;
revoke all on function worksite_internal.audit_followup_escalation_v815() from public,anon,authenticated;
grant execute on function worksite_internal.audit_followup_escalation_v815() to service_role;
create trigger build815_escalation_created
  after insert on public.customer_worksite_followup_escalations_v815
  for each row execute function worksite_internal.audit_followup_escalation_v815();
create trigger build815_escalation_transition
  after update on public.customer_worksite_followup_escalations_v815
  for each row execute function worksite_internal.audit_followup_escalation_v815();

create function worksite_internal.reject_escalation_event_changes_v815()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  raise exception 'Verified escalation history cannot be modified or removed';
end;
$$;
revoke all on function worksite_internal.reject_escalation_event_changes_v815() from public,anon,authenticated;
grant execute on function worksite_internal.reject_escalation_event_changes_v815() to service_role;
create trigger build815_escalation_history_immutable
  before update or delete on public.customer_worksite_followup_escalation_events_v815
  for each row execute function worksite_internal.reject_escalation_event_changes_v815();

comment on table public.customer_worksite_followup_escalations_v815 is
  'Private, manually flagged escalation state. Never sends notifications or changes appointments or payments.';
