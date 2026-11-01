-- Build 738: a single vehicle may accept one full-day booking or one AM
-- and one PM booking, never overlapping commitments. A pending booking is
-- a hold until its state is explicitly changed, independent of its age.
-- The per-service-date transaction advisory lock serializes concurrent writes.

CREATE INDEX IF NOT EXISTS bookings_active_date_slot_738_idx
  ON public.bookings (service_date, start_slot, duration_slots)
  WHERE status IN ('pending', 'confirmed') AND job_status <> 'cancelled';

CREATE OR REPLACE FUNCTION public.rosie_guard_one_car_capacity_738()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $capacity$
BEGIN
  IF NEW.status NOT IN ('pending', 'confirmed') OR NEW.job_status = 'cancelled' THEN
    RETURN NEW;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('rosie:one-car:' || NEW.service_date::text, 0));
  IF EXISTS (
    SELECT 1 FROM public.bookings AS other
     WHERE other.service_date = NEW.service_date
       AND other.id <> NEW.id
       AND other.status IN ('pending', 'confirmed')
       AND other.job_status <> 'cancelled'
       AND (NEW.duration_slots = 2 OR other.duration_slots = 2 OR NEW.start_slot = other.start_slot)
  ) THEN
    RAISE EXCEPTION 'One-car capacity conflict for %, %', NEW.service_date, NEW.start_slot
      USING ERRCODE = '23505', CONSTRAINT = 'rosie_one_car_capacity_738';
  END IF;
  RETURN NEW;
END
$capacity$;

DROP TRIGGER IF EXISTS bookings_one_car_capacity_guard_738 ON public.bookings;
CREATE TRIGGER bookings_one_car_capacity_guard_738
  BEFORE INSERT OR UPDATE OF service_date, start_slot, duration_slots, status, job_status
  ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.rosie_guard_one_car_capacity_738();

-- Manual release of an existing owner-created date/slot block is the only
-- exception route: it never skips the capacity guard on bookings.
CREATE TABLE IF NOT EXISTS public.rosie_schedule_exception_audit_738 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  service_date date NOT NULL,
  slot text NULL CHECK (slot IS NULL OR slot IN ('AM', 'PM')),
  action text NOT NULL CHECK (action IN ('release_date_block', 'release_slot_block')),
  reason text NOT NULL CHECK (char_length(trim(reason)) >= 20),
  actor_id uuid NULL,
  actor_label text NOT NULL CHECK (char_length(trim(actor_label)) > 0),
  removed_blocks integer NOT NULL CHECK (removed_blocks > 0)
);

ALTER TABLE public.rosie_schedule_exception_audit_738 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.rosie_schedule_exception_audit_738 FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON TABLE public.rosie_schedule_exception_audit_738 TO service_role;

CREATE OR REPLACE FUNCTION public.rosie_owner_release_schedule_block_738(
  p_service_date date,
  p_slot text,
  p_reason text,
  p_actor_id uuid,
  p_actor_label text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $release$
DECLARE
  removed_count integer;
  action_name text;
  audit_id uuid;
BEGIN
  IF p_service_date IS NULL OR (p_slot IS NOT NULL AND p_slot NOT IN ('AM', 'PM'))
     OR char_length(trim(coalesce(p_reason, ''))) < 20
     OR char_length(trim(coalesce(p_actor_label, ''))) = 0 THEN
    RAISE EXCEPTION 'Valid date, slot, owner identity and a reason of 20+ characters are required'
      USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('rosie:one-car:' || p_service_date::text, 0));
  IF p_slot IS NULL THEN
    DELETE FROM public.date_blocks WHERE blocked_date = p_service_date;
    action_name := 'release_date_block';
  ELSE
    DELETE FROM public.slot_blocks WHERE blocked_date = p_service_date AND upper(slot) = p_slot;
    action_name := 'release_slot_block';
  END IF;
  GET DIAGNOSTICS removed_count = ROW_COUNT;
  IF removed_count < 1 THEN
    RAISE EXCEPTION 'No matching schedule block exists to release' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.rosie_schedule_exception_audit_738
    (service_date, slot, action, reason, actor_id, actor_label, removed_blocks)
  VALUES
    (p_service_date, p_slot, action_name, trim(p_reason), p_actor_id, trim(p_actor_label), removed_count)
  RETURNING id INTO audit_id;

  RETURN jsonb_build_object('ok', true, 'service_date', p_service_date,
    'slot', p_slot, 'action', action_name, 'removed_blocks', removed_count,
    'audit_id', audit_id, 'capacity_override', false);
END
$release$;

REVOKE ALL ON FUNCTION public.rosie_owner_release_schedule_block_738(date, text, text, uuid, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rosie_owner_release_schedule_block_738(date, text, text, uuid, text)
  TO service_role;
