import { requireStaffAccess, json, methodNotAllowed, serviceHeaders, cleanText, isUuid } from '../_lib/staff-auth.js';

export async function onRequestOptions(){ return new Response('',{status:204,headers:corsHeaders()}); }
export async function onRequestGet(){ return withCors(methodNotAllowed()); }
export async function onRequestPost({request,env}){
  try{
    const body=await request.json().catch(()=>({}));
    const bookingId=cleanText(body.booking_id);
    const sessionId=cleanText(body.upload_session_id);
    const action=cleanText(body.action).toLowerCase();
    if(!isUuid(bookingId)||!isUuid(sessionId)) return withCors(json({error:'Valid booking_id and upload_session_id are required.'},400));
    if(!['uploading','complete','failed','cancelled','retry'].includes(action)) return withCors(json({error:'Unsupported upload session action.'},400));
    const access=await requireStaffAccess({request,env,body,capability:'work_booking',bookingId,allowLegacyAdminFallback:true});
    if(!access.ok) return withCors(access.response);
    const now=new Date().toISOString();
    const patch={status:action==='retry'?'prepared':action,updated_at:now,last_error:action==='failed'?cleanText(body.error).slice(0,1000):null};
    if(action==='retry') patch.retry_count=Number(body.retry_count||1);
    if(action==='complete') patch.completed_at=now;
    const res=await fetch(`${env.SUPABASE_URL}/rest/v1/live_upload_sessions?id=eq.${encodeURIComponent(sessionId)}&booking_id=eq.${encodeURIComponent(bookingId)}`,{method:'PATCH',headers:{...serviceHeaders(env),Prefer:'return=representation'},body:JSON.stringify(patch)});
    if(!res.ok) return withCors(json({error:`Could not update upload session. ${await res.text()}`},500));
    const rows=await res.json().catch(()=>[]);
    return withCors(json({ok:true,session:Array.isArray(rows)?rows[0]||null:null}));
  }catch(err){ return withCors(json({error:err?.message||'Unexpected server error.'},500)); }
}
function corsHeaders(){return {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type, x-admin-password, x-staff-email, x-staff-user-id','Cache-Control':'no-store'};}
function withCors(response){const headers=new Headers(response.headers||{});for(const [k,v] of Object.entries(corsHeaders()))headers.set(k,v);return new Response(response.body,{status:response.status,statusText:response.statusText,headers});}
