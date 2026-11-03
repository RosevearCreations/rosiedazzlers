// Build 752: local-only owner review packet. API is GET-only; this script never submits a decision.
const $=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const cad=value=>value==null?'Unverified':new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD'}).format(value/100);
let evidence=null,packet=null;
const link=(href,text)=>`<a href="${esc(href)}">${esc(text)}</a>`;
const empty='<p class="note752">No evidence is loaded. Nothing has been accepted or repaired.</p>';

function selectBooking(){
  const id=$('booking752').value,row=evidence?.rows?.find(item=>item.booking_id===id);
  $('detail752').innerHTML=row?`<h3>${esc(row.package_code||'Unknown package')} · ${esc(row.vehicle_size||'Unknown size')}</h3>
    <p><strong>${esc(row.decision_gate.replaceAll('_',' '))}</strong> · ${esc(row.evidence_issue_count)} evidence issue(s)</p>
    <p>Starting at ${esc(cad(row.starting_guide_cents))} · managed source ${esc(cad(row.managed_guide_cents))} · recorded revenue ${esc(cad(row.recorded_revenue_cents))}</p>
    <p class="note752">The recorded invoice may include add-ons, discounts, tax or refunds. Differences alone are not a proven pricing mistake. Pre-travel contribution ${esc(cad(row.pre_travel_contribution_cents))} is not net profit.</p>`:empty;
  const issues=(evidence?.exceptions||[]).filter(issue=>issue.booking_id===id);
  $('repair752').innerHTML=issues.length?issues.map(issue=>`<article class="item752"><span class="tag752">${esc(issue.domain)}</span><strong>${esc(issue.reason)}</strong><p>Owner: ${esc(issue.source_owner)}</p><p>${esc(issue.repair_instruction)}</p>${link(issue.source_href,'Open source workflow')}</article>`).join(''):'<p class="note752">No automated source exceptions. An independent owner acceptance decision is still required.</p>';
  packet=null;$('packet752').textContent='No draft prepared.';$('download752').disabled=true;
}

function render(data){
  evidence=data;
  const s=data.summary;
  $('stats752').innerHTML=[['Bookings reviewed',s.booking_count],['Owner review candidates',s.owner_review_candidates],['Bookings requiring source repair',s.source_repair_booking_count],['Pricing source exceptions',s.pricing_exception_count]].map(([label,n])=>`<article class="stat752"><strong>${esc(n)}</strong><span>${esc(label)}</span></article>`).join('');
  $('source752').textContent=`Managed catalog: ${data.managed_catalog_status} · Evidence snapshot SHA-256: ${data.snapshot_sha256||'unavailable'} · Owner approvals recorded: 0`;
  $('booking752').innerHTML='<option value="">Choose a booking</option>'+data.rows.map(row=>`<option value="${esc(row.booking_id)}">${esc(row.booking_id.slice(0,8))} · ${esc(row.package_code)} / ${esc(row.vehicle_size||'unknown')} · ${esc(row.decision_gate.replaceAll('_',' '))}</option>`).join('');
  $('exceptions752').innerHTML=data.exceptions.length?`<table><thead><tr><th>Booking</th><th>Type</th><th>Exception</th><th>Source owner</th></tr></thead><tbody>${data.exceptions.map(issue=>`<tr><td><code>${esc(issue.booking_id.slice(0,8))}</code></td><td>${esc(issue.domain)}</td><td>${esc(issue.reason)}</td><td>${link(issue.source_href,issue.source_owner)}</td></tr>`).join('')}</tbody></table>`:'<p class="note752">No source exceptions in this snapshot. Owner acceptance has not been recorded.</p>';
  selectBooking();
}
async function refresh(){
  const month=Number($('month752').value),year=Number($('year752').value);
  if(!Number.isInteger(month)||month<1||month>12||!Number.isInteger(year)||year<2020||year>2100){$('status752').textContent='Select a valid month and year.';return;}
  $('refresh752').disabled=true;$('status752').textContent='Reading protected accounting, inventory, shift, booking and managed catalog evidence.';
  try{
    const res=await fetch(`/api/admin/economic_acceptance_v752?month=${month}&year=${year}`,{credentials:'include',cache:'no-store',headers:{Accept:'application/json'}});
    const data=await res.json().catch(()=>null);
    if(!res.ok||!data?.ok)throw Error(data?.error||'Evidence request failed.');
    render(data);$('status752').textContent=`${data.evidence_status.replaceAll('_',' ')} · Refreshed ${new Date().toLocaleString('en-CA')} · No decisions or source records changed.`;
  }catch(err){evidence=null;packet=null;$('stats752').innerHTML=empty;$('exceptions752').innerHTML=empty;$('booking752').innerHTML='<option value="">No evidence</option>';
    $('detail752').innerHTML=empty;$('repair752').innerHTML=empty;$('source752').textContent='Source verification failed; no acceptance permitted.';$('status752').textContent=err.message||'Source unavailable.';$('download752').disabled=true;
  }finally{$('refresh752').disabled=false;}
}
function preparePacket(){
  const row=evidence?.rows?.find(item=>item.booking_id===$('booking752').value),reference=$('reference752').value.trim(),notes=$('note752').value.trim();
  if(!row){$('draftStatus752').textContent='Choose a booking first.';return;}
  if(reference.length<6||reference.length>120||notes.length<10||notes.length>500){$('draftStatus752').textContent='Enter a 6–120 character evidence reference and 10–500 character rationale. Do not enter private customer information.';return;}
  packet={schema:'rosie-owner-economic-review-draft-v752',status:'UNSIGNED_NOT_SUBMITTED',recorded_owner_approval:false,
    source_correction_applied:false,requires_independent_owner_and_source_verification:true,booking_id:row.booking_id,
    source_period:evidence.period,snapshot_sha256:evidence.snapshot_sha256,source_build:751,review_build:752,
    requested_disposition:$('decision752').value,source_gate:row.decision_gate,reviewer_supplied_evidence_reference:reference,
    reviewer_supplied_rationale:notes,exception_codes:evidence.exceptions.filter(x=>x.booking_id===row.booking_id).map(x=>x.code),
    generated_at:new Date().toISOString()};
  $('packet752').textContent=JSON.stringify(packet,null,2);$('download752').disabled=false;
  $('draftStatus752').textContent='Unsigned local draft prepared. No server approval, source repair or saved decision exists.';
}
function download(){
  if(!packet)return;
  const blob=new Blob([JSON.stringify(packet,null,2)+'\n'],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=`rosie-owner-review-draft-752-${packet.booking_id.slice(0,8)}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
document.addEventListener('DOMContentLoaded',()=>{
  window.AdminShell?.boot?.({pageKey:'admin-service-economics-commercial-capacity-review',onReady:async()=>{
    const now=new Date();$('month752').value=String(now.getMonth()+1);$('year752').value=String(now.getFullYear());
    $('refresh752').addEventListener('click',refresh);$('booking752').addEventListener('change',selectBooking);
    $('prepare752').addEventListener('click',preparePacket);$('download752').addEventListener('click',download);
    for(const id of ['reference752','note752','decision752'])$(id).addEventListener('input',()=>{packet=null;$('download752').disabled=true;$('draftStatus752').textContent='Draft changed; prepare a new unsigned packet.';});
  }});
},{once:true});
