// Build 223 — record a DAIP private-MVP design blueprint without enabling DAIP production.
import { requireStaffAccess, serviceHeaders, json } from '../_lib/staff-auth.js';
import { buildPrivateMvpDesignDashboard, buildPrivateMvpDesignInsert } from '../_lib/daip-private-mvp-design.js';

export async function onRequest(context){
  const method=String(context.request?.method||'POST').toUpperCase();
  if(method==='OPTIONS') return onRequestOptions(context);
  if(method==='POST') return handle(context);
  return withCors(json({ok:false,error:'Method not allowed.',allowed_methods:['POST','OPTIONS']},405));
}
export async function onRequestOptions(){ return new Response('',{status:204,headers:corsHeaders()}); }
export async function onRequestPost(context){ return handle(context); }
async function handle({request,env}){
  try{
    const body=await request.json().catch(()=>({}));
    const access=await requireStaffAccess({request,env,body,capability:'manage_staff',allowLegacyAdminFallback:true});
    if(!access.ok) return withCors(access.response);
    const dashboard=await buildPrivateMvpDesignDashboard(env);
    if(!dashboard.ready) return withCors(json({ok:false,error:dashboard.warning||'Apply the Build 223 design-blueprint migration before saving.'},409));
    const prepared=buildPrivateMvpDesignInsert({body,actor:access.actor,dashboard});
    if(!prepared.ok) return withCors(json({ok:false,error:prepared.error},400));
    const reviewResponse=await fetch(`${env.SUPABASE_URL}/rest/v1/daip_private_mvp_design_reviews`,{method:'POST',headers:{...serviceHeaders(env),Prefer:'return=representation'},body:JSON.stringify([prepared.row])});
    const reviewText=await reviewResponse.text();
    if(!reviewResponse.ok) return withCors(json({ok:false,error:`Could not save DAIP design blueprint. ${reviewText.slice(0,180)}`},409));
    const review=(JSON.parse(reviewText||'[]'))[0]||null;
    if(review?.id){
      const auditResponse=await fetch(`${env.SUPABASE_URL}/rest/v1/daip_private_mvp_design_audit_events`,{method:'POST',headers:{...serviceHeaders(env),Prefer:'return=minimal'},body:JSON.stringify([{...prepared.audit,design_review_id:review.id}])});
      if(!auditResponse.ok) return withCors(json({ok:false,error:'Blueprint was saved but its audit event could not be recorded. Resolve before continuing.'},409));
    }
    return withCors(json({ok:true,message:prepared.row.review_status==='submitted_for_independent_review'?'Design blueprint submitted for independent review only. Gate C remains Held.':'DAIP design blueprint saved. No technical or public capability is enabled.',review}));
  }catch(error){return withCors(json({ok:false,error:error?.message||'Could not save DAIP design blueprint.'},500));}
}
function corsHeaders(){return {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type,x-admin-password,x-staff-email,x-staff-user-id','Cache-Control':'no-store'};}
function withCors(response){const headers=new Headers(response.headers||{});for(const [key,value] of Object.entries(corsHeaders()))headers.set(key,value);return new Response(response.body,{status:response.status,statusText:response.statusText,headers});}
