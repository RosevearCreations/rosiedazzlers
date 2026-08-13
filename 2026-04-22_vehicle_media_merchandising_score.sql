BEGIN;

ALTER TABLE IF EXISTS public.customer_vehicle_media
  ADD COLUMN IF NOT EXISTS media_analysis jsonb NULL;

CREATE INDEX IF NOT EXISTS customer_vehicle_media_media_analysis_idx
  ON public.customer_vehicle_media USING gin (media_analysis);

COMMIT;
