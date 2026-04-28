-- 2026-04-20_customer_history_maintenance_reminders.sql
-- Purpose:
-- Move maintenance reminders from interest-list based to customer-history based.
-- This migration adds reminder-tracking fields to customer_profiles safely.

BEGIN;

ALTER TABLE IF EXISTS public.customer_profiles
  ADD COLUMN IF NOT EXISTS maintenance_reminder_opt_in boolean NOT NULL DEFAULT true;

ALTER TABLE IF EXISTS public.customer_profiles
  ADD COLUMN IF NOT EXISTS maintenance_cycle_days integer;

ALTER TABLE IF EXISTS public.customer_profiles
  ADD COLUMN IF NOT EXISTS maintenance_last_service_at timestamptz;

ALTER TABLE IF EXISTS public.customer_profiles
  ADD COLUMN IF NOT EXISTS maintenance_last_reminder_at timestamptz;

ALTER TABLE IF EXISTS public.customer_profiles
  ADD COLUMN IF NOT EXISTS maintenance_next_reminder_at timestamptz;

ALTER TABLE IF EXISTS public.customer_profiles
  ADD COLUMN IF NOT EXISTS maintenance_reminder_status text NOT NULL DEFAULT 'pending';

ALTER TABLE IF EXISTS public.customer_profiles
  ADD COLUMN IF NOT EXISTS maintenance_reminder_count integer NOT NULL DEFAULT 0;

UPDATE public.customer_profiles
SET
  maintenance_reminder_opt_in = COALESCE(maintenance_reminder_opt_in, true),
  maintenance_reminder_status = COALESCE(NULLIF(maintenance_reminder_status, ''), 'pending'),
  maintenance_reminder_count = COALESCE(maintenance_reminder_count, 0)
WHERE
  maintenance_reminder_opt_in IS NULL
  OR maintenance_reminder_status IS NULL
  OR maintenance_reminder_status = ''
  OR maintenance_reminder_count IS NULL;

CREATE INDEX IF NOT EXISTS customer_profiles_maintenance_next_reminder_idx
  ON public.customer_profiles (maintenance_next_reminder_at)
  WHERE maintenance_next_reminder_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS customer_profiles_maintenance_last_service_idx
  ON public.customer_profiles (maintenance_last_service_at)
  WHERE maintenance_last_service_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS customer_profiles_maintenance_status_idx
  ON public.customer_profiles (maintenance_reminder_status);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'customer_profiles'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'customer_profiles_maintenance_reminder_status_check'
  ) THEN
    ALTER TABLE public.customer_profiles
      ADD CONSTRAINT customer_profiles_maintenance_reminder_status_check
      CHECK (
        maintenance_reminder_status IN (
          'pending',
          'scheduled',
          'sent',
          'skipped',
          'paused',
          'converted'
        )
      );
  END IF;
END
$$;

COMMIT;
