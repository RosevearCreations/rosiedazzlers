import {serviceHeaders} from './staff-auth.js';
export const OUTPUT_TYPES=['youtube_video','youtube_shorts','instagram_reels','tiktok','facebook_video','pinterest_pins','etsy_draft','website_product_page','blog_article','photo_gallery','before_after','educational_article','project_archive','material_usage_report','cost_analysis','lessons_learned','future_recommendations'];
export function clean(v,max=2000){return String(v??'').trim().slice(0,max)}
export function serviceReady(env){return Boolean(env?.SUPABASE_URL&&env?.SUPABASE_SERVICE_ROLE_KEY)}
export function h(env,extra={}){return {...serviceHeaders(env),'Content-Type':'application/json',...extra}}
export async function jsonBody(r){try{return await r.json()}catch{return {}}}
export async function rest(env,path,options={}){const r=await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`,{...options,headers:h(env,options.headers||{})});const text=await r.text();let data=null;try{data=text?JSON.parse(text):null}catch{}if(!r.ok)throw new Error(data?.message||data?.error||`Database request failed (${r.status})`);return data}
export function code(){return `CP-${new Date().toISOString().slice(0,10).replaceAll('-','')}-${crypto.randomUUID().slice(0,8).toUpperCase()}`}
export async function seedOutputs(env,projectId){const rows=OUTPUT_TYPES.map(output_type=>({project_id:projectId,output_type,status:output_type==='before_after'?'not_applicable':'planned'}));await rest(env,'creative_project_outputs',{method:'POST',headers:{Prefer:'resolution=ignore-duplicates,return=minimal'},body:JSON.stringify(rows)});}
