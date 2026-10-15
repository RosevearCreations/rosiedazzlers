// Build 563: server-only adapters; no public release or browser-origin authority.
// Configure providers only from trusted server environment, never request bodies.
import {build562LedgerDecision} from './daip-trusted-consent-ledger-562.js';
const UUID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const safe=x=>typeof x==='string'&&UUID.test(x);
export async function reconcilePrivateAcceptance563({scope,workerAdapter,consentAdapter,privateAcceptance,ledger,now=new Date().toISOString()}={}){
 const p=scope?.project_id,a=scope?.asset_id,d=scope?.derivative_id;
 if(![p,a,d].every(safe))return {ok:false,status:'hold',reason:'invalid_scope',written:false,public_release_allowed:false};
 if(typeof workerAdapter?.verify!=='function'||typeof consentAdapter?.verify!=='function'||typeof ledger?.insertIfAbsent!=='function')
  return {ok:false,status:'hold',reason:'trusted_server_adapters_missing',written:false,public_release_allowed:false};
 let worker,consent;
 try{
  // Adapters must independently authenticate sources. No client attestations accepted.
  [worker,consent]=await Promise.all([workerAdapter.verify({project_id:p,asset_id:a,derivative_id:d}),consentAdapter.verify({project_id:p,asset_id:a,derivative_id:d})]);
 }catch{return {ok:false,status:'hold',reason:'provider_verification_failed',written:false,public_release_allowed:false};}
 const result=build562LedgerDecision({project_id:p,asset_id:a,derivative_id:d,worker,consent,privateAcceptance,now});
 if(!result.ready_for_trusted_server_persistence)return {ok:false,status:'hold',gaps:result.gaps,written:false,public_release_allowed:false};
 // Persistence must use the SQL UNIQUE constraint; conflict is accepted only when existing digest is identical.
 try{
  const row=await ledger.insertIfAbsent({project_id:p,asset_id:a,derivative_id:d,state:'private_ledger_candidate',
   worker_receipt_digest:result.worker_receipt_digest,consent_document_digest:result.consent_document_digest});
  if(!row||row.identity_matches!==true||row.digest_matches!==true||!['inserted','existing'].includes(row.outcome))
   return {ok:false,status:'hold',reason:'ledger_conflict_or_unverified_write',written:false,public_release_allowed:false};
  return {ok:true,status:'private_recorded_publication_hold',written:row.outcome==='inserted',idempotent:row.outcome==='existing',public_release_allowed:false};
 }catch{return {ok:false,status:'hold',reason:'ledger_unavailable',written:false,public_release_allowed:false};}
}
