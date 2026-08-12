import { requireStaffAccess, json, methodNotAllowed } from '../_lib/staff-auth.js';

export async function onRequestOptions(){ return new Response('',{status:204,headers:corsHeaders()}); }
export async function onRequestGet(){ return withCors(methodNotAllowed()); }
export async function onRequestPost({request,env}){
  try{
    const body=await request.json().catch(()=>null);
    const access=await requireStaffAccess({request,env,body:body||{},capability:'manage_staff',allowLegacyAdminFallback:false});
    if(!access.ok) return withCors(access.response);
    const keys=Array.isArray(body?.item_keys)?[...new Set(body.item_keys.map(v=>String(v||'').trim()).filter(Boolean))]:[];
    const reason=String(body?.reason||'').trim();
    const dryRun=body?.dry_run!==false;
    if(!keys.length) return withCors(json({error:'Select at least one inventory row.'},400));
    if(keys.length>500) return withCors(json({error:'A maximum of 500 rows can be reviewed at once.'},400));
    if(reason.length<8) return withCors(json({error:'Enter a reason with at least 8 characters.'},400));
    const res=await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/admin_catalog_inventory_publish_review`,{method:'POST',headers:serviceHeaders(env),body:JSON.stringify({p_item_keys:keys,p_actor_email:String(access.actor?.email||'').trim()||null,p_reason:reason,p_dry_run:dryRun})});
    const text=await res.text();
    if(!res.ok){
      const migrationRequired=/PGRST202|Could not find the function|schema cache|does not exist/i.test(text);
      return withCors(json({error:migrationRequired?'Build 246 catalog publishing migration is required before readiness publishing can run.':text.slice(0,1000),migration_required:migrationRequired,migration:migrationRequired?'sql/2026-08-07_build246_catalog_publish_readiness.sql':undefined},migrationRequired?409:500));
    }
    const data=text?JSON.parse(text):{};
    return withCors(json({ok:data?.ok!==false,...data}));
  }catch(err){ return withCors(json({error:String(err?.message||err)},500)); }
}
function serviceHeaders(env){return {apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,'Content-Type':'application/json',Accept:'application/json'};}
function corsHeaders(){return {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type, x-admin-password, x-staff-email, x-staff-user-id','Cache-Control':'no-store'};}
function withCors(response){const headers=new Headers(response.headers||{});for(const [k,v] of Object.entries(corsHeaders()))headers.set(k,v);return new Response(response.body,{status:response.status,statusText:response.statusText,headers});}
