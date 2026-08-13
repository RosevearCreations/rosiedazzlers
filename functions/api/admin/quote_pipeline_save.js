import { requireStaffAccess, serviceHeaders, json, isUuid } from "../_lib/staff-auth.js";

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(()=>({}));
  const access = await requireStaffAccess({ request, env, body, capability:"manage_bookings", allowLegacyAdminFallback:true });
  if (!access.ok) return access.response;
  try {
    const id=String(body.id||"").trim();
    if(id && !isUuid(id)) return json({ok:false,error:"Valid quote id is required."},400);
    const patch = cleanPatch(body);
    if(!patch.customer_name && !patch.service_label && !id) return json({ok:false,error:"Enter at least a customer or service before creating a quote."},400);
    patch.updated_at=new Date().toISOString();
    let url=`${env.SUPABASE_URL}/rest/v1/quote_pipeline_items`;
    let method="POST";
    if(id){url+=`?id=eq.${encodeURIComponent(id)}`;method="PATCH";} else patch.created_at=patch.updated_at;
    const res=await fetch(url,{method,headers:{...serviceHeaders(env),Prefer:"return=representation"},body:JSON.stringify(id?patch:[patch])});
    const text=await res.text();
    if(!res.ok)return json({ok:false,error:"Could not save quote pipeline item.",details:text.slice(0,600)},500);
    const data=safeJson(text,[]);const row=Array.isArray(data)?data[0]||null:data;
    return json({ok:true,row});
  } catch(err){return json({ok:false,error:err?.message||"Could not save quote pipeline item."},500);}
}
export async function onRequestOptions(){return new Response("",{status:204,headers:{"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type","Cache-Control":"no-store"}});}
function text(v,max=500){return String(v||"").trim().slice(0,max)||null}
function cents(v){const n=Number(v);return Number.isFinite(n)?Math.max(0,Math.round(n)):0}
function prob(v){const n=Number(v);return Number.isFinite(n)?Math.max(0,Math.min(100,n)):0}
function nullableUuid(v){const x=String(v||"").trim();return x&&isUuid(x)?x:null}
function cleanPatch(b){
 const out={quote_number:text(b.quote_number,80),customer_name:text(b.customer_name,240),town:text(b.town,160),service_label:text(b.service_label,240),status:text(b.status,80)||"draft",source_channel:text(b.source_channel,120),quoted_amount_cents:cents(b.quoted_amount_cents),accepted_amount_cents:cents(b.accepted_amount_cents),probability:prob(b.probability),follow_up_stage:text(b.follow_up_stage,120),next_follow_up_at:text(b.next_follow_up_at,80),sent_at:text(b.sent_at,80),accepted_at:text(b.accepted_at,80),declined_at:text(b.declined_at,80)};
 for(const key of ['lead_id','customer_id','booking_id']) if(Object.prototype.hasOwnProperty.call(b,key)) out[key]=nullableUuid(b[key]);
 return out;
}
function safeJson(t,f){try{return JSON.parse(t)}catch{return f}}
