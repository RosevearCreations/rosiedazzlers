// Build 907: proof-bound uploads and staff quote association, not public media release.
export const QUOTE_LIMIT_907=6;
export const UPLOAD_PROOF_TTL_MS907=6*60*60*1000;
export const VALID_MEDIA907=['image/jpeg','image/png','image/webp','image/heic','image/heif','video/mp4','video/quicktime','video/webm'];
export const validUuid907=s=>typeof s==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
export const validProof907=s=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s);
export const limitedText907=(s,n=500)=>String(s??'').trim().replace(/[\u0000-\u001f]/g,' ').slice(0,n);
export function normalizedReceipts907(items){
 if(!Array.isArray(items)||items.length>QUOTE_LIMIT_907)return null;
 const out=[],seen=new Set();
 for(const r of items){
  if(!r||typeof r!=='object'||Array.isArray(r)||!validUuid907(r.intake_id)||!validProof907(r.proof)||
   Object.keys(r).some(k=>!['intake_id','proof'].includes(k))||seen.has(r.intake_id))return null;
  seen.add(r.intake_id);out.push({intake_id:r.intake_id,proof:r.proof});
 }
 return out;
}
export async function sha256Receipt907(raw){
 const bytes=new TextEncoder().encode(String(raw||'')),hash=await crypto.subtle.digest('SHA-256',bytes);
 return [...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
export function cleanQuote907(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).some(k=>![
  'client_request_id','topic','full_name','email','phone','service_area','vehicle_size',
  'message','photo_receipts','photo_estimate_links','requested_service_codes','website'
 ].includes(k)))return {ok:false,error:'Unsupported quote field'};
 if(!validUuid907(raw.client_request_id))return {ok:false,error:'Original request ID required'};
 const full_name=limitedText907(raw.full_name,120),email=limitedText907(raw.email,220).toLowerCase();
 const phone=limitedText907(raw.phone,35),message=limitedText907(raw.message,900);
 if(full_name.length<2||(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)&&phone.replace(/\D/g,'').length<7)||
  message.length<12)return {ok:false,error:'Name, contact details and 12-character request are required'};
 const topic=['photo_estimate','manual_custom'].includes(raw.topic)?raw.topic:'photo_estimate';
 const links=(Array.isArray(raw.photo_estimate_links)?raw.photo_estimate_links:[])
  .filter(x=>typeof x==='string'&&/^https:\/\//i.test(x)&&x.length<=500)
  .slice(0,8);
 const codes=[...new Set((Array.isArray(raw.requested_service_codes)?raw.requested_service_codes:[])
  .filter(x=>typeof x==='string'&&/^[a-z0-9_-]{2,80}$/.test(x)))].slice(0,12);
 const receipts=normalizedReceipts907(raw.photo_receipts||[]);
 if(receipts===null)return {ok:false,error:'Invalid or repeated media receipts'};
 return {ok:true,client_request_id:raw.client_request_id,topic,
  full_name,email:/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)?email:null,
  phone:phone||null,message,service_area:limitedText907(raw.service_area,120),
  vehicle_size:['small','mid','oversize'].includes(raw.vehicle_size)?raw.vehicle_size:null,
  photo_receipts:receipts,photo_estimate_links:[...new Set(links)],requested_service_codes:codes,
  website:limitedText907(raw.website,100)};
}
export function validOriginalUpload907(row,receipt,now=Date.now()){
 return !!row&&validUuid907(row.intake_id)&&row.intake_id===receipt.intake_id&&
  row.upload_proof_hash&&typeof row.upload_proof_hash==='string'&&
  row.status==='uploaded'&&!row.lead_id&&!row.booking_id&&row.verified_at&&
  !Number.isNaN(Date.parse(row.verified_at))&&
  Number.isFinite(Date.parse(row.created_at))&&now>=Date.parse(row.created_at)&&
  now-Date.parse(row.created_at)<=UPLOAD_PROOF_TTL_MS907&&
  VALID_MEDIA907.includes(row.content_type)&&
  typeof row.bucket==='string'&&row.bucket.length<=80&&
  typeof row.object_path==='string'&&row.object_path.startsWith('photo-estimates/');
}
