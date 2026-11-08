// Build 806: read-only, source-backed daily dispatch projections.
// Never grants assignments, changes bookings, or infers a schedule slot from a time string.
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE=/^\d{4}-\d{2}-\d{2}$/;
const text=value=>String(value??'').trim();

export function normalizeSlot806(value){
  const slot=text(value).toUpperCase();
  if(['AM','MORNING'].includes(slot))return 'AM';
  if(['PM','AFTERNOON'].includes(slot))return 'PM';
  if(['FULL','FULL_DAY','BOTH','ALL_DAY'].includes(slot))return 'FULL';
  return null;
}

export function activeBooking806(row){
  return !['cancelled','canceled'].includes(text(row?.status).toLowerCase())&&
    !['cancelled','canceled'].includes(text(row?.job_status).toLowerCase());
}

export function verifiedStaff806(booking){
  const crew=Array.isArray(booking?.crew_assignments)?booking.crew_assignments:[];
  const people=new Map();
  for(const row of crew){
    const id=text(row?.staff_user_id);
    if(!UUID.test(id))continue;
    people.set(id.toLowerCase(),{id:id.toLowerCase(),name:text(row.staff_name)||`Staff ${id.slice(0,8)}`});
  }
  const leadId=text(booking?.assigned_staff_user_id);
  if(UUID.test(leadId)&&!people.has(leadId.toLowerCase()))
    people.set(leadId.toLowerCase(),{id:leadId.toLowerCase(),name:text(booking.assigned_staff_name)||text(booking.assigned_to)||`Staff ${leadId.slice(0,8)}`});
  return {people:[...people.values()],unverifiedCrew:crew.some(row=>!UUID.test(text(row?.staff_user_id)))};
}

const reason=(code,kind,label,severity='warn')=>({code,kind,label,severity});
const bookedSlots=slot=>slot==='FULL'?['AM','PM']:slot?[slot]:[];

export function buildDispatch806(schedule,bookings,{crewWarning=null}={}){
  const day=text(schedule?.service_date);
  if(!DATE.test(day)||schedule?.ok!==true||!Array.isArray(schedule.bookings))throw Error('A verified day-schedule response is required.');
  if(!Array.isArray(bookings))throw Error('Current authorized booking details are required.');
  if(!['AM','PM'].every(slot=>schedule.slots?.[slot]&&Number.isInteger(schedule.slots[slot].active_booking_count)&&schedule.slots[slot].active_booking_count>=0&&typeof schedule.slots[slot].blocked==='boolean'))
    throw Error('Authoritative AM/PM occupancy and block flags are required.');
  if(schedule.bookings.some(row=>!text(row?.id)||text(row?.service_date)!==day))
    throw Error('Day-schedule booking identifiers and dates must be reconciled.');
  const byId=new Map(bookings.filter(row=>row?.id&&text(row.service_date)===day).map(row=>[text(row.id),row]));
  const rows=schedule.bookings.filter(row=>text(row?.service_date||day)===day).map(row=>{
    const details=byId.get(text(row.id));
    return {...(details||{}),...row,crew_assignments:Array.isArray(details?.crew_assignments)?details.crew_assignments:[],
      dispatch_detail_verified:Boolean(details)};
  });
  const exceptionsById=new Map(),workloads=new Map();
  let active=0,unassigned=0;
  const add=(id,item)=>{const current=exceptionsById.get(id)||[];if(!current.some(existing=>existing.code===item.code))current.push(item);exceptionsById.set(id,current);};
  const dayBlocked=Boolean(schedule.date_block?.is_closed);
  const blocked={AM:Boolean(schedule.slots?.AM?.blocked),PM:Boolean(schedule.slots?.PM?.blocked)};
  const collision={AM:Number(schedule.slots?.AM?.active_booking_count||0)>1,PM:Number(schedule.slots?.PM?.active_booking_count||0)>1};
  for(const row of rows){
    if(!activeBooking806(row))continue;
    active++;
    const id=text(row.id),slot=normalizeSlot806(row.start_slot);
    const {people,unverifiedCrew}=verifiedStaff806(row);
    if(!people.length){unassigned++;add(id,reason('unassigned','assignment','Verified staff assignment required','high'));}
    if(unverifiedCrew)add(id,reason('crew_identity','assignment','Crew identity needs verification'));
    if(!slot)add(id,reason('slot_unknown','schedule','Service slot not recognized'));
    if(dayBlocked)add(id,reason('date_blocked','schedule','Booking falls on a blocked service date','high'));
    if(bookedSlots(slot).some(code=>blocked[code]))add(id,reason('slot_blocked','schedule','Booking occupies a blocked service slot','high'));
    if(bookedSlots(slot).some(code=>collision[code]))add(id,reason('slot_overlap','schedule','Multiple bookings occupy this service slot','high'));
    if(!text(row.package_code))add(id,reason('package_missing','data','Service package needs review'));
    if(!row.dispatch_detail_verified)add(id,reason('details_missing','data','Booking detail not reconciled'));
    for(const person of people){
      const current=workloads.get(person.id)||{...person,jobIds:[],slotCounts:{AM:0,PM:0,FULL:0,unknown:0},completed:0};
      current.name=person.name||current.name;
      current.jobIds.push(id);
      if(slot)current.slotCounts[slot]++;else current.slotCounts.unknown++;
      if(['completed','awaiting_payment'].includes(text(row.job_status).toLowerCase()))current.completed++;
      workloads.set(person.id,current);
    }
  }
  const staff=[...workloads.values()].map(entry=>{
    const counts=entry.slotCounts;
    const overloaded=counts.FULL>1||(counts.FULL>0&&(counts.AM+counts.PM)>0)||counts.AM>1||counts.PM>1;
    if(overloaded)for(const id of entry.jobIds)add(id,reason('staff_overlap','assignment','Staff member has overlapping daily assignments','high'));
    return {...entry,overloaded,needsSlotReview:counts.unknown>0};
  }).sort((a,b)=>a.name.localeCompare(b.name));
  const exceptions=rows.flatMap(row=>(exceptionsById.get(text(row.id))||[]).map(item=>({bookingId:text(row.id),customer:text(row.customer_name)||'Customer',slot:normalizeSlot806(row.start_slot)||'UNKNOWN',...item})));
  return {date:day,rows,staff,exceptions,exceptionsById,summary:{appointments:rows.length,active,unassigned,attentionJobs:exceptionsById.size,
    staffAssigned:staff.length},warnings:[...(crewWarning?[text(crewWarning)]:[]),
    ...(dayBlocked?['Service date is blocked. Review the authoritative blocks screen.']:[])]};
}

export function filterDispatch806(rows,exceptionsById,{query='',slot='all',status='all',staffId='all',onlyExceptions=false}={}){
  const term=text(query).toLowerCase();
  return rows.filter(row=>{
    const id=text(row.id),staff=verifiedStaff806(row).people.map(person=>person.id);
    if(onlyExceptions&&!(exceptionsById.get(id)||[]).length)return false;
    if(slot!=='all'&&normalizeSlot806(row.start_slot)!==slot)return false;
    if(status==='active'&&!activeBooking806(row))return false;
    if(status==='completed'&&!['completed','awaiting_payment'].includes(text(row.job_status).toLowerCase()))return false;
    if(staffId!=='all'&&!staff.includes(staffId))return false;
    if(term&&!`${text(row.customer_name)} ${text(row.package_code)} ${text(row.vehicle_make)} ${text(row.vehicle_model)}`.toLowerCase().includes(term))return false;
    return true;
  });
}
