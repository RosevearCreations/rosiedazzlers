// Build 889: customer-facing standalone service basket.
// The live server catalogue, checkout capacity and payment callbacks remain authoritative.
// No customer data is saved in URLs, browser storage or analytics.
const form=document.getElementById('alaCarteForm889');
const field=name=>form.elements.namedItem(name);
const byId=id=>document.getElementById(id);
const money=cents=>new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD'}).format(cents/100);
const status=(id,message)=>{byId(id).textContent=message;};
const selected=new Set();
let catalog=null,policy=null,approved=false,busy=false,uncertain=false;
let availability=null;
const readValue=name=>String(field(name)?.value||'').trim();
const dateIsCold=date=>/^\d{4}-(11|12|01|02|03)-\d{2}$/.test(date);
const text=(tag,string)=>{const el=document.createElement(tag);el.textContent=string;return el;};
function eligibleItems() {
  const size=readValue('vehicle_size');
  const addons=Array.isArray(catalog?.addons)?catalog.addons:[];
  return addons.filter(x=>x?.standalone_allowed===true && x?.quote_required!==true &&
     Number.isFinite(x?.prices_cad?.[size]) && x.prices_cad[size]>0);
}
function drawServices() {
  const root=byId('standaloneServices889');
  root.replaceChildren();
  const options=eligibleItems();
  const permitted=new Set(options.map(x=>x.code));
  for(const code of [...selected])if(!permitted.has(code))selected.delete(code);
  if(!options.length) {
    root.append(text('p','No individually priced and owner-approved services are available for this vehicle size. You can use the guided package booking or contact Rosie.'));
    return;
  }
  for(const item of options) {
    const wrap=document.createElement('div');wrap.className='choice';
    const input=document.createElement('input');input.type='checkbox';input.id='service889_'+item.code;
    input.value=item.code;input.checked=selected.has(item.code);input.disabled=!approved;
    const label=document.createElement('label');label.htmlFor=input.id;
    label.append(text('strong',item.name),text('span',money(Math.round(item.prices_cad[readValue('vehicle_size')]*100))+' CAD · service price'));
    input.addEventListener('change',()=>{input.checked?selected.add(item.code):selected.delete(item.code);drawBasket();});
    wrap.append(input,label);root.append(wrap);
  }
}
function drawBasket() {
  const root=byId('basketSummary889');root.replaceChildren();
  const size=readValue('vehicle_size');
  const items=eligibleItems().filter(a=>selected.has(a.code));
  let total=0;
  for(const a of items){
    const cents=Math.round(a.prices_cad[size]*100);total+=cents;
    root.append(text('span',a.name),text('strong',money(cents)));
  }
  root.append(text('span','Service subtotal before any applicable taxes'),text('strong',money(total)));
  const deposit=Number(policy?.deposit_cad);
  root.append(text('span','Owner-approved deposit requested today'),text('strong',approved&&deposit>0?money(Math.round(deposit*100)):'Not approved'));
  if (approved&&Number.isFinite(deposit) && Math.round(deposit*100)>total)
    status('catalogStatus889','Please choose services totalling at least the approved deposit or contact Rosie for a quote.');
  const allowed=approved&&items.length>0&&total>=Math.round(deposit*100)&&!!size&&!busy&&!uncertain;
  byId('checkout889').disabled=!allowed;
}
async function loadCatalog() {
  try {
    const response=await fetch('/api/pricing_catalog_public',{credentials:'same-origin',cache:'no-store'});
    const data=await response.json();
    if(!response.ok||data?.ok!==true)throw Error('Current service catalogue unavailable.');
    catalog=data;
    policy=data?.booking_rules?.ala_carte_policy||null;
    approved=policy?.enabled===true&&policy?.owner_approved===true&&
      typeof policy?.version==='string'&&!!policy.version.trim()&&
      Number.isFinite(policy?.deposit_cad)&&policy.deposit_cad>0;
    const area=field('service_area');area.replaceChildren(new Option('Choose an approved service zone',''));
    const seen=new Set();
    for(const row of Array.isArray(data.service_areas)?data.service_areas:[]){
      const value=String(row.value||row.label||'').trim();
      if(!value||seen.has(value)||!['Oxford County','Norfolk County'].includes(row.county)||row.travel_tier==='quote_required')continue;
      seen.add(value);area.add(new Option(String(row.label||value),value));
    }
    status('catalogStatus889',approved
      ?'Individual services are available under the current owner-approved catalogue. Select a vehicle size and your services.'
      :'Individual service checkout is awaiting owner approval of standalone-eligible items, prices and deposit terms. No payment can be started here. Guided package booking remains available.');
    drawServices();drawBasket();
  } catch {
    approved=false;status('catalogStatus889','We could not verify the current service catalogue. No standalone checkout is available. Please choose guided booking or contact Rosie.');
    drawServices();drawBasket();
  }
}
function availabilityMessage(date,slot,data) {
  if(!date||!slot)return 'Choose a date and appointment length to check availability.';
  if(dateIsCold(date))return 'November–March requires staff winter/site approval. Contact Rosie before making a reservation or payment.';
  if(!data?.ok)return 'Availability cannot currently be verified. Do not submit payment.';
  if(data.blocked)return 'That date is blocked for booking.';
  const open=slot==='FULL'?data.AM===true&&data.PM===true:data[slot]===true;
  return open?'The requested slot currently appears available. Rosie rechecks availability when you submit.':'That slot is not currently available. Choose another.';
}
async function refreshAvailability() {
  const date=readValue('service_date'),slot=readValue('start_slot');
  availability=null;
  if(!date||!slot){status('availabilityStatus889',availabilityMessage(date,slot,null));return;}
  if(dateIsCold(date)){status('availabilityStatus889',availabilityMessage(date,slot,null));return;}
  try{
    status('availabilityStatus889','Checking current availability…');
    const u=new URL('/api/availability',location.origin);
    u.searchParams.set('date',date);u.searchParams.set('service_area',readValue('service_area'));
    u.searchParams.set('start_slot',slot==='FULL'?'AM':slot);
    u.searchParams.set('duration_slots',slot==='FULL'?'2':'1');
    const res=await fetch(u,{cache:'no-store',credentials:'same-origin'});
    const result=await res.json();
    if(!res.ok||result?.ok!==true)throw Error('not available');
    if(date===readValue('service_date')&&slot===readValue('start_slot')) {
      availability=result;status('availabilityStatus889',availabilityMessage(date,slot,result));
    }
  }catch{status('availabilityStatus889','Availability could not be verified. Please try again later or contact Rosie.');}
}
function safeProviderUrl(url,provider){
  try{const u=new URL(url);const h=u.hostname.toLowerCase();
    if(u.protocol!=='https:'||u.username||u.password||u.port)return null;
    if(provider==='stripe'&&h==='checkout.stripe.com')return u.toString();
    if(provider==='paypal'&&(h==='paypal.com'||h.endsWith('.paypal.com')))return u.toString();
  }catch{}return null;
}
form.addEventListener('change',e=>{
  if(e.target?.name==='vehicle_size'){drawServices();drawBasket();}
  if(['service_date','start_slot','service_area'].includes(e.target?.name))refreshAvailability();
});
form.addEventListener('submit',async e=>{
  e.preventDefault();
  if(busy||uncertain||!approved||!form.reportValidity())return;
  const codes=eligibleItems().filter(a=>selected.has(a.code)).map(a=>a.code);
  if(!codes.length){status('checkoutStatus889','Please choose at least one approved standalone service.');return;}
  const date=readValue('service_date'),slot=readValue('start_slot');
  const site={access:readValue('site_access'),surface:readValue('site_surface'),
    weather:readValue('site_weather'),runoff:readValue('site_runoff')};
  if(dateIsCold(date)||Object.values(site).some((x,i)=>x!==['private_safe','clear_level','suitable','compliant'][i])){
    status('checkoutStatus889','This date or worksite needs staff review. No booking has been submitted; contact Rosie to arrange it.');
    return;
  }
  busy=true;drawBasket();
  try{
    status('checkoutStatus889','Checking the slot before preparing payment…');
    await refreshAvailability();
    if(!availability?.ok||availability.blocked||
      !(slot==='FULL'?availability.AM===true&&availability.PM===true:availability[slot]===true)){
      status('checkoutStatus889','That date/slot is not currently available. Select another appointment.');return;
    }
    const payload={
      booking_mode:'ala_carte',service_codes:codes,vehicle_size:readValue('vehicle_size'),
      service_date:date,start_slot:slot==='FULL'?'AM':slot,duration_slots:slot==='FULL'?2:1,
      service_area:readValue('service_area'),customer_name:readValue('customer_name'),
      customer_email:readValue('customer_email'),customer_phone:readValue('customer_phone')||null,
      address_line1:readValue('address_line1'),city:readValue('city'),postal_code:readValue('postal_code'),
      payment_provider:readValue('payment_provider'),
      vehicle:{year:Number(readValue('vehicle_year')),make:readValue('vehicle_make'),model:readValue('vehicle_model')},
      workability_739:site,ack_driveway:field('ack_driveway').checked,
      ack_power_water:true,ack_bylaw:field('ack_bylaw').checked,
      ack_cancellation:field('ack_cancellation').checked,
      media_consent_preference:'estimate_only'
    };
    status('checkoutStatus889','Preparing the verified deposit. Do not click again or go back while it is processing.');
    const response=await fetch('/api/checkout',{method:'POST',credentials:'same-origin',
      headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
    const data=await response.json().catch(()=>null);
    if(!response.ok){
      if(response.status>=500){uncertain=true;
        status('checkoutStatus889','Booking/payment setup could not be confirmed. Please contact Rosie before retrying, to avoid duplicate bookings or payments.');
      } else status('checkoutStatus889',String(data?.error||'Booking not available. Please review your choices and contact Rosie if needed.'));
      return;
    }
    const provider=data?.mode==='paypal'?'paypal':data?.mode==='stripe'?'stripe':null;
    const target=provider?safeProviderUrl(provider==='paypal'?data.approve_url:data.checkout_url,provider):null;
    if(!data?.ok||!target){uncertain=true;status('checkoutStatus889','Booking response needs staff verification before another attempt. Please contact Rosie.');return;}
    status('checkoutStatus889','Opening your secure payment provider. Booking confirmation follows verified payment.');
    window.location.assign(target);
  } catch {
    uncertain=true;status('checkoutStatus889','Network response is uncertain. Do not retry immediately: ask Rosie to verify whether a pending booking exists.');
  } finally {busy=false;drawBasket();}
});
const d=field('service_date'),today=new Date();const localToday=[today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-');d.min=localToday;
loadCatalog();
