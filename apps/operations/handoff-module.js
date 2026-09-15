// Build 401 — responsive field-to-office handoff and bounded commercial evidence.
// Manual/event-driven only. No polling and no mutations.
const esc=(v)=>String(v??'').replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=(m)=>m&&m.available&&Number.isFinite(Number(m.cents))?new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD'}).format(Number(m.cents)/100):'Unavailable';
export async function mount({host,api}){
  let visible=true;
  host.innerHTML=`<section class="panel stack" data-build401-handoff>
    <div class="module-head"><div><span class="badge">Build 401 · authoritative handoff</span><h2>Field → office handoff</h2><p class="mini">One read-only view of booking state, field evidence, customer decisions and commercial evidence. Missing evidence stays missing; notes never create payment, approval, accounting or inventory truth.</p></div><button class="btn ghost" id="handoffRefresh" type="button">Refresh handoff</button></div>
    <div class="notice">Manual snapshot only. No polling, automatic outreach, payment mutation, customer scoring or inferred busy time is created.</div>
    <div id="handoffBody"><div class="notice">Loading one bounded handoff snapshot…</div></div>
  </section>`;
  const body=()=>host.querySelector('#handoffBody');
  const refresh=host.querySelector('#handoffRefresh');
  async function load(){
    if(!visible)return;
    refresh.disabled=true;
    body().innerHTML='<div class="notice">Refreshing authoritative handoff evidence…</div>';
    try{
      const out=await api.requestJson('/api/admin/job_handoff_evidence',{method:'POST',body:JSON.stringify({days:90}),timeoutMs:30000});
      render(out);
    }catch(error){body().innerHTML=`<div class="notice bad">${esc(error.message||'Handoff evidence is unavailable.')} No automatic retry was started.</div>`;}
    finally{refresh.disabled=false;}
  }
  function render(out){
    const rows=Array.isArray(out?.rows)?out.rows:[];
    const summary=out?.summary||{};
    const commercial=out?.commercial||{};
    const stats=`<div class="operations-stats">
      <div><span class="mini">Jobs observed</span><strong>${Number(summary.jobs_observed||0)}</strong></div>
      <div><span class="mini">Evidence ready</span><strong>${Number(summary.evidence_ready||0)}</strong></div>
      <div><span class="mini">Office review</span><strong>${Number(summary.office_review_required||0)}</strong></div>
    </div>`;
    const commercialHtml=`<div class="runtime-strip">
      <div class="runtime-card"><span class="mini">Observed ticket value</span><strong>${commercial.ticket_value?.available?money({available:true,cents:commercial.ticket_value.total_cents}):'Unavailable'}</strong><span class="mini">${Number(commercial.ticket_value?.observed_jobs||0)} authoritative jobs</span></div>
      <div class="runtime-card"><span class="mini">Observed margin</span><strong>${commercial.margin?.available?money({available:true,cents:commercial.margin.total_cents}):'Unavailable'}</strong><span class="mini">No estimates when job-cost evidence is absent</span></div>
    </div>`;
    const list=rows.length?`<div class="operations-list">${rows.map((row)=>renderRow(row)).join('')}</div>`:'<div class="notice ok">No eligible jobs were returned for this bounded window. This no-result state is preserved.</div>';
    body().innerHTML=`${stats}${commercialHtml}<div class="notice ${commercial.add_on_attachment?.available?'ok':''}"><strong>Add-on attachment:</strong> ${commercial.add_on_attachment?.available?esc(String(commercial.add_on_attachment.rate)):'Unavailable from a separate authoritative ledger; Detailer notes are not converted into sales.'}</div>${list}`;
  }
  function renderRow(row){
    const b=row.booking||{},h=row.handoff||{},c=row.commercial||{};
    const evidence=[['Before',h.before_photo],['Checklist',h.checklist],['Add-on record',h.approved_addon_record],['Products',h.product_usage],['Completion',h.completion_evidence],['After',h.after_photo]].map(([label,ok])=>`<span class="badge">${esc(label)}: ${ok?'DONE':'OPEN'}</span>`).join('');
    const review=h.pending_review_count>0?`<span class="badge">${Number(h.pending_review_count)} review</span>`:'';
    const customer=h.customer_action_required_count>0?`<span class="badge">${Number(h.customer_action_required_count)} customer action</span>`:'';
    return `<article class="operations-row"><div class="stack" style="width:100%"><div><h3>${esc(b.customer_name||'Customer')} · ${esc(b.service_date||'Unscheduled')}</h3><p class="mini">${esc(b.package_code||'Package unavailable')} · ${esc(b.vehicle_size||'Vehicle size unavailable')} · ${esc(b.job_status||b.status||'State unavailable')}</p></div><div class="badges">${evidence}${review}${customer}</div><div class="runtime-strip"><div class="runtime-card"><span class="mini">Next office action</span><strong>${esc(h.next_action||'Review')}</strong></div><div class="runtime-card"><span class="mini">Ticket / remaining balance</span><strong>${money(c.ticket_value)} / ${money(c.remaining_balance)}</strong></div></div><div class="job-actions"><a class="btn ghost small" href="/admin-live.html?booking_id=${encodeURIComponent(b.id||'')}">Open live job</a><a class="btn ghost small" href="/final-balance-payment.html?booking_id=${encodeURIComponent(b.id||'')}">Customer balance page</a></div></div></article>`;
  }
  refresh.addEventListener('click',()=>load());
  await load();
  return{suspend(){visible=false;},setVisibility(v){visible=v!==false;}};
}
