export const AVAILABILITY_TYPES716=Object.freeze(['unavailable','vacation','sick','training','light_duty']);
export const ABSENCE_HOLD_TYPES716=Object.freeze(['unavailable','vacation','sick','training']);
export const AVAILABILITY_BLOCK_LIMIT716=50;
export const FOLLOWUP_WINDOW_MINUTES716=60;

export function plannedWindow716(value,now=new Date()){
  const start=Date.parse(value||'');
  if(!Number.isFinite(start)||start<=now.getTime()||start>now.getTime()+30*86400000)
    return null;
  return {start_at:new Date(start).toISOString(),
    end_at:new Date(start+FOLLOWUP_WINDOW_MINUTES716*60000).toISOString()};
}

// A blocked period is affirmative negative availability evidence, not a shift calendar.
// A blank result only means no recorded block in this one-hour window.
export function availabilityDecision716(blocks=[],staffId,window,{truncated=false}={}){
  const start=Date.parse(window?.start_at||''),end=Date.parse(window?.end_at||'');
  const relevant=blocks.filter(b=>b.staff_user_id===staffId&&
    Date.parse(b.start_at)<end&&Date.parse(b.end_at)>start);
  const blocking=relevant.filter(b=>ABSENCE_HOLD_TYPES716.includes(b.availability_type));
  const lightDuty=relevant.filter(b=>b.availability_type==='light_duty');
  return {staff_user_id:staffId,window,source:'staff_availability_blocks',
    source_truncated:truncated,conflicting_absence_count:blocking.length,
    light_duty_count:lightDuty.length,
    hard_hold:truncated||blocking.length>0,
    requires_manager_override:!truncated&&!blocking.length&&lightDuty.length>0,
    recorded_block_check_completed:!truncated,shift_schedule_verified:false,
    staff_hours_verified:false};
}
