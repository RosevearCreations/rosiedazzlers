// Build 850 — evidence-custodied provider recovery and cross-platform recall.
// This is a local, read-only decision engine; no provider mutation or Master transport.
import {episodeIntegrity849,exceptionPriority849} from './jobday-integrity-849.js';
export const MASTER_CONTRACT_850='rosie.ai-data.social-recall.pilot.v850';
export const PILOT_AUDIT_850='Build 850 receiver pilot owner decision:';
const timestamp=v=>{const n=Date.parse(v||'');return Number.isFinite(n)?n:NaN;};
const latest=(rows,status)=>rows.filter(r=>r.status===status).sort((a,b)=>timestamp(b.created_at)-timestamp(a.created_at))[0]||null;
const verified=(row,status)=>row?.status===status&&row.response_summary?.independent_witness_signature_valid===true;
export function recoveryCustody850(rows=[],{revoked=false,now=Date.now()}={}){
  if(!Array.isArray(rows)||rows.length>=200)return {decision:'HOLD',reasons:['EVIDENCE_WINDOW_INCOMPLETE']};
  const e=episodeIntegrity849(rows,now),p=exceptionPriority849(rows,now),reasons=[];
  if(!revoked)reasons.push('CONSENT_REVOCATION_NOT_ESTABLISHED');
  if(e.integrity_gaps.length)reasons.push('EPISODE_CHAIN_INCOMPLETE');
  if(['CONFLICT_REOPEN_REQUIRED','REOPENED_VERIFIED_PROVIDER_CONFLICT_HOLD','RECALL_OPEN_HOLD'].includes(e.state))reasons.push('RECALL_STILL_OPEN');
  const removed=latest(rows,'provider_witness_verified_removed'),cdn=latest(rows,'cdn_witness_verified_invalidation');
  if(!verified(removed,'provider_witness_verified_removed'))reasons.push('INDEPENDENT_PROVIDER_REMOVAL_UNVERIFIED');
  if(!verified(cdn,'cdn_witness_verified_invalidation'))reasons.push('INDEPENDENT_CDN_PURGE_UNVERIFIED');
  const closure=e.latestClosure;
  if(!closure||!Number.isFinite(timestamp(closure.created_at)))reasons.push('SCOPED_CLOSURE_MISSING');
  if(closure&&(!removed||timestamp(removed.created_at)>timestamp(closure.created_at)||!cdn||timestamp(cdn.created_at)>timestamp(closure.created_at)))reasons.push('CUSTODY_ORDER_INVALID');
  return {decision:reasons.length?'HOLD':'SCOPED_REVIEW_ONLY',reasons:[...new Set(reasons)],priority:p.priority,recall_state:e.state,episode_count:e.episode_count,external_mirrors_verified:false,provider_mutation_performed:false,receipt_ids:{provider:removed?.id||null,cdn:cdn?.id||null,closure:closure?.id||null}};
}
export function crossPlatformRecall850(cases=[],{expectedPlatforms=[]}={}){
  const allowed=new Set(['facebook','instagram','tiktok','youtube','pinterest','x']);
  if(!Array.isArray(cases)||!Array.isArray(expectedPlatforms)||cases.length>100||expectedPlatforms.length>6)return {decision:'HOLD',reasons:['PLATFORM_WINDOW_INVALID']};
  const reasons=[],seen=new Set();
  for(const p of expectedPlatforms){if(!allowed.has(p)||seen.has(p))reasons.push('PLATFORM_MANIFEST_INVALID');seen.add(p);}
  for(const c of cases){if(!allowed.has(c.platform)||!seen.has(c.platform))reasons.push('UNEXPECTED_PLATFORM');if(c.decision!=='SCOPED_REVIEW_ONLY')reasons.push('PLATFORM_RECOVERY_HOLD');}
  for(const p of seen)if(!cases.some(c=>c.platform===p))reasons.push('PLATFORM_EVIDENCE_MISSING');
  if(!seen.size)reasons.push('PLATFORM_MANIFEST_MISSING');
  return {decision:reasons.length?'HOLD':'SCOPED_REVIEW_ONLY',reasons:[...new Set(reasons)],platform_count:seen.size,cases_reviewed:cases.length,third_party_mirrors_verified:false,all_platforms_globally_removed:false};
}
export function receiverPilotDecision850({sourceRevision,ack,expectedCase,now=Date.now(),custody,crossPlatform}={}){
  const reasons=[];
  if(!/^[0-9a-f]{40}$/.test(sourceRevision||''))reasons.push('SOURCE_REVISION_MISSING');
  if(custody?.decision!=='SCOPED_REVIEW_ONLY'||crossPlatform?.decision!=='SCOPED_REVIEW_ONLY')reasons.push('SOURCE_RECOVERY_HOLD');
  // No unsigned browser-submitted claim may grant consumer authority or CONNECTED.
  if(!ack||ack.source_revision!==sourceRevision||ack.source_contract!==MASTER_CONTRACT_850||ack.consumer_id!=='ai-data-platform'||ack.owner_case_reference!==expectedCase)reasons.push('EXACT_MASTER_RECEIVER_ACK_MISSING');
  if(ack?.independent_signature_verified!==true||ack?.durable_replay_verified!==true||ack?.receiver_audience_verified!==true)reasons.push('MASTER_RECEIVER_CUSTODY_UNVERIFIED');
  const observed=timestamp(ack?.observed_at);
  if(!Number.isFinite(observed)||observed>now+300000||now-observed>600000)reasons.push('MASTER_RECEIVER_ACK_STALE');
  // Pilot verdict remains HOLD until independently server-verified; a browser flag is not authority.
  reasons.push('INDEPENDENT_SERVER_SIDE_MASTER_VERIFIER_REQUIRED');
  return {decision:'HOLD',reasons:[...new Set(reasons)],receiver_pilot_accepted:false,master_runtime_ack:false,master_connection:'HOLD',consumer_authorized:false,provider_mutation_performed:false,master_events_emitted:0};
}
