// Build 184 — admin R2/public image health scan based on IMAGES.md requirements.
import { requireStaffAccess, json } from "../_lib/staff-auth.js";

const PUBLIC_BASE = "https://assets.rosiedazzlers.ca/";
const FALLBACK_ASSETS = [
  ["Pet Hair Removal", "packages/pet_hair_removal.png", "addon", "1200x800 minimum, 1600x1067 preferred"],
  ["Odor Treatment", "packages/odor_treatment.png", "addon", "1200x800 minimum"],
  ["Seat Shampoo", "packages/seat_shampoo.png", "addon", "1200x800 minimum"],
  ["Carpet Shampoo", "packages/carpet_shampoo.png", "addon", "1200x800 minimum"],
  ["Salt Stain Treatment", "packages/salt_stain_treatment.png", "addon", "1200x800 minimum"],
  ["Headlight Restoration", "packages/headlight_restoration.png", "addon", "1200x800 minimum"],
  ["Windshield Ceramic Coating", "packages/windshield_ceramic_coating.png", "addon", "1200x800 minimum"],
  ["Ceramic Spray Protection", "packages/ceramic_spray_wax.png", "addon", "1200x800 minimum"],
  ["Trim Restoration", "packages/trim_restoration.png", "addon", "1200x800 minimum"],
  ["Bug and Tar Removal", "packages/bug_tar_removal.png", "addon", "1200x800 minimum"],
  ["Truck Box Wash", "packages/truck_box_wash.png", "addon", "1200x800 minimum"],
  ["Fleet Vehicle Add-on", "packages/fleet_vehicle_add_on.png", "addon", "1200x800 minimum"],
  ["Tillsonburg local hero", "landing-pages/tillsonburg-auto-detailing.webp", "regional", "1600x900 preferred"],
  ["Woodstock/Ingersoll local hero", "landing-pages/woodstock-ingersoll-auto-detailing.webp", "regional", "1600x900 preferred"],
  ["Simcoe/Delhi local hero", "landing-pages/simcoe-delhi-auto-detailing.webp", "regional", "1600x900 preferred"],
  ["Port Dover local hero", "landing-pages/port-dover-auto-detailing.webp", "regional", "1600x900 preferred"]
];

export async function onRequestPost({ request, env }) { return handle({ request, env, body: await request.json().catch(() => ({})) }); }
export async function onRequestGet({ request, env }) { return handle({ request, env, body: Object.fromEntries(new URL(request.url).searchParams.entries()) }); }

async function handle({ request, env, body }) {
  try {
    const access = await requireStaffAccess({ request, env, body, capability: "manage_bookings", allowLegacyAdminFallback: true });
    if (!access.ok) return access.response;
    const limit = Math.max(1, Math.min(120, Number(body.limit || 80) || 80));
    const assets = await loadAssetsFromPublicJson(request, limit).catch(() => fallbackAssets());
    const rows = [];
    for (const asset of assets.slice(0, limit)) rows.push(await checkAsset(asset));
    const missing = rows.filter((r) => !r.ok);
    return json({ ok: true, build: "184", checked_count: rows.length, missing_count: missing.length, present_count: rows.length - missing.length, assets: rows, missing, upload_base: PUBLIC_BASE, next_step: missing.length ? "Upload missing files to the listed R2 keys, then run this scan again." : "All checked public asset URLs responded successfully." });
  } catch (err) {
    return json({ ok: false, error: err?.message || "Could not scan media asset health." }, 500);
  }
}

async function loadAssetsFromPublicJson(request, limit) {
  const origin = new URL(request.url).origin;
  const res = await fetch(`${origin}/data/image_requirements_build184.json`, { cf: { cacheTtl: 0 } });
  if (!res.ok) throw new Error("image requirements JSON unavailable");
  const data = await res.json();
  const out = [];
  for (const item of data.required_assets || []) out.push(normalizeAsset(item));
  return out.slice(0, limit);
}
function fallbackAssets(){return FALLBACK_ASSETS.map(([label,key,category,required_size])=>normalizeAsset({label,r2_key:key,category,required_size}));}
function normalizeAsset(item){const key=String(item.r2_key || item.key || "").replace(/^\/+/,""); return { label:String(item.label || key), category:String(item.category || "media"), r2_key:key, url:String(item.url || `${PUBLIC_BASE}${key}`), required_size:String(item.required_size || item.requirement || "See IMAGES.md"), upload_method:String(item.upload_method || `Cloudflare R2 → upload ${key}`) };}
async function checkAsset(asset){let status=0, ok=false, contentType="", contentLength=""; try{let res=await fetch(asset.url,{method:"HEAD",cf:{cacheTtl:0}}); if(res.status===405||res.status===403){res=await fetch(asset.url,{method:"GET",cf:{cacheTtl:0}});} status=res.status; ok=res.ok; contentType=res.headers.get("content-type")||""; contentLength=res.headers.get("content-length")||"";}catch(err){return {...asset, ok:false, status:0, error:err?.message || "Fetch failed"};} return {...asset, ok, status, content_type:contentType, content_length:contentLength, issue: ok?"":"missing_or_not_public"};}
