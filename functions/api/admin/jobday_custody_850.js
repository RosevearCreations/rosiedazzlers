// Build 850 — original-owner, read-only evidence custody review and safe pilot HOLD.
import {requireStaffAccess,json,isUuid} from '../_lib/staff-auth.js';
import {serviceReady,rest,clean} from '../_lib/creative-projects.js';
import {ownerActor842,SOURCE_TYPE_842} from '../_lib/jobday-social-842.js';
import {recoveryCustody850,crossPlatformRecall850,receiverPilotDecision850,MASTER_CONTRACT_850} from '../_lib/jobday-custody-850.js';
const fail=(error,status=409)=>json({ok:false,error,master_connection:'HOLD',receiver_pilot_accepted:false,provider_mutation_performed:false},status);
export const onRequestOptions=()=>new Response('',{status:204});
export async function onRequest({request,env}){
  if(request.method!=='GET')return fail('Build 850 permits read-only review; no browser-origin receiver authorization.',405);
  const bookingId=clean(new URL(request.url).searchParams.get('booking_id'),80);
  if(!isUuid(bookingId))return fail('Exact original booking UUID required.',400);
  const auth=await requireStaffAccess({request,env,body:{},capability:'manage_staff',allowLegacyAdminFallback:false});
  if(!auth.ok)return auth.response;
  if(auth.auth_mode!=='session'||!ownerActor842(auth.actor))return fail('Original signed-in Rosie owner session required.',403);
  if(!serviceReady(env))return fail('Private source evidence unavailable.',503);
  try{
    const [bookings,projects,posts]=await Promise.all([
      rest(env,`bookings?select=id&id=eq.${encodeURIComponent(bookingId)}&limit=1`),
      rest(env,`creative_projects?select=id,consent_status,public_publish_allowed&source_booking_id=eq.${encodeURIComponent(bookingId)}&limit=2`),
      rest(env,`social_post_queue?select=id,platform,status,source_type&booking_id=eq.${encodeURIComponent(bookingId)}&source_type=eq.${SOURCE_TYPE_842}&order=created_at.desc&limit=101`)
    ]);
    if(bookings?.length!==1||projects?.length!==1||!Array.isArray(posts)||posts.length>=101)throw Error('Complete original booking/project/post window required.');
    const revoked=projects[0].consent_status!=='approved_public'||projects[0].public_publish_allowed!==true;
    const cases=[];
    for(const post of posts){
      const attempts=await rest(env,`social_dispatch_attempts?select=id,status,platform,created_at,request_summary,response_summary&social_post_id=eq.${encodeURIComponent(post.id)}&order=created_at.desc&limit=200`);
      const custody=recoveryCustody850(attempts,{revoked});
      cases.push({platform:post.platform,post_id:post.id,...custody,receipt_ids:undefined});
    }
    const cross=crossPlatformRecall850(cases,{expectedPlatforms:[...new Set(posts.map(p=>p.platform))]});
    const custody={decision:cases.length>0&&cases.every(c=>c.decision==='SCOPED_REVIEW_ONLY')?'SCOPED_REVIEW_ONLY':'HOLD'};
    const pilot=receiverPilotDecision850({sourceRevision:env?.CF_PAGES_COMMIT_SHA,custody,crossPlatform:cross});
    return json({ok:true,build:850,booking_id:bookingId,contract:MASTER_CONTRACT_850,provider_recovery:{cases_reviewed:cases.length,hold_count:cases.filter(c=>c.decision==='HOLD').length,priorities:cases.reduce((o,c)=>(o[c.priority||'NONE']=(o[c.priority||'NONE']||0)+1,o),{}),cases:cases.map(({platform,post_id,decision,reasons,priority,episode_count})=>({platform,post_id,decision,reasons,priority,episode_count}))},cross_platform_recall:cross,receiver_pilot:pilot,provider_mutation_performed:false,master_events_emitted:0});
  }catch(e){return fail(e?.message||'Source evidence unavailable.',503);}
}
