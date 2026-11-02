// Build 749 — immutable, booking-scoped detail-quality evidence receipts.
// A checklist or review is NOT a customer signature or an incident/claim decision.
export const QC_EVENT749={check:'detail_qc_check_v749',issue:'detail_qc_exception_v749',resolve:'detail_qc_rework_verified_v749',submit:'detail_qc_submitted_v749',review:'detail_qc_review_v749'};
export const QC_ITEMS749=Object.freeze({
  before:['existing_condition','agreed_scope','worksite_safety'],
  after:['exterior_finish','interior_finish','final_walkaround']
});
export const QC_TYPES749=Object.freeze(['rework','damage_concern','missing_step','customer_dispute','other']);
export const QC_MUST_PASS749=Object.freeze(['agreed_scope','worksite_safety','final_walkaround']);
export function isQcEvent749(row){return Object.values(QC_EVENT749).includes(row?.event_type);}
export function reconcileQuality749(source=[],media=[]){
  const events=(Array.isArray(source)?source:[]).filter(isQcEvent749).slice().sort((a,b)=>String(a.created_at||'').localeCompare(String(b.created_at||''))||String(a.id).localeCompare(String(b.id)));
  const checks={before:{},after:{}},issues=new Map(),submissions=[],reviews=new Map(),warnings=[];
  for(const row of events){
    const p=row.payload||{};
    if(row.event_type===QC_EVENT749.check&&QC_ITEMS749[p.phase]?.includes(p.item))checks[p.phase][p.item]={result:p.result,note:String(p.note||'').slice(0,350),id:row.id,at:row.created_at};
    if(row.event_type===QC_EVENT749.issue)issues.set(row.id,{id:row.id,kind:p.kind,note:String(p.note||''),evidence_id:p.evidence_id||null,opened_by:p.actor_id||null,opened_at:row.created_at,resolved:false});
    if(row.event_type===QC_EVENT749.resolve&&issues.has(p.issue_id)){
      const issue=issues.get(p.issue_id);
      if(issue.kind==='rework'||issue.kind==='missing_step'){issue.resolved=true;issue.resolution={note:p.note,evidence_id:p.evidence_id,reviewer_id:p.actor_id,at:row.created_at};}
    }
    if(row.event_type===QC_EVENT749.submit)submissions.push(row);
    if(row.event_type===QC_EVENT749.review)reviews.set(p.submission_id,row);
  }
  const missing=[];
  for(const [phase,items] of Object.entries(QC_ITEMS749))for(const item of items){const x=checks[phase][item];if(!x||!['pass','not_applicable'].includes(x.result)||(QC_MUST_PASS749.includes(item)&&x.result!=='pass'))missing.push(`${phase}: ${item.replaceAll('_',' ')}`);}
  const photos=Array.isArray(media)?media:[];
  const validPhoto=row=>row?.visibility==='internal'&&!['rejected'].includes(row.review_status)&&!['hidden','removed'].includes(row.thread_status)&&Boolean(row.media_url||(row.storage_bucket&&row.storage_path));
  const beforePhoto=photos.some(row=>row.stage==='arrival'&&validPhoto(row)),afterPhoto=photos.some(row=>row.stage==='final'&&validPhoto(row));
  if(!beforePhoto)missing.push('Private before-service photo');
  if(!afterPhoto)missing.push('Private after-service photo');
  const openIssues=[...issues.values()].filter(x=>!x.resolved);
  const latestSubmission=submissions.at(-1)||null;
  const latestReview=latestSubmission?reviews.get(latestSubmission.id)||null:null;
  const sourceEvents=events.filter(x=>[QC_EVENT749.check,QC_EVENT749.issue,QC_EVENT749.resolve].includes(x.event_type));
  const last=sourceEvents.at(-1),revision=`${sourceEvents.length}:${last?.id||'none'}`;
  const sourceReady=!missing.length&&!openIssues.length;
  const accepted=!!latestReview&&latestReview.payload?.decision==='accepted'&&latestSubmission?.payload?.revision===revision&&sourceReady;
  const qcStatus=accepted?'approved':openIssues.length?'exception_hold':latestReview?.payload?.decision==='needs_rework'?'rework_requested':latestSubmission?.payload?.revision===revision?'review_pending':sourceReady?'ready_for_review':'incomplete';
  return {build:749,revision,started:events.length>0,status:qcStatus,receipt_ids:events.map(x=>x.id),checks,missing,issues:[...issues.values()],open_issue_count:openIssues.length,
    source_ready:sourceReady,photos:{before:beforePhoto,after:afterPhoto},submitted:latestSubmission?{id:latestSubmission.id,at:latestSubmission.created_at,staff_user_id:latestSubmission.payload?.staff_user_id,revision:latestSubmission.payload?.revision}:null,
    review:latestReview?{id:latestReview.id,decision:latestReview.payload?.decision,note:latestReview.payload?.note,at:latestReview.created_at}:null,
    approved:accepted,warnings};
}
export async function qcReceiptId749(parts){
  const hash=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(`rosiedazzlers:749:${parts.join(':')}`)));
  hash[6]=(hash[6]&15)|80;hash[8]=(hash[8]&63)|128;
  const s=Array.from(hash.slice(0,16),x=>x.toString(16).padStart(2,'0')).join('');return `${s.slice(0,8)}-${s.slice(8,12)}-${s.slice(12,16)}-${s.slice(16,20)}-${s.slice(20)}`;
}
