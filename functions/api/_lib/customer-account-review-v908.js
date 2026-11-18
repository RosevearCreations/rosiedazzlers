// Rosie 908: privacy-minimized customer history and explicit review receipts.
export const UUID908=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const KINDS908=['quote','media_booking','media_quote'];
export function ownsBooking908(row,profileId,email,emailVerified=false){
 return !!row&&UUID908.test(String(row.id||''))&&(
  row.customer_profile_id===profileId ||
  (!row.customer_profile_id&&emailVerified&&String(row.customer_email||'').trim().toLowerCase()===email)
 );
}
export function safeBooking908(row){
 return {id:row.id,created_at:row.created_at,service_date:row.service_date,start_slot:row.start_slot,
  status:row.status,job_status:row.job_status,package_code:row.package_code,vehicle_size:row.vehicle_size,
  price_total_cents:row.price_total_cents,deposit_cents:row.deposit_cents,
  completed_at:row.detailing_completed_at||null,checkout_resume_available:false};
}
export function safeQuote908(row){
 return {id:row.id,title:String(row.title||'Detailing quote').slice(0,140),
  status:row.status,acceptance_status:row.acceptance_status,sent_at:row.sent_at,updated_at:row.updated_at,
  accepted_at:row.accepted_at,declined_at:row.declined_at,terms_expires_at:row.terms_expires_at};
}
export async function revision908(parts){
 const bytes=new TextEncoder().encode(JSON.stringify(parts));
 const hash=await crypto.subtle.digest('SHA-256',bytes);
 return [...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
export function allowedReview908(value){
 return !!value&&typeof value==='object'&&!Array.isArray(value)&&
  Object.keys(value).sort().join(',')==='acknowledged,kind,revision,subject_id'&&
  value.acknowledged===true&&KINDS908.includes(value.kind)&&UUID908.test(value.subject_id)&&
  typeof value.revision==='string'&&/^[a-f0-9]{64}$/.test(value.revision);
}
export function verifiedMedia908(row){
 return !!row&&row.status==='uploaded'&&!!row.verified_at&&
  Number.isFinite(Date.parse(row.verified_at))&&
  (String(row.content_type||'').startsWith('image/')||String(row.content_type||'').startsWith('video/'));
}
export function summarizeMedia908(rows){
 const verified=(Array.isArray(rows)?rows:[]).filter(verifiedMedia908).sort((a,b)=>String(a.id).localeCompare(String(b.id)));
 return {count:verified.length,images:verified.filter(x=>String(x.content_type).startsWith('image/')).length,
  videos:verified.filter(x=>String(x.content_type).startsWith('video/')).length,
  latest_verified_at:verified.reduce((s,x)=>!s||x.verified_at>s?x.verified_at:s,null),
  revision_parts:verified.map(x=>[x.id,x.verified_at,x.status])};
}
