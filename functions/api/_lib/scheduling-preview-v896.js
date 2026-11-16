// Rosie Dazzlers Build 896 — read-only, source-aware scheduling decision support.
// This is NOT a booking hold or authorization. The existing Postgres advisory-
// locked capacity trigger remains the final authority on every booking write.
import {evaluateCapacity738} from './booking-capacity-v738.js';

export const SCHEDULE_CONTRACT_896 = 'rosie-scheduling-capacity.v1';
const CLOSED_TIERS = new Set(['quote_required','out_of_zone','unverified']);
const slotCode = s => String(s??'').trim().toUpperCase();

export function requestedOccupancy896(startSlot,durationSlots=null) {
  const start=slotCode(startSlot);
  if(['FULL','FULL_DAY','BOTH'].includes(start)) {
    if(durationSlots!==null && durationSlots!==undefined &&
       Number(durationSlots)!==2)return null;
    return {start_slot:'AM',duration_slots:2,slots:['AM','PM']};
  }
  if(!['AM','PM'].includes(start))return null;
  const duration=durationSlots===null||durationSlots===undefined?1:Number(durationSlots);
  if(![1,2].includes(duration)||(duration===2&&start!=='AM'))return null;
  return {start_slot:start,duration_slots:duration,slots:duration===2?['AM','PM']:[start]};
}

export function catalogTerritory896(area,ownerRows) {
  const key=String(area??'').trim().toLowerCase();
  if(!key||!Array.isArray(ownerRows))
    return {recognized:false,auto_travel_eligible:false,review:'SERVICE_AREA_REQUIRED'};
  const matching=ownerRows.filter(row=>row&&typeof row==='object'&&
    [row.value,row.label].some(v=>typeof v==='string'&&v.trim().toLowerCase()===key));
  if(matching.length!==1)
    return {recognized:false,auto_travel_eligible:false,review:'UNKNOWN_OR_AMBIGUOUS_TERRITORY'};
  const row=matching[0],tier=String(row.travel_tier||'unverified').trim().toLowerCase();
  const eligible=!CLOSED_TIERS.has(tier)&&tier.length>0;
  return {recognized:true,auto_travel_eligible:eligible,
    county:String(row.county||''),zone:String(row.zone||row.label||''),
    travel_tier:tier,review:eligible?'WORKSITE_AND_STAFF_REVIEW':'OWNER_TRAVEL_QUOTE_REQUIRED'};
}

export function schedulePreview896({
  date,startSlot,durationSlots=null,bookings=[],dateBlocks=[],slotBlocks=[],
  businessHours=null,minimumLeadDays=0,nowMs=Date.now(),excludeBookingId=null,
  serviceArea='',ownerServiceAreas=[],staffingVerified=false,
  staffingWindows=null,worksiteVerified=false
}={}) {
  const requested=requestedOccupancy896(startSlot,durationSlots);
  if(!requested)return {ok:false,reason:'INVALID_AM_PM_DURATION',dispatch_ready:false};
  const capacity=evaluateCapacity738({
    date,bookings,dateBlocks,slotBlocks,businessHours,minimumLeadDays,nowMs,
    requestedStartSlot:requested.start_slot,requestedDurationSlots:requested.duration_slots,
    excludeBookingId,staffingVerified,staffingWindows
  });
  if(!capacity.ok)return {ok:false,reason:'INVALID_DATE',dispatch_ready:false};
  const territory=catalogTerritory896(serviceArea,ownerServiceAreas);
  const workerCoverage=staffingVerified===true &&
    requested.slots.every(slot=>staffingWindows?.[slot]===true);
  const capacityFit=capacity.requested_fit===true;
  const siteReady=worksiteVerified===true;
  const dispatchReady=capacityFit&&territory.auto_travel_eligible&&workerCoverage&&siteReady;
  const review=[
    !capacityFit?'CAPACITY_NOT_AVAILABLE':null,
    !territory.auto_travel_eligible?territory.review:null,
    !workerCoverage?'STAFF_ASSIGNMENT_UNVERIFIED':null,
    !siteReady?'WORKSITE_NOT_VERIFIED':null
  ].filter(Boolean);
  return {
    ok:true,contract:SCHEDULE_CONTRACT_896,date,requested,
    one_vehicle_day_cap:true,max_half_day_visits:2,
    capacity:{AM:capacity.AM,PM:capacity.PM,requested_fit:capacity.requested_fit,
      active_bookings:capacity.active_bookings,busy_slots:capacity.busy_slots,
      reasons:capacity.reasons},
    territory,worker_coverage_verified:workerCoverage,
    worksite_verified:siteReady,dispatch_ready:dispatchReady,
    review_required:!dispatchReady,review_reasons:review,
    has_created_booking:false,has_reserved_slot:false,
    server_database_conflict_trigger_required:true,
    source_status:'READ_ONLY_OWNER_PLANNING_NOT_BOOKING_APPROVAL'
  };
}
