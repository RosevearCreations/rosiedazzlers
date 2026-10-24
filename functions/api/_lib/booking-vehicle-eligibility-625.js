// Build 625: optional vehicle-profile eligibility. Read-only, never a booking approval.
export const VEHICLE_ELIGIBILITY_SCHEMA_625 = "rosie-vehicle-eligibility.v1";
const TYPES = new Set(["car","suv","truck","van","minivan","motorcycle","rv","other"]);
const FLAGS = new Set(["heavy_soiling","pet_hair","staining","odor","spill","water_intrusion","mold","biohazard","paint_damage","paint_correction","overspray","road_salt","special_access"]);
const REVIEW_FLAGS = new Set(["heavy_soiling","pet_hair","staining","odor","spill","water_intrusion","mold","biohazard","paint_damage","paint_correction","overspray","special_access"]);
const SPECIAL_TYPES = new Set(["motorcycle","rv","other"]);
const clean = (v,limit=90) => String(v??"").replace(/[\u0000-\u001f\u007f]/g,"").trim().slice(0,limit);
const issue = (code,message) => ({code,message});
const get = (input,key) => typeof input?.get==="function" ? input.get(key) : input?.[key];
const list = v => Array.isArray(v) ? v : typeof v==="string" ? v.split(",") : [];
export function normalizeVehicleProfile625(input={}) {
  const multi=typeof input?.getAll==="function" ? input.getAll("condition_flag") : [];
  const flags=list(multi.length ? multi : get(input,"condition_flags")??get(input,"condition_flag"))
    .map(v=>clean(v,40).toLowerCase()).filter(Boolean);
  const yearText=clean(get(input,"vehicle_year")??get(input,"year"),8);
  return {
    year:yearText?Number(yearText):null,
    make:clean(get(input,"vehicle_make")??get(input,"make"),80),
    model:clean(get(input,"vehicle_model")??get(input,"model"),80),
    type:clean(get(input,"vehicle_type")??get(input,"type"),35).toLowerCase(),
    size_confirmed:clean(get(input,"vehicle_size_confirmed")??get(input,"size_confirmed"),20).toLowerCase(),
    condition_flags:flags
  };
}
export function evaluateVehicleServiceEligibility625({input={},selection={},catalog={}}={}) {
  const profile=normalizeVehicleProfile625(input);
  const provided=profile.year!==null || !!(profile.make || profile.model || profile.type || profile.size_confirmed || profile.condition_flags.length);
  const issues=[],reviewReasons=[];
  if(!provided) return {
    schema:VEHICLE_ELIGIBILITY_SCHEMA_625,status:"not_provided",provided:false,
    profile,issues,review_reasons:reviewReasons,required_for_booking:"complete_vehicle_profile",
    vehicle_size_automatically_inferred:false,can_commit_booking:false
  };
  if(!Number.isInteger(profile.year)||profile.year<1950||profile.year>2100)
    issues.push(issue("VEHICLE_YEAR_INVALID","Enter a valid vehicle model year (1950–2100)."));
  if(!profile.make||profile.make.length>70)
    issues.push(issue("VEHICLE_MAKE_REQUIRED","Vehicle make must be provided."));
  if(!profile.model||profile.model.length>70)
    issues.push(issue("VEHICLE_MODEL_REQUIRED","Vehicle model must be provided."));
  if(!TYPES.has(profile.type))
    issues.push(issue("VEHICLE_TYPE_INVALID","Choose a supported vehicle body style."));
  if(profile.condition_flags.length>12||new Set(profile.condition_flags).size!==profile.condition_flags.length||
     profile.condition_flags.some(flag=>!FLAGS.has(flag)))
    issues.push(issue("CONDITION_FLAGS_INVALID","Vehicle condition flags are invalid or repeated."));
  const selectedSize=clean(selection?.vehicle_size,20).toLowerCase();
  if(!["small","mid","oversize"].includes(profile.size_confirmed)||
     !["small","mid","oversize"].includes(selectedSize)||profile.size_confirmed!==selectedSize)
    issues.push(issue("VEHICLE_SIZE_MISMATCH","Confirm a vehicle-size class matching the selected package price."));
  const pkg=(Array.isArray(catalog?.packages)?catalog.packages:[]).find(p=>p?.code===selection?.package_code);
  if(!pkg) issues.push(issue("SERVICE_PACKAGE_UNAVAILABLE","Selected package is not in the current catalog."));
  else {
    const amount=pkg.prices_cad?.[selectedSize];
    if(typeof amount!=="number"||!Number.isFinite(amount)||amount<0)
      issues.push(issue("SERVICE_SIZE_UNAVAILABLE","No approved package price exists for this vehicle-size class."));
    const allowed=Array.isArray(pkg.allowed_vehicle_types)?pkg.allowed_vehicle_types:[];
    const excluded=Array.isArray(pkg.excluded_vehicle_types)?pkg.excluded_vehicle_types:[];
    if((allowed.length&&!allowed.includes(profile.type))||excluded.includes(profile.type))
      issues.push(issue("PACKAGE_VEHICLE_TYPE_EXCLUDED","Selected package is not available for this vehicle body style."));
    if(pkg.quote_required===true)
      reviewReasons.push(issue("PACKAGE_REQUIRES_ESTIMATE","This package requires staff review before a fixed price."));
  }
  if(SPECIAL_TYPES.has(profile.type))
    reviewReasons.push(issue("SPECIAL_VEHICLE_REVIEW","Unusual vehicle types need staff confirmation of size, access and equipment."));
  if(profile.type==="truck"||profile.type==="van")
    reviewReasons.push(issue("VEHICLE_ACCESS_REVIEW","Confirm clearance and safe mobile workspace for this vehicle."));
  for(const flag of new Set(profile.condition_flags)) if(REVIEW_FLAGS.has(flag))
    reviewReasons.push(issue("VEHICLE_CONDITION_REVIEW","Condition '"+flag.replaceAll("_"," ")+"' requires staff scope review."));
  return {
    schema:VEHICLE_ELIGIBILITY_SCHEMA_625,provided:true,profile,
    status:issues.length?"hold":reviewReasons.length?"quote_review_required":"review_ready",
    issues,review_reasons:reviewReasons,vehicle_size_automatically_inferred:false,
    explicit_size_confirmation_required:true,can_commit_booking:false,
    statement:"Vehicle profile is non-binding; staff confirm scope, price, access and weather."
  };
}
export function attachVehicleEligibility625(contract,assessment) {
  if(!contract||contract.schema!=="rosie-booking-contract.v1") throw Error("Expected current read-only booking contract.");
  const hasHold=assessment?.status==="hold";
  const needsReview=assessment?.status==="quote_review_required";
  const baseDecision=contract.decision;
  const decision=hasHold?"hold":needsReview&&baseDecision==="review_ready"?"quote_review_required":baseDecision;
  return {...contract,decision,booking_created:false,payment_taken:false,reservation_created:false,
    can_commit_booking:false,eligibility:{...contract.eligibility,vehicle_profile:assessment},
    issues:[...(Array.isArray(contract.issues)?contract.issues:[]),...(assessment?.issues||[]),...(assessment?.review_reasons||[])],
    build_625:"Size is explicitly chosen, not inferred; no automatic booking eligibility or price commitment."
  };
}
