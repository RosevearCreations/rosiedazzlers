// Build 744 customer workbench: customer-initiated actions, no automatic outreach.
import { availabilityReadback744 } from '/assets/customer-followup-v744.mjs';
import { historyProjection807,filterHistory807,rebookingPath807 } from '/assets/customer-service-experience-v807.mjs?v=20261108build807';

const $=selector=>document.querySelector(selector);
const esc=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const validUuid=value=>/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(String(value||''));
const date=value=>String(value||'').slice(0,10)||'Date unknown';
let history=[], interests=[], catalog=null, consent=null, lastKey=null, lastFingerprint=null;
let historyView807=null,availabilitySequence807=0;

function historyFilters807(){
  return {search:$('#build807HistorySearch')?.value||'',year:$('#build807HistoryYear')?.value||'all',
    service:$('#build807HistoryPackage')?.value||'all',repeatableOnly:$('#build807HistoryMode')?.value==='repeatable'};
}

function renderHistoryChoices807(){
  if(!historyView807)return;
  for(const [id,options] of [
    ['build807HistoryYear',historyView807.years.map(year=>[year,year])],
    ['build807HistoryPackage',historyView807.packages]
  ]){
    const node=$(`#${id}`),old=node?.value;
    if(!node)continue;
    node.innerHTML=`<option value="all">${id.includes('Year')?'All years':'All services'}</option>`+
      options.map(([code,label])=>`<option value="${esc(code)}">${esc(label)}</option>`).join('');
    if(options.some(([code])=>code===old))node.value=old;
  }
}

function renderServices() {
  const host=$('#build744Services');if(!host)return;
  historyView807=historyProjection807(history,catalog);
  const rows=filterHistory807(historyView807.entries,historyFilters807());
  const {completed,repeatable}=historyView807.summary;
  $('#build807HistoryCounts').innerHTML=`<span><strong>${rows.length} / ${completed}</strong>Showing completed services</span><span><strong>${repeatable}</strong>Current catalog matches</span>`;
  host.innerHTML=rows.length?rows.map(row=>{
    const path=rebookingPath807(row);
    const rebook=path?`<a class="btn primary" href="${esc(path)}">Start a new booking</a>`:
      '<span class="build744-muted">This prior service is not verified as currently bookable. Choose a current service instead.</span>';
    return `<article class="build744-card"><span class="badge">Completed ${esc(row.completedDate)}</span><h3>${esc(row.packageName)}</h3>
      <p class="build744-muted">Recorded service ${esc(row.serviceDate)}${row.serviceArea?` · ${esc(row.serviceArea)}`:''}. No old price, time, vehicle choice or deposit carries forward.</p>
      <span class="build807-flag">${path?'Matched in current catalog':'Current catalog match unavailable'}</span>
      <p><strong>${esc(row.recommendation?.label||'Optional service review')}:</strong> ${esc(row.recommendation?.copy||'Ask Rosie about current workability and service scope.')}</p>
      <div class="build744-actions">${rebook}<button type="button" class="btn ghost" data-build744-pick="${esc(row.id)}">Ask Rosie about follow-up</button></div>
    </article>`;
  }).join(''):(completed?'<p class="build807-empty">No completed services match these filters. Clear the filters to review the available history.</p>':
    '<p class="muted">No verified completed service is linked to this signed-in history snapshot. Personalized rebooking ideas appear after a completed visit. <a href="/services">Explore current services</a>.</p>');
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
  if(!Array.isArray(data.completed_services)||!Array.isArray(data.interests))throw Error('Verified account history was not returned.');
  history=data.completed_services;
  interests=data.interests;
  consent=data.marketing_contact_readiness;
  historyView807=historyProjection807(history,catalog);
  renderHistoryChoices807();
  renderServices();renderChoices();renderConsent();renderInterests();
  $('#build744Status').className='notice ok';
  $('#build744Status').textContent='Showing the latest verified completed-service history from your account (up to 12 records). Rebooking uses the live catalog and a new checkout. No automatic messages or bookings.';
}

async function loadCatalog() {
  const response=await fetch('/api/pricing_catalog_public',{cache:'no-store'});
  const data=await response.json().catch(()=>null);
  catalog=response.ok&&data?.ok&&Array.isArray(data.packages)?data:null;
}

export async function loadCustomerFollowupWorkbench744() {
  if(typeof document==='undefined'||!$('#build744CustomerFollowup'))return;
  try {await Promise.all([loadCatalog().catch(()=>{catalog=null;}),refresh()]);renderServices();}
  catch(error){history=[];historyView807=null;interests=[];consent=null;
    $('#build744Services').innerHTML='<p class="notice bad">Completed-service history could not be verified. No rebooking shortcuts are available.</p>';
    $('#build744ServiceChoice').innerHTML='<option value="">History unavailable</option>';
    $('#build744InterestSubmit').disabled=true;$('#build744AvailabilityCheck').disabled=true;
    $('#build807HistoryCounts').textContent='History unavailable; refresh your account to retry.';
    $('#build744Status').className='notice bad';$('#build744Status').textContent=error?.message||'Cannot load follow-up choices.';}
}

function selectedService() {return history.find(row=>row.id===$('#build744ServiceChoice').value)||null;}
function clearAvailability() {availabilitySequence807++;$('#build744AvailabilityStatus').textContent='Choose a date and check live capacity. No availability is reserved.';}

async function checkAvailability() {
  const service=selectedService();const requestedDate=$('#build744AvailabilityDate').value;
  const node=$('#build744AvailabilityStatus');
  if(!service||!/^\d{4}-\d{2}-\d{2}$/.test(requestedDate)){node.textContent='Choose a completed service and date first.';return;}
  if(!service.service_area){node.textContent='Previous service area is not verified. Choose your current town in the booking wizard instead.';return;}
  const sequence=++availabilitySequence807;
  node.textContent='Checking current one-car capacity…';
  try {
    const url=`/api/availability?${new URLSearchParams({date:requestedDate,service_area:service.service_area})}`;
    const res=await fetch(url,{cache:'no-store'});
    const data=await res.json().catch(()=>null);
    if(sequence===availabilitySequence807&&selectedService()?.id===service.id&&$('#build744AvailabilityDate').value===requestedDate)
      node.textContent=availabilityReadback744(res.ok?data:null,requestedDate).label;
  } catch {if(sequence===availabilitySequence807)node.textContent='Live availability could not be checked. Please verify in the booking wizard.';}
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
  for(const id of ['build807HistorySearch','build807HistoryYear','build807HistoryPackage','build807HistoryMode'])
    $(`#${id}`)?.addEventListener(id==='build807HistorySearch'?'input':'change',renderServices);
  $('#build807HistoryClear')?.addEventListener('click',()=>{
    for(const id of ['build807HistorySearch','build807HistoryYear','build807HistoryPackage','build807HistoryMode'])
      $(`#${id}`).value=id==='build807HistorySearch'?'':'all';
    renderServices();
  });
  $('#build744Services')?.addEventListener('click',event=>{
    const button=event.target.closest('[data-build744-pick]');if(!button)return;
    $('#build744ServiceChoice').value=button.dataset.build744Pick;
    $('#build744InterestKind').focus();clearAvailability();
  });
  $('#build744ServiceChoice')?.addEventListener('change',clearAvailability);
  $('#build744AvailabilityDate')?.addEventListener('change',clearAvailability);
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
