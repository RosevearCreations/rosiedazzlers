const encoder=new TextEncoder();
const b64=bytes=>{
  let output='';for(let i=0;i<bytes.length;i+=8192)
    output+=String.fromCharCode(...bytes.slice(i,i+8192));
  return btoa(output);
};

export function signingReady716(env){
  return Boolean(env?.ROSIE_FOLLOWUP_EXPORT_ED25519_PRIVATE_JWK&&
    env?.ROSIE_FOLLOWUP_EXPORT_SIGNER_ID);
}

// Signed *server-issued export envelope*, not independently witnessed custody.
// Keep key material in a Cloudflare secret, never in source or client responses.
export async function signEvidenceReceipt716(receipt,env,cryptoProvider=globalThis.crypto){
  if(!signingReady716(env))throw Error('Optional export signing is not configured.');
  const jwk=JSON.parse(env.ROSIE_FOLLOWUP_EXPORT_ED25519_PRIVATE_JWK);
  if(jwk?.kty!=='OKP'||jwk?.crv!=='Ed25519'||!jwk.x||!jwk.d)
    throw Error('Invalid configured Ed25519 signing key.');
  const key=await cryptoProvider.subtle.importKey('jwk',jwk,{name:'Ed25519'},false,['sign']);
  const bytes=encoder.encode(JSON.stringify(receipt));
  const signed=await cryptoProvider.subtle.sign('Ed25519',key,bytes);
  return {type:'rosie_followup_export_signed_envelope',schema:1,
    receipt_base64:b64(bytes),signature_base64:b64(new Uint8Array(signed)),
    signature_algorithm:'Ed25519',signer_id:String(env.ROSIE_FOLLOWUP_EXPORT_SIGNER_ID).slice(0,100),
    public_key_jwk:{kty:'OKP',crv:'Ed25519',x:jwk.x},
    metadata:{signature_verified_by_export_service:true,
      independently_custodied_or_witnessed:false,independent_proof_b:false,
      grants_consent:false,closes_audit:false}};
}
