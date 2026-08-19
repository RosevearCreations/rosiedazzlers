-- Build 219 — DAIP owner-decision governance and promotion-readiness workspace.
--
-- This migration records the DAIP-0 owner decisions that must be complete before
-- any private storage, upload, worker, AI, public derivative, or publishing build
-- can even be reviewed. It intentionally does NOT provision media storage, accept
-- bytes, issue signed URLs, create a worker queue, or enable export/publishing.
--
-- Run only after Build 214 security containment and Build 218 internal-test mode.
-- Browser clients remain behind protected Cloudflare Functions; service_role is
-- the sole application database role for these records.

begin;

create table if not exists public.daip_governance_decisions (
  id uuid primary key default gen_random_uuid(),
  decision_key text not null unique check (decision_key in (
    'DAIP-0-01','DAIP-0-02','DAIP-0-03','DAIP-0-04','DAIP-0-05','DAIP-0-06',
    'DAIP-0-07','DAIP-0-08','DAIP-0-09','DAIP-0-10','DAIP-0-11','DAIP-0-12'
  )),
  decision_title text not null check (char_length(decision_title) between 3 and 160),
  resolution_status text not null default 'draft' check (resolution_status in ('draft','approved')),
  decision_owner_label text not null check (char_length(decision_owner_label) between 2 and 120),
  decision_summary text not null check (char_length(decision_summary) between 12 and 2400),
  business_cost_impact text not null check (char_length(business_cost_impact) between 6 and 1600),
  privacy_safety_impact text not null check (char_length(privacy_safety_impact) between 6 and 1600),
  review_due_on date not null,
  approved_by_staff_user_id uuid null references public.staff_users(id) on delete set null,
  approved_by_staff_email text null check (approved_by_staff_email is null or char_length(approved_by_staff_email) <= 320),
  approved_at timestamptz null,
  recorded_by_staff_user_id uuid null references public.staff_users(id) on delete set null,
  recorded_by_staff_email text null check (recorded_by_staff_email is null or char_length(recorded_by_staff_email) <= 320),
  revision_number integer not null default 1 check (revision_number >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (resolution_status = 'approved' and approved_at is not null)
    or (resolution_status = 'draft' and approved_at is null)
  )
);

create table if not exists public.daip_governance_audit_events (
  id uuid primary key default gen_random_uuid(),
  decision_key text not null check (decision_key in (
    'DAIP-0-01','DAIP-0-02','DAIP-0-03','DAIP-0-04','DAIP-0-05','DAIP-0-06',
    'DAIP-0-07','DAIP-0-08','DAIP-0-09','DAIP-0-10','DAIP-0-11','DAIP-0-12'
  )),
  event_type text not null check (event_type in ('decision_drafted','decision_approved','decision_reopened')),
  actor_staff_user_id uuid null references public.staff_users(id) on delete set null,
  actor_staff_email text null check (actor_staff_email is null or char_length(actor_staff_email) <= 320),
  revision_number integer not null check (revision_number >= 1),
  safe_note text null check (safe_note is null or char_length(safe_note) <= 500),
  created_at timestamptz not null default now()
);

create index if not exists daip_governance_decisions_status_idx
  on public.daip_governance_decisions (resolution_status, updated_at desc);
create index if not exists daip_governance_audit_events_decision_created_idx
  on public.daip_governance_audit_events (decision_key, created_at desc);

alter table public.daip_governance_decisions enable row level security;
alter table public.daip_governance_audit_events enable row level security;

revoke all privileges on table public.daip_governance_decisions from public, anon, authenticated;
revoke all privileges on table public.daip_governance_audit_events from public, anon, authenticated;
grant all privileges on table public.daip_governance_decisions to service_role;
grant all privileges on table public.daip_governance_audit_events to service_role;

comment on table public.daip_governance_decisions is
  'Build 219 owner-decision register for DAIP-0. This records governance only and cannot provision storage, uploads, workers, exports, or automatic publishing.';
comment on table public.daip_governance_audit_events is
  'Build 219 DAIP governance audit trail. Keep only safe decision metadata; never store secrets, keys, signed URLs, customer media, addresses, VINs, payment data, or incident evidence.';

commit;
