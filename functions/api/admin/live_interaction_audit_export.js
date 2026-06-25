import { requireStaffAccess, serviceHeaders, json, isUuid } from "../_lib/staff-auth.js";

export async function onRequestGet(context){ return handle(context); }
export async function onRequestPost(context){ return handle(context); }
async function handle({request,env}){
  try{
    const url=new URL(request.url); const body=request.method==='POST'?await request.json().catch(()=>({})):{};
    const bookingId=String(body.booking_id||url.searchParams.get('booking_id')||'').trim();
    if(!isUuid(bookingId))return withCors(json({ok:false,error:'A valid booking_id is required.'},400));
    const access=await requireStaffAccess({request,env,body,capability:'manage_progress',bookingId,allowLegacyAdminFallback:true});
    if(!access.ok)return withCors(access.response);
    const headers=serviceHeaders(env);
    const [updates,media,events,audit]=await Promise.all([
      read(env,`job_updates?select=id,created_at,created_by,stage,visibility,review_status,note,customer_visible_at,moderated_at,approved_by_staff_name,linked_incident_report_id,linked_payment_request_id&booking_id=eq.${encodeURIComponent(bookingId)}&order=created_at.asc`),
      read(env,`job_media?select=id,created_at,created_by,kind,caption,stage,visibility,review_status,customer_visible_at,moderated_at,approved_by_staff_name,retention_policy,upload_status,vehicle_area,condition_tag&booking_id=eq.${encodeURIComponent(bookingId)}&order=created_at.asc`),
      read(env,`booking_events?select=id,created_at,event_type,event_note,actor_name&booking_id=eq.${encodeURIComponent(bookingId)}&order=created_at.asc`),
      read(env,`live_interaction_audit_events?select=id,created_at,event_type,entity_type,entity_id,actor_name,detail,payload&booking_id=eq.${encodeURIComponent(bookingId)}&order=created_at.asc`)
    ]);
    const rows=[
      ...(updates.rows||[]).map(r=>({record_type:'update',...r,summary:r.note||''})),
      ...(media.rows||[]).map(r=>({record_type:'media',...r,summary:r.caption||''})),
      ...(events.rows||[]).map(r=>({record_type:'booking_event',...r,summary:r.event_note||''})),
      ...(audit.rows||[]).map(r=>({record_type:'audit',...r,summary:r.detail||''}))
    ].sort((a,b)=>new Date(a.created_at||0)-new Date(b.created_at||0));
    const csv=toCsv(rows);
    return withCors(json({ok:true,booking_id:bookingId,generated_at:new Date().toISOString(),rows,csv,warnings:[updates.warning,media.warning,events.warning,audit.warning].filter(Boolean)}));
  }catch(err){return withCors(json({ok:false,error:err?.message||'Could not export the interaction audit.',migration:'sql/2026-06-22_build213_owner_action_customer_trust.sql'},500));}
}
async function read(env,path){const res=await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`,{headers:serviceHeaders(env)});if(!res.ok)return{rows:[],warning:(await res.text()).slice(0,220)};return{rows:await res.json().catch(()=>[]),warning:null};}
function toCsv(rows){const heads=['created_at','record_type','stage','kind','visibility','review_status','event_type','actor_name','summary','entity_id']; const q=v=>`"${String(v??'').replaceAll('"','""').replace(/[\r\n]+/g,' ')}"`; return [heads.join(','),...rows.map(r=>heads.map(h=>q(r[h])).join(','))].join('\n');}
function corsHeaders(){return {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type,x-admin-password,x-staff-email,x-staff-user-id','Cache-Control':'no-store'};}function withCors(response){const h=new Headers(response.headers||{});for(const[k,v]of Object.entries(corsHeaders()))h.set(k,v);return new Response(response.body,{status:response.status,statusText:response.statusText,headers:h});}
export async function onRequestOptions(){return new Response('',{status:204,headers:corsHeaders()});}
