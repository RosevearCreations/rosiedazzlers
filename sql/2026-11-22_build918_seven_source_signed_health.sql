-- Rosie 918: original-source-only signed intake with atomic challenges and durable anti-replay.
-- This table does NOT certify AIDP receipt, seven-app CONNECTED or Windows host reboot.
create table if not exists public.rosie_sysop_challenges_v918(
 id uuid primary key default gen_random_uuid(),
 app_id text not null check(app_id in ('ai-data-platform','rosevear-ai-hub','rosevear-comms-hub','icamp','yw','devilndove','rosiedazzlers')),
 challenge text not null unique check(challenge ~ '^[a-f0-9]{64}$'),
 requested_by_staff_id uuid not null references public.staff_users(id),
 expires_at timestamptz not null,
 consumed_at timestamptz,
 created_at timestamptz not null default now(),
 check(expires_at>created_at)
);
create table if not exists public.rosie_sysop_receipts_v918(
 id uuid primary key default gen_random_uuid(),
 challenge_id uuid not null unique references public.rosie_sysop_challenges_v918(id),
 app_id text not null check(app_id in ('ai-data-platform','rosevear-ai-hub','rosevear-comms-hub','icamp','yw','devilndove','rosiedazzlers')),
 event_id text not null check(event_id ~ '^[A-Za-z0-9_-]{16,80}$'),
 nonce text not null check(nonce ~ '^[a-f0-9]{32}$'),
 source_commit text not null check(source_commit ~ '^[a-f0-9]{40}$'),
 source_state text not null check(source_state in ('HEALTHY','DEGRADED','UNHEALTHY','UNKNOWN')),
 event_kind text not null check(event_kind in ('HEARTBEAT','PROCESS_RESTART_OBSERVED','HOST_BOOT_OBSERVED','SCHEDULED_MAINTENANCE_OBSERVED','BACKUP_VERIFY_OBSERVED','INCIDENT_OBSERVED')),
 source_signed_at_ms bigint not null check(source_signed_at_ms>=0),
 observed_at_ms bigint not null check(observed_at_ms>=0),
 signature_sha256 text not null check(signature_sha256 ~ '^[a-f0-9]{64}$'),
 registered_by_staff_id uuid not null references public.staff_users(id),
 verification_state text not null default 'SIGNED_SOURCE_ONLY' check(verification_state='SIGNED_SOURCE_ONLY'),
 created_at timestamptz not null default now(),
 unique(app_id,event_id),unique(app_id,nonce)
);
create table if not exists public.rosie_sysop_host_witness_v918(
 id uuid primary key default gen_random_uuid(),
 receipt_id uuid not null unique references public.rosie_sysop_receipts_v918(id),
 witnessed_by_staff_id uuid not null references public.staff_users(id),
 evidence_sha256 text not null check(evidence_sha256 ~ '^[a-f0-9]{64}$'),
 witness_state text not null default 'SECOND_STAFF_REPORTED_UNVERIFIED' check(witness_state='SECOND_STAFF_REPORTED_UNVERIFIED'),
 created_at timestamptz not null default now()
);
create or replace function public.rosie_sysop_host_witness_guard_v918()
returns trigger language plpgsql security invoker set search_path=public as $$
declare r record;
begin
 select app_id,event_kind,registered_by_staff_id into r from public.rosie_sysop_receipts_v918 where id=new.receipt_id for share;
 if not found or r.app_id<>'rosevear-ai-hub' or r.event_kind<>'HOST_BOOT_OBSERVED' or
 r.registered_by_staff_id=new.witnessed_by_staff_id then
 raise exception 'INDEPENDENT_ORIGINAL_HOST_SOURCE_AND_DIFFERENT_STAFF_REQUIRED';
 end if;
 return new;
end;$$;
revoke all on function public.rosie_sysop_host_witness_guard_v918() from public,anon,authenticated;
grant execute on function public.rosie_sysop_host_witness_guard_v918() to service_role;
drop trigger if exists rosie_sysop_host_witness_guard_trigger_v918 on public.rosie_sysop_host_witness_v918;
create trigger rosie_sysop_host_witness_guard_trigger_v918 before insert on public.rosie_sysop_host_witness_v918
for each row execute function public.rosie_sysop_host_witness_guard_v918();
create or replace function public.rosie_sysop_admit_signed_v918(
 p_challenge_id uuid,p_app_id text,p_event_id text,p_nonce text,p_source_commit text,
 p_source_state text,p_event_kind text,p_source_signed_at_ms bigint,p_observed_at_ms bigint,
 p_signature_sha256 text,p_staff_id uuid)
returns uuid language plpgsql security invoker set search_path=public as $$
declare ch record; receipt_id uuid;
begin
 select * into ch from public.rosie_sysop_challenges_v918
  where id=p_challenge_id and requested_by_staff_id=p_staff_id and app_id=p_app_id for update;
 if not found or ch.consumed_at is not null or ch.expires_at<=clock_timestamp()
 or ch.expires_at>ch.created_at+interval '120 seconds' then
  raise exception 'ORIGINAL_CHALLENGE_CONSUMED_EXPIRED_OR_WRONG_ACTOR';
 end if;
 insert into public.rosie_sysop_receipts_v918(
 challenge_id,app_id,event_id,nonce,source_commit,source_state,event_kind,
 source_signed_at_ms,observed_at_ms,signature_sha256,registered_by_staff_id)
 values(p_challenge_id,p_app_id,p_event_id,p_nonce,p_source_commit,p_source_state,p_event_kind,
 p_source_signed_at_ms,p_observed_at_ms,p_signature_sha256,p_staff_id)
 returning id into receipt_id;
 update public.rosie_sysop_challenges_v918 set consumed_at=clock_timestamp() where id=p_challenge_id;
 return receipt_id;
end;$$;
revoke all on function public.rosie_sysop_admit_signed_v918(uuid,text,text,text,text,text,text,bigint,bigint,text,uuid) from public,anon,authenticated;
grant execute on function public.rosie_sysop_admit_signed_v918(uuid,text,text,text,text,text,text,bigint,bigint,text,uuid) to service_role;
do $$
declare t text;
begin
 foreach t in array array['rosie_sysop_challenges_v918','rosie_sysop_receipts_v918','rosie_sysop_host_witness_v918'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on table public.%I from public,anon,authenticated,service_role',t);
  if t='rosie_sysop_challenges_v918' then
   execute format('grant select,insert,update on public.%I to service_role',t);
  else
   execute format('grant select,insert on public.%I to service_role',t);
  end if;
 end loop;
end;$$;
