// Build 910: source-only account quote readiness for desktop, tablet and mobile.
// No local storage, customer PII caching, checkout token, media URL or automatic mutation.
const root=document.getElementById('build909Continuity');
if(root){
 const area=document.createElement('div');area.id='build910Readiness';area.className='panel-lite';
 const h=document.createElement('h3');h.textContent='Quote to booking: current readiness';
 const note=document.createElement('p');note.className='muted';
 note.textContent='Checks a staff-sent accepted quote against current prices. Booking date, worksite eligibility, waiver and deposit still require the normal booking process.';
 const controls=document.createElement('div');
 const status=document.createElement('p');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 status.className='muted';status.textContent='Checking signed-in quote list…';
 area.append(h,note,controls,status);root.append(area);
 const money=cents=>new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD'}).format((Number(cents)||0)/100);
 async function init(){
  try{
   const res=await fetch('/api/client/booking_continuity_v909',{credentials:'same-origin',cache:'no-store'});
   const data=await res.json();
   if(!res.ok||!data.ok)throw Error('Sign in to examine an accepted quote.');
   const quotes=(data.quotes||[]).filter(q=>q.status==='accepted'&&/^[0-9a-f-]{36}$/i.test(String(q.id||'')));
   controls.replaceChildren();
   if(!quotes.length){status.textContent='No accepted staff-sent quotes are available for this account.';return;}
   const select=document.createElement('select');select.setAttribute('aria-label','Accepted quote');
   select.style.maxWidth='100%';select.style.width='100%';
   quotes.forEach((q,i)=>{const o=document.createElement('option');o.value=String(i);
    o.textContent=q.title||'Accepted quote';select.append(o);});
   const btn=document.createElement('button');btn.type='button';btn.className='btn small primary';
   btn.textContent='Check current booking readiness';btn.style.marginTop='0.75rem';
   controls.append(select,btn);status.textContent='Select a quote to check current source evidence.';
   btn.addEventListener('click',async()=>{
    btn.disabled=true;status.textContent='Comparing current source price and private media evidence…';
    try{
     const q=quotes[Number(select.value)];
     const r=await fetch('/api/client/quote_readiness_v910?quote_id='+encodeURIComponent(q.id),
      {credentials:'same-origin',cache:'no-store'});
     const x=await r.json();
     if(!r.ok||!x.ok)throw Error(x.error||'Readiness unavailable');
     const rd=x.readiness||{},ret=x.retention||{};
     status.textContent=(rd.state||'HOLD')+': '+(rd.reason||'No verified readiness')+
      '. Private media source receipt: '+(ret.verified_items||0)+' verified item(s), '+
      (ret.retention_state||'HOLD')+'. Original storage deletion not witnessed. '+
      'No booking, charge or notification has been created.';
    }catch(err){status.textContent=err.message||'Source unavailable. No change made.';}
    finally{btn.disabled=false;}
   });
  }catch(err){status.textContent=err.message||'Customer source unavailable.';}
 }
 init();
}
