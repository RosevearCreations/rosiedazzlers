-- Build 562 append-only evidence ledger. Apply manually only after production DB review.
create table if not exists public.daip_private_acceptance_ledger (
 id uuid primary key default gen_random_uuid(),
 project_id uuid not null,
 asset_id uuid not null,
 derivative_id uuid not null,
 assessment_version integer not null default 562 check (assessment_version=562),
 state text not null default 'hold' check (state in ('hold','private_ledger_candidate')),
 worker_receipt_digest text,
 consent_document_digest text,
 evidence_digest text not null,
 server_authority_reference text not null,
 created_at timestamptz not null default now(),
 unique (project_id,asset_id,derivative_id,evidence_digest),
 check (length(evidence_digest) between 16 and 128),
 check (length(server_authority_reference) between 3 and 101)
);
alter table public.daip_private_acceptance_ledger enable row level security;
revoke all on public.daip_private_acceptance_ledger from anon, authenticated;
-- Service role access is managed by the existing server-side service credential.
create or replace function public.daip_private_acceptance_ledger_immutable()
returns trigger language plpgsql as $$
begin
 raise exception 'Private acceptance evidence is append-only';
end $$;
drop trigger if exists daip_private_acceptance_ledger_no_mutation on public.daip_private_acceptance_ledger;
create trigger daip_private_acceptance_ledger_no_mutation
 before update or delete on public.daip_private_acceptance_ledger
 for each row execute function public.daip_private_acceptance_ledger_immutable();
