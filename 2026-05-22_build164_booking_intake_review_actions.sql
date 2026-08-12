-- Build 164 — booking intake review action fields
-- Date: 2026-05-22
--
-- Build 163 added the staff-facing intake/privacy review panel. Build 164 adds
-- lightweight staff review note and audit fields so photo-estimate, condition,
-- and media/privacy review decisions can be stored directly instead of only
-- being appended to booking notes.

alter table if exists public.bookings
  add column if not exists intake_review_note text,
  add column if not exists intake_reviewed_at timestamptz,
  add column if not exists intake_reviewed_by uuid references public.staff_users(id) on delete set null;

create index if not exists idx_bookings_intake_reviewed_at
  on public.bookings(intake_reviewed_at desc);

comment on column public.bookings.intake_review_note is
  'Build 164 staff note for the latest booking estimate-intake, condition-helper, or media/privacy review decision.';
comment on column public.bookings.intake_reviewed_at is
  'Build 164 timestamp for the latest staff intake/privacy review action.';
comment on column public.bookings.intake_reviewed_by is
  'Build 164 staff user who last saved the booking intake/privacy review.';
