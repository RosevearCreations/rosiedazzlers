-- Supplementary Build 675 enforcement: Supabase may supply default service-role
-- table grants. Remove inherited write privileges and enforce append-only even
-- if a future permission change accidentally restores UPDATE/DELETE.
revoke all on public.gift_issuance_recovery_decisions from service_role;
grant select, insert on public.gift_issuance_recovery_decisions to service_role;

create or replace function public.reject_gift_issuance_recovery_decision_mutation()
returns trigger language plpgsql security invoker set search_path = ''
as $$
begin
  raise exception 'Gift issuance recovery decisions are append-only';
  return null;
end;
$$;
revoke all on function public.reject_gift_issuance_recovery_decision_mutation() from public, anon, authenticated;
drop trigger if exists gift_issuance_recovery_decisions_append_only on public.gift_issuance_recovery_decisions;
create trigger gift_issuance_recovery_decisions_append_only
  before update or delete on public.gift_issuance_recovery_decisions
  for each row execute function public.reject_gift_issuance_recovery_decision_mutation();
