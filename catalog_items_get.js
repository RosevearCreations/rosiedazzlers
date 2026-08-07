import { requireStaffAccess, json, methodNotAllowed, serviceHeaders } from "./_lib/staff-auth.js";

export async function onRequestOptions(){return new Response("",{status:204,headers:corsHeaders()});}
export async function onRequestPost(context){
  const {request, env}=context;
  try{
    const body=await request.json().catch(()=>({}));
    const access=await requireStaffAccess({request, env, body, capability:"manage_staff", allowLegacyAdminFallback:true});
    if(!access.ok) return withCors(access.response);
    const catalogType=String(body.catalog_type||"").trim().toLowerCase();
    const base="id,created_at,updated_at,catalog_type,title,category,brand,model,location_label,acquired_on,image_url,gallery_image_urls,supplier_url,sort_order,quantity_on_hand,reorder_level,unit_cost_cents,condition_rating,usefulness_rating,overall_rating,notes,is_active,last_reorder_requested_at,last_reorder_note";
    let result=await loadItems(env,catalogType,base);
    if(!result.ok && /gallery_image_urls|schema cache|PGRST204/i.test(result.error||"")) result=await loadItems(env,catalogType,base.replace(",gallery_image_urls",""));
    if(!result.ok) return withCors(json({error:`Could not load catalog items. ${result.error}`},500));
    return withCors(json({ok:true,items:result.items}));
  }catch(err){return withCors(json({error:err?.message||"Unexpected server error."},500));}
}
async function loadItems(env,catalogType,select){
  let url=`${env.SUPABASE_URL}/rest/v1/catalog_items?select=${select}&order=catalog_type.asc,sort_order.asc,updated_at.desc&limit=500`;
  if(catalogType) url=`${env.SUPABASE_URL}/rest/v1/catalog_items?select=${select}&catalog_type=eq.${encodeURIComponent(catalogType)}&order=sort_order.asc,updated_at.desc&limit=500`;
  const res=await fetch(url,{headers:serviceHeaders(env)});
  if(!res.ok) return {ok:false,error:await res.text()};
  const rows=await res.json().catch(()=>[]); return {ok:true,items:Array.isArray(rows)?rows:[]};
}
export async function onRequestGet(){return withCors(methodNotAllowed());}
function corsHeaders(){return {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type, x-staff-email, x-staff-user-id","Cache-Control":"no-store"};}
function withCors(response){const h=new Headers(response.headers||{}); for(const [k,v] of Object.entries(corsHeaders())) h.set(k,v); return new Response(response.body,{status:response.status,statusText:response.statusText,headers:h});}
