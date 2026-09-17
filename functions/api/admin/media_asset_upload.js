// Build 185 — admin R2 upload endpoint with image dimension validation.
// Build 408 — truthful bucket/environment identity and same-key retry/recovery evidence.
import { requireStaffAccess, json } from "../_lib/staff-auth.js";

const BUILD=408;
const EXPECTED_BINDINGS=["ROSIE_PUBLIC_ASSETS_BUCKET","PUBLIC_ASSETS_BUCKET","R2_PUBLIC_ASSETS_BUCKET","ASSETS_BUCKET"];
function bucketIdentity(env){
  const bindingName=EXPECTED_BINDINGS.find((name)=>env?.[name])||null;
  return {
    binding_name:bindingName,
    bucket_name:String(env?.PUBLIC_ASSETS_BUCKET_NAME||env?.R2_PUBLIC_ASSETS_BUCKET_NAME||"").trim()||null,
    environment:String(env?.APP_ENVIRONMENT||env?.CF_PAGES_BRANCH||env?.CF_PAGES_ENVIRONMENT||"unknown").trim()||"unknown",
    public_base_url:String(env?.PUBLIC_ASSET_BASE_URL||env?.ASSETS_PUBLIC_BASE_URL||"https://assets.rosiedazzlers.ca/").replace(/\/?$/, "/")
  };
}

export async function onRequestPost({ request, env }) {
  try {
    const access = await requireStaffAccess({ request, env, body: {}, capability: "manage_bookings", allowLegacyAdminFallback: true });
    if (!access.ok) return access.response;
    const identity=bucketIdentity(env);
    const bucket=identity.binding_name?env[identity.binding_name]:null;
    if (!bucket || typeof bucket.put !== "function") return json({ ok:false, build:BUILD, result_status:"unavailable", error:"No R2 bucket binding is configured. Add a Pages binding such as ROSIE_PUBLIC_ASSETS_BUCKET, then retry.", expected_bindings:EXPECTED_BINDINGS, bucket_identity:identity }, 501);
    const form = await request.formData();
    const file = form.get("file");
    const rawKey = String(form.get("r2_key") || form.get("key") || "");
    const key = cleanKey(rawKey);
    if (!file || typeof file.arrayBuffer !== "function") return json({ ok:false, build:BUILD, error:"A file field is required.", bucket_identity:identity }, 400);
    if (!key) return json({ ok:false, build:BUILD, error:"r2_key is required, for example packages/pet_hair_removal.png.", bucket_identity:identity }, 400);
    if (!isAllowedKey(key)) return json({ ok:false, build:BUILD, error:"Only approved public asset folders are allowed: packages/, landing_pages/, landing-pages/, CarPhotos/, gallery/, videos/, brand/, addons/, and products/.", bucket_identity:identity }, 400);
    const maxBytes = /^videos\//i.test(key) ? 250 * 1024 * 1024 : 20 * 1024 * 1024;
    if (Number(file.size || 0) > maxBytes) return json({ ok:false, build:BUILD, error:`File exceeds the ${Math.round(maxBytes/1024/1024)} MB admin upload limit.`, bucket_identity:identity }, 413);
    const bytes = await file.arrayBuffer();
    const contentType = file.type || guessContentType(key) || "application/octet-stream";
    const dims = readImageDimensions(new Uint8Array(bytes), contentType);
    const minW = Number(form.get("required_width") || form.get("min_width") || 0) || 0;
    const minH = Number(form.get("required_height") || form.get("min_height") || 0) || 0;
    if (dims && minW && minH && (dims.width < minW || dims.height < minH)) return json({ ok:false, build:BUILD, error:"Image is smaller than the required dimensions.", dimensions:dims, required:{width:minW,height:minH}, bucket_identity:identity }, 400);
    await bucket.put(key, bytes, { httpMetadata: { contentType }, customMetadata: { uploaded_by: access.actor?.email || "staff", build: String(BUILD) } });
    return json({
      ok:true,build:BUILD,result_status:"complete",r2_key:key,
      url:identity.public_base_url + key.split("/").map(encodeURIComponent).join("/"),content_type:contentType,size_bytes:bytes.byteLength,dimensions:dims,
      bucket_identity:identity,retry_safe_same_key:true,retry_key:key,
      recovery:"If the client loses the response, retry the same approved r2_key. The upload targets only that exact key; do not create a second recovery key.",
      next_step:"Sync the exact approved prefix, assign the managed media row, and confirm the public asset URL."
    });
  } catch (err) { return json({ ok:false, build:BUILD, result_status:"unavailable", error:err?.message || "Could not upload media asset." }, 500); }
}
export async function onRequestGet(){ return json({ ok:false, build:BUILD, error:"POST multipart/form-data with file and r2_key." }, 405); }
function cleanKey(v){return String(v||"").trim().replace(/^\/+/ ,"").replace(/\\/g,"/").replace(/\/{2,}/g,"/");}
function hasUnsafePath(k){return String(k||"").split("/").some((segment)=>segment==="."||segment==="..")||String(k||"").includes("\0");}
function isAllowedKey(k){return !hasUnsafePath(k) && /^(packages|landing_pages|landing-pages|CarPhotos|gallery|videos|brand|addons|products)\/[a-zA-Z0-9._() \&+@,\'\/-]+$/.test(k);}
function guessContentType(k){const e=k.split('.').pop().toLowerCase(); return {png:"image/png",jpg:"image/jpeg",jpeg:"image/jpeg",webp:"image/webp",gif:"image/gif",mp4:"video/mp4",webm:"video/webm",svg:"image/svg+xml",avif:"image/avif"}[e]||"application/octet-stream";}
function readImageDimensions(bytes){ if(!bytes||bytes.length<12)return null; if(bytes[0]===0x89&&bytes[1]===0x50&&bytes[2]===0x4e&&bytes[3]===0x47&&bytes.length>=24)return {type:"png",width:u32(bytes,16),height:u32(bytes,20)}; if(bytes[0]===0xff&&bytes[1]===0xd8){let i=2;while(i+9<bytes.length){if(bytes[i]!==0xff){i++;continue;}const m=bytes[i+1],l=(bytes[i+2]<<8)+bytes[i+3];if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(m))return {type:"jpeg",height:(bytes[i+5]<<8)+bytes[i+6],width:(bytes[i+7]<<8)+bytes[i+8]};i+=Math.max(2,l+2);}} return null;}
function u32(b,i){return ((b[i]<<24)>>>0)+(b[i+1]<<16)+(b[i+2]<<8)+b[i+3];}
