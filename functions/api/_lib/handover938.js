import { serviceHeaders } from './staff-auth.js';
import { verifyCaptureConsent747 } from './media-capture-v747.js';
import { signedStorageUrl } from './job-live-feed.js';

export const views = ['Driver’s footwell', 'Seat bolster', 'Cargo area'];
export const reportType = 'private_handover_report_938';
export const choiceType = 'private_handover_choices_938';
export const reply = (body, status = 200) => Response.json(body, {status, headers:{'Cache-Control':'private, no-store'}});
export async function rows(env, table, params) {
  const res = await fetch(env.SUPABASE_URL + '/rest/v1/' + table + '?' + new URLSearchParams(params), {headers:serviceHeaders(env)});
  if (!res.ok) throw Error('Record lookup unavailable');
  return res.json();
}
export async function latest(env, booking, type) {
  const [event] = await rows(env,'booking_events',{booking_id:'eq.'+booking,event_type:'eq.'+type,select:'id,payload',order:'created_at.desc,id.desc',limit:'1'});
  return event;
}
export async function record(env, booking, type, payload, actor) {
  const res = await fetch(env.SUPABASE_URL+'/rest/v1/booking_events',{method:'POST',headers:serviceHeaders(env),body:JSON.stringify({booking_id:booking,event_type:type,actor_name:actor,event_note:type===reportType?'Private handover prepared':'Private handover preferences saved',payload})});
  if (!res.ok) throw Error('Could not save handover');
}
export async function originals(env, booking) {
  const consent=await verifyCaptureConsent747(env,booking);
  if (!consent.ok) return [];
  const [media, receipts] = await Promise.all([
    rows(env,'job_media',{booking_id:'eq.'+booking,visibility:'eq.internal',kind:'eq.photo',upload_status:'eq.complete',select:'id,stage,storage_bucket,storage_path,caption,created_at',stage:'in.(arrival,pre_existing,final)'}),
    rows(env,'booking_events',{booking_id:'eq.'+booking,event_type:'eq.detailer_original_photo_v747',select:'payload'})
  ]);
  const provenance = new Map(receipts.map(({payload})=>[payload.job_media_id,payload]));
  return media.flatMap(m=>{
    const p=provenance.get(m.id);
    if (!p || p.consent_receipt_id!==consent.receipt_id || p.consent_intake_revision!==consent.revision || p.privacy_review?.finding!=='clear' || !p.privacy_review.faces_plates_addresses_checked ||
        m.storage_path!==p.original_storage_path || m.storage_bucket!==p.original_storage_bucket ||
        !m.storage_path?.startsWith('jobs/'+booking+'/v747/'+m.stage+'/') || p.authentic_stage!==m.stage ||
        !/^[a-f0-9]{64}$/.test(p.original_sha256)) return [];
    return [{...m,hash:p.original_sha256}];
  });
}
export function validateReport(input, media) {
  if (!Array.isArray(input) || input.length!==views.length) return null;
  const used=new Set(), result=[];
  for (const row of input) {
    if (!row || !['skip','pair'].includes(row.mode)) return null;
    const note=String(row.note||'').trim(), care=String(row.care||'').trim();
    if (!note || note.length>400 || care.length>400) return null;
    if (row.mode==='skip') { result.push({mode:'skip',note}); continue; }
    const before=media.find(m=>m.id===row.before), after=media.find(m=>m.id===row.after);
    if (!care || !before || !after || !['arrival','pre_existing'].includes(before.stage) || after.stage!=='final' ||
        before.hash===after.hash || used.has(before.hash) || used.has(after.hash)) return null;
    used.add(before.hash); used.add(after.hash);
    result.push({mode:'pair',before:before.id,after:after.id,note,care});
  }
  return result;
}
export async function customerReport(env, booking, report) {
  const media=await originals(env,booking);
  const pairs=validateReport(report.payload.views,media);
  if (!pairs) return null;
  async function photo(id) {
    const m=media.find(x=>x.id===id);
    const url=await signedStorageUrl({env,bucket:m.storage_bucket,path:m.storage_path,expiresIn:60});
    if (!url) throw Error('Original unavailable');
    return {url,recorded_at:m.created_at};
  }
  return Promise.all(pairs.map(async (r,i)=>r.mode==='skip'?{view:views[i],skipped:r.note}:
    {view:views[i],note:r.note,care:r.care,before:await photo(r.before),after:await photo(r.after)}));
}
