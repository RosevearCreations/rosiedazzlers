import { requireStaffAccess, json, methodNotAllowed, serviceHeaders } from "../_lib/staff-auth.js";

export async function onRequestOptions(){return new Response("",{status:204,headers:corsHeaders()});}
export async function onRequestPost(context){
  const {request, env}=context;
  try{
    const body=await request.json().catch(()=>({}));
    const access=await requireStaffAccess({request, env, body, capability:"manage_staff", allowLegacyAdminFallback:true});
    if(!access.ok) return withCors(access.response);
    const item={
      catalog_type:String(body.catalog_type||"").trim().toLowerCase(),
      title:String(body.title||"").trim(),
      category:String(body.category||"general").trim(),
      brand:String(body.brand||"").trim()||null,
      model:String(body.model||"").trim()||null,
      location_label:String(body.location_label||"").trim()||null,
      acquired_on:String(body.acquired_on||"").trim()||null,
      image_url:String(body.image_url||"").trim()||null,
      gallery_image_urls:normalizeGalleryImages(body.gallery_image_urls||body.gallery_images),
      supplier_url:String(body.supplier_url||"").trim()||null,
      sort_order:Number.isFinite(Number(body.sort_order))?Number(body.sort_order):0,
      quantity_on_hand:Number.isFinite(Number(body.quantity_on_hand))?Number(body.quantity_on_hand):0,
      reorder_level:Number.isFinite(Number(body.reorder_level))?Number(body.reorder_level):0,
      unit_cost_cents:Number.isFinite(Number(body.unit_cost_cents))?Number(body.unit_cost_cents):0,
      condition_rating:Number.isFinite(Number(body.condition_rating))?Math.max(0,Math.min(5,Number(body.condition_rating))):0,
      usefulness_rating:Number.isFinite(Number(body.usefulness_rating))?Math.max(0,Math.min(5,Number(body.usefulness_rating))):0,
      notes:String(body.notes||"").trim()||null,
      is_active:body.is_active!==false
    };
    if(!item.catalog_type||!item.title) return withCors(json({error:"catalog_type and title are required."},400));
    const id=String(body.id||"").trim();
    let result=await saveItem(env,id,item);
    const stripped=[];
    if(!result.ok && /gallery_image_urls|schema cache|PGRST204/i.test(result.error||"")){
      const fallback={...item}; delete fallback.gallery_image_urls; stripped.push("gallery_image_urls"); result=await saveItem(env,id,fallback);
    }
    if(!result.ok) return withCors(json({error:`Could not save catalog item. ${result.error}`,stripped_columns:stripped},500));
    return withCors(json({ok:true,item:result.item,stripped_columns:stripped}));
  }catch(err){return withCors(json({error:err?.message||"Unexpected server error."},500));}
}
async function saveItem(env,id,item){
  const url=id?`${env.SUPABASE_URL}/rest/v1/catalog_items?id=eq.${encodeURIComponent(id)}`:`${env.SUPABASE_URL}/rest/v1/catalog_items`;
  const method=id?"PATCH":"POST",payload=id?item:[item];
  const res=await fetch(url,{method,headers:{...serviceHeaders(env),Prefer:"return=representation"},body:JSON.stringify(payload)});
  if(!res.ok) return {ok:false,error:await res.text()};
  const rows=await res.json().catch(()=>[]); return {ok:true,item:Array.isArray(rows)?rows[0]||null:null};
}
function normalizeGalleryImages(value){let list=[];if(Array.isArray(value))list=value;else if(typeof value==="string"&&value.trim()){try{const parsed=JSON.parse(value);list=Array.isArray(parsed)?parsed:value.split(/[\n,]/)}catch{list=value.split(/[\n,]/)}}const seen=new Set();return list.map(v=>String(v||"").trim()).filter(v=>{const key=v.toLowerCase();if(!v||seen.has(key))return false;seen.add(key);return true}).slice(0,7)}
export async function onRequestGet(){return withCors(methodNotAllowed());}
function corsHeaders(){return {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type, x-staff-email, x-staff-user-id","Cache-Control":"no-store"};}
function withCors(response){const h=new Headers(response.headers||{});for(const [k,v] of Object.entries(corsHeaders()))h.set(k,v);return new Response(response.body,{status:response.status,statusText:response.statusText,headers:h});}
