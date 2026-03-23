import { requireStaffAccess, json, methodNotAllowed, serviceHeaders } from "../_lib/staff-auth.js";
import { loadAppSettings } from "../_lib/app-settings.js";

export async function onRequestOptions(){return new Response("",{status:204,headers:corsHeaders()});}
export async function onRequestPost(context){
  const {request, env}=context;
  try{
    const body=await request.json().catch(()=>({}));
    const access=await requireStaffAccess({request, env, body, capability:'manage_staff', allowLegacyAdminFallback:true});
    if(!access.ok) return withCors(access.response);
    const days=Math.max(1,Math.min(90,Number(body.days||30)));
    const since=new Date(Date.now()-days*86400000).toISOString();
    const res=await fetch(`${env.SUPABASE_URL}/rest/v1/site_activity_events?select=id,event_type,page_path,country,session_id,visitor_id,referrer,checkout_state,created_at,payload&created_at=gte.${encodeURIComponent(since)}&order=created_at.desc&limit=5000`,{headers:serviceHeaders(env)});
    if(!res.ok) return withCors(json({error:`Could not load analytics. ${await res.text()}`},500));

    const settings=await loadAppSettings(env);
    const rows = await res.json().catch(()=>[]);
    const events = Array.isArray(rows) ? rows : [];
    const uniqueVisitors = new Set(events.map(e => e.visitor_id).filter(Boolean));
    const uniqueSessions = new Set(events.map(e => e.session_id).filter(Boolean));
    const pageViews = events.filter(e => e.event_type === 'page_view');
    const checkoutStarts = events.filter(e => e.event_type === 'checkout_started');
    const checkoutCompletes = events.filter(e => e.event_type === 'checkout_completed' || e.event_type === 'booking_complete_view');
    const completedSessionIds = new Set(checkoutCompletes.map(e => e.session_id).filter(Boolean));
    const abandoned = checkoutStarts.filter(e => !completedSessionIds.has(e.session_id));
    return withCors(json({
      ok:true,
      days,
      settings,
      totals:{
        unique_visitors: uniqueVisitors.size,
        unique_sessions: uniqueSessions.size,
        page_views: pageViews.length,
        checkout_starts: checkoutStarts.length,
        checkout_completes: checkoutCompletes.length,
        estimated_abandoned_checkouts: abandoned.length
      },
      top_pages: topCounts(pageViews.map(e => e.page_path || '/')),
      top_countries: topCounts(events.map(e => e.country || 'Unknown')),
      top_referrers: topCounts(events.map(e => e.referrer || 'Direct')),
      latest_abandoned_checkouts: abandoned.slice(0,25).map(e => ({created_at:e.created_at, visitor_id:e.visitor_id, session_id:e.session_id, page_path:e.page_path, country:e.country||null, referrer:e.referrer||null, payload:e.payload||{}})),
      latest_events: events.slice(0,50)
    }));
  }catch(err){return withCors(json({error:err?.message||'Unexpected server error.'},500));}
}

export async function onRequestGet(){return withCors(methodNotAllowed());}
function topCounts(values){const counts=new Map();for(const value of values)counts.set(value,(counts.get(value)||0)+1);return [...counts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,10).map(([label,count])=>({label,count}));}
function corsHeaders(){return {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type','Cache-Control':'no-store'};}
function withCors(response){const h=new Headers(response.headers||{});for(const[k,v]of Object.entries(corsHeaders()))h.set(k,v);return new Response(response.body,{status:response.status,statusText:response.statusText,headers:h});}
