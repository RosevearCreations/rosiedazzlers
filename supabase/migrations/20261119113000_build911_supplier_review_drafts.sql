-- Rosie Build 911: staff-original supplier-review drafts, never a public product, endorsement or actual receipt.
create table if not exists public.rosie_supplier_reviews_v911 (
  id uuid primary key default gen_random_uuid(),
  supplier text not null check (supplier='VEVOR'),
  product_name text not null check (length(product_name) between 4 and 140),
  product_url text not null check (product_url like 'https://www.vevor.ca/%' and length(product_url)<=1000),
  acquisition_kind text not null check (acquisition_kind in ('not_received','purchased','gifted','loaned','review_sample')),
  video_platform text not null default 'none' check (video_platform in ('none','youtube','instagram','facebook')),
  video_url text null check (video_url is null or length(video_url)<=1000),
  video_embed_url text null check (video_embed_url is null or length(video_embed_url)<=1200),
  daip_project_id uuid null references public.creative_projects(id) on delete set null,
  review_notes text not null default '' check (length(review_notes)<=750),
  disclosure_required boolean not null default false,
  publication_status text not null default 'draft' check (publication_status='draft'),
  received_verified boolean not null default false check (received_verified=false),
  public_card_published boolean not null default false check (public_card_published=false),
  created_by_staff_user_id uuid null,
  created_at timestamptz not null default now()
);
create index if not exists rosie_supplier_reviews_v911_created_idx on public.rosie_supplier_reviews_v911(created_at desc);
alter table public.rosie_supplier_reviews_v911 enable row level security;
revoke all on table public.rosie_supplier_reviews_v911 from public, anon, authenticated;
grant select, insert on public.rosie_supplier_reviews_v911 to service_role;
comment on table public.rosie_supplier_reviews_v911 is
 'Signed-staff, append-only supplier video drafts. Review sample is owner-entered, not a verified physical receipt, endorsement, social publication or DAIP consent approval.';
