-- Build 564: server-controlled atomic idempotency. Apply only after Build 562 migration review.
create or replace function public.daip_acceptance_insert_if_absent(
 p_project_id uuid,p_asset_id uuid,p_derivative_id uuid,p_evidence_digest text,
 p_worker_digest text,p_consent_digest text,p_authority text)
returns table(outcome text, identity_matches boolean,digest_matches boolean)
language plpgsql security invoker set search_path=public as $$
declare existing public.daip_private_acceptance_ledger%rowtype; inserted boolean;
begin
 if p_evidence_digest is null or length(p_evidence_digest)<16 or length(p_evidence_digest)>128
 or p_authority is null or length(p_authority)<3 then raise exception 'invalid evidence'; end if;
 insert into public.daip_private_acceptance_ledger
 (project_id,asset_id,derivative_id,evidence_digest,worker_receipt_digest,consent_document_digest,server_authority_reference,state)
 values(p_project_id,p_asset_id,p_derivative_id,p_evidence_digest,p_worker_digest,p_consent_digest,p_authority,'private_ledger_candidate')
 on conflict (project_id,asset_id,derivative_id,evidence_digest) do nothing
 returning true into inserted;
 if inserted is true then return query select 'inserted'::text,true,true;return;end if;
 select * into existing from public.daip_private_acceptance_ledger
 where project_id=p_project_id and asset_id=p_asset_id and derivative_id=p_derivative_id
 and evidence_digest=p_evidence_digest;
 if found then
  return query select 'existing'::text,true,
  (existing.worker_receipt_digest is not distinct from p_worker_digest
   and existing.consent_document_digest is not distinct from p_consent_digest
   and existing.server_authority_reference=p_authority);
 else return query select 'conflict'::text,false,false;end if;
end $$;
revoke all on function public.daip_acceptance_insert_if_absent(uuid,uuid,uuid,text,text,text,text) from public,anon,authenticated;
grant execute on function public.daip_acceptance_insert_if_absent(uuid,uuid,uuid,text,text,text,text) to service_role;
