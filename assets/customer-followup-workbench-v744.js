// Build 744 customer workbench: customer-initiated actions, no automatic outreach.
import { seasonalGuidance744, torontoSeason744, availabilityReadback744 } from '/assets/customer-followup-v744.mjs';

const $=selector=>document.querySelector(selector);
const esc=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const validUuid=value=>/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(String(value||''));
const date=value=>String(value||'').slice(0,10)||'Date unknown';
let history=[], interests=[], catalog=null, consent=null, lastKey=null, lastFingerprint=null;

function bookablePackage(code) {
  const pkg=catalog?.packages?.find(row=>row?.code===code);
  if(!pkg||pkg.active===false||pkg.enabled===false||pkg.bookable===false||/retired|inactive|disabled|archived|unavailable/i.test(`${pkg.status||''} ${pkg.lifecycle_status||''}`)) return null;
  return ['small','mid','oversize'].some(size=>Number(pkg.prices_cad?.[size])>0)?pkg:null;
}

function renderServices() {
  const host=$('#build744Services');if(!host)return;
  const season=torontoSeason744();
  host.innerHTML=history.length?history.slice(0,6).map(row=>{
    const pkg=bookablePackage(row.package_code);
    const idea=seasonalGuidance744({...row,job_status:'completed',detailing_completed_at:row.completed_at},season);
    const rebook=pkg?`<a class="btn primary" href="/book?${new URLSearchParams({rebook_package:row.package_code,rebook_date:date(row.service_date)})}">Start a new booking</a>`:
      '<span class="build744-muted">Current service not verified in the live catalog; choose from current services.</span>';
    return `<article class="build744-card"><span class="badge">Completed ${esc(date(row.completed_at))}</span><h3>${esc(pkg?.name||row.package_code)}</h3>
      <p class="build744-muted">Based on your actual completed service${row.service_area?` in ${esc(row.service_area)}`:''}. No old price, time, vehicle choice or deposit carries forward.</p>
      <p><strong>${esc(idea?.label||'Seasonal review')}:</strong> ${esc(idea?.copy||'Ask Rosie about current workability.')}</p>
      <div class="build744-actions">${rebook}<button type="button" class="btn ghost" data-build744-pick="${esc(row.id)}">Ask Rosie about follow-up</button></div>
    </article>`;
  }).join(''):'<p class="muted">No completed service is linked to this signed-in account. Personalized rebooking and seasonal ideas will appear after a completed visit. <a href="/services">Explore current services</a>.</p>';
}

function renderChoices() {
  const select=$('#build744ServiceChoice');if(!select)return;
  const prior=select.value;
  select.innerHTML='<option value="">Choose a completed service</option>'+history.map(row=>
    `<option value="${esc(row.id)}">${esc(date(row.completed_at))} · ${esc(row.package_code)}${row.service_area?` · ${esc(row.service_area)}`:''}</option>`).join('');
  if(history.some(row=>row.id===prior))select.value=prior;
  $('#build744InterestSubmit').disabled=history.length===0;
  $('#build744AvailabilityCheck').disabled=history.length===0;
  $('#build744EmptyService').hidden=history.length>0;
}

function renderConsent() {
  const node=$('#build744ConsentStatus');if(!node)return;
  const allowed=Object.entries(consent?.channels||{}).filter(([,status])=>status.allowed).map(([key])=>key);
  node.textContent=allowed.length
    ? `Optional marketing contact currently eligible for: ${allowed.join(', ')}. Consent will be rechecked before any separate communication.`
    : 'Marketing reminders are off, stale or blocked for the current channel. Recording interest does not opt you in or authorize a message. Change your choices in the Communication section above.';
}

function renderInterests() {
  const node=$('#build744InterestHistory');if(!node)return;
  node.innerHTML=interests.length?interests.slice(0,12).map(item=>
    `<article class="build744-record"><strong>${esc(item.interest_kind)} · ${esc(date(item.submitted_at))}</strong><p>${esc(item.cycle_hint==='unsure'?'Timing not selected':item.cycle_hint.replace('_',' '))} · Awaiting staff review</p><p class="build744-muted">Interest only — no message, appointment, subscription or revenue confirmed.</p></article>`
  ).join(''):'<p class="muted">No follow-up interests recorded yet. This is separate from confirmed bookings or payments.</p>';
}

async function refresh() {
  const res=await fetch('/api/client/followup_interest_v744',{credentials:'include',cache:'no-store'});
  const data=await res.json().catch(()=>null);
  if(!res.ok||!data?.ok)throw new Error(data?.error||'Follow-up options unavailable.');
  history=Array.isArray(data.completed_services)?data.completed_services:[];
  interests=Array.isArray(data.interests)?data.interests:[];
  consent=data.marketing_contact_readiness;
  renderServices();renderChoices();renderConsent();renderInterests();
  $('#build744Status').textContent='Suggestions use your completed services. Dates and service eligibility are checked separately; no automatic messages or bookings.';
}

