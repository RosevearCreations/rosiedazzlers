// Rosie 872: owner-only refund exception resolution and original-browser field proof.
// Technical browser proof is NOT hardware/device attestation or an owner field sign-off.
import {requireStaffAccess,serviceHeaders,json,isUuid} from '../_lib/staff-auth.js';
const h={'Cache-Control':'no-store, private','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
const bad=(error,status=400)=>json({ok:false,build:872,error,
 original_device_accepted:false,refund_issued:false,booking_created:false},status,h);
const text=(v,n=180)=>String(v??'').trim().slice(0,n);
async function db(env,table,method='GET',query='',data){
 const r=await fetch(env.SUPABASE_URL.replace(/\/+$/,'')+'/rest/v1/'+table+query,
  {method,redirect:'error',headers:{...serviceHeaders(env),
   ...(method==='GET'?{}:{Prefer:'return=representation'})},
   ...(data===undefined?{}:{body:JSON.stringify(data)})});
 const out=await r.json().catch(()=>null);
 if(!r.ok||!Array.isArray(out))throw Error('Original private field/finance evidence unavailable');
 return out;
}
const uuid=crypto.randomUUID.bind(crypto);
async function originalDraft(env,id){
 const rows=await db(env,'rosie_detailing_intake_v868','GET',
  '?select=id,status,expires_at,private_photo_permission,private_capture_withdrawn_at,'+
  'quote_share_withdrawn_at,linked_booking_id'+
  '&id=eq.'+encodeURIComponent(id)+'&limit=2');
 return rows.length===1&&rows[0].status==='intake_draft'?rows[0]:null;
}
function hexRandom(){
 const a=crypto.getRandomValues(new Uint8Array(32));
 return [...a].map(x=>x.toString(16).padStart(2,'0')).join('');
}
async function sha(s){
 const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));
 return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
