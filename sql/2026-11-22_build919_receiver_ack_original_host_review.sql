-- Rosie 919: append-only, private receiver signature correlations and separate signed host evidence.
-- No provider calls, customer rows, financial side effects or automatic CONNECTED transitions.
create table if not exists public.rosie_sysop_receiver_acks_v919(
 id uuid primary key default gen_random_uuid(),
 source_receipt_id uuid not null references public.rosie_sysop_receipts_v918(id),
 source_app_id text not null check(source_app_id in ('ai-data-platform','rosevear-ai-hub','rosevear-comms-hub','icamp','yw','devilndove','rosiedazzlers')),
 receiver_id text not null check(receiver_id in ('ai-data-platform','rosevear-comms-hub')),
 receiver_commit text not null check(receiver_commit ~ '^[a-f0-9]{40}$'),
 receiver_receipt_id uuid not null,delivery_id text not null check(length(delivery_id) between 20 and 100),
 delivery_nonce text not null check(delivery_nonce ~ '^[a-f0-9]{32}$'),
 receiver_received_at_ms bigint not null check(receiver_received_at_ms>0),
 signature_sha256 text not null check(signature_sha256 ~ '^[a-f0-9]{64}$'),
 reviewed_by_staff_id uuid not null references public.staff_users(id),
 review_state text not null default 'SIGNED_RECEIVER_ACK_REVIEW_ONLY'
   check(review_state='SIGNED_RECEIVER_ACK_REVIEW_ONLY'),
 created_at timestamptz not null default now(),
 unique(source_receipt_id,receiver_id),unique(receiver_id,receiver_receipt_id),
 unique(receiver_id,delivery_id),unique(receiver_id,delivery_nonce)
);
create table if not exists public.rosie_sysop_host_recovery_v919(
 id uuid primary key default gen_random_uuid(),
 source_receipt_id uuid not null unique references public.rosie_sysop_receipts_v918(id),
 original_staff_witness_id uuid not null unique references public.rosie_sysop_host_witness_v918(id),
 host_id text not null check(host_id ~ '^[A-Za-z0-9_-]{6,100}$'),
 boot_id text not null check(boot_id ~ '^[a-f0-9]{32}$'),
 boot_time_ms bigint not null check(boot_time_ms>0),
 windows_event_sha256 text not null check(windows_event_sha256 ~ '^[a-f0-9]{64}$'),
 service_readback_sha256 text not null check(service_readback_sha256 ~ '^[a-f0-9]{64}$'),
 signature_sha256 text not null check(signature_sha256 ~ '^[a-f0-9]{64}$'),
 reviewed_by_staff_id uuid not null references public.staff_users(id),
 review_state text not null default 'SIGNED_HOST_SECOND_WITNESS_REVIEW_ONLY'
   check(review_state='SIGNED_HOST_SECOND_WITNESS_REVIEW_ONLY'),
 created_at timestamptz not null default now(),unique(host_id,boot_id)
);
create or replace function public.rosie_sysop_guard_receiver_v919()
returns trigger language plpgsql security invoker set search_path=public as $$
declare r record;
begin
 select app_id into r from public.rosie_sysop_receipts_v918 where id=new.source_receipt_id for share;
 if not found or r.app_id<>new.source_app_id then
  raise exception 'ORIGINAL_SOURCE_RECEIPT_APP_CORRELATION_REQUIRED';
 end if;
 return new;
end;$$;
revoke all on function public.rosie_sysop_guard_receiver_v919() from public,anon,authenticated;
grant execute on function public.rosie_sysop_guard_receiver_v919() to service_role;
drop trigger if exists rosie_sysop_guard_receiver_trg_v919 on public.rosie_sysop_receiver_acks_v919;
create trigger rosie_sysop_guard_receiver_trg_v919 before insert on public.rosie_sysop_receiver_acks_v919
for each row execute function public.rosie_sysop_guard_receiver_v919();
create or replace function public.rosie_sysop_guard_host_v919()
returns trigger language plpgsql security invoker set search_path=public as $$
declare r record; w record;
begin
 select app_id,event_kind,registered_by_staff_id into r
 from public.rosie_sysop_receipts_v918 where id=new.source_receipt_id for share;
 select receipt_id,witnessed_by_staff_id into w
 from public.rosie_sysop_host_witness_v918 where id=new.original_staff_witness_id for share;
 if not found or r.app_id<>'rosevear-ai-hub' or r.event_kind<>'HOST_BOOT_OBSERVED'
 or w.receipt_id<>new.source_receipt_id or w.witnessed_by_staff_id<>new.reviewed_by_staff_id
 or r.registered_by_staff_id=new.reviewed_by_staff_id then
  raise exception 'ORIGINAL_DISTINCT_STAFF_SIGNED_HOST_REVIEW_REQUIRED';
 end if;
 return new;
end;$$;
revoke all on function public.rosie_sysop_guard_host_v919() from public,anon,authenticated;
grant execute on function public.rosie_sysop_guard_host_v919() to service_role;
drop trigger if exists rosie_sysop_guard_host_trg_v919 on public.rosie_sysop_host_recovery_v919;
create trigger rosie_sysop_guard_host_trg_v919 before insert on public.rosie_sysop_host_recovery_v919
for each row execute function public.rosie_sysop_guard_host_v919();
do $$
declare t text;
begin
 foreach t in array array['rosie_sysop_receiver_acks_v919','rosie_sysop_host_recovery_v919'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from public,anon,authenticated,service_role',t);
  execute format('grant select,insert on public.%I to service_role',t);
 end loop;
end;$$;
