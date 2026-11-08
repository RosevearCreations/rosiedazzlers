// Build 802: interpret the planner's existing SERVER-VERIFIED slot snapshot.
// Never create holds or treat the calendar snapshot as a reservation.
export function availabilityGuidance802({date='',note='',slots={},chosen=''}){
  if(!date)return 'Choose a preferred date to check current availability.';
  if(/could not be confirmed|could not load|failed/i.test(note))
    return 'Availability is not verified. Please retry before choosing a time.';
  if(!String(note).startsWith(`Availability for ${date}:`))
    return 'Checking the latest availability for this date…';
  const open=['AM','PM','FULL'].filter(slot=>slots[slot]===true);
  if(!open.length)return 'No available time on this date. Please choose another day.';
  if(chosen&&open.includes(chosen))return `${chosen==='FULL'?'Full day':chosen+' half day'} selected for review. This is not a reservation; checkout rechecks capacity.`;
  const labels=open.map(slot=>slot==='FULL'?'full day':slot+' half day');
  return `${labels.join(', ')} ${open.length===1?'is':'are'} available to select. Nothing is reserved yet.`;
}
export function initAvailabilityUx802(doc=document){
  const note=doc.getElementById('availabilityNote');
  const date=doc.getElementById('service_date');
  const buttons=[...doc.querySelectorAll('[data-slot]')];
  if(!note||!date||buttons.length!==3||doc.getElementById('availabilityGuide802'))return false;
  const guide=doc.createElement('p');guide.id='availabilityGuide802';
  guide.className='rd-availability-guide-802';
  guide.setAttribute('role','status');guide.setAttribute('aria-live','polite');
  note.insertAdjacentElement('afterend',guide);
  function sync(){
    const slots={};let chosen='';
    for(const button of buttons){
      const id=button.dataset.slot;slots[id]=!button.disabled;
      const active=button.classList.contains('active');
      button.setAttribute('aria-pressed',String(active));
      if(active)chosen=id;
    }
    guide.textContent=availabilityGuidance802({date:date.value,note:note.textContent,slots,chosen});
  }
  const observer=new MutationObserver(sync);
  observer.observe(note,{childList:true,subtree:true,characterData:true});
  buttons.forEach(button=>observer.observe(button,{attributes:true,attributeFilter:['disabled','class']}));
  date.addEventListener('change',sync);
  buttons.forEach(button=>button.addEventListener('click',()=>queueMicrotask(sync)));
  sync();return true;
}
if(typeof document!=='undefined'){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>initAvailabilityUx802(),{once:true});
  else initAvailabilityUx802();
}
