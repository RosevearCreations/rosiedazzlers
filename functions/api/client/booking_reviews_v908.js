// Build 908: session-owned booking snapshots, sent quote and private-media review receipts.
// No private storage URL, photo path, token, payment-session URL, draft quote, or consent change is returned.
import {getCurrentCustomerSession,serviceHeaders} from '../_lib/customer-session.js';
import {UUID908,ownsBooking908,safeBooking908,safeQuote908,revision908,allowedReview908,summarizeMedia908} from '../_lib/customer-account-review-v908.js';
const send=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{
 'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store',
 'Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','Vary':'Cookie'}});
const no=()=>send({ok:false,error:'Method not allowed.'},405);
export const onRequestOptions=no,onRequestPut=no,onRequestDelete=no;
async function identity(request,env){
 if(!env?.SUPABASE_URL||!env?.SUPABASE_SERVICE_ROLE_KEY)throw Error('Configuration missing');
 const current=await getCurrentCustomerSession({request,env}),p=current?.customer_profile;
 if(!p?.is_active||!UUID908.test(String(p.id||''))||typeof p.email!=='string')return null;
 return {id:p.id,email:p.email.trim().toLowerCase()};
}
async function rows(env,query){
 const response=await fetch(env.SUPABASE_URL.replace(/\/+$/,'')+'/rest/v1/'+query,{
  headers:serviceHeaders(env),cache:'no-store'});
 if(!response.ok)throw Error('Original source readback unavailable');
 const data=await response.json();
 if(!Array.isArray(data))throw Error('Invalid original readback');
 return data;
}
const inList=ids=>'in.('+ids.join(',')+')';
async function workspace(env,p){
 const bookingCols='id,customer_profile_id,customer_email,created_at,service_date,start_slot,status,job_status,package_code,vehicle_size,price_total_cents,deposit_cents,detailing_completed_at';
 const [direct,legacy,quotes,receipts]=await Promise.all([
  rows(env,'bookings?select='+bookingCols+'&customer_profile_id=eq.'+p.id+'&order=created_at.desc&limit=60'),
  rows(env,'bookings?select='+bookingCols+'&customer_profile_id=is.null&customer_email=eq.'+encodeURIComponent(p.email)+'&order=created_at.desc&limit=60'),
  rows(env,'quote_proposal_drafts?select=id,title,status,acceptance_status,sent_at,updated_at,accepted_at,declined_at,terms_expires_at,lead_id&customer_email=eq.'+encodeURIComponent(p.email)+'&sent_at=not.is.null&order=sent_at.desc&limit=40'),
  rows(env,'customer_review_receipts_908?select=id,subject_kind,subject_id,source_revision,reviewed_at&customer_profile_id=eq.'+p.id+'&order=reviewed_at.desc&limit=150')
 ]);
 const bookings=[...new Map([...direct,...legacy].filter(b=>ownsBooking908(b,p.id,p.email)).map(b=>[b.id,b])).values()]
  .sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at))).slice(0,60);
 const sentQuotes=quotes.filter(q=>UUID908.test(q.id)&&q.sent_at);
 const bookingIds=bookings.map(b=>b.id);
 const leadIds=[...new Set(sentQuotes.map(q=>q.lead_id).filter(x=>UUID908.test(String(x||''))))];
 const mediaCols='id,booking_id,lead_id,status,verified_at,content_type';
 const [bookingMedia,leadMedia]=await Promise.all([
  bookingIds.length?rows(env,'photo_estimate_uploads?select='+mediaCols+'&booking_id='+inList(bookingIds)+'&status=eq.uploaded&verified_at=not.is.null&limit=200'):[],
  leadIds.length?rows(env,'photo_estimate_uploads?select='+mediaCols+'&lead_id='+inList(leadIds)+'&status=eq.uploaded&verified_at=not.is.null&limit=200'):[]
 ]);
 const targets=[];
 for(const q of sentQuotes){
  targets.push({kind:'quote',subject_id:q.id,revision:await revision908([
   'quote',q.id,q.sent_at,q.updated_at,q.status,q.acceptance_status
  ]),summary:safeQuote908(q)});
 }
 for(const b of bookings){
  const media=summarizeMedia908(bookingMedia.filter(m=>m.booking_id===b.id));
  if(media.count)targets.push({kind:'media_booking',subject_id:b.id,
   revision:await revision908(['media_booking',b.id,media.revision_parts]),summary:{
    booking_date:b.service_date,...((({revision_parts,...rest})=>rest)(media))}});
 }
 for(const q of sentQuotes){
  if(!q.lead_id)continue;
  const media=summarizeMedia908(leadMedia.filter(m=>m.lead_id===q.lead_id));
  if(media.count)targets.push({kind:'media_quote',subject_id:q.id,
   revision:await revision908(['media_quote',q.id,media.revision_parts]),summary:{
    quote_title:String(q.title||'Photo quote').slice(0,140),...((({revision_parts,...rest})=>rest)(media))}});
 }
 const acknowledged=new Set(receipts.map(x=>x.subject_kind+':'+x.subject_id+':'+x.source_revision));
 return {bookings:bookings.map(safeBooking908),targets:targets.map(t=>({...t,reviewed:acknowledged.has(t.kind+':'+t.subject_id+':'+t.revision)}))};
}
export async function onRequestGet({request,env}){
 try{
  const p=await identity(request,env);
  if(!p)return send({ok:false,error:'Sign in to view account history.'},401);
  const data=await workspace(env,p);
  return send({ok:true,authenticated:true,history:data.bookings,review_targets:data.targets,
   policy:{saved_to_account:true,media_files_public:false,quote_approved:false,
    checkout_auto_resumed:false,acknowledgement_not_consent:true}});
 }catch{return send({ok:false,error:'Customer history is temporarily unavailable. No receipt was recorded.'},503);}
}
export async function onRequestPost({request,env}){
 const origin=request.headers.get('origin'),site=request.headers.get('sec-fetch-site');
 if(!origin||origin!==new URL(request.url).origin||(site&&!['same-origin','none'].includes(site)))
  return send({ok:false,error:'Same-origin account action required.'},403);
 if(!(request.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))
  return send({ok:false,error:'JSON required.'},415);
 if(Number(request.headers.get('content-length')||0)>1024)return send({ok:false,error:'Review request too large.'},413);
 try{
  const p=await identity(request,env);
  if(!p)return send({ok:false,error:'Sign in to record a review.'},401);
  const raw=await request.text();
  if(raw.length>1024)return send({ok:false,error:'Review request too large.'},413);
  const body=JSON.parse(raw);
  if(!allowedReview908(body))return send({ok:false,error:'Invalid review receipt.'},400);
  const data=await workspace(env,p);
  const target=data.targets.find(t=>t.kind===body.kind&&t.subject_id===body.subject_id);
  if(!target)return send({ok:false,error:'This quote or verified media is not available in your account.'},404);
  if(target.revision!==body.revision)return send({ok:false,error:'The original record changed. Reload before reviewing.'},409);
  const insert=await fetch(env.SUPABASE_URL.replace(/\/+$/,'')+
   '/rest/v1/customer_review_receipts_908?on_conflict=customer_profile_id,subject_kind,subject_id,source_revision',{
    method:'POST',headers:{...serviceHeaders(env),Prefer:'resolution=ignore-duplicates,return=representation'},
    body:JSON.stringify([{customer_profile_id:p.id,subject_kind:target.kind,
     subject_id:target.subject_id,source_revision:target.revision}])});
  if(!insert.ok)throw Error('Review persistence unavailable');
  const recheck=await rows(env,'customer_review_receipts_908?select=id,reviewed_at&customer_profile_id=eq.'+p.id+
   '&subject_kind=eq.'+target.kind+'&subject_id=eq.'+target.subject_id+
   '&source_revision=eq.'+target.revision+'&limit=1');
  if(!recheck.length)return send({ok:false,error:'Receipt confirmation unavailable. No acknowledgement claimed.'},503);
  return send({ok:true,reviewed:true,reviewed_at:recheck[0].reviewed_at,
   kind:target.kind,subject_id:target.subject_id,
   quote_approved:false,media_public:false,consent_changed:false,booking_created:false,payment_attempted:false});
 }catch(e){
  return send({ok:false,error:e instanceof SyntaxError?'Invalid JSON body.':'Review source is unavailable. No acknowledgement claimed.'},e instanceof SyntaxError?400:503);
 }
}
