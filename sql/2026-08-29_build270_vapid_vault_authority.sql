-- Rosie Dazzlers Build 270 — VAPID Vault access authority
-- Development secrets were provisioned directly into Supabase Vault on 2026-08-29.
-- SECRET VALUES MUST NEVER BE COMMITTED TO SOURCE.
-- Required Vault secret names:
--   rosie_vapid_public_key
--   rosie_vapid_private_key
--   rosie_vapid_subject
-- Provision/rotate those names through the deployment secret process, then apply the RPC authority below.

create or replace function public.notification_push_public_config()
returns table(public_key text, subject text)
language sql
stable
security definer
set search_path = public, vault
as $$
  select
    max(decrypted_secret) filter (where name='rosie_vapid_public_key') as public_key,
    max(decrypted_secret) filter (where name='rosie_vapid_subject') as subject
  from vault.decrypted_secrets
  where name in ('rosie_vapid_public_key','rosie_vapid_subject');
$$;

create or replace function public.notification_push_private_config()
returns table(public_key text, private_key text, subject text)
language sql
stable
security definer
set search_path = public, vault
as $$
  select
    max(decrypted_secret) filter (where name='rosie_vapid_public_key') as public_key,
    max(decrypted_secret) filter (where name='rosie_vapid_private_key') as private_key,
    max(decrypted_secret) filter (where name='rosie_vapid_subject') as subject
  from vault.decrypted_secrets
  where name in ('rosie_vapid_public_key','rosie_vapid_private_key','rosie_vapid_subject');
$$;

revoke all on function public.notification_push_public_config() from public, anon, authenticated;
revoke all on function public.notification_push_private_config() from public, anon, authenticated;
grant execute on function public.notification_push_public_config() to service_role;
grant execute on function public.notification_push_private_config() to service_role;
