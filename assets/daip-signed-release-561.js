// Build 561: cryptographic receipt verification is not an authorization to publish.
const uuid=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const ref=/^[A-Za-z0-9][A-Za-z0-9._:-]{2,100}$/;
const validRef=x=>typeof x==='string'&&ref.test(x);
const validTime=(x,now)=>{const t=Date.parse(x||'');return Number.isFinite(t)&&t>0&&t<=now+300000;};
const decode64=s=>{if(typeof s!=='string'||!/^[A-Za-z0-9_-]+={0,2}$/.test(s))return null;try{const t=s.replace(/-/g,'+').replace(/_/g,'/');return Uint8Array.from(atob(t),x=>x.charCodeAt(0));}catch{return null;}};
export async function reviewSignedDerivative561({project_id,asset_id,derivative_id,operatorReview=null,workerReceipt=null,workerSignature=null,trustedPublicKey=null,consentEvidence=null,supervisor={},now=new Date().toISOString()}={}){
 const gaps=[],clock=Date.parse(now);
 const scoped=[project_id,asset_id,derivative_id].every(x=>typeof x==='string'&&uuid.test(x));
 const operatorComplete=scoped&&operatorReview?.build===560&&operatorReview?.operator_provenance_complete===true&&operatorReview?.operator_privacy_review_complete===true&&operatorReview?.operator_consent_review_complete===true&&operatorReview?.private_derivative_present===true;
 if(!operatorComplete)gaps.push('build560_scoped_operator_acceptance_required');
 // Receipt bytes must be supplied from the trusted server's independently fetched worker output.
 const expected={project_id,asset_id,derivative_id};
 const receipt=workerReceipt;
 const bound=!!receipt&&typeof receipt==='object'&&Object.keys(expected).every(k=>receipt[k]===expected[k])
  &&validRef(receipt.worker_job_reference)&&validRef(receipt.source_checksum_reference)
  &&validRef(receipt.output_checksum_reference)&&validTime(receipt.finished_at,clock)
  &&receipt.outcome==='succeeded'&&Number.isSafeInteger(receipt.output_bytes)&&receipt.output_bytes>0;
 if(!bound)gaps.push('valid_signed_source_bound_worker_receipt_required');
 let signatureVerified=false;
 // This verifier accepts a public key only when injected by trusted server configuration.
 // Never trust a public key, claims, or receipt supplied directly from a browser.
 if(bound&&typeof workerSignature==='string'&&trustedPublicKey&&globalThis.crypto?.subtle){
  const signature=decode64(workerSignature);
  try{
   if(signature){const key=await crypto.subtle.importKey('jwk',trustedPublicKey,{name:'ECDSA',namedCurve:'P-256'},false,['verify']);
    const canonical=JSON.stringify({project_id:receipt.project_id,asset_id:receipt.asset_id,derivative_id:receipt.derivative_id,worker_job_reference:receipt.worker_job_reference,source_checksum_reference:receipt.source_checksum_reference,output_checksum_reference:receipt.output_checksum_reference,finished_at:receipt.finished_at,outcome:receipt.outcome,output_bytes:receipt.output_bytes});
    signatureVerified=await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},key,signature,new TextEncoder().encode(canonical));
   }
  }catch{signatureVerified=false;}
 }
 if(!signatureVerified)gaps.push('trusted_worker_signature_verification_required');
 const consent=!!consentEvidence&&consentEvidence.project_id===project_id&&consentEvidence.asset_id===asset_id&&consentEvidence.derivative_id===derivative_id
  &&consentEvidence.signature_verified_by_trusted_service===true&&consentEvidence.revoked===false&&consentEvidence.expired===false&&validTime(consentEvidence.checked_at,clock)
  &&validRef(consentEvidence.authority_reference);
 if(!consent)gaps.push('independently_verified_current_consent_required');
 const supervision=validRef(supervisor.reviewer_reference)&&validRef(supervisor.approval_reference)&&validTime(supervisor.reviewed_at,clock)
  &&supervisor.privacy_check_passed===true&&supervisor.derivative_inspection_passed===true&&supervisor.decision==='approve_private_acceptance';
 if(!supervision)gaps.push('supervised_private_acceptance_required');
 // Private technical acceptance can be assessed; publishing remains separate and disabled.
 const accepted=operatorComplete&&signatureVerified&&consent&&supervision;
 return Object.freeze({build:561,status:accepted?'private_derivative_technical_acceptance':'signed_evidence_acceptance_hold',
  worker_signature_verified:signatureVerified,consent_authority_reported_verified:consent,supervised_private_acceptance:supervision,
  gaps,public_release_allowed:false,public_export_allowed:false,storage_written:false,worker_dispatched:false,
  publication_executed:false,canonical_publication_hold_closed:false});
}
