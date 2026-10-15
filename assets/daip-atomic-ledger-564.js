// Server-only DB adapter. Never expose service role credentials to browser.
const uuid=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const digest=/^[A-Za-z0-9._:-]{16,128}$/;
export function createAtomicAcceptanceLedger564({url,serviceRoleKey,authority,fetchImpl=fetch}={}){
 if(typeof url!=='string'||!/^https:\/\/[^/]+\.supabase\.co\/?$/.test(url)
  ||typeof serviceRoleKey!=='string'||serviceRoleKey.length<24
  ||typeof authority!=='string'||!/^[A-Za-z0-9._:-]{3,101}$/.test(authority))return null;
 return Object.freeze({async insertIfAbsent({project_id,asset_id,derivative_id,evidence_digest,worker_receipt_digest,consent_document_digest}={}){
  if(![project_id,asset_id,derivative_id].every(x=>typeof x==='string'&&uuid.test(x))
   ||typeof evidence_digest!=='string'||!digest.test(evidence_digest)
   ||typeof worker_receipt_digest!=='string'||!digest.test(worker_receipt_digest)
   ||typeof consent_document_digest!=='string'||!digest.test(consent_document_digest))
   throw Error('invalid bounded acceptance evidence');
  const response=await fetchImpl(url.replace(/\/$/,'')+'/rest/v1/rpc/daip_acceptance_insert_if_absent',{
   method:'POST',headers:{apikey:serviceRoleKey,Authorization:'Bearer '+serviceRoleKey,'Content-Type':'application/json','Cache-Control':'no-store'},
   body:JSON.stringify({p_project_id:project_id,p_asset_id:asset_id,p_derivative_id:derivative_id,
    p_evidence_digest:evidence_digest,p_worker_digest:worker_receipt_digest,p_consent_digest:consent_document_digest,p_authority:authority})
  });
  if(!response.ok)throw Error('private acceptance persistence unavailable');
  const data=await response.json(),row=Array.isArray(data)&&data.length===1?data[0]:null;
  if(!row||!['inserted','existing','conflict'].includes(row.outcome))throw Error('invalid ledger acknowledgement');
  return {outcome:row.outcome,identity_matches:row.identity_matches===true,digest_matches:row.digest_matches===true};
 }});
}
export function inspectProviderEnvironment564(env){
 const missing=[];
 for(const key of ['SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','DAIP_WORKER_IDENTITY_PROVIDER_URL','DAIP_WORKER_IDENTITY_PROVIDER_TOKEN','DAIP_CONSENT_PROVIDER_URL','DAIP_CONSENT_PROVIDER_TOKEN','DAIP_LEDGER_AUTHORITY_REFERENCE']){
  if(typeof env?.[key]!=='string'||!env[key].trim())missing.push(key);
 }
 return Object.freeze({configured:missing.length===0,missing,credentials_disclosed:false,live_probe_performed:false,
  status:missing.length?'provider_configuration_hold':'configured_unverified_runtime_hold'});
}
