-- QL-336 additive PREPARATION ONLY. Does not convert existing bookings,
-- payments, customer records, media, provider accounts or authorization.
-- Requires a separately approved source backup and scoped backfill before any
-- child can become active or be queried through a multi-tenant API.
CREATE TABLE IF NOT EXISTS public.rosie_shell_children_ql336 (
  child_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shell_id text NOT NULL DEFAULT 'rosiedazzlers' CHECK (shell_id='rosiedazzlers'),
  child_slug text NOT NULL UNIQUE CHECK (child_slug ~ '^[a-z0-9][a-z0-9-]{2,62}$'),
  display_name text NOT NULL CHECK (length(display_name) BETWEEN 1 AND 150),
  lifecycle text NOT NULL DEFAULT 'PENDING_BACKUP_OWNER_REVIEW'
    CHECK (lifecycle='PENDING_BACKUP_OWNER_REVIEW'),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.rosie_shell_memberships_ql336 (
  child_id uuid NOT NULL REFERENCES public.rosie_shell_children_ql336(child_id) ON DELETE RESTRICT,
  auth_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  role text NOT NULL CHECK (role IN ('owner','manager','detailer','viewer')),
  lifecycle text NOT NULL DEFAULT 'PENDING_INDEPENDENT_REVIEW'
    CHECK (lifecycle='PENDING_INDEPENDENT_REVIEW'),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (child_id,auth_user_id)
);
CREATE INDEX IF NOT EXISTS rosie_shell_memberships_user_ql336
  ON public.rosie_shell_memberships_ql336(auth_user_id,child_id);
CREATE TABLE IF NOT EXISTS public.rosie_shell_resource_claims_ql336 (
  resource_kind text NOT NULL CHECK (resource_kind IN
    ('booking','customer','vehicle','photo','service','employee','invoice','payment','export')),
  legacy_resource_id text NOT NULL CHECK (length(legacy_resource_id) BETWEEN 1 AND 160),
  child_id uuid NOT NULL REFERENCES public.rosie_shell_children_ql336(child_id) ON DELETE RESTRICT,
  lifecycle text NOT NULL DEFAULT 'PENDING_SOURCE_BACKFILL'
    CHECK (lifecycle='PENDING_SOURCE_BACKFILL'),
  PRIMARY KEY(resource_kind,legacy_resource_id)
);
CREATE INDEX IF NOT EXISTS rosie_shell_resource_claims_child_ql336
  ON public.rosie_shell_resource_claims_ql336(child_id,resource_kind);
CREATE TABLE IF NOT EXISTS public.rosie_shell_provider_handles_ql336 (
  child_id uuid NOT NULL REFERENCES public.rosie_shell_children_ql336(child_id) ON DELETE RESTRICT,
  provider text NOT NULL CHECK (provider IN ('stripe','paypal','media','storage','email','sms')),
  opaque_vault_ref text CHECK (opaque_vault_ref IS NULL OR
    (opaque_vault_ref ~ '^vault://[a-z0-9/_-]+$' AND length(opaque_vault_ref)<=180)),
  lifecycle text NOT NULL DEFAULT 'PENDING_SEPARATE_CONSENT'
    CHECK (lifecycle='PENDING_SEPARATE_CONSENT'),
  PRIMARY KEY(child_id,provider)
);

-- Deny all client/API access, including members, until a reviewed policy set
-- and source-side child-bound query refactor are independently verified.
DO $$ DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['rosie_shell_children_ql336','rosie_shell_memberships_ql336',
    'rosie_shell_resource_claims_ql336','rosie_shell_provider_handles_ql336'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY',t);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC,anon,authenticated',t);
  END LOOP;
END $$;
