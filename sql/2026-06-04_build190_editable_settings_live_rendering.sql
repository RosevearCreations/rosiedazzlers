-- Build 190: editable site-settings live rendering, validation, sync, and history support.

CREATE TABLE IF NOT EXISTS public.app_management_setting_history (
  history_id bigserial PRIMARY KEY,
  key text NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_app_management_setting_history_key_created
  ON public.app_management_setting_history (key, created_at DESC);

INSERT INTO public.app_management_settings (key, value, updated_at)
VALUES
  ('business_profile', jsonb_build_object('build', '190', 'note', 'Editable business identity, contact, social links, and LocalBusiness schema source. Update from /admin-site-settings.html.'), now()),
  ('navigation_footer', jsonb_build_object('build', '190', 'note', 'Editable public navigation and footer link source. Update from /admin-site-settings.html.'), now()),
  ('site_policies', jsonb_build_object('build', '190', 'note', 'Editable deposit, cancellation, refund, driveway, water/power, and media privacy copy source. Update from /admin-site-settings.html.'), now())
ON CONFLICT (key) DO NOTHING;
