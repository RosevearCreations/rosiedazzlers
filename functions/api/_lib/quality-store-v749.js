import {serviceHeaders} from './staff-auth.js';
import {QC_EVENT749,reconcileQuality749} from './quality-v749.js';

export async function qualitySnapshot749(env,bookingId){
  const types=Object.values(QC_EVENT749).join(',');
  const evQuery=new URLSearchParams({select:'id,booking_id,event_type,created_at,actor_name,payload',booking_id:`eq.${bookingId}`,event_type:`in.(${types})`,order:'created_at.asc,id.asc',limit:'250'});
  const mediaQuery=new URLSearchParams({select:'id,stage,visibility,review_status,thread_status,media_url,storage_bucket,storage_path,created_at',booking_id:`eq.${bookingId}`,stage:'in.(arrival,final,issue,during)',order:'created_at.desc',limit:'150'});
  const [er,mr]=await Promise.all([
    fetch(`${env.SUPABASE_URL}/rest/v1/booking_events?${evQuery}`,{headers:serviceHeaders(env)}),
    fetch(`${env.SUPABASE_URL}/rest/v1/job_media?${mediaQuery}`,{headers:serviceHeaders(env)})
  ]);
  if(!er.ok||!mr.ok)throw Error('Quality receipts or private photo evidence could not be verified; completion is held.');
  const events=await er.json(),media=await mr.json();
  if(!Array.isArray(events)||!Array.isArray(media)||events.length>=250||media.length>=150)throw Error('Quality source is incomplete; Operations must inspect the full history.');
  return {events,media,summary:reconcileQuality749(events,media)};
}

export async function saveQualityReceipt749(env,row){
  const res=await fetch(`${env.SUPABASE_URL}/rest/v1/booking_events`,{method:'POST',headers:{...serviceHeaders(env),Prefer:'return=representation'},body:JSON.stringify([row])}).catch(()=>null);
  if(res?.status===409){
    const q=new URLSearchParams({select:'id,event_type,booking_id,payload',id:`eq.${row.id}`,limit:'1'});
    const read=await fetch(`${env.SUPABASE_URL}/rest/v1/booking_events?${q}`,{headers:serviceHeaders(env)});
    const existing=read.ok?(await read.json().catch(()=>[]))[0]:null;
    if(existing?.id===row.id&&existing?.booking_id===row.booking_id&&existing?.event_type===row.event_type&&
      Object.keys(row.payload||{}).every(key=>JSON.stringify(existing.payload?.[key])===JSON.stringify(row.payload?.[key])))return {duplicate:true};
    throw Error('A different quality receipt already uses this operation ID. Reload before continuing.');
  }
  if(!res?.ok)throw Error('Quality receipt outcome is uncertain. Reload the source before retrying with the SAME operation ID.');
  const inserted=await res.json().catch(()=>[]);
  if(!inserted?.[0]?.id)throw Error('Quality receipt confirmation unavailable. Reload before retrying.');
  return {duplicate:false};
}
