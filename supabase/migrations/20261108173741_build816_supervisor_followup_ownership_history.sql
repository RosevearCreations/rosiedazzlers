-- Build 816: manual, private supervisor follow-up ownership; due dates are
-- internal review targets, not customer response promises or automatic SLAs.
create table public.customer_worksite_followup_ownership_v816 (
  id uuid primary key default gen_random_uuid(),
  followup_id uuid not null unique references public.customer_worksite_followups_v814(id) on delete restrict,
  owner_staff_user_id uuid not null references public.staff_users(id) on delete restrict,
  assigned_by_staff_user_id uuid not null references public.staff_users(id) on delete restrict,
  assigned_at timestamptz not null default clock_timestamp(),
  review_due_at timestamptz,
  private_note text not null check (char_length(private_note) between 12 and 600),
  updated_at timestamptz not null default clock_timestamp(),
  workflow_revision integer not null default 0 check (workflow_revision between 0 and 2147483646)
);
create index build816_owner_queue on public.customer_worksite_followup_ownership_v816(owner_staff_user_id,review_due_at,assigned_at desc);

create table public.customer_worksite_followup_ownership_events_v816 (
  id uuid primary key default gen_random_uuid(),
  ownership_id uuid not null references public.customer_worksite_followup_ownership_v816(id) on delete restrict,
  ownership_revision integer not null check (ownership_revision >= 0),
  event_kind text not null check (event_kind in ('owner_assigned','owner_reassigned','review_target_updated')),
  recorded_at timestamptz not null default clock_timestamp(),
  actor_staff_user_id uuid not null references public.staff_users(id) on delete restrict,
  previous_owner_staff_user_id uuid references public.staff_users(id) on delete restrict,
  current_owner_staff_user_id uuid not null references public.staff_users(id) on delete restrict,
  review_due_at timestamptz,
  constraint build816_unique_ownership_event unique(ownership_id,ownership_revision,event_kind)
);
create index build816_ownership_audit on public.customer_worksite_followup_ownership_events_v816(ownership_id,recorded_at desc);

alter table public.customer_worksite_followup_ownership_v816 enable row level security;
alter table public.customer_worksite_followup_ownership_events_v816 enable row level security;
revoke all on public.customer_worksite_followup_ownership_v816 from public,anon,authenticated,service_role;
revoke all on public.customer_worksite_followup_ownership_events_v816 from public,anon,authenticated,service_role;
grant select,insert,update on public.customer_worksite_followup_ownership_v816 to service_role;
grant select,insert on public.customer_worksite_followup_ownership_events_v816 to service_role;

create function worksite_internal.audit_followup_ownership_v816()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare followup_state text;
begin
  select status into followup_state from public.customer_worksite_followups_v814 where id=new.followup_id;
  if followup_state is distinct from 'awaiting_staff' then
    raise exception 'Only an unanswered follow-up can receive a new supervisor ownership decision';
  end if;
  if tg_op = 'INSERT' then
    if new.workflow_revision <> 0 or new.updated_at < new.assigned_at then
      raise exception 'Invalid initial ownership revision';
    end if;
    insert into public.customer_worksite_followup_ownership_events_v816
      (ownership_id,ownership_revision,event_kind,actor_staff_user_id,current_owner_staff_user_id,review_due_at)
    values(new.id,0,'owner_assigned',new.assigned_by_staff_user_id,new.owner_staff_user_id,new.review_due_at);
    return new;
  end if;
  if new.id is distinct from old.id or new.followup_id is distinct from old.followup_id or
     new.workflow_revision <> old.workflow_revision+1 or new.updated_at < old.updated_at or
     (new.owner_staff_user_id is not distinct from old.owner_staff_user_id and
       new.review_due_at is not distinct from old.review_due_at and
       new.private_note is not distinct from old.private_note) then
    raise exception 'Ownership identity immutable; an actual change and next revision are required';
  end if;
  insert into public.customer_worksite_followup_ownership_events_v816
    (ownership_id,ownership_revision,event_kind,actor_staff_user_id,previous_owner_staff_user_id,current_owner_staff_user_id,review_due_at)
  values(new.id,new.workflow_revision,
    case when new.owner_staff_user_id is distinct from old.owner_staff_user_id then 'owner_reassigned' else 'review_target_updated' end,
    new.assigned_by_staff_user_id,old.owner_staff_user_id,new.owner_staff_user_id,new.review_due_at);
  return new;
end;
$$;
revoke all on function worksite_internal.audit_followup_ownership_v816() from public,anon,authenticated;
grant execute on function worksite_internal.audit_followup_ownership_v816() to service_role;
create trigger build816_ownership_created after insert on public.customer_worksite_followup_ownership_v816
  for each row execute function worksite_internal.audit_followup_ownership_v816();
create trigger build816_ownership_updated after update on public.customer_worksite_followup_ownership_v816
  for each row execute function worksite_internal.audit_followup_ownership_v816();

create function worksite_internal.reject_followup_ownership_event_changes_v816()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  raise exception 'Verified supervisor ownership events are append-only';
end;
$$;
revoke all on function worksite_internal.reject_followup_ownership_event_changes_v816() from public,anon,authenticated;
grant execute on function worksite_internal.reject_followup_ownership_event_changes_v816() to service_role;
create trigger build816_ownership_events_immutable before update or delete on public.customer_worksite_followup_ownership_events_v816
  for each row execute function worksite_internal.reject_followup_ownership_event_changes_v816();

comment on table public.customer_worksite_followup_ownership_v816 is
  'Manual operational ownership and optional private review target, never a customer promise or automated message.';
