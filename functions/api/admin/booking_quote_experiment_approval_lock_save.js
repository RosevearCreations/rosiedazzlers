// Build 481 — explicit owner approval + immutable measurement-contract lock.
// This records governance only. It never starts an experiment or changes price, discount, availability, booking rules or outreach.
import { requireStaffAccess, serviceHeaders, json } from "../_lib/staff-auth.js";

const SETTING_KEY="booking_quote_experiment_approval_lock";
const EXPERIMENT_KEYS=new Set(["booking_stage_clarity","quote_band_clarity","accepted_work_scope_clarity"]);
const TARGET_DIRECTIONS=new Set(["increase","decrease","maintain_or_improve","custom"]);
const REQUIRED_STOP_CONDITIONS=[
  "retained_evidence_unavailable_restricted_or_materially_truncated",
  "minimum_evidence_no_longer_met",
  "like_for_like_window_breaks",
  "price_discount_booking_rule_or_outreach_change_required",
  "owner_withdraws_approval",
  "material_confounder_breaks_comparability"
];

export async function onRequestPost({request,env}){
  try{
    const body=await request.json().catch(()=>({}));
    const access=await requireStaffAccess({request,env,body,capability:"manage_bookings",allowLegacyAdminFallback:true});
    if(!access.ok)return access.response;
    if(!hasSupabaseConfig(env))return json({ok:false,error:"Supabase settings authority is unavailable."},503);

    const experimentKey=clean(body.experiment_key);
    if(!EXPERIMENT_KEYS.has(experimentKey))return json({ok:false,error:"Unknown controlled experiment key."},400);
    if(body.approved!==true||body.confirm_measurement_lock!==true)return json({ok:false,error:"Explicit owner approval and measurement-lock confirmation are required."},400);

    const successThreshold=clean(body.success_threshold).slice(0,240);
    const targetDirection=clean(body.target_direction).toLowerCase();
    const winnerRule=clean(body.winner_rule).slice(0,500);
    const durationDays=positiveWhole(body.duration_days);
    const allocationRule=clean(body.allocation_rule).slice(0,500);
    const stopConditions=unique(Array.isArray(body.stop_conditions)?body.stop_conditions.map(clean).filter(Boolean):[]);
    const seasonalEligibilityRule=clean(body.seasonal_eligibility_rule).slice(0,700);
    const weatherIneligibleHandling=clean(body.weather_ineligible_handling).toLowerCase();

    if(successThreshold.length<3)return json({ok:false,error:"Record an explicit success threshold before locking measurement."},400);
    if(!TARGET_DIRECTIONS.has(targetDirection))return json({ok:false,error:"Target direction must be increase, decrease, maintain_or_improve or custom."},400);
    if(winnerRule.length<8)return json({ok:false,error:"Record an explicit winner rule before locking measurement."},400);
    if(!durationDays||durationDays>90)return json({ok:false,error:"Duration must be an explicit whole number from 1 to 90 days."},400);
    if(allocationRule.length<8)return json({ok:false,error:"Record an explicit allocation rule before locking measurement."},400);
    const missingStops=REQUIRED_STOP_CONDITIONS.filter((item)=>!stopConditions.includes(item));
    if(missingStops.length)return json({ok:false,error:"All retained fail-closed stop conditions must be explicitly recorded before locking measurement.",missing_stop_conditions:missingStops},400);
    if(seasonalEligibilityRule.length<12)return json({ok:false,error:"Record the Southern Ontario seasonal/weather eligibility rule before locking measurement."},400);
    if(weatherIneligibleHandling!=="exclude_from_conversion_denominator")return json({ok:false,error:"Weather-ineligible sessions must be excluded from the conversion denominator for this measurement lock."},400);

    const headers=serviceHeaders(env);
    const existingRes=await fetch(`${env.SUPABASE_URL}/rest/v1/app_management_settings?select=value&key=eq.${encodeURIComponent(SETTING_KEY)}&limit=1`,{headers});
    const rows=existingRes.ok?await existingRes.json().catch(()=>[]):[];
    const existing=Array.isArray(rows)&&rows[0]?.value&&typeof rows[0].value==="object"?rows[0].value:{};
    const records=existing?.records&&typeof existing.records==="object"?existing.records:{};
    const prior=records[experimentKey]&&typeof records[experimentKey]==="object"?records[experimentKey]:null;
    if(prior?.measurement_locked===true)return json({ok:false,error:"This measurement contract is already locked and immutable in Build 481. A future separately authorized governance revision is required to replace it."},409);

    const now=new Date().toISOString();
    const actor=clean(access.actor?.email||access.actor?.staff_email||access.actor?.id)||"authorized_owner";
    const revision=Math.max(1,positiveWhole(prior?.revision)||1);
    const record={
      experiment_key:experimentKey,
      approval_status:"approved",
      approved:true,
      approved_by:actor,
      approved_at:now,
      success_threshold:successThreshold,
      target_direction:targetDirection,
      winner_rule:winnerRule,
      duration_days:durationDays,
      allocation_rule:allocationRule,
      stop_conditions:stopConditions,
      seasonal_eligibility_rule:seasonalEligibilityRule,
      weather_ineligible_handling:"exclude_from_conversion_denominator",
      measurement_locked:true,
      locked_at:now,
      locked_by:actor,
      revision,
      execution_authorized:false,
      experiment_started:false,
      recorded_at:now
    };
    const value={...existing,records:{...records,[experimentKey]:record},updated_at:now};
    const saveRes=await fetch(`${env.SUPABASE_URL}/rest/v1/app_management_settings`,{
      method:"POST",
      headers:{...headers,Prefer:"resolution=merge-duplicates,return=representation"},
      body:JSON.stringify([{key:SETTING_KEY,value,updated_at:now}])
    });
    const savedText=await saveRes.text();
    if(!saveRes.ok)return json({ok:false,error:safeError(savedText)||"Could not save the owner measurement lock."},500);

    return json({
      ok:true,
      build:481,
      authority:"booking_quote_experiment_approval_measurement_lock",
      experiment_key:experimentKey,
      state:"measurement_locked",
      record,
      execution_authorized:false,
      rule:"The measurement contract is locked. This does not authorize experiment execution or any price, discount, booking-rule, availability or outreach change."
    });
  }catch(error){
    return json({ok:false,build:481,error:safeError(error?.message||error)||"Could not save the owner measurement lock."},500);
  }
}
export async function onRequestGet(){return json({ok:false,error:"POST required. Read current lock state from /api/admin/booking_funnel_quote_pricing_learning."},405)}
export async function onRequestPut(){return immutable()}
export async function onRequestPatch(){return immutable()}
export async function onRequestDelete(){return immutable()}
export async function onRequestOptions(){return new Response("",{status:204,headers:{"Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type,x-admin-password,x-staff-email,x-staff-user-id","Cache-Control":"no-store"}})}

function immutable(){return json({ok:false,error:"Build 481 measurement locks are immutable through this endpoint."},405)}
function hasSupabaseConfig(env){return Boolean(env?.SUPABASE_URL&&(env?.SUPABASE_SERVICE_ROLE_KEY||env?.SUPABASE_SERVICE_KEY||env?.SUPABASE_SERVICE_ROLE||env?.SUPABASE_SECRET_KEY))}
function positiveWhole(value){const n=Number(value);return Number.isFinite(n)&&n>0?Math.floor(n):0}
function unique(values){return [...new Set(values)]}
function clean(value){return String(value==null?"":value).trim()}
function safeError(value){return clean(value).replace(/Bearer\s+[A-Za-z0-9._-]+/g,"Bearer [redacted]").slice(0,500)}
