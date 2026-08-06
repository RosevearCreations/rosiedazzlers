// Build 185 — admin R2 upload endpoint with image dimension validation.
import { requireStaffAccess, json } from "../_lib/staff-auth.js";

export async function onRequestPost({ request, env }) {
  try {
    const access = await requireStaffAccess({ request, env, body: {}, capability: "manage_bookings", allowLegacyAdminFallback: true });
    if (!access.ok) return access.response;
    const bucket = env.ROSIE_PUBLIC_ASSETS_BUCKET || env.PUBLIC_ASSETS_BUCKET || env.R2_PUBLIC_ASSETS_BUCKET || env.ASSETS_BUCKET;
    if (!bucket || typeof bucket.put !== "function") return json({ ok:false, error:"No R2 bucket binding is configured. Add a Pages binding such as ROSIE_PUBLIC_ASSETS_BUCKET, then retry.", expected_bindings:["ROSIE_PUBLIC_ASSETS_BUCKET","PUBLIC_ASSETS_BUCKET","R2_PUBLIC_ASSETS_BUCKET","ASSETS_BUCKET"] }, 501);
    const form = await request.formData();
    const file = form.get("file");
    const key = cleanKey(form.get("r2_key") || form.get("key"));
    if (!file || typeof file.arrayBuffer !== "function") return json({ ok:false, error:"A file field is required." }, 400);
    if (!key) return json({ ok:false, error:"r2_key is required, for example packages/pet_hair_removal.png." }, 400);
    if (!isAllowedKey(key)) return json({ ok:false, error:"Only packages/, landing-pages/, gallery/, videos/, brand/, and addons/ keys are allowed from the admin uploader." }, 400);
    const bytes = await file.arrayBuffer();
    const contentType = file.type || guessContentType(key) || "application/octet-stream";
    const dims = readImageDimensions(new Uint8Array(bytes), contentType);
    const minW = Number(form.get("required_width") || form.get("min_width") || 0) || 0;
    const minH = Number(form.get("required_height") || form.get("min_height") || 0) || 0;
    if (dims && minW && minH && (dims.width < minW || dims.height < minH)) return json({ ok:false, error:"Image is smaller than the required dimensions.", dimensions:dims, required:{width:minW,height:minH} }, 400);
    await bucket.put(key, bytes, { httpMetadata: { contentType }, customMetadata: { uploaded_by: access.actor?.email || "staff", build: "185" } });
    const publicBase = String(env.PUBLIC_ASSET_BASE_URL || env.ASSETS_PUBLIC_BASE_URL || "https://assets.rosiedazzlers.ca/").replace(/\/?$/, "/");
    return json({ ok:true, build:"185", r2_key:key, url: publicBase + key, content_type:contentType, size_bytes:bytes.byteLength, dimensions:dims, next_step:"Run Media Health again and confirm the asset is public." });
  } catch (err) { return json({ ok:false, error:err?.message || "Could not upload media asset." }, 500); }
}
export async function onRequestGet(){ return json({ ok:false, error:"POST multipart/form-data with file and r2_key." }, 405); }
function cleanKey(v){return String(v||"").trim().replace(/^\/+/,"").replace(/\.\.+/g,"");}
function isAllowedKey(k){return /^(packages|landing-pages|gallery|videos|brand|addons)\/[a-zA-Z0-9._\/-]+$/.test(k);}
function guessContentType(k){const e=k.split('.').pop().toLowerCase(); return {png:"image/png",jpg:"image/jpeg",jpeg:"image/jpeg",webp:"image/webp",gif:"image/gif",mp4:"video/mp4",webm:"video/webm",svg:"image/svg+xml"}[e]||"application/octet-stream";}
function readImageDimensions(bytes){ if(!bytes||bytes.length<12)return null; if(bytes[0]===0x89&&bytes[1]===0x50&&bytes[2]===0x4e&&bytes[3]===0x47&&bytes.length>=24)return {type:"png",width:u32(bytes,16),height:u32(bytes,20)}; if(bytes[0]===0xff&&bytes[1]===0xd8){let i=2;while(i+9<bytes.length){if(bytes[i]!==0xff){i++;continue;}const m=bytes[i+1],l=(bytes[i+2]<<8)+bytes[i+3];if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(m))return {type:"jpeg",height:(bytes[i+5]<<8)+bytes[i+6],width:(bytes[i+7]<<8)+bytes[i+8]};i+=Math.max(2,l+2);}} return null;}
function u32(b,i){return ((b[i]<<24)>>>0)+(b[i+1]<<16)+(b[i+2]<<8)+b[i+3];}
