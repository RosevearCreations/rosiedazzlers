// Rosie 878: verify the original owner's Build 877 Ed25519 sidecar against
// public keys pinned by the original server operator, NEVER the uploaded file.
const enc=new TextEncoder();
const b64url=bytes=>btoa(String.fromCharCode(...new Uint8Array(bytes)))
 .replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const validKey=k=>k?.kty==='OKP'&&k.crv==='Ed25519'&&
 typeof k.x==='string'&&/^[A-Za-z0-9_-]{43}$/.test(k.x);
const validIso=s=>typeof s==='string'&&Number.isFinite(Date.parse(s));
const denied=reason=>({ok:false,state:'PINNED_PROVENANCE_HOLD',
 signed_provenance_verified:false,reason,external_independent_witness:false,
 current_payment_clearance:false});
export async function pinnedKeyId878(publicJwk){
 if(!validKey(publicJwk))return null;
 const digest=await crypto.subtle.digest('SHA-256',enc.encode(publicJwk.x));
 return 'ed25519-sha256:'+b64url(digest);
}
export function pinnedIssuerRoster878(raw,{fallbackPublicJwk=null}={}){
 let rows;
 try{rows=typeof raw==='string'&&raw.trim()?JSON.parse(raw):null;}
 catch{return {ok:false,reason:'Original operator pinned-key registry is not valid JSON'};}
 if(!rows&&validKey(fallbackPublicJwk))
  rows=[{status:'active',public_jwk:fallbackPublicJwk}];
 if(!Array.isArray(rows)||rows.length<1||rows.length>6)
  return {ok:false,reason:'Original operator pinned-key roster is missing or outside bounds'};
 const seen=new Set();let active=0;
 for(const row of rows){
  if(!validKey(row?.public_jwk)||seen.has(row.public_jwk.x)||
   !['active','previous','revoked'].includes(row.status))
   return {ok:false,reason:'Duplicate, malformed or unclassified original issuer key'};
  seen.add(row.public_jwk.x);
  if(row.status==='active')active++;
  if(row.status==='previous'&&(!validIso(row.issued_before)||
    !validIso(row.verify_until)||Date.parse(row.verify_until)<=Date.parse(row.issued_before)))
   return {ok:false,reason:'Previous issuer key needs explicit issuance cutoff and verification expiry'};
 }
 if(active!==1)return {ok:false,reason:'Exactly one original active pinned issuer key required'};
 return {ok:true,rows,rotation_staged:rows.some(x=>x.status==='previous'),
  revoked_pins:rows.filter(x=>x.status==='revoked').length};
}
export async function verifyPinnedProvenance878({sidecar,artifact,roster,
 nowMs=Date.now()}={}){
 if(!roster?.ok)return denied(roster?.reason||'Original pinned operator issuer roster unavailable');
 const p=sidecar?.payload;
 if(!p||p.schema!=='rosie-closure-provenance-renewal-v877'||
    p.source_revalidated_at_issuance!==true||
    p.external_independent_witness!==false||
    p.current_payment_clearance!==false||
    p.new_provider_delivery_not_inferred!==true||
    !/^[a-f0-9]{64}$/.test(p.original_artifact_sha256||'')||
    p.original_artifact_sha256!==artifact?.integrity?.digest_sha256||
    p.draft_id!==artifact?.closure?.draft_id||
    p.closure_id!==artifact?.closure?.id||
    !validIso(p.issued_at)||Date.parse(p.issued_at)>nowMs+300000)
  return denied('Sidecar claims, original closure identity, digest or issued-at validity do not match');
 const rawSig=sidecar?.signature_ed25519;
 if(typeof rawSig!=='string'||!/^[A-Za-z0-9_-]{86}$/.test(rawSig))
  return denied('Original Ed25519 signature is missing or invalid');
 const matched=[];
 for(const row of roster.rows){
  const kid=await pinnedKeyId878(row.public_jwk);
  if(kid===p.issuer_key_id)matched.push({...row,kid});
 }
 if(matched.length!==1)return denied('Original signature issuer is not in the trusted pinned key roster');
 const key=matched[0],issued=Date.parse(p.issued_at);
 if(key.status==='revoked')return denied('Original signing key is revoked; existing signatures require owner review');
 if(key.status==='previous'&&
   (issued>Date.parse(key.issued_before)||nowMs>Date.parse(key.verify_until)))
  return denied('Original previous signing key is outside its rotation verification window');
 if(sidecar.issuer_public_jwk&&
  (!validKey(sidecar.issuer_public_jwk)||sidecar.issuer_public_jwk.x!==key.public_jwk.x))
  return denied('Sidecar public key does not match independently pinned issuer');
 try{
  const verifier=await crypto.subtle.importKey('jwk',{kty:'OKP',crv:'Ed25519',x:key.public_jwk.x},
   {name:'Ed25519'},false,['verify']);
  const raw=rawSig.replace(/-/g,'+').replace(/_/g,'/');
  const decoded=Uint8Array.from(atob(raw+'='.repeat((4-raw.length%4)%4)),c=>c.charCodeAt(0));
  if(decoded.length!==64||!await crypto.subtle.verify('Ed25519',verifier,decoded,
    enc.encode(JSON.stringify(p))))
   return denied('Pinned original issuer signature verification failed');
  return {ok:true,state:'PINNED_PROVENANCE_VERIFIED',
   signed_provenance_verified:true,original_artifact_source_revalidated_by_caller:true,
   issuer_key_id:key.kid,key_status:key.status,
   rotation_readiness:key.status==='previous'?'PREVIOUS_PIN_WITHIN_GRACE':
     roster.rotation_staged?'ACTIVE_PIN_WITH_PREVIOUS_READY':'ACTIVE_PIN_ONLY',
   original_signature_created_at:p.issued_at,
   external_independent_witness:false,current_payment_clearance:false,
   no_new_signature_or_payment_created:true};
 }catch{return denied('Original Ed25519 verifier or signature is unavailable');}
}
