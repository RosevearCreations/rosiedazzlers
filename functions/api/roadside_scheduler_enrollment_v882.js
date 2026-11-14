// Build 882: short-lived Ed25519 enrollment proof checked by the original Cloudflare signer pin.
// This is source enrollment readback, not proof of scheduling uptime or provider delivery.
import {json} from './_lib/staff-auth.js';
import {signedJob881} from './_lib/roadside-watch-source-v881.js';
import {pinnedIssuerRoster878} from './_lib/roadside-provenance-pin-v878.js';
import {validateAnchorPublic881} from './_lib/roadside-operational-v881.js';
const h={'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
const repo='RosevearCreations/rosiedazzlers';
const valid64=s=>typeof s==='string'&&/^[A-Za-z0-9_-]{86}$/.test(s);
const decoder=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
export async function verifyEnrollmentProof882(proof,signature,pin,now=Date.now()){
 if(!proof||proof.schema!=='rosie882-scheduler-enrollment-v1'||
  proof.repository!==repo||!['watch','anchor'].includes(proof.mode)||
  !/^[A-Za-z0-9_-]{43}$/.test(proof.challenge||'')||
  !/^[1-9][0-9]{0,18}$/.test(proof.run_id||'')||
  typeof proof.issued_at!=='string'||!Number.isFinite(Date.parse(proof.issued_at))||
  Math.abs(now-Date.parse(proof.issued_at))>300000||!valid64(signature))return false;
 try{
  const key=await crypto.subtle.importKey('jwk',pin,{name:'Ed25519'},false,['verify']);
  return await crypto.subtle.verify('Ed25519',key,decoder(signature),
   new TextEncoder().encode(JSON.stringify(proof)));
 }catch{return false;}
}
export async function onRequestPost({request,env}){
 let input;try{const raw=await request.text();if(raw.length>1500)throw Error('oversized');
  input=JSON.parse(raw);}catch{return json({ok:false,build:882,state:'MALFORMED_PROOF_HOLD'},400,h);}
 const mode=input?.proof?.mode;
 const anchor=mode==='anchor',watch=mode==='watch';
 if(!anchor&&!watch)return json({ok:false,build:882,state:'UNSUPPORTED_SCHEDULER_HOLD'},400,h);
 const secret=anchor?'ROSIE881_ANCHOR_JOB_SECRET':'ROSIE881_OWNER_WATCH_JOB_SECRET';
 const enabled=anchor?'ROSIE881_EXTERNAL_ANCHOR_ENABLED':'ROSIE881_OWNER_WATCH_ENABLED';
 if(env?.[enabled]!=='true'||!await signedJob881(env,request.headers.get('Authorization'),secret))
  return json({ok:false,build:882,state:'SCHEDULER_NOT_ENROLLED_HOLD'},403,h);
 let pin;try{pin=JSON.parse(env.ROSIE881_EXTERNAL_ANCHOR_PUBLIC_JWK||'null');}
 catch{return json({ok:false,build:882,state:'SIGNER_PIN_INVALID_HOLD'},503,h);}
 const roster=pinnedIssuerRoster878(env.ROSIE_CLOSURE_TRUSTED_ED25519_KEYS_JSON);
 if(!validateAnchorPublic881(pin,roster)||
  !await verifyEnrollmentProof882(input.proof,input.signature_ed25519,pin))
  return json({ok:false,build:882,state:'SIGNED_SCHEDULER_READBACK_HOLD'},409,h);
 const sha=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(input.proof.challenge));
 const challenge_sha256=Array.from(new Uint8Array(sha)).map(x=>x.toString(16).padStart(2,'0')).join('');
 return json({ok:true,build:882,state:'SIGNED_ENROLLMENT_READBACK',
  scheduler:mode,repository:repo,challenge_sha256,
  no_original_provider_delivery_claim:true,no_financial_or_issuer_mutation:true,
  not_a_replay_protected_lease:true},200,h);
}
export const onRequestOptions=()=>json({ok:false,error:'Signed bearer POST required'},405,h);
