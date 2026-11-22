-- Build 919 hardening: original independent host witness must bind to its deployed commit.
-- No existing signed original-host records exist at activation; preserve append-only custody.
alter table public.rosie_sysop_host_recovery_v919
 add column if not exists host_witness_commit text
 check(host_witness_commit ~ '^[a-f0-9]{40}$');
alter table public.rosie_sysop_host_recovery_v919
 alter column host_witness_commit set not null;
