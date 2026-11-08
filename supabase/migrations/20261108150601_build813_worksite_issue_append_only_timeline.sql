-- Build 813: server-recorded, append-only worksite issue change history.
-- Existing issues receive NO invented historical events; recording begins on activation.
alter table public.customer_worksite_issues_v811
  add column arrival_escalation_addressed_at timestamptz,
  add column arrival_escalation_addressed_by_staff_user_id uuid references public.staff_users(id) on delete set null;

create table public.customer_worksite_issue_events_v813 (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.customer_worksite_issues_v811(id) on delete restrict,
  issue_revision integer not null check (issue_revision > 0),
  event_kind text not null check (event_kind in (
    'assignment_changed','staff_acknowledged','arrival_escalation_changed',
    'review_status_changed','resolution_updated'
  )),
  recorded_at timestamptz not null default clock_timestamp(),
  actor_staff_user_id uuid references public.staff_users(id) on delete set null,
  previous_status text,
  current_status text,
  previous_assignee uuid,
  current_assignee uuid,
  previous_escalation text,
  current_escalation text,
  customer_resolution_snapshot text check (customer_resolution_snapshot is null or char_length(customer_resolution_snapshot) <= 1000),
  constraint build813_unique_change_kind unique(issue_id,issue_revision,event_kind)
);
create index build813_issue_event_history
  on public.customer_worksite_issue_events_v813 (issue_id,recorded_at desc,id desc);
alter table public.customer_worksite_issue_events_v813 enable row level security;
revoke all on public.customer_worksite_issue_events_v813 from public,anon,authenticated;
grant select,insert on public.customer_worksite_issue_events_v813 to service_role;

create schema if not exists worksite_internal;
revoke all on schema worksite_internal from public,anon,authenticated;
grant usage on schema worksite_internal to service_role;

create function worksite_internal.capture_worksite_issue_event_v813()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  -- Every business update made through the verified Build 811/812 handlers
  -- increments this version. Reject a change that cannot be ordered reliably.
  if new.workflow_revision <> old.workflow_revision + 1 then
    raise exception 'Worksite issue change requires the next workflow revision';
  end if;

  if new.assigned_staff_user_id is distinct from old.assigned_staff_user_id then
    insert into public.customer_worksite_issue_events_v813
      (issue_id,issue_revision,event_kind,actor_staff_user_id,previous_assignee,current_assignee)
    values (new.id,new.workflow_revision,'assignment_changed',new.assigned_by_staff_user_id,
      old.assigned_staff_user_id,new.assigned_staff_user_id);
  end if;

  if new.staff_acknowledged_at is distinct from old.staff_acknowledged_at then
    insert into public.customer_worksite_issue_events_v813
      (issue_id,issue_revision,event_kind,actor_staff_user_id)
    values (new.id,new.workflow_revision,'staff_acknowledged',new.staff_acknowledged_by_staff_user_id);
  end if;

  if new.arrival_escalation_status is distinct from old.arrival_escalation_status then
    insert into public.customer_worksite_issue_events_v813
      (issue_id,issue_revision,event_kind,actor_staff_user_id,previous_escalation,current_escalation)
    values (new.id,new.workflow_revision,'arrival_escalation_changed',
      case when new.arrival_escalation_status='addressed'
        then new.arrival_escalation_addressed_by_staff_user_id
        else new.arrival_escalated_by_staff_user_id end,
      old.arrival_escalation_status,new.arrival_escalation_status);
  end if;

  if new.status is distinct from old.status then
    insert into public.customer_worksite_issue_events_v813
      (issue_id,issue_revision,event_kind,actor_staff_user_id,previous_status,current_status,customer_resolution_snapshot)
    values (new.id,new.workflow_revision,'review_status_changed',new.reviewed_by_staff_user_id,
      old.status,new.status,new.customer_visible_resolution);
  elsif new.customer_visible_resolution is distinct from old.customer_visible_resolution then
    insert into public.customer_worksite_issue_events_v813
      (issue_id,issue_revision,event_kind,actor_staff_user_id,previous_status,current_status,customer_resolution_snapshot)
    values (new.id,new.workflow_revision,'resolution_updated',new.reviewed_by_staff_user_id,
      old.status,new.status,new.customer_visible_resolution);
  end if;
  return new;
end;
$$;
revoke all on function worksite_internal.capture_worksite_issue_event_v813() from public,anon,authenticated;
grant execute on function worksite_internal.capture_worksite_issue_event_v813() to service_role;

create trigger build813_worksite_issue_change_audit
after update of status,assigned_staff_user_id,staff_acknowledged_at,
  arrival_escalation_status,customer_visible_resolution
on public.customer_worksite_issues_v811
for each row execute function worksite_internal.capture_worksite_issue_event_v813();

comment on table public.customer_worksite_issue_events_v813 is
  'Build 813: append-only at the application role level; database-triggered staff transitions, no simulated backfill or direct browser access.';
