// Build 841 — bounded job-to-DAIP source tagging. No private media URL/bytes,
// progress token, customer identity or social-platform credential is returned.
import { requireStaffAccess, json, isUuid } from '../_lib/staff-auth.js';
import { serviceReady, rest, clean } from '../_lib/creative-projects.js';
import { insertSocialPostDrafts, normalizePlatforms } from '../_lib/social-dispatch.js';
import { buildSocialComplianceDraft } from '../_lib/social-compliance.js';

function cors(response){const h=new Headers(response.headers);h.set('Access-Control-Allow-Origin','*');h.set('Access-Control-Allow-Methods','GET,POST,OPTIONS');h.set('Access-Control-Allow-Headers','Content-Type,x-admin-password,x-staff-email,x-staff-user-id');h.set('Cache-Control','no-store');return new Response(response.body,{status:response.status,headers:h});}
function fail(error,status=400){return cors(json({ok:false,error},status));}
function sourceNote(id){return `Build 841 job media source tag: ${id}; metadata only, no media copied or published.`;}
function publicBooking(b){return {id:b.id,service_date:b.service_date||null,package_code:b.package_code||null,status:b.status||null,job_status:b.job_status||null};}
function publicMedia(m){return {id:m.id,stage:m.stage||'general',kind:m.kind||'image',caption:clean(m.caption,140),created_at:m.created_at||null,visibility:m.visibility||null,review_status:m.review_status||null};}
async function sources(env,bookingId){
  const bookings=await rest(env,`bookings?select=id,service_date,package_code,status,job_status&${bookingId?`id=eq.${encodeURIComponent(bookingId)}&`:''}order=service_date.desc.nullslast&limit=${bookingId?1:30}`);
  if(!bookingId)return {bookings:(bookings||[]).map(publicBooking),media:[]};
  const media=await rest(env,`job_media?select=id,stage,kind,caption,created_at,visibility,review_status&booking_id=eq.${encodeURIComponent(bookingId)}&order=created_at.desc&limit=40`);
  return {bookings:(bookings||[]).map(publicBooking),media:(media||[]).map(publicMedia)};
}
export async function onRequestOptions(){return cors(new Response('',{status:204}));}
export async function onRequest(context){
  const {request,env}=context;
  if(!['GET','POST'].includes(request.method))return fail('Method not allowed.',405);
  const body=request.method==='POST'?await request.json().catch(()=>({})):{};
  const url=new URL(request.url);
  const bookingId=clean(body.booking_id||url.searchParams.get('booking_id'),80);
  if(bookingId&&!isUuid(bookingId))return fail('Invalid booking ID.');
  const access=await requireStaffAccess({request,env,body,capability:request.method==='GET'?'manage_progress':'manage_bookings',bookingId:bookingId||null,allowLegacyAdminFallback:true});
  if(!access.ok)return cors(access.response);
  if(!serviceReady(env))return fail('Private database service is unavailable.',503);
  try{
    if(request.method==='GET')return cors(json({ok:true,...await sources(env,bookingId)}));
    const action=clean(body.action,32);
    const mediaId=clean(body.media_id,80),projectId=clean(body.project_id,80);
    if(!isUuid(bookingId)||!isUuid(mediaId)||!isUuid(projectId))return fail('Choose a valid booking, job photo and DAIP Creative Project.');
    const [projects,media]=await Promise.all([
      rest(env,`creative_projects?select=id,source_booking_id,public_publish_allowed,consent_reviewed&id=eq.${encodeURIComponent(projectId)}&source_booking_id=eq.${encodeURIComponent(bookingId)}&limit=1`),
      rest(env,`job_media?select=id,booking_id,stage,kind,caption&id=eq.${encodeURIComponent(mediaId)}&booking_id=eq.${encodeURIComponent(bookingId)}&limit=1`)
    ]);
    if(!projects?.[0]||!media?.[0])return fail('The media and Creative Project must belong to the same booking.',404);
    const note=sourceNote(mediaId);
    const existing=await rest(env,`creative_project_audit?select=id,created_at&project_id=eq.${encodeURIComponent(projectId)}&event_type=eq.updated&safe_note=eq.${encodeURIComponent(note)}&limit=1`);
    let tag=existing?.[0]||null;
    if(action==='tag'){
      if(!tag){
        const inserted=await rest(env,'creative_project_audit',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({project_id:projectId,event_type:'updated',actor_staff_email:clean(access.actor?.email,200)||null,safe_note:note})});
        tag=inserted?.[0]||null;
      }
      return cors(json({ok:true,tagged:!!tag,already_tagged:!!existing?.length,metadata_only:true,public_publish_allowed:false,copy_performed:false,media_id:mediaId,project_id:projectId}));
    }
    if(action!=='draft')return fail('Choose Tag in DAIP or Create private social draft.');
    if(!tag)return fail('First tag this media source in the linked DAIP project.',409);
    const caption=clean(body.caption,1800);
    if(!caption)return fail('Write a short, customer-safe caption.');
    const platforms=normalizePlatforms(body.platforms);
    const drafts=platforms.map(platform=>{
      const review=buildSocialComplianceDraft({platform,postText:caption,mediaUrls:[],publicUrl:null,input:{hashtags:[],customer_consent_confirmed:false,plate_privacy_confirmed:false,no_private_info_confirmed:false,compliance_note:'Build 841 DAIP source tag. Attach only separately approved PUBLIC derivatives after human review.'}});
      return {booking_id:bookingId,source_type:'daip_job_media_tag',source_id:mediaId,platform,status:'draft',post_text:caption,media_urls:[],public_url:null,hashtags:[],created_by_staff_user_id:access.actor?.id||null,created_by_name:access.actor?.full_name||access.actor?.email||'Staff',scheduled_for:null,...review,review_status:'needs_review'};
    });
    const saved=await insertSocialPostDrafts({env,posts:drafts});
    if(!saved.ok)return fail('Social queue could not save the draft. Check the social queue migration and service connection.',503);
    return cors(json({ok:true,count:saved.rows.length,metadata_only:true,media_attached:false,approved_for_publication:false,drafts:saved.rows.map(row=>({id:row.id,platform:row.platform,status:row.status})),warning:saved.warning||null}));
  }catch(error){return fail(error?.message||'Could not load or tag job media.',503);}
}
