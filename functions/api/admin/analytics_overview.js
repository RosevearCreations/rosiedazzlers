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
    const serviceAreaFilter = cleanText(body.service_area || "");
    const since=new Date(Date.now()-days*86400000).toISOString();
    const settings=await loadAppSettings(env);

    const res=await fetch(
      `${env.SUPABASE_URL}/rest/v1/site_activity_events?select=id,event_type,page_path,country,session_id,visitor_id,referrer,checkout_state,created_at,payload&created_at=gte.${encodeURIComponent(since)}&order=created_at.desc&limit=10000`,
      {headers:serviceHeaders(env)}
    );
    if(!res.ok) return withCors(json({error:`Could not load analytics. ${await res.text()}`},500));

    const rows = await res.json().catch(()=>[]);
    let data = Array.isArray(rows)?rows:[];
    const serviceAreaCandidates = Array.from(new Set(data.map((r)=> String(r?.payload?.service_area_label || r?.payload?.service_area || "").trim()).filter(Boolean))).sort((a,b)=>a.localeCompare(b));
    if (serviceAreaFilter) data = data.filter((r)=> String(r?.payload?.service_area_label || r?.payload?.service_area || "").trim() === serviceAreaFilter);
    const pageViews = data.filter(r=>r.event_type==="page_view");
    const heartbeatEvents = data.filter(r=>r.event_type==="heartbeat");
    const uniqueVisitors = new Set(data.map(r=>r.visitor_id).filter(Boolean)).size;
    const uniqueSessions = new Set(data.map(r=>r.session_id).filter(Boolean)).size;
    const topPages = summarizeCounts(pageViews.map(r=>r.page_path || "/"));
    const topCountries = summarizeCounts(data.map(r=>r.country || "Unknown"));
    const topRegions = summarizeCounts(data.map(r=> r?.payload?.region || 'Unknown'));
    const topCities = summarizeCounts(data.map(r=> { const city = r?.payload?.city || ''; const region = r?.payload?.region || ''; return city ? `${city}${region ? `, ${region}` : ''}` : 'Unknown'; }));
    const topDevices = summarizeCounts(data.map(r=>r?.payload?.device_type || 'Unknown'));
    const topReferrers = summarizeCounts(data.map(r=>r.referrer || "Direct"));
    const topActions = summarizeCounts(data.filter(r=>!['heartbeat','page_focus','page_exit'].includes(r.event_type)).map(r=> r.event_type || 'unknown'));
    const topServiceAreas = summarizeCounts(data.map(r=> r?.payload?.service_area_label || r?.payload?.service_area || '').filter(Boolean));
    const funnel = summarizeBookingFunnel(data);
    const checkoutStates = summarizeCounts(data.map(r=>r.checkout_state || '').filter(Boolean));
    const sessionJourneys = summarizeJourneys(data);
    const abandoned = summarizeAbandoned(data);
    const liveOnline = summarizeLiveOnline(sessionJourneys, data);
    const avgEngagementSeconds = heartbeatEvents.length ? Math.round(heartbeatEvents.reduce((sum, r)=>sum + Number(r?.payload?.duration_ms || 0), 0) / heartbeatEvents.length / 1000) : 0;
    const cartSnapshots = summarizeCartSnapshots(data);
    const dailyTraffic = summarizeDailyTraffic(data);
    const recentActions = summarizeRecentActions(data);

    return withCors(json({
      ok:true,
      settings,
      days,
      summary:{
        events:data.length,
        page_views:pageViews.length,
        unique_visitors:uniqueVisitors,
        unique_sessions:uniqueSessions,
        abandoned_sessions:abandoned.length,
        live_online_sessions: liveOnline.length,
        avg_engagement_seconds: avgEngagementSeconds
      },
      top_pages: topPages,
      top_countries: topCountries,
      top_regions: topRegions,
      top_cities: topCities,
      top_devices: topDevices,
      top_referrers: topReferrers,
      top_actions: topActions,
      top_service_areas: topServiceAreas,
      service_area_options: serviceAreaCandidates,
      selected_service_area: serviceAreaFilter || null,
      funnel,
      checkout_states: checkoutStates,
      daily_traffic: dailyTraffic,
      session_journeys: sessionJourneys.slice(0,50),
      live_online_sessions: liveOnline.slice(0,50),
      cart_snapshots: cartSnapshots.slice(0,50),
      recent_actions: recentActions.slice(0,50),
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
      country: row.country || null,
      checkout_state: row.checkout_state || null
    });
    bySession.set(sid, current);
  }
  return [...bySession.entries()].map(([session_id, events])=>({
    session_id,
    event_count: events.length,
    started_at: events[0]?.at || null,
    ended_at: events[events.length-1]?.at || null,
    country: events.find(e=>e.country)?.country || null,
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
    country:j.country,
    path:j.path,
    last_page:j.path[j.path.length-1] || null
  }));
}

