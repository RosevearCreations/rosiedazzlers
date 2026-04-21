BEGIN;

ALTER TABLE IF EXISTS public.customer_vehicles
  ADD COLUMN IF NOT EXISTS next_service_mileage_km numeric NULL;
ALTER TABLE IF EXISTS public.customer_vehicles
  ADD COLUMN IF NOT EXISTS garage_display_media_url text NULL;
ALTER TABLE IF EXISTS public.customer_vehicles
  ADD COLUMN IF NOT EXISTS garage_display_media_kind text NULL;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.customer_vehicle_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  customer_profile_id uuid NOT NULL REFERENCES public.customer_profiles(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES public.customer_vehicles(id) ON DELETE CASCADE,
  media_kind text NOT NULL DEFAULT 'photo' CHECK (media_kind IN ('photo','video')),
  media_url text NOT NULL,
  capture_role text NULL,
  caption text NULL,
  is_primary boolean NOT NULL DEFAULT false,
  is_deleted boolean NOT NULL DEFAULT false,
  uploaded_by_customer boolean NOT NULL DEFAULT true,
  google_score numeric NULL,
  google_score_label text NULL,
  google_score_status text NOT NULL DEFAULT 'pending',
  admin_override_reason text NULL,
  original_media_id uuid NULL REFERENCES public.customer_vehicle_media(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS customer_vehicle_media_vehicle_idx ON public.customer_vehicle_media(vehicle_id, created_at DESC);
CREATE INDEX IF NOT EXISTS customer_vehicle_media_customer_idx ON public.customer_vehicle_media(customer_profile_id, created_at DESC);

COMMIT;
