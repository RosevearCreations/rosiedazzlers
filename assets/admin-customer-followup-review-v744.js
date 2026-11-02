// Staff-only Build 744 queue. Display only sanitized API fields; no dispatch actions.
const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');

export async function loadStaffCustomerFollowup744() {
  if(typeof document==='undefined'||!$('#build744StaffQueue'))return;
  const status=$('#build744StaffStatus');status.textContent='Loading the customer-initiated interest queue…';
  try {
    const response=await fetch('/api/admin/customer_followup_review_v744',{credentials:'include',cache:'no-store'});
    const data=await response.json().catch(()=>null);
    if(!response.ok||!data?.ok)throw new Error(data?.error||'Follow-up queue unavailable.');
    const items=Array.isArray(data.interests)?data.interests:[];
    $('#build744StaffQueue').innerHTML=items.length?items.map(item=>{
      const channels=item.currently_allowed_channels?.length?item.currently_allowed_channels.join(', '):'none';
      const fresh=item.consent_fresh?'Fresh preference version':'Missing or stale preference';
      return `<article class="build744-record"><span class="badge">${esc(item.interest_kind)} · ${esc(item.review_status)}</span>
        <h3>${esc(item.customer_label)} · ${esc(String(item.submitted_at||'').slice(0,10))}</h3>
        <p>Source booking: <code>${esc(item.source_booking_id)}</code> · Timing interest: ${esc(item.cycle_hint)}</p>
        <p><strong>Current marketing readiness:</strong> ${esc(fresh)}; channels: ${esc(channels)}${item.consent_changed_since_submission?' · consent version changed since request':''}.</p>
        <p class="build744-muted">${esc(item.next_action)} Interest contributes $0 to confirmed revenue.</p></article>`;
    }).join(''):'<p class="muted">No customer-initiated follow-up interest has been recorded yet.</p>';
    status.textContent=`${items.length} recorded interest(s) in this bounded view. Confirmed revenue from interest: $0. No contact, booking or subscription was initiated.`;
  }catch(error){status.className='notice bad';status.textContent=error?.message||'Staff queue unavailable; no customer contact initiated.';}
}
