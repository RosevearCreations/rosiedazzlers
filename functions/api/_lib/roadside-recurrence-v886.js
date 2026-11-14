// Rosie 886: deterministic, read-only cross-audit reconciliation.
// Inputs MUST already be individually signature-verified original 885 audit records.
// Missing windows, duplicate source IDs and owner renewal drift always fail closed.
export const horizons886 = ['4h','24h','7d','30d'];
const validTime = value => typeof value === 'string' && Number.isFinite(Date.parse(value));
export function reconcileAudits886(records, {now = Date.now(), ownerRenewal = null, renewalMaxAgeMs = 24*3600000} = {}) {
  if (!Array.isArray(records) || !Number.isFinite(now) || records.length === 0)
    return {state:'HOLD',reasons:['ORIGINAL_SIGNED_AUDIT_HISTORY_MISSING'],horizons:{}};
  const reasons = [], seen = new Set(), sorted = [...records].sort((a,b)=>Date.parse(a.recorded_at)-Date.parse(b.recorded_at));
  let previous = null;
  for (const a of sorted) {
    if (a?.schema !== 'rosie885-original-continuity-audit-v1' ||
        !validTime(a.recorded_at) || !/^[1-9][0-9]*$/.test(String(a.run_id ?? '')) ||
        !/^[a-f0-9]{64}$/.test(a.latest_checkpoint_sha256 ?? '') ||
        a.chain_state !== 'VERIFIED' || !a.sla || typeof a.sla !== 'object') {
      reasons.push('INVALID_OR_UNVERIFIED_ORIGINAL_AUDIT');continue;
    }
    if (seen.has(String(a.run_id))) reasons.push('DUPLICATE_ORIGINAL_AUDIT_RUN');
    seen.add(String(a.run_id));
    const when = Date.parse(a.recorded_at);
    if (when > now + 300000) reasons.push('FUTURE_ORIGINAL_AUDIT_TIMESTAMP');
    if (previous && previous.when === when && previous.sha !== a.latest_checkpoint_sha256)
      reasons.push('CONFLICTING_SAME_TIME_CHECKPOINT');
    previous = {when, sha:a.latest_checkpoint_sha256};
  }
  const latest=sorted.at(-1), latestAt=Date.parse(latest?.recorded_at);
  const horizons={};
  for (const h of horizons886) {
    const duration=Number.parseInt(h,10)*(h.endsWith('d')?86400000:3600000);
    const within=sorted.filter(a=>validTime(a?.recorded_at) && Date.parse(a.recorded_at) >= now-duration && Date.parse(a.recorded_at)<=now+300000);
    const reported=latest?.sla?.[h] ?? null;
    const mature=sorted.some(a=>validTime(a?.recorded_at) && Date.parse(a.recorded_at)<=now-duration);
    const state=!mature?'HOLD_IMMATURE':!within.length?'HOLD_GAP':reported==='VERIFIED'?'VERIFIED':'HOLD_SOURCE_SLA';
    horizons[h]={state,original_audit_count:within.length,source_status:reported};
    if(state!=='VERIFIED') reasons.push('ORIGINAL_'+h.toUpperCase()+'_COVERAGE_'+state);
  }
  if(!validTime(latest?.recorded_at) || now-latestAt>=4*3600000)
    reasons.push('LATEST_ORIGINAL_AUDIT_STALE');
  if(!ownerRenewal || ownerRenewal.original_owner_verified!==true ||
     !validTime(ownerRenewal.recorded_at) || !ownerRenewal.audit_run_id ||
     String(ownerRenewal.audit_run_id)!==String(latest?.run_id) ||
     ownerRenewal.latest_checkpoint_sha256!==latest?.latest_checkpoint_sha256 ||
     now-Date.parse(ownerRenewal.recorded_at)>renewalMaxAgeMs ||
     Date.parse(ownerRenewal.recorded_at)>now+300000) reasons.push('OWNER_RENEWAL_DRIFT_OR_MISSING');
  return {schema:'rosie886-recurrence-reconciliation-v1',
    state:reasons.length?'HOLD':'VERIFIED', reasons:[...new Set(reasons)],
    horizons, original_audits:sorted.length, latest_original_run_id:latest?.run_id??null,
    latest_original_checkpoint_sha256:latest?.latest_checkpoint_sha256??null,
    original_provider_delivery_not_inferred:true, original_approval_not_inferred:true};
}
