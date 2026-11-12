// Rosie 870: fragment bearer stays out of booking query strings, logs and analytics.
const el=id=>document.getElementById(id);
function status(message,invalid=false){
 el('rdQuoteMessage').textContent=message;
 el('rdQuoteMessage').className='notice'+(invalid?' error':'');
}
async function init(){
 const token=new URLSearchParams(location.hash.slice(1)).get('share')||'';
 // Avoid accidental fragment forwarding through referrers or external links.
 history.replaceState(null,'',location.pathname);
 if(!/^[A-Za-z0-9_-]{43}$/.test(token)){
  status('This quote link is missing or invalid. Request a new link from Rosie Dazzlers.',true);
  return;
 }
 try{
  const response=await fetch('/api/roadside_quote_v870',{method:'POST',
   headers:{'Content-Type':'application/json'},cache:'no-store',
   referrerPolicy:'no-referrer',body:JSON.stringify({share_token:token})});
  const r=await response.json().catch(()=>({}));
  if(!response.ok||!r.ok)throw Error(r.error||'Quote link unavailable');
  el('rdQuoteAmount').textContent='$'+Number(r.estimate_cad).toFixed(2)+' CAD';
  const labels={premium_wash:'Premium Wash',basic_detail:'Basic Detail',
   complete_detail:'Complete Detail',interior_detail:'Interior Detail',
   exterior_detail:'Exterior Detail'};
  const sizes={small:'Small',mid:'Mid-sized',oversize:'Oversized'};
  el('rdQuotePreference').textContent=
   (labels[r.package_code]||'Choose your service')+
   ' · '+(sizes[r.vehicle_size]||'Choose your vehicle size');
  el('rdQuoteExpiry').textContent='Quote link valid until '+new Date(r.expires_at).toLocaleString()+'.';
  const next=el('rdBookLink');
  if(r.booking_href && r.booking_href.startsWith('/book')){
   next.href=r.booking_href;
   next.hidden=false;
   status('Review this estimate, then continue to our standard booking wizard. Current prices, availability, terms and deposit are verified there.');
  }else{
   status('A booking has already been linked to this quote. Contact Rosie Dazzlers to make changes.');
  }
 }catch(e){status(e.message,true);}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
else init();
