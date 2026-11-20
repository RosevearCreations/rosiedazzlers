// Build 914: fail-closed supplier custody, creative consent and first-party attribution contracts.
// This module never fetches private DAIP media or treats a video URL as evidence of publication.
export const UUID914=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const CHANNELS914=new Set(['youtube','instagram','facebook']);
export function normalizeCustody914(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).some(k=>!['supplier_review_id','custody_kind','evidence_reference','received_at','custody_note'].includes(k)))throw Error('Invalid custody input');
 if(!UUID914.test(raw.supplier_review_id))throw Error('Supplier review ID required');
 if(!['not_received','purchased','gifted','loaned','review_sample'].includes(raw.custody_kind))throw Error('Invalid custody kind');
 if(raw.custody_kind==='not_received')throw Error('Unreceived item cannot have a custody attestation');
 if(!/^[A-Za-z0-9 ._:/#-]{8,180}$/.test(String(raw.evidence_reference||'')))throw Error('Private evidence reference required');
 const received=new Date(raw.received_at);
 if(!Number.isFinite(+received)||+received>Date.now()+60000||+received<Date.now()-366*86400000)throw Error('Invalid custody date');
 const note=String(raw.custody_note||'').trim();
 if(note.length<10||note.length>600)throw Error('Custody context required');
 return {supplier_review_id:raw.supplier_review_id,custody_kind:raw.custody_kind,evidence_reference:raw.evidence_reference,received_at:received.toISOString(),custody_note:note};
}
export function assessPublication914({review,custody,project,workflow,decision,assetIds=[]}){
 const blockers=[];
 if(!review||!UUID914.test(review.id))blockers.push('SUPPLIER_DRAFT_MISSING');
 if(!custody||!UUID914.test(custody.id)||custody.supplier_review_id!==review?.id)blockers.push('ORIGINAL_CUSTODY_MISSING');
 if(!project||project.id!==review?.daip_project_id)blockers.push('DAIP_PROJECT_LINK_MISSING');
 if(!workflow?.public_handoff_ready||workflow.project_id!==project?.id)blockers.push('PRIVATE_CREATIVE_REVIEW_INCOMPLETE');
 const selected=workflow?.handoff_manifest?.selected_private_asset_ids||[];
 if(!Array.isArray(assetIds)||!assetIds.length||!assetIds.every(x=>UUID914.test(x)&&selected.includes(x))||new Set(assetIds).size!==assetIds.length)
  blockers.push('EXPLICIT_SELECTED_ASSETS_REQUIRED');
 if(!decision||decision.approved!==true||!UUID914.test(decision.approver_id)||!CHANNELS914.has(decision.channel))blockers.push('HUMAN_CHANNEL_APPROVAL_REQUIRED');
 if(decision?.supplier_review_id!==review?.id||decision?.project_id!==project?.id)blockers.push('DECISION_SCOPE_MISMATCH');
 if(!decision?.consent_record_id||!UUID914.test(decision.consent_record_id))blockers.push('CONSENT_RECEIPT_REQUIRED');
 if(['gifted','loaned','review_sample'].includes(custody?.custody_kind)&&decision?.disclosure_confirmed!==true)blockers.push('MATERIAL_CONNECTION_DISCLOSURE_REQUIRED');
 if(!decision?.creative_reviewed_at||!Number.isFinite(Date.parse(decision.creative_reviewed_at)))blockers.push('CREATIVE_REVIEW_TIMESTAMP_REQUIRED');
 return {ready:blockers.length===0,blockers,auto_publish:false,raw_media_public:false,channel:decision?.channel||null};
}
export function normalizeAttribution914(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).some(k=>!['campaign_id','event_kind','source'].includes(k)))throw Error('Invalid attribution');
 if(!UUID914.test(raw.campaign_id))throw Error('Campaign ID required');
 if(!['landing','product_interest','quote_started'].includes(raw.event_kind))throw Error('Unsupported attribution event');
 if(!['youtube','instagram','facebook'].includes(raw.source))throw Error('Unsupported campaign source');
 return {campaign_id:raw.campaign_id,event_kind:raw.event_kind,source:raw.source};
}
