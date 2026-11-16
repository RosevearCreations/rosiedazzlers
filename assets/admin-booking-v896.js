// Rosie 896: owner-only, read-only booking schedule planning panel.
// This never submits a booking, staff assignment, payment or external command.
const $=id=>document.getElementById(id);
const form=$('rd896PlanningForm');
let busy=false;
function show(text,isError=false){
 const target=$('rd896Result');if(!target)return;
 target.textContent=text;
 target.className=isError?'notice error mini':'notice mini';
}
function clean(v){return String(v??'').trim();}
function resultText896(planning){
 if(!planning?.ok)return 'The schedule could not be reviewed. No booking was created.';
 const occupancy=planning.requested?.duration_slots===2?'full day (AM and PM)':
   clean(planning.requested?.start_slot)+' half-day';
 const fit=planning.capacity?.requested_fit===true?'capacity tentatively available':
   'capacity NOT available';
 const territory=planning.territory?.recognized===true?
   'recognized owner service area'+(planning.territory.auto_travel_eligible?'':' — owner travel quote required'):
   'area unverified — owner location review required';
 const worker=planning.worker_coverage_verified?'verified staffing window':'staff assignment/coverage not verified';
 const worksite=planning.worksite_verified?'worksite verified':'worksite/parking/bylaw not verified';
 return [
  'Requested '+occupancy+'. '+fit+'.',
  'AM '+(planning.capacity?.AM?'open':'blocked')+' / PM '+(planning.capacity?.PM?'open':'blocked')+'.',
  'Territory: '+territory+'.',
  'Crew: '+worker+'.',
  'Site: '+worksite+'.',
  planning.dispatch_ready?'All source checks satisfied — booking is STILL subject to final database hold.':
   'OWNER REVIEW REQUIRED before dispatch. No reservation, payment or staff assignment was made.'
 ].join(' ');
}
if(form){
 form.addEventListener('submit',async event=>{
  event.preventDefault();
  if(busy)return;
  const service_date=clean($('rd896Date')?.value);
  const start_slot=clean($('rd896Slot')?.value);
  const service_area=clean($('rd896Area')?.value);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(service_date)||!['AM','PM','FULL'].includes(start_slot)||
     !service_area||service_area.length>120){
    show('Choose a valid date, appointment length and configured service area.',true);
    return;
  }
  busy=true;const btn=$('rd896Check');if(btn)btn.disabled=true;
  show('Checking live booking capacity and configured territory…');
  try{
    const res=await fetch('/api/admin/booking_availability',{
      method:'POST',credentials:'include',cache:'no-store',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({service_date,start_slot,
       duration_slots:start_slot==='FULL'?2:1,service_area})
    });
    const data=await res.json().catch(()=>null);
    if(!res.ok||data?.ok!==true||!data?.planning_896?.ok)
      throw Error(data?.error||'Current schedule review is unavailable');
    show(resultText896(data.planning_896));
  }catch(error){
    show((error?.message||'Could not review schedule')+
     '. No changes were made. Sign in with booking-management access before retrying.',true);
  }finally{busy=false;if(btn)btn.disabled=false}
 });
}
