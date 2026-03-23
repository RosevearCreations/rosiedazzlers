
import { requireStaffAccess, json, methodNotAllowed, serviceHeaders } from "../_lib/staff-auth.js";
import { loadAppSettings } from "../_lib/app-settings.js";

export async function onRequestOptions(){return new Response("",{status:204,headers:corsHeaders()});}

export async function onRequestPost(context){
  const {request, env}=context;
  try{
    const body=await request.json().catch(()=>({}));
    const access=await requireStaffAccess({request, env, body, capability:"manage_staff", allowLegacyAdminFallback:true});
    if(!access.ok) return withCors(access.response);

    const days=Math.max(1,Math.min(90,Number(body.days||30)));
    const since=new Date(Date.now()-days*86400000).toISOString();
    const settings=await loadAppSettings(env);

    const res=await fetch(
      `${env.SUPABASE_URL}/rest/v1/site_activity_events?select=id,event_type,page_path,country,session_id,visitor_id,referrer,checkout_state,created_at,payload&created_at=gte.${encodeURIComponent(since)}&order=created_at.desc&limit=10000`,
      {headers:serviceHeaders(env)}
    );
    if(!res.ok) return withCors(json({error:`Could not load analytics. ${await res.text()}`},500));

    const rows = await res.json().catch(()=>[]);
    const data = Array.isArray(rows)?rows:[];
    const pageViews = data.filter(r=>r.event_type==="page_view");
    const uniqueVisitors = new Set(data.map(r=>r.visitor_id).filter(Boolean)).size;
    const uniqueSessions = new Set(data.map(r=>r.session_id).filter(Boolean)).size;
    const topPages = summarizeCounts(pageViews.map(r=>r.page_path || "/"));
    const topCountries = summarizeCounts(data.map(r=>r.country || "Unknown"));
    const topReferrers = summarizeCounts(data.map(r=>r.referrer || "Direct"));
    const sessionJourneys = summarizeJourneys(data);
    const abandoned = summarizeAbandoned(data);

    return withCors(json({
      ok:true,
      settings,
      days,
      summary:{
        events:data.length,
        page_views:pageViews.length,
        unique_visitors:uniqueVisitors,
        unique_sessions:uniqueSessions,
        abandoned_sessions:abandoned.length
      },
      top_pages: topPages,
      top_countries: topCountries,
      top_referrers: topReferrers,
      session_journeys: sessionJourneys.slice(0,50),
      abandoned_checkouts: abandoned.slice(0,50)
    }));
  }catch(err){
    return withCors(json({error:err?.message||"Unexpected server error."},500));
  }
}

export async function onRequestGet(){return withCors(methodNotAllowed());}

function summarizeCounts(list){
  const map=new Map();
  for(const item of list){
    const key=String(item||"Unknown");
    map.set(key,(map.get(key)||0)+1);
  }
  return [...map.entries()].sort((a,b)=>b[1]-a[1]).slice(0,20).map(([label,count])=>({label,count}));
}

function summarizeJourneys(rows){
  const bySession=new Map();
  const sorted=[...rows].sort((a,b)=>String(a.created_at).localeCompare(String(b.created_at)));
  for(const row of sorted){
    const sid = row.session_id || `anon:${row.visitor_id || row.id}`;
    const current = bySession.get(sid) || [];
    current.push({
      at: row.created_at || null,
      type: row.event_type || null,
      page: row.page_path || null,
      checkout_state: row.checkout_state || null
    });
    bySession.set(sid, current);
  }
  return [...bySession.entries()].map(([session_id, events])=>({
    session_id,
    event_count: events.length,
    started_at: events[0]?.at || null,
    ended_at: events[events.length-1]?.at || null,
    path: events.map(e=>e.page).filter(Boolean),
    events
  })).sort((a,b)=>String(b.ended_at).localeCompare(String(a.ended_at)));
}

function summarizeAbandoned(rows){
  const journeys = summarizeJourneys(rows);
  return journeys.filter(j=>{
    const started = j.events.some(e=>e.type==="checkout_started" || e.checkout_state==="started");
    const completed = j.events.some(e=>e.type==="checkout_completed" || e.checkout_state==="completed");
    return started && !completed;
  }).map(j=>({
    session_id:j.session_id,
    started_at:j.started_at,
    ended_at:j.ended_at,
    path:j.path,
    last_page:j.path[j.path.length-1] || null
  }));
}

function corsHeaders(){return {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type","Cache-Control":"no-store"};}
function withCors(response){const h=new Headers(response.headers||{}); for(const [k,v] of Object.entries(corsHeaders())) h.set(k,v); return new Response(response.body,{status:response.status,statusText:response.statusText,headers:h});}
