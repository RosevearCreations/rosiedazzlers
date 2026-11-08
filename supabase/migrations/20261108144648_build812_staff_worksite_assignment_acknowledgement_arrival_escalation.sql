-- Build 812: manual assignment, genuine staff acknowledgement, arrival-day escalation.
-- Customer sessions never see staff identities or internal notes; browser roles stay revoked.
alter table public.customer_worksite_issues_v811
  add column assigned_staff_user_id uuid references public.staff_users(id) on delete set null,
  add column assigned_at timestamptz,
  add column assigned_by_staff_user_id uuid references public.staff_users(id) on delete set null,
  add column staff_acknowledged_at timestamptz,
  add column staff_acknowledged_by_staff_user_id uuid references public.staff_users(id) on delete set null,
  add column arrival_escalation_status text not null default 'none'
    check (arrival_escalation_status in ('none','flagged','addressed')),
  add column arrival_escalated_at timestamptz,
  add column arrival_escalated_by_staff_user_id uuid references public.staff_users(id) on delete set null,
  add column workflow_revision integer not null default 0 check (workflow_revision >= 0);

create index if not exists build812_worksite_assignee_open
  on public.customer_worksite_issues_v811 (assigned_staff_user_id, submitted_at desc)
  where status in ('pending_review','reviewing');
create index if not exists build812_arrival_flag_queue
  on public.customer_worksite_issues_v811 (arrival_escalation_status, submitted_at desc)
  where status in ('pending_review','reviewing');

alter table public.customer_worksite_issues_v811 enable row level security;
revoke all on public.customer_worksite_issues_v811 from public, anon, authenticated;
grant select,insert,update on public.customer_worksite_issues_v811 to service_role;
comment on column public.customer_worksite_issues_v811.staff_acknowledged_at is
  'Actual authorized staff acknowledgement; not an outbound customer notification or readiness guarantee.';
comment on column public.customer_worksite_issues_v811.arrival_escalation_status is
  'Manual staff escalation record, not automatic dispatch, arrival promise or booking mutation.';