function summarizeLiveOnline(journeys, rows){
  const cutoff = Date.now() - 2 * 60 * 1000;
  const bySession = new Map(rows.map(r => [r.session_id || `anon:${r.visitor_id || r.id}`, r]));
  return journeys.filter(j => j.ended_at && new Date(j.ended_at).getTime() >= cutoff).map(j => ({ session_id:j.session_id, ended_at:j.ended_at, country:j.country || bySession.get(j.session_id)?.country || null, path:j.path.slice(-5) }));
}

function summarizeCartSnapshots(rows){
  return rows.filter(r => r.event_type === "cart_snapshot").slice(0,50).map(r => ({
    session_id: r.session_id || null,
    page_path: r.page_path || null,
    created_at: r.created_at || null,
    item_count: Number(r?.payload?.item_count || 0),
    cart_key: r?.payload?.cart_key || null
  })).sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at)));
}

function summarizeDailyTraffic(rows){
  const map = new Map();
  for(const row of rows){
    const day = String(row.created_at || '').slice(0,10);
    if(!day) continue;
    if(!map.has(day)) map.set(day, { day, events:0, page_views:0, visitor_ids:new Set(), session_ids:new Set(), abandoned_sessions:new Set() });
    const cur = map.get(day);
    cur.events += 1;
    if(row.event_type === 'page_view') cur.page_views += 1;
    if(row.visitor_id) cur.visitor_ids.add(row.visitor_id);
    if(row.session_id) cur.session_ids.add(row.session_id);
    if(row.checkout_state === 'started' || row.event_type === 'checkout_started') cur.abandoned_sessions.add(row.session_id || `anon:${row.visitor_id || row.id}`);
    if(row.checkout_state === 'completed' || row.event_type === 'checkout_completed') cur.abandoned_sessions.delete(row.session_id || `anon:${row.visitor_id || row.id}`);
  }
  return [...map.values()].sort((a,b)=>String(a.day).localeCompare(String(b.day))).map((row)=>({
    day: row.day,
    events: row.events,
    page_views: row.page_views,
    unique_visitors: row.visitor_ids.size,
    unique_sessions: row.session_ids.size,
    abandoned_sessions: row.abandoned_sessions.size
  }));
}

function corsHeaders(){return {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type","Cache-Control":"no-store"};}
function withCors(response){const h=new Headers(response.headers||{}); for(const [k,v] of Object.entries(corsHeaders())) h.set(k,v); return new Response(response.body,{status:response.status,statusText:response.statusText,headers:h});}

function summarizeRecentActions(rows){
  return rows
    .filter(r=>!['heartbeat'].includes(r.event_type))
    .sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at)))
    .slice(0,100)
    .map(r=>({
      created_at:r.created_at || null,
      event_type:r.event_type || null,
      page_path:r.page_path || null,
      city:r?.payload?.city || null,
      region:r?.payload?.region || null,
      device_type:r?.payload?.device_type || null,
      target_text:r?.payload?.target_text || null,
      href:r?.payload?.href || null,
      percent:r?.payload?.percent || null,
      viewport:r?.payload?.viewport || null,
      session_id:r.session_id || null
    }));
}


function summarizeBookingFunnel(rows){
  const eventCounts = (type)=> rows.filter((r)=>r.event_type === type).length;
  const stepViews = new Map();
  for (const row of rows.filter((r)=>r.event_type === 'booking_step_view')) {
    const key = Number(row?.payload?.step_number || 0);
    if (key) stepViews.set(key, (stepViews.get(key) || 0) + 1);
  }
  return {
    step_1_views: stepViews.get(1) || 0,
    step_2_views: stepViews.get(2) || 0,
    step_3_views: stepViews.get(3) || 0,
    step_4_views: stepViews.get(4) || 0,
    step_5_views: stepViews.get(5) || 0,
    service_area_picks: eventCounts('booking_service_area_pick'),
    date_picks: eventCounts('booking_date_pick'),
    package_picks: eventCounts('booking_package_pick'),
    addon_toggles: eventCounts('booking_addon_toggle'),
    checkout_started: eventCounts('checkout_started'),
    checkout_redirects: eventCounts('checkout_redirect'),
    checkout_errors: eventCounts('checkout_error')
  };
}

function cleanText(value){return String(value||'').trim().slice(0,160);}
