// Build 546 — Seasonal Owner Evidence Closure & Public Claim Decision Readiness.
// Pure, read-only decision workbench; neither source/runtime success nor previous publication closes a HOLD.
const CLASSES=new Set(["cold_snap_capable","temperature_limited_outdoor","controlled_environment_required"]);
const GENERIC_CLAIMS=/\b(all winter|year.round|any temperature|always available|unlimited winter|guaranteed winter)\b/i;
const DAYS=30;
const clean=v=>String(v??"").trim();
const normalize=v=>clean(v).replace(/[\s-]+/g,"_").toLowerCase();
const key=(type,code)=>normalize(type)+"::"+clean(code);
function identity(row={}){
  const type=normalize(row.entity_type||(row.package_code?"package":row.add_on_code?"add_on":row.service_code?"service":""));
  return {entity_type:type,code:clean(row.code||row.package_code||row.add_on_code||row.service_code)};
}
function validDate(value, now, maxAgeDays=DAYS){
  const ts=Date.parse(clean(value));
  return Number.isFinite(ts) && ts<=now && now-ts<=maxAgeDays*86400000;
}
function finite(value){
  if(value===null||value===undefined||value==="")return null;
  const n=Number(value);return Number.isFinite(n)?n:null;
}
export function buildSeasonalOwnerPublicClaimReadiness({report={},economics={},generated_at=null}={}){
  const sources=Array.isArray(economics?.seasonal_operability_evidence?.rows)?economics.seasonal_operability_evidence.rows:[];
  const integrity=Array.isArray(report?.economics?.seasonal_public_claim_evidence_integrity_review?.rows)?
    report.economics.seasonal_public_claim_evidence_integrity_review.rows:[];
  const now=Date.parse(clean(generated_at||report?.generated_at||new Date().toISOString()));
  const current=Number.isFinite(now)?now:Date.now();
  const map=new Map(),keys=new Set();
  for(const row of sources){
    const id=identity(row),k=key(id.entity_type,id.code);
    if(!map.has(k))map.set(k,[]);
    map.get(k).push(row);
    keys.add(k);
  }
  for(const row of integrity)keys.add(key(row.entity_type,row.code));
  const entries=[];
  for(const k of keys){
    const sourceRows=map.get(k)||[],source=sourceRows.length===1?sourceRows[0]:null;
    const recorded=integrity.filter(row=>key(row.entity_type,row.code)===k);
    const evidence=recorded.length===1?recorded[0]:null;
    const id=source?identity(source):recorded.length?identity(recorded[0]):{entity_type:"",code:""};
    const cls=normalize(source?.classification);
    const temp=finite(source?.minimum_working_temperature_c);
    const decision=normalize(source?.public_claim_activation_decision);
    const ownerRef=clean(source?.public_claim_activation_reference);
    const ownerAt=clean(source?.public_claim_activation_reviewed_at);
    const wording=clean(source?.proposed_public_claim_wording||source?.public_claim_activation_wording||
      source?.public_claim_review_wording||source?.public_claim_outcome_published_wording);
    const sourceType=clean(source?.evidence_source_type),sourceRef=clean(source?.evidence_source);
    const missing=[];
    if(!id.entity_type||!id.code)missing.push("service_specific_identity");
    if(sourceRows.length!==1)missing.push(sourceRows.length?"duplicate_owning_service_evidence":"owning_service_evidence_unavailable");
    if(!sourceType||!sourceRef)missing.push("source_owned_capability_reference");
    if(source?.capability_evidence_current!==true)missing.push("current_service_capability_evidence");
    if(!CLASSES.has(cls))missing.push("service_specific_classification");
    if(cls==="temperature_limited_outdoor"&&(temp===null||source?.exact_temperature_claim_supported!==true))
      missing.push("source_owned_working_temperature_limit");
    if(cls==="controlled_environment_required" &&
       (source?.indoor_capable_workflow_supported!==true||
        !clean(source?.indoor_workflow_reference)||!clean(source?.indoor_workflow_source_type)))
      missing.push("controlled_environment_workflow_evidence");
    const prevTemp=finite(source?.public_claim_outcome_minimum_working_temperature_c);
    if(temp!==null&&prevTemp!==null&&prevTemp<temp)missing.push("prior_claim_threshold_widens_source_owned_limit");
    if(!ownerRef||!validDate(ownerAt,current))missing.push("dated_attributable_owner_decision");
    if(!["approve_public_claim_activation","hold_public_claim_activation"].includes(decision))
      missing.push("explicit_approve_or_retain_hold_decision");
    if(!evidence||evidence.evidence_integrity_current!==true)
      missing.push("build536_outcome_integrity_or_current_source_review");
    if(decision==="approve_public_claim_activation"){
      if(source?.public_claim_activation_wording_confirmed!==true||!wording)missing.push("owner_confirmed_service_specific_wording");
      if(GENERIC_CLAIMS.test(wording))missing.push("unsupported_broad_winter_wording");
      if(cls==="temperature_limited_outdoor" && /\b(no minimum|any temperature|below freezing)\b/i.test(wording))
        missing.push("wording_conflicts_with_source_limit");
    }
    const ready=missing.length===0;
    const state=ready?(decision==="hold_public_claim_activation"?"retain_hold_confirmed_for_manual_review":"publication_decision_ready_for_manual_review"):
      (sourceRows.length===0?"evidence_unavailable":"owner_evidence_or_decision_review_required");
    entries.push(Object.freeze({
      entity_type:id.entity_type,code:id.code,classification:cls||null,
      owning_evidence_source_type:sourceType||null,owning_evidence_source:sourceRef||null,
      source_owned_minimum_working_temperature_c:temp,owner_decision:decision||null,
      owner_decision_reference:ownerRef||null,owner_decision_at:ownerAt||null,
      proposed_wording:wording||null,integrity_state:evidence?.integrity_state||"unavailable",
      state,manual_review_ready:ready,missing:Object.freeze([...new Set(missing)]),
      safe_default:"retain_public_claim_hold",manual_publication_required:true,
      broad_winter_availability_authorized:false,automatic_publication_authorized:false,
      automatic_booking_or_quote_change_authorized:false,automatic_hold_narrowing_authorized:false
    }));
  }
  const rows=entries.sort((a,b)=>key(a.entity_type,a.code).localeCompare(key(b.entity_type,b.code)));
  return Object.freeze({
    build:546,authority:"seasonal_owner_evidence_closure_public_claim_decision_readiness",
    status:rows.length===0?"unavailable":rows.every(x=>x.manual_review_ready)?"review_ready":"owner_review_required",
    row_count:rows.length,decision_ready_count:rows.filter(x=>x.state==="publication_decision_ready_for_manual_review").length,
    retained_hold_count:rows.filter(x=>x.state==="retain_hold_confirmed_for_manual_review").length,
    review_required_count:rows.filter(x=>!x.manual_review_ready).length,
    rows:Object.freeze(rows),safe_default:"retain_public_claim_hold",
    published_claims_authorized_by_this_report:false,broad_winter_availability_authorized:false,
    schema_mutation_allowed:false,storage_mutation_allowed:false,provider_mutation_allowed:false,
    canonical_hold_mutation_allowed:false,automatic_publication_allowed:false,
    automatic_booking_or_quote_change_allowed:false,persistent_telemetry_allowed:false
  });
}
