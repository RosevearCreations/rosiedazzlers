// Build 184 / Build 185 — admin R2/public image health scan with real image dimension validation and DB/static fallback.
import { requireStaffAccess, json, serviceHeaders } from "../_lib/staff-auth.js";

const PUBLIC_BASE = "https://assets.rosiedazzlers.ca/";
const FALLBACK_ASSETS = [
  ["Pet Hair Removal", "packages/pet_hair_removal.png", "addon", 1200, 800, "1200x800 minimum, 1600x1067 preferred"],
  ["Odor Treatment", "packages/odor_treatment.png", "addon", 1200, 800, "1200x800 minimum"],
  ["Seat Shampoo", "packages/seat_shampoo.png", "addon", 1200, 800, "1200x800 minimum"],
  ["Carpet Shampoo", "packages/carpet_shampoo.png", "addon", 1200, 800, "1200x800 minimum"],
  ["Salt Stain Treatment", "packages/salt_stain_treatment.png", "addon", 1200, 800, "1200x800 minimum"],
  ["Headlight Restoration", "packages/headlight_restoration.png", "addon", 1200, 800, "1200x800 minimum"],
  ["Windshield Ceramic Coating", "packages/windshield_ceramic_coating.png", "addon", 1200, 800, "1200x800 minimum"],
  ["Ceramic Spray Protection", "packages/ceramic_spray_wax.png", "addon", 1200, 800, "1200x800 minimum"],
  ["Trim Restoration", "packages/trim_restoration.png", "addon", 1200, 800, "1200x800 minimum"],
  ["Bug and Tar Removal", "packages/bug_tar_removal.png", "addon", 1200, 800, "1200x800 minimum"],
  ["Truck Box Wash", "packages/truck_box_wash.png", "addon", 1200, 800, "1200x800 minimum"],
  ["Fleet Vehicle Add-on", "packages/fleet_vehicle_add_on.png", "addon", 1200, 800, "1200x800 minimum"],
  ["Tillsonburg local hero", "landing-pages/tillsonburg-auto-detailing.webp", "regional", 1600, 900, "1600x900 preferred"],
  ["Woodstock/Ingersoll local hero", "landing-pages/woodstock-ingersoll-auto-detailing.webp", "regional", 1600, 900, "1600x900 preferred"],
  ["Simcoe/Delhi local hero", "landing-pages/simcoe-delhi-auto-detailing.webp", "regional", 1600, 900, "1600x900 preferred"],
  ["Port Dover local hero", "landing-pages/port-dover-auto-detailing.webp", "regional", 1600, 900, "1600x900 preferred"]
];

export async function onRequestPost({ request, env }) { return handle({ request, env, body: await request.json().catch(() => ({})) }); }
export async function onRequestGet({ request, env }) { return handle({ request, env, body: Object.fromEntries(new URL(request.url).searchParams.entries()) }); }

async function handle({ request, env, body }) {
  try {
    const access = await requireStaffAccess({ request, env, body, capability: "manage_bookings", allowLegacyAdminFallback: true });
    if (!access.ok) return access.response;
    const limit = Math.max(1, Math.min(200, Number(body.limit || 120) || 120));
    const assets = await loadAssets(env, request, limit);
    const rows = [];
    for (const asset of assets.slice(0, limit)) rows.push(await checkAsset(asset));
    const missing = rows.filter((r) => !r.ok);
    const undersized = rows.filter((r) => r.ok && r.dimension_status === "too_small");
    return json({ ok: true, build: "185", checked_count: rows.length, missing_count: missing.length, undersized_count: undersized.length, present_count: rows.length - missing.length, assets: rows, missing, undersized, upload_base: PUBLIC_BASE, dimension_validation: "png/jpeg/webp header parsing", next_step: missing.length ? "Upload missing files to the listed R2 keys, then run this scan again." : (undersized.length ? "Replace undersized files with the size listed in IMAGES.md." : "All checked public asset URLs responded and met known size rules.") });
  } catch (err) {
    return json({ ok: false, error: err?.message || "Could not scan media asset health." }, 500);
  }
}

