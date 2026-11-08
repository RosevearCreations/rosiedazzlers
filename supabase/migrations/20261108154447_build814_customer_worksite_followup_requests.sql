-- Build 814 hosted migration history version: 20261108154447.
-- Build 814: a worksite issue may have a series of customer-owned follow-up
-- conversations. One outstanding request at a time; no outbound notification.
-- Direct browser API table access remains revoked even for authenticated users.
create table public.customer_worksite_followups_v814 (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.customer_worksite_issues_v811(id) on delete restrict,
  customer_profile_id uuid not null references public.customer_profiles(id) on delete restrict,
  client_request_id uuid not null,
  request_kind text not null check (request_kind in ('clarification','new_information','still_unresolved','other')),
  request_text text not null check (char_length(request_text) between 12 and 1000),
  status text not null default 'awaiting_staff' check (status in ('awaiting_staff','staff_replied','confirmed','needs_more_help')),
  requested_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  workflow_revision integer not null default 0 check (workflow_revision >= 0),
  staff_response text check (staff_response is null or char_length(staff_response) between 12 and 1000),
  staff_responded_at timestamptz,
  staff_responded_by_staff_user_id uuid references public.staff_users(id) on delete set null,
  customer_feedback text check (customer_feedback is null or char_length(customer_feedback) <= 500),
  customer_decided_at timestamptz,
  constraint build814_unique_customer_request unique(customer_profile_id,client_request_id)
);
create unique index build814_one_outstanding_followup_per_issue
  on public.customer_worksite_followups_v814(issue_id)
  where status in ('awaiting_staff','staff_replied');
create index build814_customer_followup_history
  on public.customer_worksite_followups_v814(customer_profile_id,requested_at desc);
create index build814_staff_followup_queue
  on public.customer_worksite_followups_v814(status,requested_at desc);

create table public.customer_worksite_followup_events_v814 (
  id uuid primary key default gen_random_uuid(),
  followup_id uuid not null references public.customer_worksite_followups_v814(id) on delete restrict,
  followup_revision integer not null check (followup_revision >= 0),
  event_kind text not null check(event_kind in ('request_submitted','staff_responded','customer_confirmed','customer_needs_more_help')),
  recorded_at timestamptz not null default clock_timestamp(),
  actor_staff_user_id uuid references public.staff_users(id) on delete set null,
  previous_status text,
  current_status text not null,
  constraint build814_unique_followup_event unique(followup_id,followup_revision,event_kind)
);
create index build814_followup_audit_history
  on public.customer_worksite_followup_events_v814(followup_id,recorded_at desc);

alter table public.customer_worksite_followups_v814 enable row level security;
alter table public.customer_worksite_followup_events_v814 enable row level security;
revoke all on public.customer_worksite_followups_v814 from public,anon,authenticated,service_role;
revoke all on public.customer_worksite_followup_events_v814 from public,anon,authenticated,service_role;
grant select,insert,update on public.customer_worksite_followups_v814 to service_role;
grant select,insert on public.customer_worksite_followup_events_v814 to service_role;

-- Two database-side triggers ensure every state transition is ordered and
-- recorded atomically even if an HTTP response is interrupted.
create function worksite_internal.audit_followup_v814()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare owned uuid;
begin
  if tg_op = 'INSERT' then
    select customer_profile_id into owned from public.customer_worksite_issues_v811 where id=new.issue_id;
    if owned is distinct from new.customer_profile_id or
       new.status <> 'awaiting_staff' or new.workflow_revision <> 0 or
       new.staff_response is not null or new.staff_responded_at is not null or
       new.staff_responded_by_staff_user_id is not null or new.customer_decided_at is not null or
       new.customer_feedback is not null then
      raise exception 'Follow-up ownership or initial state is invalid';
    end if;
    insert into public.customer_worksite_followup_events_v814
      (followup_id,followup_revision,event_kind,current_status)
    values(new.id,0,'request_submitted',new.status);
    return new;
  end if;

  if new.id is distinct from old.id or new.issue_id is distinct from old.issue_id or
     new.customer_profile_id is distinct from old.customer_profile_id or
     new.client_request_id is distinct from old.client_request_id or
     new.request_kind is distinct from old.request_kind or
     new.request_text is distinct from old.request_text or
     new.requested_at is distinct from old.requested_at or
     new.workflow_revision <> old.workflow_revision+1 then
    raise exception 'Follow-up source is immutable and revision must advance';
  end if;

  if old.status='awaiting_staff' and new.status='staff_replied' then
    if new.staff_response is null or char_length(new.staff_response)<12 or
       new.staff_responded_at is null or new.staff_responded_by_staff_user_id is null or
       new.customer_decided_at is not null or new.customer_feedback is not null then
      raise exception 'Staff response needs a genuine staff decision';
    end if;
    insert into public.customer_worksite_followup_events_v814
      (followup_id,followup_revision,event_kind,actor_staff_user_id,previous_status,current_status)
    values(new.id,new.workflow_revision,'staff_responded',new.staff_responded_by_staff_user_id,old.status,new.status);
  elsif old.status='staff_replied' and new.status in ('confirmed','needs_more_help') then
    if new.staff_response is distinct from old.staff_response or
       new.staff_responded_at is distinct from old.staff_responded_at or
       new.staff_responded_by_staff_user_id is distinct from old.staff_responded_by_staff_user_id or
       new.customer_decided_at is null or
       (new.status='needs_more_help' and (new.customer_feedback is null or char_length(new.customer_feedback)<12)) then
      raise exception 'Customer confirmation needs an existing unchanged staff response';
    end if;
    insert into public.customer_worksite_followup_events_v814
      (followup_id,followup_revision,event_kind,previous_status,current_status)
    values(new.id,new.workflow_revision,case when new.status='confirmed'
      then 'customer_confirmed' else 'customer_needs_more_help' end,old.status,new.status);
  else
    raise exception 'Invalid follow-up transition';
  end if;
  return new;
end;
$$;
revoke all on function worksite_internal.audit_followup_v814() from public,anon,authenticated;
grant execute on function worksite_internal.audit_followup_v814() to service_role;
create trigger build814_record_followup_creation
  after insert on public.customer_worksite_followups_v814
  for each row execute function worksite_internal.audit_followup_v814();
create trigger build814_record_followup_transition
  after update on public.customer_worksite_followups_v814
  for each row execute function worksite_internal.audit_followup_v814();

create function worksite_internal.reject_followup_event_changes_v814()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  raise exception 'Recorded worksite follow-up events cannot be changed or deleted';
end;
$$;
revoke all on function worksite_internal.reject_followup_event_changes_v814() from public,anon,authenticated;
grant execute on function worksite_internal.reject_followup_event_changes_v814() to service_role;
create trigger build814_followup_events_immutable
  before update or delete on public.customer_worksite_followup_events_v814
  for each row execute function worksite_internal.reject_followup_event_changes_v814();

comment on table public.customer_worksite_followups_v814 is
  'Build 814: private customer requests and verified staff responses; no automatic outreach, refunds or booking mutation.';
