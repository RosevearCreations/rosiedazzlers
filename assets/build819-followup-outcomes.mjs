// Build 819: read-only outcomes and guidance from the bounded authorized queue.
// Follow-up confirmation must never imply worksite issue, booking or payment closure.
const eventLabels=Object.freeze({
  request_submitted:'Customer follow-up submitted',
  staff_responded:'Staff response recorded',
  customer_confirmed:'Customer confirmation recorded',
  customer_needs_more_help:'Customer requested more help',
});
const timeValid=value=>typeof value==='string'&&Number.isFinite(Date.parse(value));
const responseRecorded=row=>!!String(row.staff_response||'').trim()&&timeValid(row.staff_responded_at);
const fallback=Object.freeze({kind:'review',label:'Source review needed',guidance:'Refresh the authorized record and check its history before making a closure decision.',closureConfirmed:false});
export function outcome819(row){
  if(!row||typeof row!=='object')return fallback;
  if(row.status==='awaiting_staff'){
    if(row.staff_response||row.staff_responded_at||row.customer_decided_at)return fallback;
    return {kind:'waiting',label:'Awaiting a staff response',guidance:'Check the original concern, owner assignment and supervisor review before writing a customer-visible response. No reply deadline is promised.',closureConfirmed:false};
  }
  if(row.status==='staff_replied'){
    if(!responseRecorded(row)||row.customer_decided_at)return fallback;
    return {kind:'responded',label:'Staff replied; customer decision pending',guidance:'The response is in My Account. Wait for the customer’s decision; do not infer that the worksite issue or booking is closed.',closureConfirmed:false};
  }
  if(row.status==='needs_more_help'){
    if(!responseRecorded(row)||!timeValid(row.customer_decided_at)||!String(row.customer_feedback||'').trim())return fallback;
    return {kind:'needs_help',label:'Customer requested additional help',guidance:'Read the recorded feedback and review a manual next step. A new follow-up or direct contact may be needed; no automatic message or reopening occurs.',closureConfirmed:false};
  }
  if(row.status==='confirmed'){
    if(!responseRecorded(row)||!timeValid(row.customer_decided_at))return fallback;
    return {kind:'confirmed',label:'Customer confirmed this answer',guidance:'This confirms only the follow-up answer. Verify the separate worksite issue before closing work; never infer booking or payment completion.',closureConfirmed:true};
  }
  return fallback;
}
export function latestReturnedHandoff819(row,events){
  if(typeof row?.id!=='string'||!row.id)return null;
  const matching=(Array.isArray(events)?events:[]).filter(e=>
    e?.followup_id===row?.id&&Object.hasOwn(eventLabels,e.event_kind)&&timeValid(e.recorded_at)&&
    Number.isSafeInteger(e.followup_revision)&&e.followup_revision>=0);
  matching.sort((a,b)=>Date.parse(b.recorded_at)-Date.parse(a.recorded_at)||b.followup_revision-a.followup_revision);
  const event=matching[0];
  return event?{label:eventLabels[event.event_kind],recordedAt:event.recorded_at,revision:event.followup_revision}:null;
}
export function outcomeSummary819(rows){
  const result={waiting:0,responded:0,needs_help:0,confirmed:0,review:0,total:0};
  for(const row of Array.isArray(rows)?rows:[]){const kind=outcome819(row).kind;result[kind]++;result.total++;}
  return result;
}
