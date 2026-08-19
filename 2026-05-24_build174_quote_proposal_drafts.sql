-- Build 174 — quote/proposal draft foundation
-- Purpose: persist Admin Leads quote starters so staff can revise, follow up,
-- and later convert leads into bookings/quotes without losing the generated text.
-- Safe to run after Build 167/168 lead/photo-estimate migrations.

create table if not exists public.quote_proposal_drafts (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid,
  booking_id uuid,
  title text not null default 'Rosie Dazzlers quote draft',
  status text not null default 'draft',
  body text not null,
  pricing_note text,
  internal_note text,
  customer_name text,
  customer_email text,
  source text not null default 'admin_leads',
  follow_up_at timestamptz,
  sent_at timestamptz,
  created_by_staff_user_id uuid,
  updated_by_staff_user_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists quote_proposal_drafts_lead_idx
  on public.quote_proposal_drafts(lead_id, updated_at desc);

create index if not exists quote_proposal_drafts_booking_idx
  on public.quote_proposal_drafts(booking_id, updated_at desc);

create index if not exists quote_proposal_drafts_status_followup_idx
  on public.quote_proposal_drafts(status, follow_up_at, updated_at desc);

create index if not exists quote_proposal_drafts_customer_email_idx
  on public.quote_proposal_drafts(customer_email, updated_at desc);

alter table public.quote_proposal_drafts enable row level security;

-- Staff/admin API access uses the Supabase service role key through Cloudflare
-- Functions. No public read/write policy is intentionally added in this pass.

comment on table public.quote_proposal_drafts is
  'Build 174 persistent staff quote/proposal drafts from Admin Leads. Service-role admin APIs read/write this table; no public access policy is added.';

comment on column public.quote_proposal_drafts.status is
  'draft, needs_review, ready_to_send, sent, accepted, declined, or archived.';

-- Build 174 note:
-- /admin-leads can still build and copy quote starter text before this migration.
-- Saving/loading persistent quote drafts requires this table.
