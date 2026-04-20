-- 2026-04-20_scheduled_gifts_and_membership_reminders.sql
-- Purpose:
-- 1) Create membership_interest_requests if it does not already exist.
-- 2) Add the reminder-oriented columns used by the recurring maintenance flow.
-- 3) Keep the migration idempotent so it can be run safely on databases that are behind.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.membership_interest_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  postal_code text,

  vehicle_count integer NOT NULL DEFAULT 1,
  preferred_cycle text NOT NULL DEFAULT 'Every 4 weeks',

  notes text,
  source_url text,

  status text NOT NULL DEFAULT 'new',

  last_reminder_at timestamptz,
  last_reminder_type text,
  next_reminder_due_at timestamptz,

  converted_at timestamptz,
  closed_at timestamptz
);

ALTER TABLE public.membership_interest_requests
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.membership_interest_requests
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.membership_interest_requests
  ADD COLUMN IF NOT EXISTS full_name text;

ALTER TABLE public.membership_interest_requests
  ADD COLUMN IF NOT EXISTS email text;

ALTER TABLE public.membership_interest_requests
  ADD COLUMN IF NOT EXISTS phone text;

ALTER TABLE public.membership_interest_requests
  ADD COLUMN IF NOT EXISTS postal_code text;

ALTER TABLE public.membership_interest_requests
  ADD COLUMN IF NOT EXISTS vehicle_count integer NOT NULL DEFAULT 1;

ALTER TABLE public.membership_interest_requests
  ADD COLUMN IF NOT EXISTS preferred_cycle text NOT NULL DEFAULT 'Every 4 weeks';

ALTER TABLE public.membership_interest_requests
  ADD COLUMN IF NOT EXISTS notes text;

ALTER TABLE public.membership_interest_requests
  ADD COLUMN IF NOT EXISTS source_url text;

ALTER TABLE public.membership_interest_requests
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'new';

ALTER TABLE public.membership_interest_requests
  ADD COLUMN IF NOT EXISTS last_reminder_at timestamptz;

ALTER TABLE public.membership_interest_requests
  ADD COLUMN IF NOT EXISTS last_reminder_type text;

ALTER TABLE public.membership_interest_requests
  ADD COLUMN IF NOT EXISTS next_reminder_due_at timestamptz;

ALTER TABLE public.membership_interest_requests
  ADD COLUMN IF NOT EXISTS converted_at timestamptz;

ALTER TABLE public.membership_interest_requests
  ADD COLUMN IF NOT EXISTS closed_at timestamptz;

ALTER TABLE public.membership_interest_requests
  ALTER COLUMN vehicle_count SET DEFAULT 1;

ALTER TABLE public.membership_interest_requests
  ALTER COLUMN preferred_cycle SET DEFAULT 'Every 4 weeks';

ALTER TABLE public.membership_interest_requests
  ALTER COLUMN status SET DEFAULT 'new';

UPDATE public.membership_interest_requests
SET
  vehicle_count = COALESCE(vehicle_count, 1),
  preferred_cycle = COALESCE(NULLIF(preferred_cycle, ''), 'Every 4 weeks'),
  status = COALESCE(NULLIF(status, ''), 'new')
WHERE
  vehicle_count IS NULL
  OR preferred_cycle IS NULL
  OR preferred_cycle = ''
  OR status IS NULL
  OR status = '';

CREATE INDEX IF NOT EXISTS membership_interest_requests_email_idx
  ON public.membership_interest_requests (lower(email));

CREATE INDEX IF NOT EXISTS membership_interest_requests_status_idx
  ON public.membership_interest_requests (status);

CREATE INDEX IF NOT EXISTS membership_interest_requests_created_at_idx
  ON public.membership_interest_requests (created_at DESC);

CREATE INDEX IF NOT EXISTS membership_interest_requests_next_reminder_due_at_idx
  ON public.membership_interest_requests (next_reminder_due_at)
  WHERE next_reminder_due_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS membership_interest_requests_last_reminder_at_idx
  ON public.membership_interest_requests (last_reminder_at)
  WHERE last_reminder_at IS NOT NULL;

-- Optional helpful status check without being too restrictive for future expansion.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'membership_interest_requests_status_check'
  ) THEN
    ALTER TABLE public.membership_interest_requests
      ADD CONSTRAINT membership_interest_requests_status_check
      CHECK (
        status IN (
          'new',
          'contacted',
          'interested',
          'scheduled',
          'converted',
          'closed',
          'unsubscribed'
        )
      );
  END IF;
END
$$;

COMMIT;
