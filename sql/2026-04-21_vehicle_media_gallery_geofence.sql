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
  alt_text text NULL,
  image_title text NULL,
  crop_history jsonb NULL,
  media_width_px integer NULL,
  media_height_px integer NULL,
  media_orientation text NULL,
  is_primary boolean NOT NULL DEFAULT false,
  is_deleted boolean NOT NULL DEFAULT false,
  uploaded_by_customer boolean NOT NULL DEFAULT true,
  media_score numeric NULL,
  media_score_label text NULL,
  media_score_status text NOT NULL DEFAULT 'pending',
  admin_override_reason text NULL,
  original_media_id uuid NULL REFERENCES public.customer_vehicle_media(id) ON DELETE SET NULL
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'customer_vehicle_media' AND column_name = 'google_score'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'customer_vehicle_media' AND column_name = 'media_score'
  ) THEN
    EXECUTE 'ALTER TABLE public.customer_vehicle_media RENAME COLUMN google_score TO media_score';
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'customer_vehicle_media' AND column_name = 'google_score_label'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'customer_vehicle_media' AND column_name = 'media_score_label'
  ) THEN
    EXECUTE 'ALTER TABLE public.customer_vehicle_media RENAME COLUMN google_score_label TO media_score_label';
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'customer_vehicle_media' AND column_name = 'google_score_status'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'customer_vehicle_media' AND column_name = 'media_score_status'
  ) THEN
    EXECUTE 'ALTER TABLE public.customer_vehicle_media RENAME COLUMN google_score_status TO media_score_status';
  END IF;
END $$;

ALTER TABLE IF EXISTS public.customer_vehicle_media
  ADD COLUMN IF NOT EXISTS alt_text text NULL;
ALTER TABLE IF EXISTS public.customer_vehicle_media
  ADD COLUMN IF NOT EXISTS image_title text NULL;
ALTER TABLE IF EXISTS public.customer_vehicle_media
  ADD COLUMN IF NOT EXISTS crop_history jsonb NULL;
ALTER TABLE IF EXISTS public.customer_vehicle_media
  ADD COLUMN IF NOT EXISTS media_width_px integer NULL;
ALTER TABLE IF EXISTS public.customer_vehicle_media
  ADD COLUMN IF NOT EXISTS media_height_px integer NULL;
ALTER TABLE IF EXISTS public.customer_vehicle_media
  ADD COLUMN IF NOT EXISTS media_orientation text NULL;
ALTER TABLE IF EXISTS public.customer_vehicle_media
  ADD COLUMN IF NOT EXISTS media_score numeric NULL;
ALTER TABLE IF EXISTS public.customer_vehicle_media
  ADD COLUMN IF NOT EXISTS media_score_label text NULL;
ALTER TABLE IF EXISTS public.customer_vehicle_media
  ADD COLUMN IF NOT EXISTS media_score_status text NOT NULL DEFAULT 'pending';

CREATE INDEX IF NOT EXISTS customer_vehicle_media_vehicle_idx ON public.customer_vehicle_media(vehicle_id, created_at DESC);
CREATE INDEX IF NOT EXISTS customer_vehicle_media_customer_idx ON public.customer_vehicle_media(customer_profile_id, created_at DESC);

ALTER TABLE IF EXISTS public.bookings
  ADD COLUMN IF NOT EXISTS trusted_service_latitude numeric NULL;
ALTER TABLE IF EXISTS public.bookings
  ADD COLUMN IF NOT EXISTS trusted_service_longitude numeric NULL;
ALTER TABLE IF EXISTS public.bookings
  ADD COLUMN IF NOT EXISTS trusted_service_coordinate_source text NULL;
ALTER TABLE IF EXISTS public.bookings
  ADD COLUMN IF NOT EXISTS trusted_service_coordinate_status text NOT NULL DEFAULT 'pending';
ALTER TABLE IF EXISTS public.bookings
  ADD COLUMN IF NOT EXISTS trusted_service_coordinate_label text NULL;
ALTER TABLE IF EXISTS public.bookings
  ADD COLUMN IF NOT EXISTS trusted_service_coordinate_resolved_at timestamptz NULL;
ALTER TABLE IF EXISTS public.bookings
  ADD COLUMN IF NOT EXISTS trusted_service_geofence_radius_m numeric NOT NULL DEFAULT 250;
ALTER TABLE IF EXISTS public.bookings
  ADD COLUMN IF NOT EXISTS arrival_device_latitude numeric NULL;
ALTER TABLE IF EXISTS public.bookings
  ADD COLUMN IF NOT EXISTS arrival_device_longitude numeric NULL;
ALTER TABLE IF EXISTS public.bookings
  ADD COLUMN IF NOT EXISTS arrival_geofence_status text NULL;
ALTER TABLE IF EXISTS public.bookings
  ADD COLUMN IF NOT EXISTS arrival_distance_m numeric NULL;
ALTER TABLE IF EXISTS public.bookings
  ADD COLUMN IF NOT EXISTS arrival_geofence_checked_at timestamptz NULL;

CREATE INDEX IF NOT EXISTS bookings_trusted_service_coordinate_idx ON public.bookings(service_date DESC, trusted_service_coordinate_status);
CREATE INDEX IF NOT EXISTS bookings_arrival_geofence_status_idx ON public.bookings(service_date DESC, arrival_geofence_status);

COMMIT;
