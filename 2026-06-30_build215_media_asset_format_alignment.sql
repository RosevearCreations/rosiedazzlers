-- Build 215 — public media asset format alignment
-- Purpose: align legacy regional Hero task records to the JPG assets now used in R2.
-- DAIP NOTE: this migration does NOT create DAIP tables, queues, workers, AI processing,
-- or publishing automation. DAIP remains documentation/planning only in Build 215.

begin;

-- Only rename legacy .webp task keys when the matching .jpg task row does not already exist.
-- This avoids a unique-key conflict if someone has already created a JPG task manually.
update public.media_asset_tasks legacy
set
  r2_key = regexp_replace(legacy.r2_key, '\.webp$', '.jpg', 'i'),
  public_url = 'https://assets.rosiedazzlers.ca/' || regexp_replace(legacy.r2_key, '\.webp$', '.jpg', 'i'),
  required_size = '1600x900 preferred JPG/WebP',
  notes = trim(both from concat_ws(' ', legacy.notes, '[Build 215: JPG hero key aligned; runtime accepts JPG/JPEG/WebP/PNG variants.]')),
  updated_at = now()
where legacy.category = 'regional'
  and legacy.r2_key ~* '^landing-pages/(tillsonburg-auto-detailing|woodstock-ingersoll-auto-detailing|simcoe-delhi-auto-detailing|port-dover-auto-detailing|norwich-otterville-auto-detailing|zorra-thamesford-embro-auto-detailing|waterford-vittoria-auto-detailing|port-rowan-turkey-point-auto-detailing)\.webp$'
  and not exists (
    select 1
    from public.media_asset_tasks jpg
    where jpg.r2_key = regexp_replace(legacy.r2_key, '\.webp$', '.jpg', 'i')
  );

-- If a JPG row already existed, make its metadata authoritative and clear for the verifier/UI.
update public.media_asset_tasks jpg
set
  public_url = coalesce(nullif(jpg.public_url, ''), 'https://assets.rosiedazzlers.ca/' || jpg.r2_key),
  required_width = coalesce(jpg.required_width, 1600),
  required_height = coalesce(jpg.required_height, 900),
  required_size = '1600x900 preferred JPG/WebP',
  notes = trim(both from concat_ws(' ', jpg.notes, '[Build 215: canonical local hero JPG; compatible formats accepted by runtime/verifier.]')),
  updated_at = now()
where jpg.category = 'regional'
  and jpg.r2_key ~* '^landing-pages/(tillsonburg-auto-detailing|woodstock-ingersoll-auto-detailing|simcoe-delhi-auto-detailing|port-dover-auto-detailing|norwich-otterville-auto-detailing|zorra-thamesford-embro-auto-detailing|waterford-vittoria-auto-detailing|port-rowan-turkey-point-auto-detailing)\.jpg$';

-- Add missing local-page task rows while leaving any existing task status/assignment intact.
insert into public.media_asset_tasks (
  label, category, r2_key, public_url, required_width, required_height, required_size,
  status, priority, notes
)
values
  ('Tillsonburg local hero photo', 'regional', 'landing-pages/tillsonburg-auto-detailing.jpg', 'https://assets.rosiedazzlers.ca/landing-pages/tillsonburg-auto-detailing.jpg', 1600, 900, '1600x900 preferred JPG/WebP', 'needed', 85, 'Build 215 canonical local hero JPG'),
  ('Woodstock/Ingersoll local hero photo', 'regional', 'landing-pages/woodstock-ingersoll-auto-detailing.jpg', 'https://assets.rosiedazzlers.ca/landing-pages/woodstock-ingersoll-auto-detailing.jpg', 1600, 900, '1600x900 preferred JPG/WebP', 'needed', 82, 'Build 215 canonical local hero JPG'),
  ('Simcoe/Delhi local hero photo', 'regional', 'landing-pages/simcoe-delhi-auto-detailing.jpg', 'https://assets.rosiedazzlers.ca/landing-pages/simcoe-delhi-auto-detailing.jpg', 1600, 900, '1600x900 preferred JPG/WebP', 'needed', 80, 'Build 215 canonical local hero JPG'),
  ('Port Dover local hero photo', 'regional', 'landing-pages/port-dover-auto-detailing.jpg', 'https://assets.rosiedazzlers.ca/landing-pages/port-dover-auto-detailing.jpg', 1600, 900, '1600x900 preferred JPG/WebP', 'needed', 80, 'Build 215 canonical local hero JPG'),
  ('Norwich/Otterville local hero photo', 'regional', 'landing-pages/norwich-otterville-auto-detailing.jpg', 'https://assets.rosiedazzlers.ca/landing-pages/norwich-otterville-auto-detailing.jpg', 1600, 900, '1600x900 preferred JPG/WebP', 'needed', 76, 'Build 215 canonical local hero JPG'),
  ('Zorra/Thamesford/Embro local hero photo', 'regional', 'landing-pages/zorra-thamesford-embro-auto-detailing.jpg', 'https://assets.rosiedazzlers.ca/landing-pages/zorra-thamesford-embro-auto-detailing.jpg', 1600, 900, '1600x900 preferred JPG/WebP', 'needed', 76, 'Build 215 canonical local hero JPG'),
  ('Waterford/Vittoria local hero photo', 'regional', 'landing-pages/waterford-vittoria-auto-detailing.jpg', 'https://assets.rosiedazzlers.ca/landing-pages/waterford-vittoria-auto-detailing.jpg', 1600, 900, '1600x900 preferred JPG/WebP', 'needed', 74, 'Build 215 canonical local hero JPG'),
  ('Port Rowan/Turkey Point local hero photo', 'regional', 'landing-pages/port-rowan-turkey-point-auto-detailing.jpg', 'https://assets.rosiedazzlers.ca/landing-pages/port-rowan-turkey-point-auto-detailing.jpg', 1600, 900, '1600x900 preferred JPG/WebP', 'needed', 74, 'Build 215 canonical local hero JPG')
on conflict (r2_key) do update
set
  public_url = excluded.public_url,
  required_width = excluded.required_width,
  required_height = excluded.required_height,
  required_size = excluded.required_size,
  notes = trim(both from concat_ws(' ', public.media_asset_tasks.notes, '[Build 215: canonical JPG public URL confirmed.]')),
  updated_at = now();

commit;

-- Verification: expect eight canonical regional JPG rows after this migration.
select r2_key, public_url, status, required_width, required_height
from public.media_asset_tasks
where category = 'regional'
  and r2_key like 'landing-pages/%-auto-detailing.jpg'
order by r2_key;
