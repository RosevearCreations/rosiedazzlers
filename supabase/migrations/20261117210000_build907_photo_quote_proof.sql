-- Rosie Build 907: add proof-bound upload confirmation without sharing private media publicly.
alter table public.photo_estimate_uploads
 add column if not exists upload_proof_hash text,
 add column if not exists verified_at timestamptz;
create unique index if not exists rosie907_intake_unique
 on public.photo_estimate_uploads(intake_id) where intake_id is not null;
create index if not exists rosie907_staff_lead_uploads
 on public.photo_estimate_uploads(lead_id,linked_at desc) where lead_id is not null;
alter table public.photo_estimate_uploads enable row level security;
revoke all on table public.photo_estimate_uploads from public,anon,authenticated;
grant select,insert,update on table public.photo_estimate_uploads to service_role;
comment on column public.photo_estimate_uploads.upload_proof_hash is
 'SHA256 digest of ephemeral per-file receipt, never original token or public access key.';
comment on column public.photo_estimate_uploads.verified_at is
 'Storage-existence confirmation; not a privacy approval, staff quote or payment evidence.';
