import { serviceHeaders } from './staff-auth.js';
import { serviceReady, safeJson } from './daip-test-mode.js';
export const BUILD=227;
export async function roadmapDashboard(env){
 if(!serviceReady(env)) return {ready:false,warning:'Supabase service configuration is missing.',items:[],policy:null};
 const h=serviceHeaders(env);
 const [ir,pr]=await Promise.all([
  fetch(`${env.SUPABASE_URL}/rest/v1/app_roadmap_execution_items?select=*&order=sort_order.asc`,{headers:h}),
  fetch(`${env.SUPABASE_URL}/rest/v1/daip_intake_validation_policy?select=*&policy_key=eq.active&limit=1`,{headers:h})
 ]);
 const it=await ir.text(),pt=await pr.text();
 return {build:BUILD,ready:ir.ok&&pr.ok,warning:(!ir.ok||!pr.ok)?'Apply the Build 227 migration.':null,items:ir.ok?(safeJson(it)||[]):[],policy:pr.ok?((safeJson(pt)||[])[0]||null):null,gate_c:{state:'held',detail:'Build 227 changes planning and fictional validation policy only. No media capability is enabled.'}};
}
export function clean(v,max=1200){return String(v??'').trim().slice(0,max)}
