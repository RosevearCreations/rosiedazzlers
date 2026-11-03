// Build 752: source-qualified owner decision candidates. Never a write authority.
const BASIC_OWNER_PRICES = Object.freeze({small:22900,mid:26900,oversize:30900});
const clean=value=>String(value??'').trim();
const cents=value=>value==null||value===''||!Number.isFinite(Number(value))?null:Math.round(Number(value)*100);

const REPAIR_ROUTES = Object.freeze({
  identity:{label:'Finance / booking identity',href:'/admin-accounting.html',action:'Reconcile the original accounting booking reference and booking identity before any new review.'},
  package_size:{label:'Booking and Finance',href:'/admin-booking.html',action:'Compare the signed booking package/vehicle-size snapshot to the accounting record. Repair only in its owning workflow with an attributable correction.'},
  date:{label:'Booking and Finance',href:'/admin-accounting.html',action:'Verify the original service date and accounting period; do not rewrite history from this dashboard.'},
  travel_zone:{label:'Booking / travel',href:'/admin-booking.html',action:'Confirm the service-area source and any explicitly billed travel item. A zone guide is not collected revenue.'},
  inventory:{label:'Consumables / posting ledger',href:'/admin-catalog.html',action:'Trace the original Build 750 posting batch and frozen unit-cost rows, including reversals, before correcting the owning record.'},
  finance:{label:'Finance / COGS',href:'/admin-accounting.html',action:'Reconcile recognized cash, refunds, recorded cost, labour and posted COGS to original source documents.'},
  travel_time:{label:'Staff time / travel',href:'/admin-payroll.html',action:'Reconcile Build 748 travel punches, missing intervals and shift sign-off; observed minutes are not an approved wage expense.'},
  pricing:{label:'App Management / pricing',href:'/admin-catalog.html',action:'Compare effective and managed catalog versions to the owner-approved package/size guide. Requires separate owner authorization before any price edit.'},
  acceptance:{label:'Owner economic acceptance',href:'/admin-margin-review-v751.html',action:'Review the exact Build 751 evidence snapshot and separately record an attributable owner acceptance in the owning approval process.'}
});

function classify(reason){
  if(/booking identity|corresponding accounting|corresponding booking/i.test(reason))return 'identity';
  if(/package|vehicle size/i.test(reason))return 'package_size';
  if(/service date/i.test(reason))return 'date';
  if(/travel zone/i.test(reason))return 'travel_zone';
  if(/travel|shift punch/i.test(reason))return 'travel_time';
  if(/material cost|COGS|revenue|labour|refund|cash/i.test(reason))return 'finance';
  if(/inventory|posting-time ledger/i.test(reason))return 'inventory';
  return 'finance';
}

function managedPrice(managedCatalog,pkg,size){
  const rows=managedCatalog?.packages;
  if(!Array.isArray(rows))return {value:null,status:'missing_managed_package_list'};
  const matching=rows.filter(row=>clean(row?.code)===pkg);
  if(matching.length!==1)return {value:null,status:matching.length?'duplicate_managed_package':'missing_managed_package'};
  const raw=matching[0]?.prices_cad?.[size];
  const value=cents(raw);
  return {value:Number.isInteger(value)&&value>0?value:null,status:Number.isInteger(value)&&value>0?'explicit_managed_price':'missing_managed_size_price'};
}

