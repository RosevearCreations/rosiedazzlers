import {signEvidenceReceipt716} from './quote-followup-signature-v716.mjs';

// Audits a *server* key only. It cannot manufacture independent custody or a witness.
export async function signerCustodyAudit717(env,cryptoProvider=globalThis.crypto){
  const base={algorithm:'Ed25519',status:'unconfigured',server_signature_test_passed:false,
    independent_custodian_verified:false,independent_witness_receipt_present:false,
    proof_b_authorized:false,signing_available:false};
  if(!env?.ROSIE_FOLLOWUP_EXPORT_ED25519_PRIVATE_JWK||!env?.ROSIE_FOLLOWUP_EXPORT_SIGNER_ID)
    return base;
  try{
    const test=await signEvidenceReceipt716({kind:'rosie_server_signer_self_test',build:717},env,cryptoProvider);
    const key=await cryptoProvider.subtle.importKey('jwk',test.public_key_jwk,
      {name:'Ed25519'},false,['verify']);
    const decode=value=>Uint8Array.from(atob(value),c=>c.charCodeAt(0));
    const valid=await cryptoProvider.subtle.verify('Ed25519',key,
      decode(test.signature_base64),decode(test.receipt_base64));
    if(!valid)throw Error('Signature verification failed');
    const publicBytes=new TextEncoder().encode(JSON.stringify(test.public_key_jwk));
    const digest=await cryptoProvider.subtle.digest('SHA-256',publicBytes);
    const thumbprint=[...new Uint8Array(digest)].map(v=>v.toString(16).padStart(2,'0')).join('');
    return {...base,status:'server_key_self_test_passed',server_signature_test_passed:true,
      signing_available:true,signer_id:test.signer_id,public_key_sha256:thumbprint,
      audit_checked_at:new Date().toISOString()};
  }catch{return {...base,status:'invalid_or_unreadable_server_key'};}
}
