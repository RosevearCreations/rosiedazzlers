// Staff-only Build 744 queue. Display only sanitized API fields; no dispatch actions.
import {followupTriage807,filterFollowup807} from '/assets/customer-service-experience-v807.mjs?v=20261108build807';
const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const uuid=v=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v||''));
let queue807=null;

function filters807(){return {search:$('#build807StaffSearch')?.value||'',kind:$('#build807StaffKind')?.value||'all',
  review:$('#build807StaffReview')?.value||'all',triage:$('#build807StaffTriage')?.value||'all'};}

function renderQueue807(){
  if(!queue807)return;
  const rows=filterFollowup807(queue807.entries,filters807());
  const {total,pending,consentReview,staffReview}=queue807.summary;
  $('#build807StaffCounts').innerHTML=[['Recorded interests',total],['Pending review',pending],
    ['Consent to recheck',consentReview],['Current preference only',staffReview]]
    .map(([label,value])=>`<span><strong>${value}</strong>${esc(label)}</span>`).join('');
  $('#build807StaffVisible').textContent=`Showing ${rows.length} of ${total} customer-initiated interests. Filtering is local; no follow-up is sent or recorded.`;
  $('#build744StaffQueue').innerHTML=rows.length?rows.map(item=>{
    const bookingLink=uuid(item.source_booking_id)?`<a class="btn secondary" href="/admin-booking.html?booking_id=${encodeURIComponent(item.source_booking_id)}">Open original booking</a>`:
      '<span class="muted">Original booking ID not verified</span>';
    const days=Number.isInteger(item.daysOld)?`${item.daysOld} day(s) since request`:'Request age unknown';
    return `<article class="build744-record build807-staff-card" data-consent-review="${item.needsConsentReview}">
      <div><span class="badge">${esc(item.interest_kind)} · ${esc(item.review_status)}</span> <span class="build807-flag">${esc(item.consentLabel)}</span></div>
      <h3>${esc(item.customer_label)} · ${esc(String(item.submitted_at||'').slice(0,10))}</h3>
      <p>Source booking: <code>${esc(item.source_booking_id)}</code> · Timing interest: ${esc(item.cycle_hint)} · ${esc(days)}</p>
      <p><strong>Current marketing preference:</strong> ${esc(item.consentLabel)}. Potential channels: ${esc(item.channels.join(', ')||'none')}. This is never permission to send.</p>
      <p class="build744-muted">${esc(item.next_action)} No contact, reservation, subscription or confirmed revenue is inferred.</p>
      <div class="build744-actions">${bookingLink}<a class="btn secondary" href="/admin-customers.html">Customer administration</a></div>
    </article>`;
  }).join(''):'<p class="build807-empty">No interests match these filters. Clear filters to return to the full authorized review queue.</p>';
}

export async function loadStaffCustomerFollowup744() {
  if(typeof document==='undefined'||!$('#build744StaffQueue'))return;
  const status=$('#build744StaffStatus');status.className='notice';status.textContent='Loading the customer-initiated interest queue…';
  try {
    const response=await fetch('/api/admin/customer_followup_review_v744',{credentials:'include',cache:'no-store'});
    const data=await response.json().catch(()=>null);
    if(!response.ok||!data?.ok)throw new Error(data?.error||'Follow-up queue unavailable.');
    if(!data.read_only||!data.no_dispatch||!Array.isArray(data.interests))throw Error('Read-only staff follow-up authority is unavailable.');
    queue807=followupTriage807(data.interests);
    renderQueue807();
    status.className='notice ok';
    status.textContent=`${queue807.summary.total} recorded interest(s) in this bounded view. Confirmed revenue from interest: $0. No contact, booking or subscription was initiated.`;
  }catch(error){queue807=null;$('#build744StaffQueue').innerHTML='<p class="notice bad">Staff follow-up source unavailable. No interest state or consent clearance is inferred.</p>';
    $('#build807StaffCounts').textContent='Authorized queue unavailable';$('#build807StaffVisible').textContent='No verified follow-up data.';
    status.className='notice bad';status.textContent=error?.message||'Staff queue unavailable; no customer contact initiated.';}
}

if(typeof document!=='undefined'){
  for(const id of ['build807StaffSearch','build807StaffKind','build807StaffReview','build807StaffTriage'])
    $(`#${id}`)?.addEventListener(id==='build807StaffSearch'?'input':'change',renderQueue807);
  $('#build807StaffClear')?.addEventListener('click',()=>{
    for(const id of ['build807StaffSearch','build807StaffKind','build807StaffReview','build807StaffTriage'])
      $(`#${id}`).value=id==='build807StaffSearch'?'':'all';
    renderQueue807();
  });
}
