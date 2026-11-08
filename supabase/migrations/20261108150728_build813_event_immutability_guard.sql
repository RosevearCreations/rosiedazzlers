-- Build 813 hardening: inherited service-role grants must not allow DML edits
-- to recorded history. A BEFORE trigger additionally blocks UPDATE and DELETE.
revoke all on public.customer_worksite_issue_events_v813 from service_role;
grant select,insert on public.customer_worksite_issue_events_v813 to service_role;

create function worksite_internal.deny_worksite_event_rewrite_v813()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  raise exception 'Recorded worksite issue events cannot be changed or deleted'
    using errcode = '42501';
end;
$$;
revoke all on function worksite_internal.deny_worksite_event_rewrite_v813() from public,anon,authenticated;
grant execute on function worksite_internal.deny_worksite_event_rewrite_v813() to service_role;

create trigger build813_event_immutable_dml_guard
before update or delete on public.customer_worksite_issue_events_v813
for each row execute function worksite_internal.deny_worksite_event_rewrite_v813();