/** Raw catalog is needed: a normalized fallback is not proof of an approved managed price. */
export function buildEconomicAcceptance752({margin,managed_catalog=null,managed_catalog_status='unavailable',snapshot_sha256=null}={}){
  if(margin?.build!==751||!Array.isArray(margin.rows)||!margin.period)throw Error('Build 751 source snapshot missing or invalid.');
  const rows=[],exceptions=[];
  for(const source of margin.rows){
    const id=clean(source.booking_id),pkg=clean(source.package_code),size=clean(source.vehicle_size);
    const price=managedPrice(managed_catalog,pkg,size);
    const priceIssues=[];
    if(managed_catalog_status!=='managed')priceIssues.push({code:'managed_catalog_unverified',message:'Managed pricing source was not verified; a bundled fallback does not establish owner approval.'});
    else if(price.status!=='explicit_managed_price')priceIssues.push({code:price.status,message:'No single explicit managed price for this package and vehicle size.'});
    if(price.value!=null&&source.current_starting_price_cents!==price.value)priceIssues.push({code:'effective_managed_price_conflict',message:'Effective displayed guide differs from the managed package-size price.'});
    if(pkg==='basic_detail'&&Object.hasOwn(BASIC_OWNER_PRICES,size)){
      const locked=BASIC_OWNER_PRICES[size];
      if(source.current_starting_price_cents!==locked||price.value!=null&&price.value!==locked)priceIssues.push({code:'owner_basic_detail_price_conflict',message:'Basic Detail guide conflicts with the owner-retained three-size Starting at price.'});
    }
    const issues=[...(source.review_reasons||[]).map(message=>({code:classify(message),message})),...priceIssues];
    const ready=source.margin_review_status==='review_ready'&&issues.length===0;
    const row={booking_id:id,package_code:pkg||null,vehicle_size:size||null,season_bucket:source.season_bucket,
      recorded_revenue_cents:source.recognized_revenue_cents,starting_guide_cents:source.current_starting_price_cents,
      managed_guide_cents:price.value,managed_price_status:price.status,pre_travel_contribution_cents:ready?source.pre_travel_contribution_cents:null,
      decision_gate:ready?'owner_review_candidate':'source_repair_required',owner_acceptance:'not_recorded',
      evidence_issue_count:issues.length,recorded_revenue_below_guide_is_pricing_error:false,source_repair_applied:false,
      ledger_batch_ids:source.ledger_batch_ids||[]};
    rows.push(row);
    for(const [index,issue] of issues.entries()){
      const route=REPAIR_ROUTES[issue.code.startsWith('managed_')||issue.code.includes('price_')||issue.code.includes('basic_detail')?'pricing':issue.code]||REPAIR_ROUTES.finance;
      exceptions.push({key:`${id||'unknown'}:${issue.code}:${index}`,booking_id:id,package_code:pkg||null,vehicle_size:size||null,
        domain:route===REPAIR_ROUTES.pricing?'pricing':'source',code:issue.code,reason:issue.message,
        source_owner:route.label,source_href:route.href,repair_instruction:route.action,
        disposition:'needs_independent_owner_review',repair_status:'unapplied',owner_acceptance:'not_recorded'});
    }
  }
  return {ok:true,build:752,authority:'owner_economic_evidence_acceptance_pricing_exception_source_repair',period:margin.period,
    source_build:751,source_generated_at:margin.generated_at||null,snapshot_sha256,managed_catalog_status,
    evidence_status:!rows.length?'no_observations':exceptions.length?'exceptions_need_owner_review':'candidates_need_owner_acceptance',
    summary:{booking_count:rows.length,owner_review_candidates:rows.filter(x=>x.decision_gate==='owner_review_candidate').length,
      source_repair_booking_count:rows.filter(x=>x.decision_gate==='source_repair_required').length,
      pricing_exception_count:exceptions.filter(x=>x.domain==='pricing').length,source_exception_count:exceptions.filter(x=>x.domain==='source').length,
      owner_accepted_count:0,automatic_repairs_applied:0},rows,exceptions,
    repair_routes:REPAIR_ROUTES,boundaries:{read_only:true,owner_approval_recorded:false,independent_source_correction_recorded:false,
      pricing_and_discount_write:false,inventory_or_accounting_write:false,booking_or_travel_write:false,
      winter_availability_hold_retained:true,source_issues_never_auto_closed:true,
      recognized_revenue_vs_starting_guide_not_proof_of_mispricing:true,missing_cost_never_assumed_zero:true,
      no_net_margin_claim:true,snapshot_hash_is_not_an_attestation:true,exported_owner_draft_is_unsigned:true}};
}
