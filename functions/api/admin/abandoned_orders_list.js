
import { requireStaffAccess, json, methodNotAllowed, serviceHeaders } from "../_lib/staff-auth.js";

export async function onRequestOptions(){return new Response("",{status:204,headers:corsHeaders()});}
export async function onRequestPost(context){
  const {request, env}=context;
  try{
    const body=await request.json().catch(()=>({}));
    const access=await requireStaffAccess({request, env, body, capability:"manage_staff", allowLegacyAdminFallback:true});
    if(!access.ok) return withCors(access.response);

    const since=new Date(Date.now()-Number(body.days||30)*86400000).toISOString();
    const res=await fetch(`${env.SUPABASE_URL}/rest/v1/site_activity_events?select=id,session_id,visitor_id,page_path,event_type,checkout_state,created_at,payload&created_at=gte.${encodeURIComponent(since)}&order=created_at.desc&limit=10000`,{headers:serviceHeaders(env)});
    if(!res.ok) return withCors(json({error:`Could not load events. ${await res.text()}`},500));
    const rows=await res.json().catch(()=>[]);
    const bySession=new Map();
    const sorted=[...(Array.isArray(rows)?rows:[])].sort((a,b)=>String(a.created_at).localeCompare(String(b.created_at)));
    for(const row of sorted){
      const sid=row.session_id||`anon:${row.visitor_id||row.id}`;
      const cur=bySession.get(sid)||[];
      cur.push(row);
      bySession.set(sid,cur);
    }
    const abandoned=[];
    for(const [session_id,events] of bySession.entries()){
      const started=events.some(e=>e.event_type==="checkout_started" || e.checkout_state==="started");
      const completed=events.some(e=>e.event_type==="checkout_completed" || e.checkout_state==="completed");
      if(!started || completed) continue;
      const payloads=events.map(e=>e.payload||{}).filter(Boolean);
      const email = payloads.map(p=>p.customer_email).find(Boolean) || null;
      abandoned.push({
        session_id,
        started_at: events[0]?.created_at || null,
        ended_at: events[events.length-1]?.created_at || null,
        customer_email: email,
        path: events.map(e=>e.page_path).filter(Boolean),
        last_page: events[events.length-1]?.page_path || null,
        recovery_possible: !!email
      });
    }
    return withCors(json({ok:true, abandoned_orders:abandoned.slice(0,200)}));
  }catch(err){return withCors(json({error:err?.message||"Unexpected server error."},500));}
}
export async function onRequestGet(){return withCors(methodNotAllowed());}
function corsHeaders(){return {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type","Cache-Control":"no-store"};}
function withCors(response){const h=new Headers(response.headers||{}); for(const [k,v] of Object.entries(corsHeaders())) h.set(k,v); return new Response(response.body,{status:response.status,statusText:response.statusText,headers:h});}
