import {json,methodNotAllowed} from '../_lib/staff-auth.js';
import {serviceHeaders} from '../_lib/inventory-posting.js';
import {onRequestGet as marginReviewGet} from './margin_review_v751.js';
import {buildEconomicAcceptance752} from '../_lib/economic-acceptance-v752.js';

const denied=()=>json({ok:false,build:752,error:'Owner acceptance and source repair require an independently authorized owning workflow. This endpoint is read-only.'},405);
const hashSnapshot=async data=>{
  if(!globalThis.crypto?.subtle)throw Error('Evidence fingerprint is unavailable.');
  const bytes=new TextEncoder().encode(JSON.stringify(data));
  const digest=await crypto.subtle.digest('SHA-256',bytes);
  return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
};

export async function onRequestGet({request,env,context}){
  // Build 751 enforces a signed-in manage_staff-capable session before any private read.
  const upstream=await marginReviewGet({request,env,context});
  if(!upstream.ok)return upstream;
  try{
    const margin=await upstream.json();
    if(!margin.ok||margin.build!==751)throw Error('Margin source invalid.');
    const res=await fetch(`${env.SUPABASE_URL}/rest/v1/app_management_settings?select=key,value&key=eq.pricing_catalog&limit=2`,
      {headers:serviceHeaders(env)});
    if(!res.ok)throw Error(`Managed pricing source unavailable (${res.status}); cannot verify price authority.`);
    const records=await res.json();
    if(!Array.isArray(records)||records.length>1)throw Error('Pricing catalog source is ambiguous or truncated.');
    const raw=records[0]?.value;
    const status=raw&&typeof raw==='object'&&!Array.isArray(raw)?'managed':records.length?'invalid':'absent';
    const snapshot_sha256=await hashSnapshot({period:margin.period,rows:margin.rows,managed_catalog_status:status,managed_catalog:status==='managed'?raw:null});
    return json(buildEconomicAcceptance752({margin,managed_catalog:status==='managed'?raw:null,managed_catalog_status:status,snapshot_sha256}));
  }catch(error){return json({ok:false,build:752,error:String(error?.message||'Economic evidence unavailable.').slice(0,350),read_only:true},503);}
}
export async function onRequestPost(){return denied();}
export async function onRequestPut(){return denied();}
export async function onRequestPatch(){return denied();}
export async function onRequestDelete(){return denied();}
export async function onRequestOptions(){return new Response('',{status:204,headers:{'Access-Control-Allow-Methods':'GET,OPTIONS','Cache-Control':'no-store'}});}
