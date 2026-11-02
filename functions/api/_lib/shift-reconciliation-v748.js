// Build 748: pure shift-state reconciliation over existing job_time_entries.
// New zero-minute event types are intentionally NOT payroll's work-state events.
export const SHIFT_SOURCE748='shift_v748';
export const SHIFT_TYPES748=Object.freeze({
  clock_in:'shift_clock_in',travel_start:'shift_travel_start',travel_stop:'shift_travel_stop',
  work_start:'shift_service_start',break_start:'shift_break_start',break_stop:'shift_break_stop',
  work_stop:'shift_service_stop',clock_out:'shift_clock_out'
});
const STATES={off:['clock_in'],idle:['travel_start','work_start','clock_out'],travel:['travel_stop'],work:['break_start','work_stop'],break:['break_stop']};
const NEXT={clock_in:'idle',travel_start:'travel',travel_stop:'idle',work_start:'work',break_start:'break',break_stop:'work',work_stop:'idle',clock_out:'off'};
const EVENT_TO_ACTION=Object.fromEntries(Object.entries(SHIFT_TYPES748).map(([key,value])=>[value,key]));
export const SHIFT_SUBMIT_EVENT748='shift_reconciliation_submitted_v748';
export const SHIFT_REVIEW_EVENT748='shift_reconciliation_review_v748';

export function reconcileShift748(rows=[]){
  const sourceRows=(Array.isArray(rows)?rows:[]).filter(row=>row?.source===SHIFT_SOURCE748)
    .slice().sort((a,b)=>Date.parse(a.event_time||a.created_at)-Date.parse(b.event_time||b.created_at)||String(a.id).localeCompare(String(b.id)));
  let state='off',openedAt=null,segmentAt=null,segmentKind='',shiftCount=0;
  const totals={shift_minutes:0,work_minutes:0,travel_minutes:0,break_minutes:0},issues=[],timeline=[];
  for(const row of sourceRows){
    const action=EVENT_TO_ACTION[row.entry_type];
    const at=Date.parse(row.event_time||row.created_at);
    if(!action||!Number.isFinite(at)){issues.push('Unrecognized or undated punch needs manager review.');continue;}
    if(!STATES[state]?.includes(action)){issues.push(`Unexpected ${action.replaceAll('_',' ')} while ${state}.`);continue;}
    if(segmentAt!==null){
      const minutes=(at-segmentAt)/60000;
      if(minutes<0||minutes>20*60){issues.push('Out-of-order or unusually long time interval.');continue;}
      if(segmentKind==='work')totals.work_minutes+=minutes;
      if(segmentKind==='travel')totals.travel_minutes+=minutes;
      if(segmentKind==='break')totals.break_minutes+=minutes;
    }
    if(action==='clock_in'){openedAt=at;shiftCount++;}
    if(action==='clock_out'){
      const span=(at-openedAt)/60000;
      if(!Number.isFinite(span)||span<0||span>20*60){issues.push('Shift exceeds 20 hours or has missing clock-in.');continue;}
      totals.shift_minutes+=span;openedAt=null;
    }
    state=NEXT[action];
    segmentKind=state==='work'||state==='travel'||state==='break'?state:'';
    segmentAt=segmentKind?at:null;
    timeline.push({id:row.id,action,event_time:new Date(at).toISOString(),note:String(row.note||'').slice(0,240)});
  }
  if(state!=='off')issues.push(`Open ${state} interval: finish the missing punches before submitting.`);
  if(shiftCount===0)issues.push('No shift clock-in recorded.');
  const rounded=Object.fromEntries(Object.entries(totals).map(([key,value])=>[key,Math.round(value*100)/100]));
  const paidCandidate=Math.round((totals.work_minutes+totals.travel_minutes)*100)/100;
  if(state==='off'&&shiftCount>0&&totals.shift_minutes+0.02<paidCandidate+totals.break_minutes)issues.push('Recorded intervals exceed the enclosing shift.');
  const last=sourceRows.at(-1),revision=`${sourceRows.length}:${last?.id||'none'}:${last?.event_time||last?.created_at||'none'}`;
  return {state,shift_count:shiftCount,totals:rounded,paid_candidate_minutes:paidCandidate,issues:[...new Set(issues)],ready_to_submit:state==='off'&&issues.length===0&&shiftCount>0,
    next_actions:STATES[state]||[],revision,event_count:sourceRows.length,timeline};
}

export async function stableReceiptId748(parts){
  const bytes=new TextEncoder().encode(`rosiedazzlers:748:${parts.join(':')}`);
  const hash=new Uint8Array(await crypto.subtle.digest('SHA-256',bytes));
  hash[6]=(hash[6]&15)|80;hash[8]=(hash[8]&63)|128;
  const hex=Array.from(hash.slice(0,16),x=>x.toString(16).padStart(2,'0')).join('');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}
