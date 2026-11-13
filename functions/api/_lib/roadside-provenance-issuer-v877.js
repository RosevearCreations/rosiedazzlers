// Rosie 877: dedicated, owner-controlled Ed25519 issuer key, separate from
// Supabase/service roles, native provider HMAC, and GitHub scheduler secrets.
// Not an external witness or independent timestamping authority.
const enc=new TextEncoder();
const b64url=b=>btoa(String.fromCharCode(...new Uint8Array(b)))
 .replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const digest=async text=>b64url(await crypto.subtle.digest('SHA-256',enc.encode(text)));
const validPublic=x=>x?.kty==='OKP'&&x.crv==='Ed25519'&&
  typeof x.x==='string'&&/^[A-Za-z0-9_-]{43}$/.test(x.x);
export async function issueOwnerClosureProvenance({privateJwk,publicJwk,draftId,closureId,
  artifactDigest,nowIso=new Date().toISOString()}={}){
 if(!validPublic(publicJwk)||!validPublic(privateJwk)||
    privateJwk.x!==publicJwk.x||typeof privateJwk.d!=='string'||
    !/^[A-Za-z0-9_-]{43}$/.test(privateJwk.d)||
    !/^[a-f0-9]{64}$/.test(artifactDigest||'')||
    !/^[0-9a-f-]{36}$/i.test(draftId||'')||
    !/^[0-9a-f-]{36}$/i.test(closureId||'')||
    !Number.isFinite(Date.parse(nowIso)))return {ok:false,reason:'Pinned original Ed25519 issuer key or digest is unavailable'};
 try{
  const privateKey=await crypto.subtle.importKey('jwk',privateJwk,
   {name:'Ed25519'},false,['sign']);
  const publicKey=await crypto.subtle.importKey('jwk',publicJwk,
   {name:'Ed25519'},false,['verify']);
  const keyId='ed25519-sha256:'+await digest(publicJwk.x);
  const payload={schema:'rosie-closure-provenance-renewal-v877',
   original_artifact_sha256:artifactDigest,draft_id:draftId,closure_id:closureId,
   issued_at:nowIso,issuer_key_id:keyId,
   source_revalidated_at_issuance:true,
   external_independent_witness:false,current_payment_clearance:false,
   new_provider_delivery_not_inferred:true};
  const signature=await crypto.subtle.sign('Ed25519',privateKey,
    enc.encode(JSON.stringify(payload)));
  const verified=await crypto.subtle.verify('Ed25519',publicKey,signature,
    enc.encode(JSON.stringify(payload)));
  if(!verified)return {ok:false,reason:'Dedicated issuer signature and pinned public key do not agree'};
  return {ok:true,payload,signature_ed25519:b64url(signature),
   issuer_public_jwk:publicJwk,issuer_key_fingerprint:keyId,
   owner_key_signature_verified:true,
   independently_witnessed:false};
 }catch{return {ok:false,reason:'Original Ed25519 signing authority unavailable'};}
}
