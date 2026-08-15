-- Build 259 — staff/customer vehicle-size verification workflow.
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS vehicle_size_review_status text NOT NULL DEFAULT 'verified';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS vehicle_size_original text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS vehicle_size_catalog_expected text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS vehicle_size_review_reason text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS vehicle_size_reviewed_size text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS vehicle_size_reviewed_price_cents integer;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS vehicle_size_reviewed_at timestamptz;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS vehicle_size_reviewed_by uuid;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS vehicle_size_review_token_hash text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS vehicle_size_review_expires_at timestamptz;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS vehicle_size_customer_response text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS vehicle_size_customer_responded_at timestamptz;

CREATE INDEX IF NOT EXISTS bookings_vehicle_size_review_status_idx ON public.bookings(vehicle_size_review_status, service_date);

COMMENT ON COLUMN public.bookings.vehicle_size_review_status IS 'verified, needs_review, awaiting_customer, customer_confirmed, customer_cancelled';
COMMENT ON COLUMN public.bookings.vehicle_size_review_token_hash IS 'SHA-256 only; raw customer review token is never stored.';
