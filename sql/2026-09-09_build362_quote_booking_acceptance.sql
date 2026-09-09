-- Build 362 — Quote-to-Booking Acceptance Hardening
-- Additive migration. Historical quote/booking rows remain valid and nullable.
-- New hardened quote conversions freeze structured commercial terms and record booking source ids.

alter table public.quote_proposal_drafts
  add column if not exists structured_terms jsonb null,
  add column if not exists structured_terms_hash text null,
  add column if not exists structured_terms_created_at timestamptz null,
  add column if not exists terms_expires_at timestamptz null,
  add column if not exists accepted_terms jsonb null,
  add column if not exists accepted_terms_hash text null,
  add column if not exists accepted_terms_at timestamptz null;

comment on column public.quote_proposal_drafts.structured_terms is
  'Build 362: server-generated commercial terms delivered to the customer. Human-readable quote body is not authoritative booking pricing.';
comment on column public.quote_proposal_drafts.accepted_terms is
  'Build 362: immutable snapshot copied from structured_terms when the customer accepts. Later quote edits do not alter accepted commercial terms.';
comment on column public.quote_proposal_drafts.terms_expires_at is
  'Build 362: explicit expiry boundary for the delivered structured quote terms.';

alter table public.bookings
  add column if not exists source_quote_proposal_draft_id uuid null references public.quote_proposal_drafts(id) on delete set null,
  add column if not exists source_conversion_draft_id uuid null references public.lead_conversion_drafts(id) on delete set null;

create unique index if not exists uq_bookings_source_quote_proposal_draft
  on public.bookings(source_quote_proposal_draft_id)
  where source_quote_proposal_draft_id is not null;

create unique index if not exists uq_bookings_source_conversion_draft
  on public.bookings(source_conversion_draft_id)
  where source_conversion_draft_id is not null;

create index if not exists idx_quote_proposal_drafts_terms_expires_at
  on public.quote_proposal_drafts(terms_expires_at)
  where terms_expires_at is not null;
