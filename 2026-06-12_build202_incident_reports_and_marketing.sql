-- Build 202 — incident reports and marketing tracker support
-- Date: 2026-06-12
-- Purpose:
--   Adds DB-backed private incident reports for vehicle damage, faulty equipment,
--   pre-existing damage, customer disputes, safety issues, and other job-site incidents.
--   Customer-visible fields are separate from private report/admin discussion so staff
--   can approve only safe wording and selected photo evidence for the progress page.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.incident_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,

  incident_type text NOT NULL DEFAULT 'damage'
    CHECK (incident_type IN ('damage','faulty_equipment','pre_existing_damage','customer_dispute','safety','other')),
  severity text NOT NULL DEFAULT 'medium'
    CHECK (severity IN ('low','medium','high','urgent')),
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','under_review','closed_private','customer_visible')),
  decision_status text NOT NULL DEFAULT 'needs_review'
    CHECK (decision_status IN ('needs_review','no_action_needed','repair_required','customer_credit','approved_for_customer','closed_private')),

  vehicle_area text,
  equipment_name text,
  title text NOT NULL,

  private_report text NOT NULL,
  private_admin_discussion text,
  evidence_items jsonb NOT NULL DEFAULT '[]'::jsonb,

  decision_summary_private text,
  decision_made_by_staff_user_id uuid REFERENCES public.staff_users(id) ON DELETE SET NULL,
  decision_made_by_name text,
  decision_made_at timestamptz,

  approved_customer_summary text,
  approved_customer_discussion text,
  public_evidence_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  public_visible boolean NOT NULL DEFAULT false,
  customer_visible_at timestamptz,

  reported_by_staff_user_id uuid REFERENCES public.staff_users(id) ON DELETE SET NULL,
  reported_by_staff_name text,
  reported_by_staff_email text,
  created_by_staff_user_id uuid REFERENCES public.staff_users(id) ON DELETE SET NULL,
  created_by_staff_name text,
  created_by_staff_email text,
  updated_by_staff_user_id uuid REFERENCES public.staff_users(id) ON DELETE SET NULL,
  updated_by_staff_name text,
  updated_by_staff_email text,

  CONSTRAINT incident_reports_private_evidence_array CHECK (jsonb_typeof(evidence_items) = 'array'),
  CONSTRAINT incident_reports_public_evidence_array CHECK (jsonb_typeof(public_evidence_items) = 'array'),
  CONSTRAINT incident_reports_public_requires_summary CHECK (public_visible = false OR approved_customer_summary IS NOT NULL),
  CONSTRAINT incident_reports_public_requires_evidence CHECK (public_visible = false OR jsonb_array_length(public_evidence_items) > 0)
);

CREATE INDEX IF NOT EXISTS incident_reports_booking_idx ON public.incident_reports(booking_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS incident_reports_status_idx ON public.incident_reports(status, decision_status, updated_at DESC);
CREATE INDEX IF NOT EXISTS incident_reports_public_idx ON public.incident_reports(booking_id, public_visible, customer_visible_at DESC);
CREATE INDEX IF NOT EXISTS incident_reports_reported_by_idx ON public.incident_reports(reported_by_staff_user_id, updated_at DESC);

COMMENT ON TABLE public.incident_reports IS 'Build 202 private detailer/admin incident reports with approved customer-visible summary and evidence fields.';
COMMENT ON COLUMN public.incident_reports.private_report IS 'Private staff report. Never rendered to customer pages.';
COMMENT ON COLUMN public.incident_reports.private_admin_discussion IS 'Private admin/detailer discussion. Never rendered to customer pages.';
COMMENT ON COLUMN public.incident_reports.approved_customer_summary IS 'Admin-approved customer-facing summary shown only when public_visible=true.';
COMMENT ON COLUMN public.incident_reports.public_evidence_items IS 'Admin-selected customer-visible evidence photo objects.';
