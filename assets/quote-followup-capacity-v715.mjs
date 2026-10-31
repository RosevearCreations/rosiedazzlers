import {agingQueue711} from './quote-followup-aging-v711.mjs';

export const CAPACITY_POLICY715=Object.freeze({max_assigned:6,max_overdue:3,max_critical:2,
  quote_limit:150,event_limit:800,staff_limit:100});

// Conservative follow-up queue guard only. These counts are NOT booked hours,
// current shift availability, payroll caps or an assurance of spare capacity.
export function capacitySnapshot715(quotes=[],events=[],now=new Date()){
  const queue=agingQueue711(quotes,events,now),groups=new Map();
  for(const item of queue.items){
    if(!item.assignment_needs_live_recheck&&item.assigned_staff_user_id){
      const id=item.assigned_staff_user_id;
      if(!groups.has(id))groups.set(id,{staff_user_id:id,assigned:0,overdue:0,critical:0});
      const group=groups.get(id);
      group.assigned++;
      if(['overdue','critical'].includes(item.bucket))group.overdue++;
      if(item.bucket==='critical')group.critical++;
    }
  }
  return {by_staff:[...groups.values()],quote_count:quotes.length,event_count:events.length,
    source_truncated:quotes.length>=CAPACITY_POLICY715.quote_limit||
      events.length>=CAPACITY_POLICY715.event_limit,
    policy:CAPACITY_POLICY715,shift_availability_verified:false,hours_verified:false};
}

export function capacityDecision715(snapshot,staffId,selectedBucket='scheduled',alreadyOwned=false){
  const current=snapshot.by_staff.find(x=>x.staff_user_id===staffId)||
    {staff_user_id:staffId,assigned:0,overdue:0,critical:0};
  const plus=alreadyOwned?0:1;
  const incomingOverdue=['overdue','critical'].includes(selectedBucket)?plus:0;
  const incomingCritical=selectedBucket==='critical'?plus:0;
  const projected={assigned:current.assigned+plus,
    overdue:current.overdue+incomingOverdue,critical:current.critical+incomingCritical};
  const exceeded=Object.entries({assigned:CAPACITY_POLICY715.max_assigned,
    overdue:CAPACITY_POLICY715.max_overdue,critical:CAPACITY_POLICY715.max_critical})
    .filter(([key,max])=>projected[key]>max).map(([key])=>key);
  return {target_staff_user_id:staffId,current,projected,exceeded,
    source_truncated:snapshot.source_truncated,hard_hold:snapshot.source_truncated,
    requires_manager_override:exceeded.length>0&&!snapshot.source_truncated,
    shift_availability_verified:false,hours_verified:false};
}
