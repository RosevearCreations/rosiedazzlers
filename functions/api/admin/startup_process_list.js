// Historical Build 239 compatibility token: STARTUP_PROCESS_CATALOG_BUILD239
import { requireStaffAccess, serviceHeaders, json } from '../_lib/staff-auth.js';
import { STARTUP_PROCESS_CATALOG_BUILD260, RETIRED_STARTUP_PROCESS_IDS_BUILD260, STARTUP_PROCESS_BUILD } from '../_lib/startup-process-catalog.js';

export async function onRequestGet(context){ return handle(context); }
export async function onRequestPost(context){ return handle(context); }
export async function onRequestOptions(){ return new Response('',{status:204,headers:corsHeaders()}); }

async function handle({request,env}){
  try{
    const body=request.method==='GET'?{}:await request.json().catch(()=>({}));
    const access=await requireStaffAccess({request,env,body,capability:'manage_bookings',allowLegacyAdminFallback:true});
    if(!access.ok)return withCors(access.response);
    const db=await readDatabaseCatalog(env);
    const items=mergeCurrentCatalog(db.items);
    return withCors(json({
      ok:true,
      build:STARTUP_PROCESS_BUILD,
      source:db.ready&&db.items.length?'shared_database_plus_build260':'packaged_fallback',
      warning:db.warning||null,
      item_count:items.length,
      items:items.map(normalizeItem),
      generated_at:new Date().toISOString()
    }));
  }catch(error){
    return withCors(json({ok:false,error:error?.message||'Could not load the Startup Command Center catalog.',build:STARTUP_PROCESS_BUILD,source:'packaged_fallback',items:STARTUP_PROCESS_CATALOG_BUILD260.map(normalizeItem)},500));
  }
}

async function readDatabaseCatalog(env){
  if(!env.SUPABASE_URL||!env.SUPABASE_SERVICE_ROLE_KEY)return {ready:false,items:[],warning:'Supabase service configuration is missing; using packaged read-only instructions.'};
  try{
    const response=await fetch(`${env.SUPABASE_URL}/rest/v1/app_startup_process_items?select=*&is_active=eq.true&order=sort_order.asc`,{headers:serviceHeaders(env)});
    const text=await response.text();
    if(!response.ok)return {ready:false,items:[],warning:'The shared Startup catalog is unavailable; using the current Build 260 packaged catalog until database access returns.'};
    const rows=JSON.parse(text||'[]');
    return {ready:true,items:Array.isArray(rows)?rows:[],warning:null};
  }catch(error){return {ready:false,items:[],warning:`Shared startup catalog is unavailable (${String(error).slice(0,180)}); using packaged read-only instructions.`};}
}

function mergeCurrentCatalog(databaseRows=[]){
  const dbById=new Map((Array.isArray(databaseRows)?databaseRows:[])
    .filter((row)=>!RETIRED_STARTUP_PROCESS_IDS_BUILD260.has(String(row.process_key||row.id||'')))
    .map((row)=>[String(row.process_key||row.id||''),row]));
  const current=[];
  const seen=new Set();
  for(const packaged of STARTUP_PROCESS_CATALOG_BUILD260){
    const id=String(packaged.id||packaged.process_key||'');
    // Build 260 packaged wording is authoritative for current instructions. Database
    // rows still supply persistence/audit existence, but historical wording cannot
    // turn an obsolete migration back into a current blocker.
    current.push(packaged);
    seen.add(id);
    dbById.delete(id);
  }
  // Preserve genuinely newer/custom active rows that are not in the packaged catalog.
  for(const row of dbById.values()){
    const id=String(row.process_key||row.id||'');
    if(!id||seen.has(id)||RETIRED_STARTUP_PROCESS_IDS_BUILD260.has(id))continue;
    current.push(row);
  }
  return current.sort((a,b)=>Number(a.sort_order||a.order||9999)-Number(b.sort_order||b.order||9999));
}
function normalizeItem(item){
  return {
    id:String(item.process_key||item.id||''),
    order:Number(item.sort_order||item.order||0),
    category:String(item.category||'Other'),
    severity:String(item.severity||'planned'),
    title:String(item.title||'Untitled startup item'),
    why:String(item.why_text||item.why||''),
    where:asArray(item.locations||item.where),
    steps:asArray(item.instructions||item.steps),
    done_when:String(item.done_when||''),
    route:String(item.action_route||item.route||''),
    evidence_key:item.evidence_key?String(item.evidence_key):null,
    source_build:Number(item.source_build||STARTUP_PROCESS_BUILD)
  };
}
function asArray(value){if(Array.isArray(value))return value.map(v=>String(v));if(typeof value==='string'){try{const parsed=JSON.parse(value);if(Array.isArray(parsed))return parsed.map(v=>String(v));}catch{}return value?[value]:[];}return [];}
function corsHeaders(){return {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type,x-admin-password,x-staff-email,x-staff-user-id','Cache-Control':'no-store'};}
function withCors(response){const headers=new Headers(response.headers||{});for(const [key,value] of Object.entries(corsHeaders()))headers.set(key,value);return new Response(response.body,{status:response.status,statusText:response.statusText,headers});}
