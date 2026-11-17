-- Build 905 follow-up: Supabase service_role may inherit broad default table grants.
-- Restrict this evidence table explicitly to SELECT + INSERT; immutable triggers remain.
revoke all on table public.rosie_manual_contact_evidence_v905 from service_role;
grant select,insert on table public.rosie_manual_contact_evidence_v905 to service_role;
