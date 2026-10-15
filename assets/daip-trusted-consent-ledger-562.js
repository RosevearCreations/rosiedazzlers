// Build 562: immutable, source-bound ledger assessment. No browser-trusted attestations.
const UUID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const REF=/^[A-Za-z0-9][A-Za-z0-9._:-]{2,100}$/;
const vref=x=>typeof x==='string'&&REF.test(x);
export function build562LedgerDecision({project_id,asset_id,derivative_id,worker={},consent={},privateAcceptance={},previous=null,now=new Date().toISOString()}={}){
 const gaps=[],clock=Date.parse(now),scoped=[project_id,asset_id,derivative_id].every(x=>typeof x==='string'&&UUID.test(x));
 if(!scoped||!Number.isFinite(clock))gaps.push('valid_scope_and_clock_required');
 const scope={project_id,asset_id,derivative_id};
 const tied=x=>x&&Object.keys(scope).every(k=>x[k]===scope[k]);
 const trustedWorker=tied(worker)&&worker.signature_verified_by_server===true&&worker.key_registered_by_server===true
   &&vref(worker.key_id)&&vref(worker.receipt_digest)&&vref(worker.worker_job_reference)
   &&Number.isFinite(Date.parse(worker.verified_at))&&Date.parse(worker.verified_at)<=clock+300000;
 if(!trustedWorker)gaps.push('trusted_server_worker_receipt_required');
 const trustedConsent=tied(consent)&&consent.provider_verified_by_server===true&&consent.signature_verified_by_server===true
   &&consent.revoked===false&&consent.scope==='specific_derivative'&&vref(consent.document_digest)
   &&vref(consent.provider_reference)&&Number.isFinite(Date.parse(consent.expires_at))
   &&Date.parse(consent.expires_at)>clock&&Number.isFinite(Date.parse(consent.verified_at))
   &&Date.parse(consent.verified_at)<=clock+300000;
 if(!trustedConsent)gaps.push('trusted_current_consent_provider_attestation_required');
 const accepted=tied(privateAcceptance)&&privateAcceptance.build===561&&privateAcceptance.status==='private_derivative_technical_acceptance'
   &&privateAcceptance.public_release_allowed===false&&vref(privateAcceptance.supervisor_reference);
 if(!accepted)gaps.push('supervised_private_acceptance_required');
 const predecessor=previous===null||previous?.status==='hold'&&previous?.project_id===project_id
   &&previous?.asset_id===asset_id&&previous?.derivative_id===derivative_id;
 if(!predecessor)gaps.push('conflicting_or_advanced_ledger_entry');
 const ready=gaps.length===0;
 return Object.freeze({build:562,project_id:scoped?project_id:null,asset_id:scoped?asset_id:null,
 derivative_id:scoped?derivative_id:null,status:ready?'private_ledger_candidate':'hold',
 ready_for_trusted_server_persistence:ready,gaps,
 worker_receipt_digest:trustedWorker?worker.receipt_digest:null,consent_document_digest:trustedConsent?consent.document_digest:null,
 public_release_allowed:false,public_export_allowed:false,db_written:false,storage_written:false,canonical_publication_hold_closed:false});
}
