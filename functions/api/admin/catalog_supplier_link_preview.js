import { requireStaffAccess, json, methodNotAllowed } from "../_lib/staff-auth.js";

const ALLOWED_HOSTS = ["amazon.ca","amazon.com","www.amazon.ca","www.amazon.com","a.co","amzn.to"];

export async function onRequestOptions(){ return new Response("",{status:204,headers:corsHeaders()}); }
export async function onRequestGet(){ return withCors(methodNotAllowed()); }

export async function onRequestPost({request,env}){
  try{
    const body=await request.json().catch(()=>({}));
    const access=await requireStaffAccess({request,env,body,capability:"manage_staff",allowLegacyAdminFallback:false});
    if(!access.ok) return withCors(access.response);
    const raw=String(body?.url||"").trim();
    if(!raw) return withCors(json({error:"A supplier product URL is required."},400));
    let url; try{ url=new URL(raw); }catch{ return withCors(json({error:"Enter a valid https product URL."},400)); }
    if(url.protocol!=="https:") return withCors(json({error:"Only https supplier links are accepted."},400));
    if(!ALLOWED_HOSTS.includes(url.hostname.toLowerCase())) return withCors(json({error:"Build 233 currently supports Amazon.ca and Amazon.com links. The importer contract is provider-neutral for later suppliers."},400));
    const canonical=normalizeAmazonUrl(url);
    const asin=extractAsin(canonical);
    const duplicate=await findDuplicate(env,canonical,asin);
    let html="", fetchWarning="";
    try{
      const res=await fetch(canonical,{headers:{"User-Agent":"Mozilla/5.0 (compatible; RosieDazzlersInventoryImporter/1.0)","Accept":"text/html,application/xhtml+xml"},redirect:"follow",cf:{cacheTtl:0,cacheEverything:false}});
      if(res.ok) html=(await res.text()).slice(0,1500000); else fetchWarning=`Supplier page returned HTTP ${res.status}.`;
    }catch(err){ fetchWarning=`Supplier page could not be read: ${String(err)}`; }
    const meta=extractMetadata(html,canonical,asin);
    const classification=classify(meta.title,meta.description);
    const draft={
      source_provider:"amazon", source_url:canonical, amazon_url:canonical, amazon_asin:asin||null,
      name:meta.title||titleFromUrl(canonical), item_key:makeKey(meta.title||asin||"amazon_item"),
      item_type:classification.item_type, category:classification.category, subcategory:classification.subcategory,
      preferred_vendor:"Amazon", vendor_sku:asin||null, image_url:meta.image||null,
      cost_cad:meta.price, unit_label:classification.unit_label, reuse_policy:classification.reuse_policy,
      reorder_point:classification.item_type==="consumable"?1:0, reorder_qty:1, qty_on_hand:1,
      amazon_brand:meta.brand||null, amazon_title:meta.title||null, amazon_category:meta.category||null,
      description:meta.description||null,
      notes:[meta.description?`Imported description: ${meta.description}`:"",`Supplier-link draft created ${new Date().toISOString().slice(0,10)}. Review all fields before saving.`].filter(Boolean).join("\n")
    };
    await writeAudit(env,{url:canonical,provider:"amazon",asin,status:html?"parsed":"partial",warning:fetchWarning||null,duplicate_item_key:duplicate?.item_key||null,actor:access.actor});
    return withCors(json({ok:true,draft,duplicate:duplicate||null,warning:fetchWarning||null,review_required:true,extracted:{title:!!meta.title,image:!!meta.image,price:meta.price!=null,brand:!!meta.brand}}));
  }catch(err){ return withCors(json({error:String(err)},500)); }
}
function normalizeAmazonUrl(url){ const asin=extractAsin(url.href); const host=url.hostname.toLowerCase().endsWith('.com')?'www.amazon.com':'www.amazon.ca'; return asin?`https://${host}/dp/${asin}`:`https://${host}${url.pathname}`; }
function extractAsin(value){ const m=String(value).match(/(?:\/dp\/|\/gp\/product\/|\/ASIN\/)([A-Z0-9]{10})/i)||String(value).match(/[?&]asin=([A-Z0-9]{10})/i); return m?m[1].toUpperCase():null; }
function pick(html,patterns){ for(const p of patterns){ const m=html.match(p); if(m?.[1]) return decode(m[1]).trim(); } return ""; }
function extractMetadata(html,url,asin){
 const title=pick(html,[/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i,/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i,/<title[^>]*>([^<]+)/i]).replace(/\s*:\s*Amazon\.[^:]+.*$/i,'');
 const image=pick(html,[/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/i,/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i]);
 const description=pick(html,[/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i,/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)/i]).slice(0,1200);
 const priceRaw=pick(html,/["']price["']\s*:\s*["']?([0-9]+(?:\.[0-9]{1,2})?)/i,/<span[^>]+class=["'][^"']*a-offscreen[^"']*["'][^>]*>\s*\$?([0-9,.]+)/i).replace(/,/g,'');
 const brand=pick(html,/["']brand["']\s*:\s*["']([^"']+)/i,/<a[^>]+id=["']bylineInfo["'][^>]*>([^<]+)/i).replace(/^Visit the\s+/i,'').replace(/\s+Store$/i,'');
 const category=pick(html,/["']category["']\s*:\s*["']([^"']+)/i);
 return {title,image,description,price:priceRaw&&Number.isFinite(Number(priceRaw))?Number(priceRaw):null,brand,category,asin,url};
}
function classify(title,description){ const s=`${title} ${description}`.toLowerCase(); const tool=/polisher|extractor|pressure washer|steam cleaner|camera|tripod|light|compressor|generator|drill|vacuum|blower|machine|charger|battery|brush set/.test(s); const chemical=/soap|shampoo|cleaner|compound|polish|wax|ceramic|coating|spray|degreaser|dressing|solvent/.test(s); const disposable=/microfiber|towel|glove|tape|pad|cloth|wipe|filter|bottle|bag|mask/.test(s); const item_type=tool&&!chemical&&!disposable?'tool':'consumable'; let category=tool?'tools and equipment':'shop supplies'; if(chemical) category='cleaning liquids'; else if(/camera|tripod|light/.test(s)) category='media equipment'; else if(/microfiber|towel|cloth/.test(s)) category='microfiber towels'; else if(/pad|polisher|compound|polish/.test(s)) category='pads and polishers'; else if(/glove|mask|safety/.test(s)) category='safety gear'; return {item_type,category,subcategory:tool?'equipment':'consumable',unit_label:/pack|set|kit/.test(s)?'pack':'each',reuse_policy:item_type==='tool'?'never_reuse':'reorder'}; }
async function findDuplicate(env,url,asin){ if(!env.SUPABASE_URL||!env.SUPABASE_SERVICE_ROLE_KEY)return null; const h={apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,Accept:'application/json'}; const clauses=[]; if(asin) clauses.push(`amazon_asin.eq.${encodeURIComponent(asin)}`); clauses.push(`amazon_url.eq.${encodeURIComponent(url)}`); const r=await fetch(`${env.SUPABASE_URL}/rest/v1/catalog_inventory_items?select=id,item_key,name,item_type,amazon_url,amazon_asin&or=(${clauses.join(',')})&limit=1`,{headers:h}); if(!r.ok)return null; return (await r.json().catch(()=>[]))[0]||null; }
async function writeAudit(env,row){ try{ if(!env.SUPABASE_URL||!env.SUPABASE_SERVICE_ROLE_KEY)return; await fetch(`${env.SUPABASE_URL}/rest/v1/catalog_supplier_import_audit`,{method:'POST',headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify([{source_url:row.url,provider:row.provider,external_product_id:row.asin||null,parse_status:row.status,warning_text:row.warning,duplicate_item_key:row.duplicate_item_key,actor_name:row.actor?.display_name||row.actor?.email||null}])}); }catch{} }
function titleFromUrl(value){ try{ const u=new URL(value); const p=u.pathname.split('/').filter(Boolean)[0]||'Amazon item'; return decodeURIComponent(p).replace(/[-_]+/g,' ').replace(/\b\w/g,m=>m.toUpperCase()); }catch{return 'Amazon item';} }
function makeKey(v){ return String(v||'inventory_item').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'').slice(0,80)||'inventory_item'; }
function decode(v){ return String(v||'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/\s+/g,' '); }
function corsHeaders(){return{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type, x-admin-password, x-staff-email, x-staff-user-id','Cache-Control':'no-store'}}
function withCors(r){const h=new Headers(r.headers||{});Object.entries(corsHeaders()).forEach(([k,v])=>h.set(k,v));return new Response(r.body,{status:r.status,statusText:r.statusText,headers:h});}
