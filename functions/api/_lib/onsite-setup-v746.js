import { serviceHeaders } from './staff-auth.js';

export const BAG_POLICY746 = Object.freeze({included:1,extraCents:500});
export const BAG_OPTIONS746 = Object.freeze(['1 medium white Glad bag or less','More than 1 medium white Glad bag']);
export const ONSITE_EVENT746 = 'detailer_onsite_setup_v746';

// These values describe staff-recorded acknowledgement, not a digital customer signature.
export function assessOnsite746(intake, receipt) {
  const missing=[];
  if (!intake) return {ready:false,missing:['Saved onsite intake'],revision:null};
  for (const [field,label] of [
    ['vehicle_accessible_and_safe','Safe, permitted workspace and vehicle access'],
    ['keys_collected','Keys / vehicle access'],
    ['water_hookup_located','Available water source'],['water_tested','Water test'],
    ['power_hookup_located','Available power source'],['power_tested','Power test'],
    ['inspection_acknowledged','Customer inspection acknowledgement'],
    ['existing_condition_acknowledged','Customer condition acknowledgement'],
    ['keys_handed_over_acknowledged','Customer key handoff acknowledgement']
  ]) if (intake[field] !== true) missing.push(label);
  if (!String(intake.existing_damage_notes||'').trim()) missing.push('Existing-damage inspection notes (or None observed)');
  if (intake.valuables_present !== true && intake.valuables_present !== false) missing.push('Valuables review');
  if (intake.valuables_present === true && !String(intake.valuables_notes||'').trim()) missing.push('Valuables handling notes');
  if (!BAG_OPTIONS746.includes(intake.garbage_bag_estimate)) missing.push('One included bag / extra-bag policy review');
  const extra=Number(intake.extra_bag_count);
  if (!Number.isInteger(extra)||extra<0||extra>25||intake.extra_bag_count==null) missing.push('Valid extra-bag count');
  if (intake.garbage_bag_estimate===BAG_OPTIONS746[0] && extra!==0 || intake.garbage_bag_estimate===BAG_OPTIONS746[1] && extra<1)
    missing.push('Bag count consistent with reviewed policy');
  if (extra>0 && !String(intake.extra_charge_notes||'').trim()) missing.push('Extra-bag review notes');
  if (!receipt || receipt.event_type!==ONSITE_EVENT746 || receipt.payload?.intake_revision!==intake.updated_at)
    missing.push('Current audited onsite setup receipt');
  if (receipt?.payload?.photo_consent !== 'internal_job_evidence') missing.push('Explicit customer consent for private job photos');
  if (extra>0 && receipt?.payload?.extra_bag_fee_acknowledged !== true)
    missing.push('Customer acknowledgement of potential $5 per extra bag');
  if (String(intake.intake_complete||'')!=='Yes - ready to begin') missing.push('Completed onsite intake status');
  return {ready:missing.length===0,missing,revision:intake.updated_at||null,extra_bag_count:Number.isInteger(extra)?extra:null,
    potential_extra_cents:Number.isInteger(extra)&&extra>0?extra*BAG_POLICY746.extraCents:0};
}

export async function loadOnsiteGate746(env,bookingId) {
  const headers=serviceHeaders(env),id=encodeURIComponent(bookingId);
  const [intakeRes,eventRes]=await Promise.all([
    fetch(`${env.SUPABASE_URL}/rest/v1/jobsite_intake?select=*&booking_id=eq.${id}&limit=1`,{headers}),
    fetch(`${env.SUPABASE_URL}/rest/v1/booking_events?select=id,event_type,payload,created_at&booking_id=eq.${id}&event_type=eq.${ONSITE_EVENT746}&order=created_at.desc&limit=1`,{headers})
  ]);
  if(!intakeRes.ok||!eventRes.ok)throw new Error('Current onsite evidence could not be independently verified.');
  const [intakes,events]=await Promise.all([intakeRes.json(),eventRes.json()]);
  const intake=Array.isArray(intakes)?intakes[0]||null:null;
  const receipt=Array.isArray(events)?events[0]||null:null;
  return {intake,receipt,assessment:assessOnsite746(intake,receipt)};
}
