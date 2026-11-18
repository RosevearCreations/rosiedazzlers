// Rosie 909: signed-in cross-device non-sensitive plans, account quote acceptance,
// and original-source private-media chronology. Never exposes raw media or payment tokens.
import {getCurrentCustomerSession,serviceHeaders} from '../_lib/customer-session.js';
import {UUID908,ownsBooking908} from '../_lib/customer-account-review-v908.js';
import {normalizePlan909,quoteSnapshot909,safeMediaTimeline909} from '../_lib/customer-continuity-v909.js';
const api=(x,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{
 'Content-Type':'application/json; charset=utf-8','Cache-Control':'private,no-store',
 'Referrer-Policy':'no-referrer','Vary':'Cookie','X-Content-Type-Options':'nosniff'}});
const disabled=()=>api({ok:false,error:'Method not allowed.'},405);
export const onRequestOptions=disabled,onRequestPut=disabled,onRequestDelete=disabled;
async function current(request,env){
 if(!env?.SUPABASE_URL||!env?.SUPABASE_SERVICE_ROLE_KEY)throw Error('Source configuration unavailable');
 const s=await getCurrentCustomerSession({request,env}),p=s?.customer_profile;
 if(!p?.is_active||!UUID908.test(String(p.id||'')))return null;
 return {id:p.id,email:String(p.email||'').trim().toLowerCase(),verified:!!p.email_verified_at};
}
async function read(env,query){
 const res=await fetch(String(env.SUPABASE_URL).replace(/\/+$/,'')+'/rest/v1/'+query,{headers:serviceHeaders(env),cache:'no-store'});
 if(!res.ok)throw Error('Original readback unavailable');
 const data=await res.json();if(!Array.isArray(data))throw Error('Invalid original readback');
 return data;
}
const list=values=>'in.('+values.join(',')+')';
async function quoteRows(env,p){
 if(!p.verified)return [];
 return read(env,'quote_proposal_drafts?select='+encodeURIComponent('id,title,customer_email,status,acceptance_status,sent_at,updated_at,accepted_at,declined_at,terms_expires_at,structured_terms,structured_terms_hash,lead_id,accepted_terms_hash')+
  '&customer_email=eq.'+encodeURIComponent(p.email)+'&sent_at=not.is.null&order=sent_at.desc&limit=35');
}
async function snapshot(env,p){
 const [plans,quotes,receipts,owned]=await Promise.all([
  read(env,'customer_booking_plans_909?select=booking_mode,choices,updated_at&customer_profile_id=eq.'+p.id+'&limit=2'),
  quoteRows(env,p),
  read(env,'customer_review_receipts_908?select=subject_id,source_revision&customer_profile_id=eq.'+p.id+'&subject_kind=eq.quote&limit=150'),
  read(env,'bookings?select=id,customer_profile_id,customer_email,service_date,package_code,created_at&customer_profile_id=eq.'+p.id+'&order=created_at.desc&limit=50')
 ]);
 const legacy=p.verified?await read(env,'bookings?select=id,customer_profile_id,customer_email,service_date,package_code,created_at&customer_profile_id=is.null&customer_email=eq.'+encodeURIComponent(p.email)+'&order=created_at.desc&limit=50'):[];
 const bookings=[...new Map([...owned,...legacy].filter(b=>ownsBooking908(b,p.id,p.email,p.verified)).map(b=>[b.id,b])).values()];
 const reviewSet=new Set(receipts.map(x=>x.subject_id+':'+x.source_revision));
 const safeQuotes=[];
 for(const q of quotes){
  if(!UUID908.test(String(q.id||''))||String(q.customer_email||'').trim().toLowerCase()!==p.email)continue;
  const pre=await quoteSnapshot909(q,false);
  safeQuotes.push(await quoteSnapshot909(q,reviewSet.has(q.id+':'+pre.revision)));
 }
 const bIds=bookings.map(b=>b.id),lIds=[...new Set(quotes.map(q=>q.lead_id).filter(x=>UUID908.test(String(x||''))))];
 const fields='id,booking_id,lead_id,status,verified_at,linked_at,content_type';
 const [bm,lm]=await Promise.all([
  bIds.length?read(env,'photo_estimate_uploads?select='+fields+'&booking_id='+list(bIds)+'&status=eq.uploaded&verified_at=not.is.null&limit=200'):[],
  lIds.length?read(env,'photo_estimate_uploads?select='+fields+'&lead_id='+list(lIds)+'&status=eq.uploaded&verified_at=not.is.null&limit=200'):[]
 ]);
 const timeline=[];
 for(const b of bookings){
  timeline.push(...safeMediaTimeline909(bm.filter(x=>x.booking_id===b.id),'booking',b.id,b.package_code||'Detailing booking'));
 }
 for(const q of quotes){
  if(!q.lead_id||!safeQuotes.some(s=>s.id===q.id))continue;
  timeline.push(...safeMediaTimeline909(lm.filter(x=>x.lead_id===q.lead_id),'quote',q.id,q.title));
 }
 timeline.sort((a,b)=>String(b.at).localeCompare(String(a.at)));
 return {plans:Object.fromEntries(plans.filter(x=>normalizePlan909(x.choices)).map(x=>[x.booking_mode,{...normalizePlan909(x.choices),updated_at:x.updated_at}])),
  quotes:safeQuotes,media_timeline:timeline.slice(0,100),
  policy:{verified_email_required_for_quote_acceptance:true,private_media_only:true,
   choices_not_booking:true,quoted_terms_not_current_price:true,payment_attempted:false}};
}
export async function onRequestGet({request,env}){
 try{const p=await current(request,env);if(!p)return api({ok:false,error:'Sign in to view saved choices.'},401);
 const data=await snapshot(env,p);return api({ok:true,email_verified:p.verified,...data});}
 catch{return api({ok:false,error:'Account continuity source unavailable.'},503);}
}
function sameOrigin(request){
 const o=request.headers.get('origin'),site=request.headers.get('sec-fetch-site');
 try{return !!o&&new URL(o).origin===new URL(request.url).origin&&(!site||['same-origin','none'].includes(site));}catch{return false;}
}
async function quoteAccept(env,p,body){
 if(!p.verified)return api({ok:false,error:'Verify your account email before accepting a sent quote.'},403);
 if(!UUID908.test(String(body.quote_id||''))||!/^[a-f0-9]{64}$/.test(String(body.revision||''))||
  !/^[a-f0-9]{64}$/.test(String(body.terms_hash||''))||body.confirmed!==true||
  Object.keys(body).sort().join(',')!=='action,confirmed,quote_id,revision,terms_hash')
  return api({ok:false,error:'Explicit confirmation of the current quote is required.'},400);
 const qRows=await read(env,'quote_proposal_drafts?select='+encodeURIComponent('id,title,customer_email,status,acceptance_status,sent_at,updated_at,accepted_at,declined_at,terms_expires_at,structured_terms,structured_terms_hash,accepted_terms_hash')+
  '&id=eq.'+body.quote_id+'&customer_email=eq.'+encodeURIComponent(p.email)+'&sent_at=not.is.null&limit=1');
 const q=qRows[0];
 if(!q||String(q.customer_email||'').trim().toLowerCase()!==p.email)
  return api({ok:false,error:'That staff-sent quote is not available in this verified account.'},404);
 const decision=await quoteSnapshot909(q,false);
 if(decision.revision!==body.revision||decision.terms_hash!==body.terms_hash)
  return api({ok:false,error:'The quote has changed. Reload and review it again.'},409);
 if(String(q.acceptance_status||'').toLowerCase()==='accepted'){
  if(q.accepted_terms_hash&&q.accepted_terms_hash===body.terms_hash)
   return api({ok:true,accepted:true,replay:true,booking_created:false,payment_attempted:false,
    message:'Quote already accepted. A booking and payment are still separate.'});
  return api({ok:false,error:'This quote has conflicting accepted terms. Contact Rosie.'},409);
 }
 if(!decision.terms)return api({ok:false,error:decision.reason},409);
 const [receipt]=await read(env,'customer_review_receipts_908?select=id&customer_profile_id=eq.'+p.id+
  '&subject_kind=eq.quote&subject_id=eq.'+q.id+'&source_revision=eq.'+decision.revision+'&limit=1');
 if(!receipt)return api({ok:false,error:'Review this exact quote version in My Account before accepting.'},409);
 const now=new Date().toISOString();
 const patch={
  acceptance_status:'accepted',status:'accepted',responded_at:now,accepted_at:now,
  declined_at:null,accepted_terms:decision.terms,
  accepted_terms_hash:q.structured_terms_hash,accepted_terms_at:now,updated_at:now
 };
 const predicate='id=eq.'+q.id+'&customer_email=eq.'+encodeURIComponent(p.email)+
  '&sent_at=not.is.null&updated_at=eq.'+encodeURIComponent(q.updated_at)+
  '&structured_terms_hash=eq.'+q.structured_terms_hash+
  '&accepted_terms_hash=is.null&or=(acceptance_status.is.null,acceptance_status.neq.accepted)';
 const result=await fetch(env.SUPABASE_URL.replace(/\/+$/,'')+'/rest/v1/quote_proposal_drafts?'+predicate,{
  method:'PATCH',headers:{...serviceHeaders(env),Prefer:'return=representation'},
  body:JSON.stringify(patch)});
 if(!result.ok)return api({ok:false,error:'The quote changed or persistence is unavailable. No acceptance claimed.'},503);
 const updated=await result.json().catch(()=>[]);
 if(!Array.isArray(updated)||updated.length!==1||updated[0].accepted_terms_hash!==q.structured_terms_hash)
  return api({ok:false,error:'Quote was changed concurrently. Reload before accepting.'},409);
 return api({ok:true,accepted:true,replay:false,quote_id:q.id,accepted_at:updated[0].accepted_at,
  booking_created:false,payment_attempted:false,notification_sent:false,
  message:'Quote accepted at the exact delivered terms. Availability, current price, booking and deposit must be confirmed separately.'});
}
export async function onRequestPost({request,env}){
 if(!sameOrigin(request))return api({ok:false,error:'Same-origin account action required.'},403);
 if(!(request.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))
  return api({ok:false,error:'JSON required.'},415);
 if(Number(request.headers.get('content-length')||0)>3000)return api({ok:false,error:'Account request too large.'},413);
 try{
  const p=await current(request,env);if(!p)return api({ok:false,error:'Sign in before changing saved choices.'},401);
  const raw=await request.text();if(raw.length>3000)return api({ok:false,error:'Account request too large.'},413);
  const body=JSON.parse(raw);
  if(!body||typeof body!=='object'||Array.isArray(body))return api({ok:false,error:'Invalid request.'},400);
  if(body.action==='accept_quote')return quoteAccept(env,p,body);
  if(body.action==='save_plan'){
   if(Object.keys(body).sort().join(',')!=='action,plan')return api({ok:false,error:'Unsupported saved-choice fields.'},400);
   const plan=normalizePlan909(body.plan);if(!plan)return api({ok:false,error:'Only non-sensitive Smart or Manual choices can be saved.'},400);
   const res=await fetch(env.SUPABASE_URL.replace(/\/+$/,'')+
    '/rest/v1/customer_booking_plans_909?on_conflict=customer_profile_id,booking_mode',{
    method:'POST',headers:{...serviceHeaders(env),Prefer:'resolution=merge-duplicates,return=representation'},
    body:JSON.stringify([{customer_profile_id:p.id,booking_mode:plan.mode,choices:plan,updated_at:new Date().toISOString()}])});
   if(!res.ok)throw Error('Source persistence failed');
   const written=await res.json().catch(()=>[]);
   if(!Array.isArray(written)||written.length!==1||written[0].customer_profile_id!==p.id)
    return api({ok:false,error:'Saved-choice readback missing; do not assume saved.'},503);
   return api({ok:true,saved:true,mode:plan.mode,choices_not_booking:true,
    current_price_recheck_required:true,booking_created:false,payment_attempted:false});
  }
  return api({ok:false,error:'Unsupported account action.'},400);
 }catch(e){return api({ok:false,error:e instanceof SyntaxError?'Invalid JSON body.':'Account continuity temporarily unavailable; no success claimed.'},e instanceof SyntaxError?400:503);}
}