async function loadCatalog() {
  const response=await fetch('/api/pricing_catalog_public',{cache:'no-store'});
  const data=await response.json().catch(()=>null);
  catalog=response.ok&&data?.ok&&Array.isArray(data.packages)?data:null;
}

export async function loadCustomerFollowupWorkbench744() {
  if(typeof document==='undefined'||!$('#build744CustomerFollowup'))return;
  try {await Promise.all([loadCatalog().catch(()=>{catalog=null;}),refresh()]);renderServices();}
  catch(error){$('#build744Status').className='notice bad';$('#build744Status').textContent=error?.message||'Cannot load follow-up choices.';}
}

function selectedService() {return history.find(row=>row.id===$('#build744ServiceChoice').value)||null;}
function clearAvailability() {$('#build744AvailabilityStatus').textContent='Choose a date and check live capacity. No availability is reserved.';}

async function checkAvailability() {
  const service=selectedService();const requestedDate=$('#build744AvailabilityDate').value;
  const node=$('#build744AvailabilityStatus');
  if(!service||!/^\d{4}-\d{2}-\d{2}$/.test(requestedDate)){node.textContent='Choose a completed service and date first.';return;}
  if(!service.service_area){node.textContent='Previous service area is not verified. Choose your current town in the booking wizard instead.';return;}
  node.textContent='Checking current one-car capacity…';
  try {
    const url=`/api/availability?${new URLSearchParams({date:requestedDate,service_area:service.service_area})}`;
    const res=await fetch(url,{cache:'no-store'});
    const data=await res.json().catch(()=>null);
    node.textContent=availabilityReadback744(res.ok?data:null,requestedDate).label;
  } catch {node.textContent='Live availability could not be checked. Please verify in the booking wizard.';}
}

async function submitInterest(event) {
  event.preventDefault();const form=event.currentTarget;if(form.getAttribute('aria-busy')==='true')return;
  const source=selectedService();
  if(!source||!validUuid(source.id))return;
  const body={source_booking_id:source.id,interest_kind:$('#build744InterestKind').value,
    cycle_hint:$('#build744InterestKind').value==='maintenance'?$('#build744Cycle').value:'unsure',
    customer_note:$('#build744Note').value.trim()};
  const fingerprint=JSON.stringify(body);
  if(fingerprint!==lastFingerprint){lastFingerprint=fingerprint;lastKey=crypto.randomUUID();}
  body.client_request_id=lastKey;
  form.setAttribute('aria-busy','true');$('#build744InterestSubmit').disabled=true;
  const node=$('#build744SubmitStatus');node.className='notice';node.textContent='Saving interest without sending or booking…';
  try {
    const res=await fetch('/api/client/followup_interest_v744',{method:'POST',credentials:'include',
      headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const data=await res.json().catch(()=>null);
    if(!res.ok||!data?.ok)throw new Error(data?.error||'Could not save interest.');
    node.className='notice ok';node.textContent=data.duplicate
      ?'This interest was already recorded this month; no duplicate was created.'
      :'Interest saved for human review. No notification sent, appointment reserved, subscription started or payment recorded.';
    lastKey=null;lastFingerprint=null;$('#build744Note').value='';
    await refresh();
  }catch(error){node.className='notice bad';node.textContent=error?.message||'Could not save interest.';}
  finally{form.setAttribute('aria-busy','false');$('#build744InterestSubmit').disabled=history.length===0;}
}

if(typeof document!=='undefined'){
  $('#build744Services')?.addEventListener('click',event=>{
    const button=event.target.closest('[data-build744-pick]');if(!button)return;
    $('#build744ServiceChoice').value=button.dataset.build744Pick;
    $('#build744InterestKind').focus();clearAvailability();
  });
  $('#build744ServiceChoice')?.addEventListener('change',clearAvailability);
  $('#build744InterestKind')?.addEventListener('change',()=>{$('#build744CycleWrap').hidden=$('#build744InterestKind').value!=='maintenance';});
  $('#build744InterestForm')?.addEventListener('submit',submitInterest);
  $('#build744AvailabilityCheck')?.addEventListener('click',checkAvailability);
  const input=$('#build744AvailabilityDate');if(input){
    const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Toronto',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
    const piece=key=>parts.find(item=>item.type===key)?.value||'';
    input.min=`${piece('year')}-${piece('month')}-${piece('day')}`;
  }
  $('#build744Share')?.addEventListener('click',async()=>{
    const url=new URL('/services',location.origin).href;
    try{if(navigator.share)await navigator.share({title:'Rosie Dazzlers services',url});
      else if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(url);
      else throw new Error('Share not supported');
      $('#build744ShareStatus').textContent='Service page shared or copied. No customer information was included.';
    }catch{$('#build744ShareStatus').textContent=`Sharing is unavailable; use the public Services link instead. No message was sent by Rosie.`;}
  });
}
