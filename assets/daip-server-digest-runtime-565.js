// Build 565: trusted-server digest and runtime verification only. No publishing.
const ID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const REF=/^[A-Za-z0-9][A-Za-z0-9._:-]{2,100}$/;
const hex=bytes=>Array.from(new Uint8Array(bytes),x=>x.toString(16).padStart(2,'0')).join('');
export async function deriveAcceptanceDigest565({scope,worker,consent,acceptance,cryptoImpl=globalThis.crypto}={}){
 if(![scope?.project_id,scope?.asset_id,scope?.derivative_id].every(x=>typeof x==='string'&&ID.test(x)))throw Error('invalid scope');
 if(!worker||!consent||!acceptance||worker.signature_verified_by_server!==true||
 consent.signature_verified_by_server!==true||consent.provider_verified_by_server!==true||
 consent.revoked!==false||acceptance.status!=='private_derivative_technical_acceptance')throw Error('unverified provider or acceptance');
 for(const item of [worker,consent,acceptance])for(const k of ['project_id','asset_id','derivative_id'])
  if(item[k]!==scope[k])throw Error('cross-project evidence');
 if(![worker.receipt_digest,consent.document_digest].every(x=>typeof x==='string'&&REF.test(x)))throw Error('invalid receipt digest');
 if(!cryptoImpl?.subtle?.digest)throw Error('trusted crypto unavailable');
 const input=JSON.stringify([scope.project_id,scope.asset_id,scope.derivative_id,worker.receipt_digest,consent.document_digest,acceptance.status]);
 const digest=hex(await cryptoImpl.subtle.digest('SHA-256',new TextEncoder().encode(input)));
 return Object.freeze({evidence_digest:digest,worker_receipt_digest:worker.receipt_digest,consent_document_digest:consent.document_digest,public_release_allowed:false});
}
export function runtimeAcceptance565({configured,providersVerified,migrationApplied,dbReplayVerified,cloudflareExactShaVerified,privateOperatorVerified}={}){
 const gaps=[];
 if(configured!==true)gaps.push('production_provider_credentials_unverified');
 if(providersVerified!==true)gaps.push('live_worker_and_consent_providers_unverified');
 if(migrationApplied!==true)gaps.push('production_migration_not_verified');
 if(dbReplayVerified!==true)gaps.push('atomic_replay_not_verified');
 if(cloudflareExactShaVerified!==true)gaps.push('cloudflare_exact_sha_not_verified');
 if(privateOperatorVerified!==true)gaps.push('private_operator_acceptance_not_verified');
 return Object.freeze({status:gaps.length?'HOLD':'private_runtime_acceptance_only',gaps,public_release_allowed:false});
}
