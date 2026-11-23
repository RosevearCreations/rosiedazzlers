-- Rosie 921: original HTTPS receiver-native read witness and original Windows signed loopback observations.
-- Immutable, private original evidence. No auto-CONNECTED, physical acceptance, reboot or financial side effects.
create table if not exists public.rosie_sysop_native_api_witness_v921(
 id uuid primary key default gen_random_uuid(),
 ledger_review_id uuid not null references public.rosie_sysop_receiver_readbacks_v920(id),
 receiver_id text not null check(receiver_id in ('ai-data-platform','rosevear-comms-hub')),
 ledger_entry_id uuid not null,
 challenge_nonce text not null unique check(challenge_nonce ~ '^[a-f0-9]{64}$'),
 api_observed_at_ms bigint not null check(api_observed_at_ms>0),
 api_signer_commit text not null check(api_signer_commit ~ '^[a-f0-9]{40}$'),
 api_signer_fingerprint_sha256 text not null check(api_signer_fingerprint_sha256 ~ '^[a-f0-9]{64}$'),
 signature_sha256 text not null unique check(signature_sha256 ~ '^[a-f0-9]{64}$'),
 reviewed_by_staff_id uuid not null references public.staff_users(id),
 review_state text not null default 'ORIGINAL_NATIVE_API_GET_SIGNATURE_VERIFIED'
 check(review_state='ORIGINAL_NATIVE_API_GET_SIGNATURE_VERIFIED'),
 created_at timestamptz not null default now(),
 unique(ledger_review_id,api_observed_at_ms)
);
create table if not exists public.rosie_sysop_windows_health_v921(
 id uuid primary key default gen_random_uuid(),
 host_review_id uuid not null references public.rosie_sysop_host_recovery_v919(id),
 ceremony_id uuid not null references public.rosie_sysop_preflight_v920(id),
 host_id text not null check(host_id ~ '^[A-Za-z0-9_-]{6,100}$'),
 boot_id text not null check(boot_id ~ '^[a-f0-9]{32}$'),
 sample_id uuid not null unique,
 sample_seq integer not null check(sample_seq between 1 and 10000),
 sampled_at_ms bigint not null check(sampled_at_ms>0),
 os_uptime_sec bigint not null check(os_uptime_sec>=0),
 sampler_commit text not null check(sampler_commit ~ '^[a-f0-9]{40}$'),
 sampler_fingerprint_sha256 text not null check(sampler_fingerprint_sha256 ~ '^[a-f0-9]{64}$'),
 hub_api_port text not null check(hub_api_port in ('LISTENING','NO_LISTENER','UNKNOWN')),
 caddy_port text not null check(caddy_port in ('LISTENING','NO_LISTENER','UNKNOWN')),
 mqtt_port text not null check(mqtt_port in ('LISTENING','NO_LISTENER','UNKNOWN')),
 ollama_port text not null check(ollama_port in ('LISTENING','NO_LISTENER','UNKNOWN')),
 signature_sha256 text not null unique check(signature_sha256 ~ '^[a-f0-9]{64}$'),
 recorded_by_staff_id uuid not null references public.staff_users(id),
 created_at timestamptz not null default now(),
 unique(host_review_id,sample_seq),unique(host_review_id,sampled_at_ms)
);
create index if not exists rosie_sysop_native_api_v921_recent on public.rosie_sysop_native_api_witness_v921(receiver_id,created_at desc);
create index if not exists rosie_sysop_windows_health_v921_recent on public.rosie_sysop_windows_health_v921(host_review_id,sample_seq desc);
create or replace function public.rosie_sysop_native_api_guard_v921()
returns trigger language plpgsql security invoker set search_path=public as $$
declare r record;
begin
 select id,receiver_id,ledger_entry_id into r
 from public.rosie_sysop_receiver_readbacks_v920 where id=new.ledger_review_id;
 if r.id is null or r.receiver_id<>new.receiver_id or r.ledger_entry_id<>new.ledger_entry_id then
  raise exception 'ORIGINAL_NATIVE_API_LEDGER_CORRELATION_REQUIRED';
 end if;
 return new;
end;$$;
revoke all on function public.rosie_sysop_native_api_guard_v921() from public,anon,authenticated;
grant execute on function public.rosie_sysop_native_api_guard_v921() to service_role;
drop trigger if exists rosie_sysop_native_api_guard_t_v921 on public.rosie_sysop_native_api_witness_v921;
create trigger rosie_sysop_native_api_guard_t_v921 before insert on public.rosie_sysop_native_api_witness_v921
for each row execute function public.rosie_sysop_native_api_guard_v921();
create or replace function public.rosie_sysop_windows_health_guard_v921()
returns trigger language plpgsql security invoker set search_path=public as $$
declare h record;c record;prior record;
begin
 perform pg_advisory_xact_lock(921,hashtext(new.host_review_id::text));
 select id,host_id,boot_id,boot_time_ms into h
 from public.rosie_sysop_host_recovery_v919 where id=new.host_review_id;
 select id,host_id,created_at,expires_at into c
 from public.rosie_sysop_preflight_v920 where id=new.ceremony_id;
 if h.id is null or c.id is null or h.host_id<>new.host_id or c.host_id<>new.host_id
 or h.boot_id<>new.boot_id or h.boot_time_ms>=new.sampled_at_ms
 or h.boot_time_ms<=floor(extract(epoch from c.created_at)*1000)::bigint
 or h.boot_time_ms>=floor(extract(epoch from c.expires_at)*1000)::bigint then
  raise exception 'ORIGINAL_WINDOWS_POST_PREFLIGHT_BOOT_CORRELATION_REQUIRED';
 end if;
 select sample_seq,sampled_at_ms,os_uptime_sec,sampler_fingerprint_sha256 into prior
 from public.rosie_sysop_windows_health_v921 where host_review_id=new.host_review_id
 order by sample_seq desc limit 1;
 if prior.sample_seq is null then
  if new.sample_seq<>1 then raise exception 'ORIGINAL_WINDOWS_SAMPLE_SEQUENCE_START_REQUIRED';end if;
 else
  if new.sample_seq<>prior.sample_seq+1
   or new.sampled_at_ms-prior.sampled_at_ms<30000
   or new.os_uptime_sec<=prior.os_uptime_sec
   or new.sampler_fingerprint_sha256<>prior.sampler_fingerprint_sha256 then
   raise exception 'ORIGINAL_WINDOWS_MONOTONIC_SAMPLING_REQUIRED';
  end if;
 end if;
 return new;
end;$$;
revoke all on function public.rosie_sysop_windows_health_guard_v921() from public,anon,authenticated;
grant execute on function public.rosie_sysop_windows_health_guard_v921() to service_role;
drop trigger if exists rosie_sysop_windows_health_guard_t_v921 on public.rosie_sysop_windows_health_v921;
create trigger rosie_sysop_windows_health_guard_t_v921 before insert on public.rosie_sysop_windows_health_v921
for each row execute function public.rosie_sysop_windows_health_guard_v921();
do $$
declare t text;
begin
 foreach t in array array['rosie_sysop_native_api_witness_v921','rosie_sysop_windows_health_v921'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from public,anon,authenticated,service_role',t);
  execute format('grant select,insert on public.%I to service_role',t);
 end loop;
end;$$;
