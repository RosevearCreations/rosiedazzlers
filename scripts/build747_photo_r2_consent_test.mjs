import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {capturePolicy747,sessionMatches747} from '../functions/api/_lib/media-capture-v747.js';
import {onRequestPost as sign} from '../functions/api/detailer/media_upload_url.js';
import {onRequestPost as commit} from '../functions/api/detailer/media_post.js';
import {onRequestPost as recover} from '../functions/api/detailer/media_recovery_v747.js';
import {onRequestPost as savePublic} from '../functions/api/admin/photo_library_save.js';

const origin='https://rosiedazzlers.ca',bookingId='dab89e67-cc92-4b6a-832f-64b8d5f22842',staffId='ac697b64-72f5-4ed5-bbaa-c761bdf8c82d';
const env={SUPABASE_URL:'https://mock-storage.invalid',SUPABASE_SERVICE_ROLE_KEY:'test-only'};
const actor={id:staffId,full_name:'Rosie Detailer',email:'staff@example.invalid',role_code:'detailer',is_active:true,can_manage_bookings:true};
let intake={id:'onsite',booking_id:bookingId,updated_at:'2026-11-02T10:01:00Z'},consent='internal_job_evidence';
let sessions=[],media=[],events=[],objectState='present',insertCount=0,auditWrites=0,commitRace=false;
const privacy={faces_plates_addresses_checked:true,finding:'sensitive_private'};
const originalHash='f'.repeat(64);
const req=(leaf,body,opts={})=>({env,request:new Request(`${origin}/api/${leaf}`,{method:'POST',headers:{Origin:opts.origin||origin,'Content-Type':'application/json',...(opts.cookie===false?{}:{Cookie:'rd_staff_session=test'})},body:JSON.stringify(body)})});
const respond=rows=>Response.json(rows);
const realFetch=globalThis.fetch;
globalThis.fetch=async(input,options={})=>{
  const url=new URL(input),method=options.method||'GET',table=url.pathname.split('/').pop();
  assert.equal(url.origin,env.SUPABASE_URL,'Mock must never contact a provider');
  if(url.pathname.includes('/storage/v1/object/upload/sign/'))return respond({signedURL:'/object/upload/signed?token=test'});
  if(url.pathname.includes('/storage/v1/object/authenticated/'))return new Response(null,{status:objectState==='present'?200:objectState==='missing'?404:503,headers:objectState==='present'?{'Content-Length':'132'}:{}});
  if(url.pathname.includes('/storage/v1/object/sign/'))return respond({signedURL:'/object/sign/preview?token=test'});
  if(table==='staff_auth_sessions')return respond([{id:'session',expires_at:'2030-01-01T00:00:00Z',staff_user:actor}]);
  if(table==='bookings')return respond([{id:bookingId,assigned_staff_user_id:staffId,assigned_staff_email:actor.email}]);
  if(table==='jobsite_intake')return respond([intake]);
  if(table==='booking_events'){
    if(method==='GET')return url.searchParams.get('event_type')==='eq.detailer_original_photo_v747'?respond(events.filter(row=>row.event_type==='detailer_original_photo_v747')):
      respond([{id:'consent-receipt',event_type:'detailer_onsite_setup_v746',payload:{intake_revision:intake.updated_at,photo_consent:consent}}]);
    auditWrites++;events.push(...(Array.isArray(JSON.parse(options.body))?JSON.parse(options.body):[JSON.parse(options.body)]));return respond([]);
  }
  if(table==='live_upload_sessions'){
    if(method==='GET')return respond(sessions.filter(row=>`eq.${row.id}`===url.searchParams.get('id')));
    if(method==='POST'){
      const row=JSON.parse(options.body)[0];sessions.push({...row,status:'prepared',updated_at:'2026-11-02T11:00:00Z'});return respond([]);
    }
    if(method==='PATCH'){
      const row=sessions.find(s=>`eq.${s.id}`===url.searchParams.get('id'));
      if(!row)return respond([]);
      if(commitRace&&JSON.parse(options.body).status==='committing')return respond([]);
      if(url.searchParams.has('updated_at')&&url.searchParams.get('updated_at')!==`eq.${row.updated_at}`)return respond([]);
      if(url.searchParams.has('status')){
        const expected=url.searchParams.get('status');
        if(expected.startsWith('in.')&&!['prepared','uploading','failed'].includes(row.status)||expected==='eq.committing'&&row.status!=='committing')return respond([]);
      }
      Object.assign(row,JSON.parse(options.body));return respond([{...row}]);
    }
  }
  if(table==='job_media'){
    if(method==='GET')return url.searchParams.has('upload_session_id')?respond(media.filter(row=>`eq.${row.upload_session_id}`===url.searchParams.get('upload_session_id'))):respond(media.filter(row=>['arrival','pre_existing'].includes(row.stage)));
    insertCount++;const row={id:`media-${insertCount}`,...JSON.parse(options.body)[0]};media.push(row);return respond([row]);
  }
  throw new Error(`Unexpected mock ${method} ${url.pathname}`);
};