async function originalProof(data,challenge,mediaId,draftId){
 const jwk=data.public_key;
 if(!jwk||typeof jwk!=='object'||jwk.kty!=='EC'||jwk.crv!=='P-256'||
  typeof jwk.x!=='string'||typeof jwk.y!=='string'||'d' in jwk||
  !/^[A-Za-z0-9_-]{43}$/.test(jwk.x)||!/^[A-Za-z0-9_-]{43}$/.test(jwk.y))
  return {verified:false};
 const signature=text(data.signature,180);
 if(!/^[A-Za-z0-9_-]{86,90}$/.test(signature))return {verified:false};
 try{
  const bytes=Uint8Array.from(atob(signature.replace(/-/g,'+').replace(/_/g,'/')),x=>x.charCodeAt(0));
  if(bytes.length!==64)return {verified:false};
  const key=await crypto.subtle.importKey('jwk',
   {kty:'EC',crv:'P-256',x:jwk.x,y:jwk.y,ext:true},
   {name:'ECDSA',namedCurve:'P-256'},false,['verify']);
  const signed='v872:'+challenge.id+':'+draftId+':'+mediaId+':'+challenge.challenge_nonce;
  return {verified:await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},key,bytes,
    new TextEncoder().encode(signed)),keyDigest:await sha(jwk.x+'.'+jwk.y)};
 }catch{return {verified:false};}
}
export const onRequestOptions=()=>new Response(null,{status:204,headers:h});
export async function onRequest({request,env}){
 if(!['GET','POST'].includes(request.method))return bad('Unsupported method',405);
 if(!/^https:\/\//.test(env.SUPABASE_URL||'')||!env.SUPABASE_SERVICE_ROLE_KEY)
  return bad('Original Rosie authority unavailable',503);
 const raw=request.method==='POST'?await request.text().catch(()=>''):'';
 if(raw.length>5500)return bad('Request too large',413);
 let body={};
 if(request.method==='POST')try{
  body=JSON.parse(raw);if(!body||typeof body!=='object'||Array.isArray(body))throw Error();
 }catch{return bad('JSON object required');}
 const auth=await requireStaffAccess({request,env,body,capability:'manage_bookings',
  allowLegacyAdminFallback:false});
 if(!auth.ok)return auth.response;
 if(auth.auth_mode!=='session')return bad('Signed-in staff session required',403);
 const actor=text(auth.actor?.email||auth.actor?.id,140);
 if(actor.length<3)return bad('Original staff identity unavailable',403);
 const draftId=text(request.method==='GET'?
  new URL(request.url).searchParams.get('draft_id'):body.draft_id,80);
 if(!isUuid(draftId))return bad('Original draft ID required');
 try{
  const d=await originalDraft(env,draftId);
  if(!d)return bad('Original private draft not found',404);
  if(request.method==='GET'){
   const [cases,challenges,latest]=await Promise.all([
    db(env,'rosie_roadside_refund_cases_v872','GET',
     '?select=id,booking_id,issue_code,state,opened_at,owner_reviewed_at,owner_reviewed_by,resolution_note,closed_at'+
     '&draft_id=eq.'+draftId+'&order=opened_at.desc&limit=10'),
    db(env,'rosie_roadside_device_challenges_v872','GET',
     '?select=id,issued_at,expires_at,completed_at,media_id,state,owner_accepted_at,owner_accepted_by'+
     '&draft_id=eq.'+draftId+'&order=issued_at.desc&limit=8'),
    db(env,'rosie_roadside_net_deposit_checks_v871','GET',
     '?select=id,booking_id,provider,state,gross_cents,refunded_cents,net_cents,net_verified,checked_at'+
     '&draft_id=eq.'+draftId+'&order=checked_at.desc&limit=5')
   ]);
   return json({ok:true,build:872,refund_cases:cases,device_challenges:challenges,
    latest_net_checks:latest,quote_consent_withdrawn:Boolean(d.quote_share_withdrawn_at),
    original_device_accepted:challenges.some(x=>x.state==='owner_accepted'),
    original_device_hardware_attested:false,refund_issued:false},200,h);
  }
  const action=text(body.action,60);
  if(action==='open_refund_exception'){
   if(!isUuid(d.linked_booking_id))return bad('Canonical original booking required',409);
   const latest=await db(env,'rosie_roadside_net_deposit_checks_v871','GET',
    '?select=id,booking_id,state,net_verified,refunded_cents,checked_at'+
    '&draft_id=eq.'+draftId+'&booking_id=eq.'+d.linked_booking_id+
    '&order=checked_at.desc&limit=1');
   const source=latest[0];
   if(!source)return bad('Recheck original provider net deposit first',409);
   if(source.net_verified===true&&source.refunded_cents===0)
    return bad('Current verified original deposit has no refund exception',409);
   const created=await db(env,'rosie_roadside_refund_cases_v872','POST','',[{
    id:uuid(),draft_id:draftId,booking_id:d.linked_booking_id,
    source_check_id:source.id,
    issue_code:source.net_verified===true?'refund_detected':'deposit_hold',
    opened_by:actor
   }]);
   if(created.length!==1)throw Error('Duplicate or stale refund review already exists');
   return json({ok:true,build:872,case_id:created[0].id,state:'open',
    owner_review_required:true,refund_issued:false},201,h);
  }
  if(action==='review_refund_exception'){
   if(auth.actor?.is_admin!==true)return bad('Owner/Admin review authority required',403);
   const caseId=text(body.case_id,80),decision=text(body.decision,25),
    note=text(body.note,500);
   if(!isUuid(caseId)||!['review_hold','close_verified'].includes(decision)||
    note.length<12)return bad('Exact case, decision and owner reasoning required');
   const matches=await db(env,'rosie_roadside_refund_cases_v872','GET',
    '?select=id,booking_id,state&draft_id=eq.'+draftId+'&id=eq.'+caseId+'&limit=2');
   if(matches.length!==1)return bad('Original refund case not found',404);
   const latest=await db(env,'rosie_roadside_net_deposit_checks_v871','GET',
    '?select=id,booking_id,checked_at&draft_id=eq.'+draftId+
    '&booking_id=eq.'+matches[0].booking_id+'&order=checked_at.desc,id.desc&limit=1');
   if(latest.length!==1)return bad('New original provider readback required',409);
   const out=await db(env,'rpc/rosie872_review_refund_case','POST','',{
    p_case_id:caseId,p_latest_check_id:latest[0].id,
    p_actor:actor,p_decision:decision,p_note:note});
   if(out.length!==1||!['HOLD_REVIEWED','CLOSED_SOURCE_VERIFIED'].includes(out[0].outcome))
    throw Error('Owner source-bound resolution failed');
   return json({ok:true,build:872,state:out[0].outcome,
    refund_issued:false,booking_or_payment_changed:false},200,h);
  }
  if(action==='start_device_challenge'){
   if(d.quote_share_withdrawn_at||d.private_capture_withdrawn_at||
      d.private_photo_permission!==true||Date.parse(d.expires_at)<=Date.now())
    return bad('Original private capture consent is unavailable',409);
   if(body.confirm_original_device_present!==true)
    return bad('Confirm the physical roadside device is present',400);
   const jwk=body.public_key;
   if(!jwk||jwk.kty!=='EC'||jwk.crv!=='P-256'||'d' in jwk||
      !/^[A-Za-z0-9_-]{43}$/.test(jwk.x||'')||
      !/^[A-Za-z0-9_-]{43}$/.test(jwk.y||''))
    return bad('Same-browser enrolled public signing key required',400);
   const keyDigest=await sha(jwk.x+'.'+jwk.y);
   const now=Date.now(),id=uuid(),nonce=hexRandom();
   const result=await db(env,'rosie_roadside_device_challenges_v872','POST','',[{
    id,draft_id:draftId,challenge_nonce:nonce,issued_by:actor,
    public_key_digest:keyDigest,
    expires_at:new Date(now+5*60*1000).toISOString()
   }]);
   if(result.length!==1)throw Error('Original browser challenge not stored');
   return json({ok:true,build:872,challenge_id:id,nonce,
    expires_at:result[0].expires_at,
    instruction:'Capture and save a NEW private photo/video using this same browser within five minutes; then complete proof.',
    hardware_attested:false,original_device_accepted:false},201,h);
  }
  if(action==='complete_device_challenge'){
   if(d.private_capture_withdrawn_at||d.private_photo_permission!==true)
    return bad('Original private capture permission withdrawn',409);
   const challengeId=text(body.challenge_id,80),mediaId=text(body.media_id,80);
   if(!isUuid(challengeId)||!isUuid(mediaId)||body.camera_api_available!==true)
    return bad('Original on-device camera capability and private media required');
   const [challenges,medias]=await Promise.all([
    db(env,'rosie_roadside_device_challenges_v872','GET',
     '?select=id,issued_by,issued_at,expires_at,challenge_nonce,state,public_key_digest'+
     '&id=eq.'+challengeId+'&draft_id=eq.'+draftId+'&limit=2'),
    db(env,'rosie_detailing_intake_media_v868','GET',
     '?select=id,draft_id,status,verified_at,content_type'+
     '&id=eq.'+mediaId+'&draft_id=eq.'+draftId+'&limit=2')
   ]);
   const c=challenges[0],m=medias[0];
   if(challenges.length!==1||medias.length!==1||c.state!=='challenge_pending'||
     c.issued_by!==actor||Date.parse(c.expires_at)<=Date.now()||
     m.status!=='stored_private'||!m.verified_at||
     Date.parse(m.verified_at)<Date.parse(c.issued_at))
    return bad('Fresh same-session original private media/challenge evidence required',409);
   const verified=await originalProof(body,c,mediaId,draftId);
   if(verified.verified!==true||verified.keyDigest!==c.public_key_digest)
    return bad('Original enrolled browser key/signature mismatch',409);
   const patched=await db(env,'rosie_roadside_device_challenges_v872','PATCH',
    '?id=eq.'+challengeId+'&draft_id=eq.'+draftId+
    '&state=eq.challenge_pending&completed_at=is.null&expires_at=gt.'+encodeURIComponent(new Date().toISOString()),{
     completed_at:new Date().toISOString(),media_id:mediaId,
     public_key_digest:verified.keyDigest,camera_api_available:true,
     state:'browser_proof_complete'
    });
   if(patched.length!==1)throw Error('Original device challenge expired or was already used');
   return json({ok:true,build:872,proof:'same_browser_crypto_and_recent_private_media',
    state:'browser_proof_complete',owner_acceptance_pending:true,
    manufacturer_device_attested:false,original_device_accepted:false},200,h);
  }
  if(action==='owner_accept_device'){
   if(auth.actor?.is_admin!==true)return bad('Independent owner/Admin sign-off required',403);
   if(body.confirm_original_device_observed!==true||body.confirm_private_media_verified!==true)
    return bad('Explicit witnessed original-device acceptance required',400);
   const challengeId=text(body.challenge_id,80);
   if(!isUuid(challengeId))return bad('Exact device challenge required');
   const rows=await db(env,'rosie_roadside_device_challenges_v872','GET',
    '?select=id,state,completed_at,media_id&draft_id=eq.'+draftId+
    '&id=eq.'+challengeId+'&limit=2');
   if(rows.length!==1||rows[0].state!=='browser_proof_complete'||
     Date.now()-Date.parse(rows[0].completed_at)>60*60*1000)
    return bad('Fresh completed field proof required before owner sign-off',409);
   const accepted=await db(env,'rosie_roadside_device_challenges_v872','PATCH',
    '?id=eq.'+challengeId+'&draft_id=eq.'+draftId+
    '&state=eq.browser_proof_complete',{
     state:'owner_accepted',owner_accepted_by:actor,owner_accepted_at:new Date().toISOString()
    });
   if(accepted.length!==1)throw Error('Original owner acceptance was already decided');
   return json({ok:true,build:872,state:'owner_accepted',
    owner_witnessed_original_device:true,manufacturer_device_attested:false,
    booking_created:false,refund_issued:false},200,h);
  }
  return bad('Unsupported original roadmap action',405);
 }catch(e){return bad(e?.message||'Private roadside evidence unavailable',409);}
}
