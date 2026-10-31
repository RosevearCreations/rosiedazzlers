const stamp=value=>Date.parse(value||'');
const iso=value=>Number.isFinite(stamp(value))?new Date(stamp(value)).toISOString():null;
export const SHIFT_ROSTER_LIMIT717=50;
export const SHIFT_ROSTER_MAX_AGE_MS717=12*60*60*1000;

// An opt-in, authoritative roster feed; absences are checked independently.
// A missing source must never be represented as an approved working shift.
export function shiftRosterDecision717(payload,staffId,window,now=new Date()){
  const blank={source:'configured_staff_shift_roster',staff_user_id:staffId,window,
    shift_schedule_verified:false,staff_hours_verified:false,verified_shift_ids:[],
    hard_hold:true,requires_manual_shift_acknowledgement:false};
  if(!payload||payload.complete!==true||!Array.isArray(payload.shifts)||
    payload.shifts.length>=SHIFT_ROSTER_LIMIT717||
    !iso(payload.generated_at)||stamp(payload.generated_at)>now.getTime()+300000||
    now.getTime()-stamp(payload.generated_at)>SHIFT_ROSTER_MAX_AGE_MS717||
    !String(payload.source_revision||'').trim())return {...blank,reason:'Roster feed is stale, incomplete or invalid.'};
  const start=stamp(window?.start_at),end=stamp(window?.end_at);
  if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start)
    return {...blank,reason:'Planned shift window is invalid.'};
  const approved=[];
  for(const row of payload.shifts){
    if(!row||row.staff_user_id!==staffId||!String(row.id||'').trim()||
      !String(row.approved_by||'').trim()||row.status!=='approved'||
      !Number.isFinite(stamp(row.start_at))||!Number.isFinite(stamp(row.end_at))||
      stamp(row.end_at)<=stamp(row.start_at))
      return {...blank,reason:'Roster contains an unapproved or malformed shift.'};
    if(stamp(row.end_at)>start&&stamp(row.start_at)<end)
      approved.push(row);
  }
  approved.sort((a,b)=>stamp(a.start_at)-stamp(b.start_at));
  let coveredUntil=start;
  for(const row of approved){
    if(stamp(row.start_at)>coveredUntil)break;
    coveredUntil=Math.max(coveredUntil,stamp(row.end_at));
    if(coveredUntil>=end)break;
  }
  if(coveredUntil<end)return {...blank,reason:'No approved shift covers the entire planned hour.',
    source_revision:payload.source_revision};
  return {...blank,hard_hold:false,shift_schedule_verified:true,staff_hours_verified:true,
    verified_shift_ids:approved.map(row=>String(row.id)).slice(0,SHIFT_ROSTER_LIMIT717),
    generated_at:iso(payload.generated_at),source_revision:String(payload.source_revision).slice(0,120),
    reason:'Approved roster source covers the whole planned hour.'};
}

export function shiftRosterUnconfigured717(staffId,window){
  return {source:'not_configured',staff_user_id:staffId,window,hard_hold:false,
    shift_schedule_verified:false,staff_hours_verified:false,verified_shift_ids:[],
    requires_manual_shift_acknowledgement:true,
    reason:'No authoritative shift source configured. Explicit manager acknowledgement is required; no shift is verified.'};
}
