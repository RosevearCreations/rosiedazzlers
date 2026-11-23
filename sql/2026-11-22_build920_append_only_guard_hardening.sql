-- Build920 append-only guard hardening: original evidence tables are SELECT/INSERT only.
-- Avoid FOR UPDATE / FOR SHARE permission requirements; serialize same-ceremony reports
-- by transaction-scoped advisory lock, with no table UPDATE or DELETE grants.
create or replace function public.rosie_sysop_readback_guard_v920()
returns trigger language plpgsql security invoker set search_path=public as $$
declare a record;
begin
 select source_receipt_id,receiver_id into a from public.rosie_sysop_receiver_acks_v919
 where id=new.ack_review_id;
 if a.source_receipt_id is null or a.source_receipt_id<>new.source_receipt_id or a.receiver_id<>new.receiver_id then
  raise exception 'ORIGINAL_RECEIVER_LEDGER_ACK_CORRELATION_REQUIRED';
 end if;
 return new;
end;$$;
revoke all on function public.rosie_sysop_readback_guard_v920() from public,anon,authenticated;
grant execute on function public.rosie_sysop_readback_guard_v920() to service_role;
create or replace function public.rosie_sysop_owner_guard_v920()
returns trigger language plpgsql security invoker set search_path=public as $$
declare c record;h record;prior record;
begin
 perform pg_advisory_xact_lock(920,hashtext(new.ceremony_id::text));
 select id,host_id,created_at,expires_at into c
 from public.rosie_sysop_preflight_v920 where id=new.ceremony_id;
 select id,host_id,boot_time_ms into h
 from public.rosie_sysop_host_recovery_v919 where id=new.host_review_id;
 if c.id is null or h.id is null or c.host_id<>h.host_id
 or h.boot_time_ms<=floor(extract(epoch from c.created_at)*1000)::bigint
 or h.boot_time_ms>=floor(extract(epoch from c.expires_at)*1000)::bigint then
  raise exception 'ORIGINAL_PREFLIGHT_MUST_PRECEDE_SIGNED_WINDOWS_BOOT';
 end if;
 select host_review_id into prior from public.rosie_sysop_owner_reports_v920
 where ceremony_id=c.id limit 1;
 if prior.host_review_id is not null and prior.host_review_id<>new.host_review_id then
  raise exception 'TWO_OWNER_REPORTS_MUST_BIND_SAME_ORIGINAL_BOOT';
 end if;
 return new;
end;$$;
revoke all on function public.rosie_sysop_owner_guard_v920() from public,anon,authenticated;
grant execute on function public.rosie_sysop_owner_guard_v920() to service_role;
