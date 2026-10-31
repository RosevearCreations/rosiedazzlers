-- Build 722 REVIEW-ONLY SQL. NOT a Supabase migration. NEVER run against Production.
-- Run manually only in a deliberately selected, disposable nonproduction DB after
-- owner and independent security approvals; capture query output privately.
-- All definitions, privileges and test rows are rolled back at the end.
BEGIN;

CREATE SCHEMA IF NOT EXISTS rosie_private;
REVOKE ALL ON SCHEMA rosie_private FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS rosie_private.owner_evidence_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recorded_at timestamptz NOT NULL DEFAULT now(),
  owner_staff_user_id uuid NOT NULL,
  source_request_sha256 text NOT NULL CHECK (source_request_sha256 ~ '^[a-f0-9]{64}$'),
  owner_receipt_sha256 text NOT NULL CHECK (owner_receipt_sha256 ~ '^[a-f0-9]{64}$'),
  security_review_sha256 text NOT NULL CHECK (security_review_sha256 ~ '^[a-f0-9]{64}$'),
  current_signer_fingerprint text NOT NULL CHECK (current_signer_fingerprint ~ '^[a-f0-9]{64}$'),
  retention_expires_at timestamptz NOT NULL,
  CHECK (retention_expires_at > recorded_at),
  CHECK (retention_expires_at <= recorded_at + interval '90 days')
);

CREATE TABLE IF NOT EXISTS rosie_private.provider_source_drift_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  staff_user_id uuid NOT NULL,
  window_start_at timestamptz NOT NULL,
  window_end_at timestamptz NOT NULL,
  baseline_receipt_sha256 text NOT NULL CHECK (baseline_receipt_sha256 ~ '^[a-f0-9]{64}$'),
  current_source_sha256 text NOT NULL CHECK (current_source_sha256 ~ '^[a-f0-9]{64}$'),
  provider_origin_pin_sha256 text NOT NULL CHECK (provider_origin_pin_sha256 ~ '^[a-f0-9]{64}$'),
  provider_account_pin_sha256 text NOT NULL CHECK (provider_account_pin_sha256 ~ '^[a-f0-9]{64}$'),
  drift_status text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('none','review','critical')),
  retention_expires_at timestamptz NOT NULL,
  actor_staff_user_id uuid NOT NULL,
  server_signer_fingerprint text NOT NULL CHECK (server_signer_fingerprint ~ '^[a-f0-9]{64}$'),
  CHECK (window_end_at > window_start_at),
  CHECK (retention_expires_at > occurred_at),
  CHECK (retention_expires_at <= occurred_at + interval '90 days')
);

ALTER TABLE rosie_private.owner_evidence_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE rosie_private.provider_source_drift_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE rosie_private.owner_evidence_ledger FORCE ROW LEVEL SECURITY;
ALTER TABLE rosie_private.provider_source_drift_history FORCE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA rosie_private FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA rosie_private FROM PUBLIC, anon, authenticated;

-- Read-only inspection before rollback; inspect both the policy and Data API
-- exposed-schema configuration externally. Lack of grants is only one gate.
SELECT n.nspname AS schema_name, c.relname AS table_name,
       c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS rls_forced,
       has_schema_privilege('anon', n.oid, 'USAGE') AS anon_schema_usage,
       has_schema_privilege('authenticated', n.oid, 'USAGE') AS authenticated_schema_usage,
       has_table_privilege('anon', c.oid, 'SELECT, INSERT, UPDATE, DELETE') AS anon_table_access,
       has_table_privilege('authenticated', c.oid, 'SELECT, INSERT, UPDATE, DELETE') AS authenticated_table_access
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='rosie_private' AND c.relname IN
  ('owner_evidence_ledger','provider_source_drift_history') ORDER BY c.relname;

-- No real or synthetic customer/owner rows are inserted. No production data read.
ROLLBACK;
