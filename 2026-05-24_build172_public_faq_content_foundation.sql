-- Build 172 public FAQ content foundation — 2026-05-24
-- Purpose: move frequently duplicated public FAQ/help content toward DB-managed content
-- while keeping the static FAQ page and /api/public_faqs fallback-safe before this SQL is applied.

create table if not exists public.public_faq_entries (
  id uuid primary key default gen_random_uuid(),
  category text not null default 'General',
  question text not null,
  answer text not null,
  cta_label text,
  cta_href text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  source_key text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_public_faq_entries_active_sort
  on public.public_faq_entries(is_active, sort_order, category);

alter table public.public_faq_entries enable row level security;

drop policy if exists public_faq_entries_public_read on public.public_faq_entries;
create policy public_faq_entries_public_read
  on public.public_faq_entries
  for select
  using (is_active = true);

insert into public.public_faq_entries
  (source_key, category, question, answer, cta_label, cta_href, sort_order, is_active)
values
  ('build172_where_does_rosie_dazzlers_provide_mobile_auto_detailing', 'Booking and service area', 'Where does Rosie Dazzlers provide mobile auto detailing?', 'Rosie Dazzlers serves Oxford County and Norfolk County, Ontario, with strongest public pages for Tillsonburg, Woodstock, Ingersoll, Simcoe, Delhi, Port Dover, Norwich, Otterville, Waterford, Vittoria, Port Rowan, Turkey Point, Zorra, Thamesford, and Embro. Final availability still depends on schedule, driveway access, travel time, and weather.', 'Check booking availability', '/book', 10, true),
  ('build172_do_we_need_a_driveway_water_and_power', 'Booking and service area', 'Do we need a driveway, water, and power?', 'Yes. The standard mobile setup assumes a safe driveway or private parking area, customer-provided water, and customer-provided power. If water or power is not available, staff must review options before confirming the job because timing, equipment, and pricing may change.', 'Read service details', '/services', 20, true),
  ('build172_how_far_ahead_can_customers_book', 'Booking and service area', 'How far ahead can customers book?', 'The booking flow is designed around the live availability window shown on the website. Weather, blocked days, service length, and one-vehicle-per-day planning can affect what is available.', 'See live availability', '/pricing#booking-planner', 30, true),
  ('build172_why_does_final_pricing_depend_on_vehicle_condition', 'Pricing and quotes', 'Why does final pricing depend on vehicle condition?', 'Vehicle size, pet hair, salt buildup, staining, odour, heavy soil, work-truck use, paint condition, and add-ons can change the time and products needed. The site uses quote-safe language so customers understand that the final plan may need review before work starts.', 'View pricing', '/pricing', 40, true),
  ('build172_should_customers_book_directly_or_send_photos_first', 'Pricing and quotes', 'Should customers book directly or send photos first?', 'Book directly when the package is clear. Send photos or links first when the vehicle has heavy pet hair, odour, salt, staining, paint correction questions, ceramic coating questions, work-truck buildup, or fleet/maintenance needs.', 'Send photos for estimate', '/book?estimate=photos', 50, true),
  ('build172_are_deposits_required', 'Pricing and quotes', 'Are deposits required?', 'Deposits are used to reserve booking times. Cancellation or rescheduling rules are covered in the site terms and booking flow so staff time and travel planning are protected.', 'Read terms', '/terms', 60, true),
  ('build172_what_is_the_difference_between_a_standard_interior_detail_an', 'Services and add-ons', 'What is the difference between a standard interior detail and heavy interior work?', 'A standard interior detail is for normal use and maintenance-level cleanup. Heavy interior work can include pet hair, salt, odour, staining, spills, work-truck buildup, or extra extraction time, and may require add-ons or a photo estimate.', 'Compare services', '/services', 70, true),
  ('build172_do_ceramic_coating_paint_correction_and_sealants_need_inspec', 'Services and add-ons', 'Do ceramic coating, paint correction, and sealants need inspection?', 'Yes. Paint condition, previous waxes or coatings, scratches, oxidation, and customer expectations should be reviewed before promising a result. The website uses dedicated pages for ceramic coating, paint correction, graphene finish, clay treatment, and paint sealant so customers can choose the right path.', 'Open ceramic coating page', '/ceramic-coating', 80, true),
  ('build172_can_gift_cards_be_used_toward_add_ons', 'Services and add-ons', 'Can gift cards be used toward add-ons?', 'Gift cards can usually be used toward eligible detailing services and add-ons, but final use depends on the booking, vehicle condition, and staff review.', 'View gift cards', '/gift-cards', 90, true),
  ('build172_do_fleet_or_maintenance_plans_need_a_custom_quote', 'Fleet and maintenance', 'Do fleet or maintenance plans need a custom quote?', 'Yes. Fleet and maintenance pricing depends on vehicle count, cadence, parking logistics, job location, vehicle condition, water/power access, and whether the first visit should be a paid test detail.', 'Request fleet quote', '/fleet', 100, true),
  ('build172_can_customers_upload_photos_or_videos_for_an_estimate', 'Photos, privacy, and proof', 'Can customers upload photos or videos for an estimate?', 'The quote-first path supports pasted photo/share links, and the direct upload foundation is available when the public upload environment variables and storage bucket are enabled. Staff review privacy status before any media is used publicly.', 'Start quote-first booking', '/book?estimate=photos', 110, true),
  ('build172_will_customer_photos_be_posted_online', 'Photos, privacy, and proof', 'Will customer photos be posted online?', 'Photos or videos should not be used publicly until staff confirm customer consent, privacy review, and any needed blur/crop work for plates, faces, addresses, or private information.', 'Read privacy policy', '/privacy', 120, true)
on conflict (source_key) do update set
  category = excluded.category,
  question = excluded.question,
  answer = excluded.answer,
  cta_label = excluded.cta_label,
  cta_href = excluded.cta_href,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = now();

-- Build 172 note:
-- /faq and /api/public_faqs work before this migration using static fallback content.
-- Apply this migration when staff are ready to manage FAQ copy through a future admin content screen.