async function loadAssets(env, request, limit) {
  const fromDb = await loadAssetsFromDb(env, limit).catch(() => []);
  const fromJson = await loadAssetsFromPublicJson(request, limit).catch(() => []);
  const merged = new Map();
  for (const item of [...fromJson, ...fromDb, ...fallbackAssets()]) {
    if (item.r2_key && !merged.has(item.r2_key)) merged.set(item.r2_key, item);
  }
  return [...merged.values()].slice(0, limit);
}
async function loadAssetsFromDb(env, limit) {
  if (!hasSupabaseConfig(env)) return [];
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/media_asset_tasks?select=label,category,r2_key,public_url,required_width,required_height,required_size,upload_method,status&status=neq.archived&order=sort_order.asc&limit=${limit}`, { headers: serviceHeaders(env) });
  const rows = res.ok ? await res.json().catch(() => []) : [];
  return Array.isArray(rows) ? rows.map(normalizeAsset) : [];
}
async function loadAssetsFromPublicJson(request, limit) {
  const origin = new URL(request.url).origin;
  const res = await fetch(`${origin}/data/media_requirements.json`, { cf: { cacheTtl: 0 } });
  if (!res.ok) throw new Error("media requirements JSON unavailable");
  const data = await res.json();
  const out = [];
  for (const item of data.required_assets || []) out.push(normalizeAsset(item));
  return out.slice(0, limit);
}
function fallbackAssets(){return FALLBACK_ASSETS.map(([label,key,category,required_width,required_height,required_size])=>normalizeAsset({label,r2_key:key,category,required_width,required_height,required_size}));}
function normalizeAsset(item){const key=String(item.r2_key || item.key || "").replace(/^\/+/,""); const url=String(item.public_url || item.url || `${PUBLIC_BASE}${key}`); return { label:String(item.label || key), category:String(item.category || "media"), r2_key:key, url, required_width:Number(item.required_width || item.min_width || 0) || null, required_height:Number(item.required_height || item.min_height || 0) || null, required_size:String(item.required_size || item.requirement || "See IMAGES.md"), upload_method:String(item.upload_method || `Cloudflare R2 → upload ${key}`) };}
async function checkAsset(asset){let status=0, ok=false, contentType="", contentLength="", dimensions=null, dimension_status="unknown"; try{let res=await fetch(asset.url,{method:"GET",cf:{cacheTtl:0}}); status=res.status; ok=res.ok; contentType=res.headers.get("content-type")||""; contentLength=res.headers.get("content-length")||""; if(res.ok){const buf=await res.arrayBuffer(); dimensions=readImageDimensions(new Uint8Array(buf), contentType); if(dimensions && asset.required_width && asset.required_height){dimension_status = dimensions.width >= asset.required_width && dimensions.height >= asset.required_height ? "ok" : "too_small";} else if(dimensions){dimension_status="measured";} } }catch(err){return {...asset, ok:false, status:0, error:err?.message || "Fetch failed"};} return {...asset, ok, status, content_type:contentType, content_length:contentLength, dimensions, dimension_status, issue: ok?(dimension_status === "too_small" ? "undersized" : "") : "missing_or_not_public"};}
function readImageDimensions(bytes, contentType=""){
  if(!bytes || bytes.length < 12) return null;
  if(bytes[0]===0x89 && bytes[1]===0x50 && bytes[2]===0x4e && bytes[3]===0x47 && bytes.length>=24){return {type:"png", width:u32(bytes,16), height:u32(bytes,20)};}
  if(bytes[0]===0xff && bytes[1]===0xd8){let i=2; while(i+9<bytes.length){if(bytes[i]!==0xff){i++; continue;} const marker=bytes[i+1]; const len=(bytes[i+2]<<8)+bytes[i+3]; if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)){return {type:"jpeg", height:(bytes[i+5]<<8)+bytes[i+6], width:(bytes[i+7]<<8)+bytes[i+8]};} i += Math.max(2, len+2);} }
  if(bytes[0]===0x52 && bytes[1]===0x49 && bytes[2]===0x46 && bytes[3]===0x46 && bytes[8]===0x57 && bytes[9]===0x45 && bytes[10]===0x42 && bytes[11]===0x50){return readWebp(bytes);}
  return null;
}
function readWebp(b){const chunk=String.fromCharCode(b[12],b[13],b[14],b[15]); if(chunk==="VP8X" && b.length>=30){return {type:"webp", width:1 + b[24] + (b[25]<<8) + (b[26]<<16), height:1 + b[27] + (b[28]<<8) + (b[29]<<16)};} if(chunk==="VP8 " && b.length>=30){return {type:"webp", width:b[26] + ((b[27]&0x3f)<<8), height:b[28] + ((b[29]&0x3f)<<8)};} if(chunk==="VP8L" && b.length>=25){const bits=b[21] | (b[22]<<8) | (b[23]<<16) | (b[24]<<24); return {type:"webp", width:(bits & 0x3fff)+1, height:((bits>>14)&0x3fff)+1};} return {type:"webp"};}
function u32(b,i){return ((b[i]<<24)>>>0) + (b[i+1]<<16) + (b[i+2]<<8) + b[i+3];}
function hasSupabaseConfig(env){return !!(env?.SUPABASE_URL && (env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY));}