try{
  const basic={booking_id:bookingId,filename:'original.jpg',content_type:'image/jpeg',file_size_bytes:132,media_kind:'image',stage:'arrival',visibility:'internal',privacy_review:privacy};
  assert.equal(capturePolicy747({...basic,audience:'customer'}).ok,false);
  assert.equal(capturePolicy747({...basic,publication_approval:true}).ok,false);
  assert.equal(capturePolicy747({...basic,privacy_review:{finding:'clear'}}).ok,false);
  assert.equal(capturePolicy747(basic).ok,true);
  assert.equal((await sign(req('detailer/media_upload_url',basic,{cookie:false}))).status,401);
  assert.equal((await sign(req('detailer/media_upload_url',basic,{origin:'https://other.invalid'}))).status,403);
  consent='declined';assert.equal((await sign(req('detailer/media_upload_url',basic))).status,409);
  assert.equal(sessions.length,0,'No session or signed upload on declined consent');
  consent='internal_job_evidence';
  let response=await sign(req('detailer/media_upload_url',basic));
  assert.equal(response.status,200,await response.clone().text());const signed=await response.json();
  assert.equal(signed.public_url,null);assert.equal(signed.public_use_allowed,false);
  assert.match(signed.path,new RegExp(`^jobs/${bookingId}/v747/arrival/`));
  assert.equal(sessions.length,1);
  const mediaBody={booking_id:bookingId,kind:'photo',caption:'Arrival original',audience:'internal',stage:'arrival',storage_bucket:signed.bucket,storage_path:signed.path,content_type:basic.content_type,file_size_bytes:132,upload_session_id:signed.upload_session_id,original_sha256:originalHash,privacy_review:privacy};
  assert.equal(sessionMatches747(sessions[0],mediaBody,actor),true);
  assert.equal((await commit(req('detailer/media_post',{...mediaBody,audience:'customer'}))).status,409,'No public posting of originals');
  assert.equal((await commit(req('detailer/media_post',{...mediaBody,storage_path:'jobs/foreign.jpg'}))).status,409);
  objectState='missing';assert.equal((await commit(req('detailer/media_post',mediaBody))).status,409,'Missing original blocks insert');
  assert.equal(media.length,0);
  objectState='present';commitRace=true;assert.equal((await commit(req('detailer/media_post',mediaBody))).status,409,'Stale CAS holds commit');commitRace=false;
  response=await commit(req('detailer/media_post',mediaBody));
  assert.equal(response.status,200,await response.clone().text());
  const saved=await response.json();assert.equal(saved.private_capture,true);
  assert.equal(media.length,1);assert.equal(media[0].visibility,'internal');assert.equal(media[0].gallery_reuse_status,'not_queued');
  const receipts=events.filter(row=>row.event_type==='detailer_original_photo_v747');
  assert.equal(receipts.length,1);assert.equal(receipts[0].payload.original_sha256,originalHash);assert.equal(receipts[0].payload.thumbnail_storage_path,null);
  assert.equal(receipts[0].payload.marketing_approved,false);assert.equal(receipts[0].payload.privacy_review.finding,'sensitive_private');
  response=await commit(req('detailer/media_post',mediaBody));assert.equal(response.status,200);assert.equal((await response.json()).already_saved,true);
  assert.equal(insertCount,1,'A replay must not duplicate job media');assert.equal(auditWrites,2,'No duplicate provenance receipts');
  response=await recover(req('detailer/media_recovery_v747',{booking_id:bookingId,upload_session_id:signed.upload_session_id,action:'inspect'}));
  assert.equal((await response.json()).state,'media_saved');
  const other=await sign(req('detailer/media_upload_url',{...basic,stage:'final'}));
  const second=await other.json();
  response=await recover(req('detailer/media_recovery_v747',{booking_id:bookingId,upload_session_id:second.upload_session_id,action:'inspect'}));
  assert.equal((await response.json()).state,'uploaded_unregistered');
  objectState='missing';response=await recover(req('detailer/media_recovery_v747',{booking_id:bookingId,upload_session_id:second.upload_session_id,action:'inspect'}));
  assert.equal((await response.json()).state,'file_missing');
  objectState='present';response=await recover(req('detailer/media_recovery_v747',{booking_id:bookingId,upload_session_id:second.upload_session_id,action:'reopen'}));
  assert.equal(response.status,409,'Fresh/in-flight uploads cannot be reopened');
  response=await commit(req('detailer/media_post',{...mediaBody,upload_session_id:second.upload_session_id,stage:'final',storage_path:second.path}));
  assert.equal(response.status,409,'Before and after cannot reuse the same original');
  assert.equal((await response.json()).code,'authentic_photo_conflict');
  consent='declined';response=await commit(req('detailer/media_post',{...mediaBody,upload_session_id:second.upload_session_id,stage:'final',storage_path:second.path}));
  assert.equal(response.status,409,'Revoked private consent blocks new commit');consent='internal_job_evidence';
  response=await savePublic(req('admin/photo_library_save',{id:'media',expected_updated_at:'2026-11-02T11:00:00Z',expected_source_status:'needs_review',source_status:'active',publication_approval:true,license_notes:'Customer public permission verified'}));
  assert.equal(response.status,409);assert.equal((await response.json()).code,'media_privacy_review_required');
  const ui=readFileSync(new URL('../apps/detailer/live-job-module.js',import.meta.url),'utf8');
  for(const token of ['capture747Privacy','inspect747Upload','sessionStorage','originalHash747','privacy_review','private original'])assert.ok(ui.includes(token),`Detailer UI missing ${token}`);
  const studio=readFileSync(new URL('../admin-photo-studio.html',import.meta.url),'utf8');
  for(const token of ['R2_CHECKPOINT747','restoreR2747','publicPrivacy747','authentic747','r2_etag'])assert.ok(studio.includes(token),`R2 public review missing ${token}`);
  console.log('Build 747 PASS: private consent, original provenance, object check, idempotent commit, stale claim, manual recovery, R2 checkpoint and public redaction gate.');
}finally{globalThis.fetch=realFetch;}
