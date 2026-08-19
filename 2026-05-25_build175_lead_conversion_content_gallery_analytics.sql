-- Build 175 — lead conversion drafts, expanded content blocks, gallery/privacy filters, and conversion analytics support.
-- Apply after Build 174 quote_proposal_drafts.

create table if not exists public.lead_conversion_drafts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  lead_id uuid not null references public.public_inquiry_leads(id) on delete cascade,
  quote_proposal_draft_id uuid null references public.quote_proposal_drafts(id) on delete set null,
  status text not null default 'draft_booking' check (status in ('draft_booking','needs_review','ready_to_book','converted','closed')),
  customer_name text null,
  customer_email text null,
  customer_phone text null,
  service_area text null,
  vehicle_count integer not null default 1,
  preferred_cadence text null,
  proposed_package_code text null,
  proposed_vehicle_size text null,
  proposed_booking jsonb not null default '{}'::jsonb,
  proposed_quote jsonb not null default '{}'::jsonb,
  internal_note text null,
  next_action text null,
  created_by_staff_user_id uuid null references public.staff_users(id) on delete set null,
  updated_by_staff_user_id uuid null references public.staff_users(id) on delete set null
);

create index if not exists idx_lead_conversion_drafts_lead_updated on public.lead_conversion_drafts (lead_id, updated_at desc);
create index if not exists idx_lead_conversion_drafts_status_updated on public.lead_conversion_drafts (status, updated_at desc);
alter table public.lead_conversion_drafts enable row level security;

create table if not exists public.site_content_blocks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  content_type text not null check (content_type in ('special','service_blurb','homepage_card','help_article','faq_note','trust_proof','maintenance','fleet')),
  placement text not null default 'general',
  slug text not null,
  title text not null,
  summary text null,
  body text null,
  cta_label text null,
  cta_href text null,
  image_url text null,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  unique (content_type, placement, slug)
);

create index if not exists idx_site_content_blocks_active_placement on public.site_content_blocks (is_active, placement, sort_order);
create index if not exists idx_site_content_blocks_type_placement on public.site_content_blocks (content_type, placement, sort_order);
alter table public.site_content_blocks enable row level security;

insert into public.site_content_blocks (content_type, placement, slug, title, summary, body, cta_label, cta_href, sort_order, is_active, metadata) values
('special','specials_page','seasonal-refresh','Seasonal refresh special','Timely detailing reminders for Southern Ontario road salt, pollen, summer dust, and winter prep.','Use this block for public Specials page copy that should be editable without changing HTML.','View specials','/specials',10,true,'{"build":"175"}'::jsonb),
('service_blurb','services_page','photo-estimate-first','Send photos first when condition matters','Pet hair, odour, salt, paint correction, ceramic coating, work trucks, and fleet jobs should be reviewed before final pricing.','This block supports quote-first customer education and reduces pricing surprises.','Send photos','/book?estimate=photos',20,true,'{"build":"175"}'::jsonb),
('homepage_card','home_feature','privacy-approved-proof','Privacy-approved local proof','Before/after media should only be public after consent and privacy review.','Use this block to connect the homepage to approved gallery and recent-work proof.','See gallery','/gallery',30,true,'{"build":"175"}'::jsonb),
('help_article','help_hub','road-salt-cleanup','Ontario road salt cleanup','Explain why winter salt cleanup matters for Southern Ontario vehicles.','Help article content can be expanded here before becoming a dedicated help page.','Read help articles','/blog',40,true,'{"build":"175"}'::jsonb)
on conflict (content_type, placement, slug) do update set
  title = excluded.title,
  summary = excluded.summary,
  body = excluded.body,
  cta_label = excluded.cta_label,
  cta_href = excluded.cta_href,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  metadata = public.site_content_blocks.metadata || excluded.metadata,
  updated_at = now();

-- Optional app-management gallery items should include the following keys to support Build 175 filtering:
-- service, service_slug, town, town_slug, consent_status, media_privacy_status, privacy_reviewed_at.
-- Public gallery API only returns sample media or media with approved_public/customer_approved_public/public consent/privacy status.
