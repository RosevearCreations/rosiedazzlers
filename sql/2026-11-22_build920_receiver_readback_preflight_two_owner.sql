-- Rosie 920 original evidence: signed receiver readbacks, pre-reboot ceremony, two separate owner reports.
-- All outcomes are reviews. No remote reboot, receiver writes or auto-CONNECTED transition.
create table if not exists public.rosie_sysop_receiver_readbacks_v920(
 id uuid primary key default gen_random_uuid(),
 ack_review_id uuid not null unique references public.rosie_sysop_receiver_acks_v919(id),
 source_receipt_id uuid not null references public.rosie_sysop_receipts_v918(id),
 receiver_id text not null check(receiver_id in ('ai-data-platform','rosevear-comms-hub')),
 ledger_entry_id uuid not null,
 ledger_entry_sha256 text not null check(ledger_entry_sha256 ~ '^[a-f0-9]{64}$'),
 ledger_head_sha256 text not null check(ledger_head_sha256 ~ '^[a-f0-9]{64}$'),
 ledger_observed_at_ms bigint not null check(ledger_observed_at_ms>0),
 signature_sha256 text not null check(signature_sha256 ~ '^[a-f0-9]{64}$'),
 ledger_signer_fingerprint_sha256 text not null check(ledger_signer_fingerprint_sha256 ~ '^[a-f0-9]{64}$'),
 reviewed_by_staff_id uuid not null references public.staff_users(id),
 review_state text not null default 'SIGNED_INDEPENDENT_LEDGER_READBACK_REVIEW'
 check(review_state='SIGNED_INDEPENDENT_LEDGER_READBACK_REVIEW'),
 created_at timestamptz not null default now(),
 unique(receiver_id,ledger_entry_id),unique(receiver_id,ledger_entry_sha256)
);
create table if not exists public.rosie_sysop_preflight_v920(
 id uuid primary key default gen_random_uuid(),
 host_id text not null check(host_id ~ '^[A-Za-z0-9_-]{6,100}$'),
 preflight_nonce text not null unique check(preflight_nonce ~ '^[a-f0-9]{64}$'),
 opened_by_staff_id uuid not null references public.staff_users(id),
 expires_at timestamptz not null,
 created_at timestamptz not null default now(),
 check(expires_at>created_at and expires_at<=created_at+interval '60 minutes')
);
create table if not exists public.rosie_sysop_owner_reports_v920(
 id uuid primary key default gen_random_uuid(),
 ceremony_id uuid not null references public.rosie_sysop_preflight_v920(id),
 host_review_id uuid not null references public.rosie_sysop_host_recovery_v919(id),
 owner_staff_id uuid not null references public.staff_users(id),
 owner_role text not null check(owner_role in ('PRIMARY_OWNER','SECOND_OWNER')),
 owner_signer_commit text not null check(owner_signer_commit ~ '^[a-f0-9]{40}$'),
 owner_pin_fingerprint_sha256 text not null check(owner_pin_fingerprint_sha256 ~ '^[a-f0-9]{64}$'),
 signature_sha256 text not null check(signature_sha256 ~ '^[a-f0-9]{64}$'),
 observed_at_ms bigint not null check(observed_at_ms>0),
 report_state text not null default 'OWNER_SIGNED_PHYSICAL_OBSERVATION_REPORT_ONLY'
 check(report_state='OWNER_SIGNED_PHYSICAL_OBSERVATION_REPORT_ONLY'),
 created_at timestamptz not null default now(),
 unique(ceremony_id,owner_role),unique(ceremony_id,owner_staff_id),unique(ceremony_id,owner_pin_fingerprint_sha256)
);
create or replace function public.rosie_sysop_readback_guard_v920()
returns trigger language plpgsql security invoker set search_path=public as $$
declare a record;
begin
 select source_receipt_id,receiver_id into a from public.rosie_sysop_receiver_acks_v919
 where id=new.ack_review_id for share;
 if not found or a.source_receipt_id<>new.source_receipt_id or a.receiver_id<>new.receiver_id then
  raise exception 'ORIGINAL_RECEIVER_LEDGER_ACK_CORRELATION_REQUIRED';
 end if;
 return new;
end;$$;
revoke all on function public.rosie_sysop_readback_guard_v920() from public,anon,authenticated;
grant execute on function public.rosie_sysop_readback_guard_v920() to service_role;
drop trigger if exists rosie_sysop_readback_guard_t_v920 on public.rosie_sysop_receiver_readbacks_v920;
create trigger rosie_sysop_readback_guard_t_v920 before insert on public.rosie_sysop_receiver_readbacks_v920
for each row execute function public.rosie_sysop_readback_guard_v920();
create or replace function public.rosie_sysop_owner_guard_v920()
returns trigger language plpgsql security invoker set search_path=public as $$
declare c record; h record; prior record;
begin
 select * into c from public.rosie_sysop_preflight_v920 where id=new.ceremony_id for update;
 select * into h from public.rosie_sysop_host_recovery_v919 where id=new.host_review_id for share;
 if not found or c.id is null or h.id is null or c.host_id<>h.host_id
 or h.boot_time_ms<=floor(extract(epoch from c.created_at)*1000)::bigint
 or h.boot_time_ms>=floor(extract(epoch from c.expires_at)*1000)::bigint then
  raise exception 'ORIGINAL_PREFLIGHT_MUST_PRECEDE_SIGNED_WINDOWS_BOOT';
 end if;
 select host_review_id into prior from public.rosie_sysop_owner_reports_v920
 where ceremony_id=c.id limit 1;
 if found and prior.host_review_id<>new.host_review_id then
  raise exception 'TWO_OWNER_REPORTS_MUST_BIND_SAME_ORIGINAL_BOOT';
 end if;
 return new;
end;$$;
revoke all on function public.rosie_sysop_owner_guard_v920() from public,anon,authenticated;
grant execute on function public.rosie_sysop_owner_guard_v920() to service_role;
drop trigger if exists rosie_sysop_owner_guard_t_v920 on public.rosie_sysop_owner_reports_v920;
create trigger rosie_sysop_owner_guard_t_v920 before insert on public.rosie_sysop_owner_reports_v920
for each row execute function public.rosie_sysop_owner_guard_v920();
do $$
declare t text;
begin
 foreach t in array array['rosie_sysop_receiver_readbacks_v920','rosie_sysop_preflight_v920','rosie_sysop_owner_reports_v920'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from public,anon,authenticated,service_role',t);
  execute format('grant select,insert on public.%I to service_role',t);
 end loop;
end;$$;
