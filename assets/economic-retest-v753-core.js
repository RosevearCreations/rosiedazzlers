// Shared deterministic comparison for Build 753. No browser or database side effects.
const hex64=value=>typeof value==='string'&&/^[a-f0-9]{64}$/i.test(value);
const clean=value=>String(value??'').trim();
const time=value=>Number.isFinite(Date.parse(value))?Date.parse(value):null;
const issueKey=issue=>`${clean(issue.code)}|${clean(issue.reason)}`;
const sorted=items=>[...items].sort((a,b)=>a.localeCompare(b));
const sourceRows=packet=>new Map(packet.rows.map(row=>[row.booking_id,row]));
const sourceIssues=(packet,id)=>new Set((packet.exceptions||[]).filter(issue=>issue.booking_id===id).map(issueKey));
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);

export function compareEconomicRetests753(baseline,retest){
  if(!baseline?.ok||!retest?.ok||baseline.build!==753||retest.build!==753||
    baseline.source_build!==752||retest.source_build!==752)throw Error('Two authenticated Build 753 source reads are required.');
  if(!hex64(baseline.snapshot_sha256)||!hex64(retest.snapshot_sha256))throw Error('Both source hashes must be valid SHA-256 values.');
  if(!baseline.read_id||!retest.read_id||baseline.read_id===retest.read_id||
    time(baseline.read_at)==null||time(retest.read_at)==null||time(retest.read_at)<=time(baseline.read_at))
    throw Error('Retest must be a distinct, later source read.');
  if(!baseline.period||!retest.period||baseline.period.year!==retest.period.year||baseline.period.month!==retest.period.month)
    throw Error('Retest period differs; recapture the baseline.');
  if(!Array.isArray(baseline.rows)||!Array.isArray(retest.rows)||!Array.isArray(baseline.exceptions)||!Array.isArray(retest.exceptions))
    throw Error('Missing source rows or exception evidence.');
  const old=sourceRows(baseline),now=sourceRows(retest);
  if(old.size!==baseline.rows.length||now.size!==retest.rows.length||old.has('')||now.has(''))throw Error('Duplicate or missing booking identity; comparison held.');
  const ids=sorted(new Set([...old.keys(),...now.keys()])),rows=[];
  for(const booking_id of ids){
    const a=old.get(booking_id),b=now.get(booking_id),oldIssues=sourceIssues(baseline,booking_id),newIssues=sourceIssues(retest,booking_id);
    const disappeared=sorted([...oldIssues].filter(value=>!newIssues.has(value))),appeared=sorted([...newIssues].filter(value=>!oldIssues.has(value)));
    const sourceFields=['package_code','vehicle_size','season_bucket','recorded_revenue_cents','starting_guide_cents','managed_guide_cents',
      'managed_price_status','decision_gate','pre_travel_contribution_cents','ledger_batch_ids'];
    const changed_fields=a&&b?sourceFields.filter(field=>!same(a[field],b[field])):['booking_membership'];
    const global_provenance_changed=baseline.managed_catalog_status!==retest.managed_catalog_status;
    const changed=changed_fields.length>0||global_provenance_changed||disappeared.length>0||appeared.length>0;
    const state=!a||!b?'membership_change_review':appeared.length?'new_exception_review':disappeared.length?'disappeared_gap_needs_source_proof':
      changed?'source_drift_review':b.decision_gate==='owner_review_candidate'?'owner_receipt_pending':'retained_hold';
    rows.push({booking_id,package_code:b?.package_code||a?.package_code||null,vehicle_size:b?.vehicle_size||a?.vehicle_size||null,
      baseline_gate:a?.decision_gate||'not_observed',retest_gate:b?.decision_gate||'not_observed',
      baseline_issue_count:oldIssues.size,retest_issue_count:newIssues.size,
      disappeared_issues:disappeared,appeared_issues:appeared,changed_fields,global_provenance_changed,
      retest_disposition:state,source_correction_verified:false,owner_approval_verified:false,
      explicit_hold:true,source_href:'/admin-economic-acceptance-v752.html'});
  }
  return {build:753,authority:'owner_exception_disposition_source_retest_receipt_review',period:baseline.period,
    baseline:{read_at:baseline.read_at,read_id:baseline.read_id,snapshot_sha256:baseline.snapshot_sha256},
    retest:{read_at:retest.read_at,read_id:retest.read_id,snapshot_sha256:retest.snapshot_sha256},
    comparison_status:baseline.snapshot_sha256===retest.snapshot_sha256?'same_source_snapshot':'source_snapshot_changed',
    rows,summary:{booking_count:rows.length,disappeared_gap_candidates:rows.filter(x=>x.disappeared_issues.length).length,
      newly_appeared_issue_bookings:rows.filter(x=>x.appeared_issues.length).length,
      source_drift_bookings:rows.filter(x=>x.changed_fields.length||x.global_provenance_changed).length,
      owner_receipts_verified:0,source_corrections_verified:0,exceptions_closed:0},
    boundaries:{read_only:true,source_delta_not_approved_correction:true,disappeared_issue_not_closed:true,
      receipt_metadata_not_authentication:true,owner_approval_recorded:false,pricing_or_cogs_write:false,
      winter_availability_hold_retained:true,missing_ledger_cost_not_zero:true,pre_travel_contribution_not_net_margin:true}};
}

export function reviewOwnerReceipt753(receipt,comparison,bookingId){
  if(!comparison||comparison.build!==753||!comparison.rows.some(x=>x.booking_id===bookingId))
    return {status:'invalid_comparison',authenticated:false,owner_approved:false,closure_allowed:false};
  if(!receipt||typeof receipt!=='object'||Array.isArray(receipt))
    return {status:'missing_receipt',authenticated:false,owner_approved:false,closure_allowed:false};
  const exact=receipt.schema==='rosie-economic-approval-receipt-v1'&&receipt.booking_id===bookingId&&
    receipt.baseline_snapshot_sha256===comparison.baseline.snapshot_sha256&&
    receipt.retest_snapshot_sha256===comparison.retest.snapshot_sha256&&
    /^[A-Za-z0-9][A-Za-z0-9._:/-]{5,119}$/.test(clean(receipt.receipt_reference))&&
    /^[A-Za-z0-9][A-Za-z0-9._:/-]{3,119}$/.test(clean(receipt.issuer_reference))&&
    ['retain_hold','request_source_repair','owner_review_requested'].includes(receipt.proposed_disposition)&&
    time(receipt.issued_at)!=null&&time(receipt.issued_at)<=Date.now()+300000;
  return {status:exact?'metadata_matches_authentication_missing':'receipt_metadata_mismatch',
    authenticated:false,owner_approved:false,closure_allowed:false,
    next_step:exact?'Obtain independent source-authenticated signature, issuer role/authority, exact correction record and owner decision receipt.':'Correct the exact booking, period, source hashes, issuer, date and receipt reference before independent verification.'};
}
