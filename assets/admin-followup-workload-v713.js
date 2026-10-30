(() => {
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const labels={overdue_without_owner:'Overdue without a current staff owner',
    overdue_consent_recheck:'Overdue; current consent recheck missing',
    escalation_owner_review_pending:'Escalation needs management ownership review',
    stale_escalation_audit:'Previous escalation audit is stale'};
  const readable=v=>{const d=new Date(v);return v&&!Number.isNaN(d.getTime())?
    d.toLocaleString('en-CA',{dateStyle:'medium',timeStyle:'short'}):'Unknown';};
  let queue=null,selected=null,selectedQuoteId='';
  async function api(url,options={}){
    const response=await fetch(url,{credentials:'include',cache:'no-store',...options});
    const data=await response.json().catch(()=>({}));
    if(!response.ok||data.ok!==true)throw Error(data.error||`Request failed (${response.status})`);
    return data;
  }
  function source(message,error=false){
    $('workloadSource713').textContent=message;
    $('workloadSource713').dataset.state=error?'error':'ready';
  }
  function detailStatus(message,error=false){
    $('workloadDetailStatus713').textContent=message;
    $('workloadDetailStatus713').dataset.state=error?'error':'ready';
  }
  function setDetailControls(){
    const code=$('workloadExceptionCode713').value;
    const allowed=selected?.manager_review_allowed===true&&
      selected.live_exceptions?.includes(code)&&!selected.reviewed_codes?.includes(code)&&
      !selected.event_history_may_be_truncated;
    const note=$('workloadReviewNote713').value.trim();
    $('workloadReviewNote713').disabled=!selected?.manager_review_allowed;
    $('workloadExceptionCode713').disabled=!selected?.manager_review_allowed||!selected.live_exceptions?.length;
    $('workloadReviewSave713').disabled=!allowed||note.length<12||note.length>300;
    $('workloadDetailRefresh713').disabled=!selectedQuoteId;
  }
  function renderStaff(){
    const groups=queue?.staff||[];
    $('staffWorkloadRows713').innerHTML=groups.length?groups.map(g=>
      `<tr><td>${esc(g.staff_name)}</td><td>${g.assigned}</td><td>${g.overdue}</td><td>${g.critical}</td><td>${g.exceptions}</td></tr>`).join(''):
      '<tr><td colspan="5">No active saved-quote follow-up assignments found in this source sample.</td></tr>';
    const maximum=Math.max(1,...groups.map(g=>g.assigned));
    $('workloadBars713').innerHTML=groups.map(g=>
      `<div class="rd-workload-bar-row"><span>${esc(g.staff_name)}</span><div class="rd-workload-bar-track"><div class="rd-workload-bar-fill" style="width:${Math.round(g.assigned/maximum*100)}%"></div></div><strong>${g.assigned}</strong></div>`).join('');
  }
  function renderCases(){
    const filter=$('workloadFilter713').value;
    const items=(queue?.exceptions||[]).filter(e=>filter==='all'||
      (filter==='critical'&&e.bucket==='critical')||
      (filter==='overdue'&&e.bucket==='overdue'));
    $('workloadExceptions713').innerHTML=items.length?items.slice(0,40).map(item=>
      `<button class="rd-workload-case" type="button" data-quote-id="${esc(item.quote_id)}" aria-pressed="${selectedQuoteId===item.quote_id}">
      <strong>${esc(item.quote_number)} · ${esc(item.bucket.replaceAll('_',' '))}</strong>
      <small>${esc(item.staff_name)} · ${item.age_days} day(s) in queue</small>
      <small>${esc(item.flags.map(code=>labels[code]||code).join(' · '))}</small></button>`).join(''):
      '<p class="muted">No flags match this filter in the current limited queue. This is not proof that consent or audit clearance is current.</p>';
  }
  async function refreshQueue(){
    $('workloadRefresh713').disabled=true;
    source('Loading saved quotes and staff event history; current permission is not inferred…');
    try{
      queue=await api('/api/admin/quote_followup_workload');
      const counts=queue.summary||{};
      const values=[counts.total,counts.overdue,counts.critical,counts.triage_exceptions];
      $('workloadKpis713').querySelectorAll('strong').forEach((el,index)=>{el.textContent=String(values[index]??0);});
      source(`Snapshot: ${counts.staffed||0} assignments matching saved quote markers of ${counts.total||0} open quotes · `+
        `${counts.unassigned||0} recorded unassigned · limited to ${queue.quote_limit} quotes / ${queue.event_limit} events. `+
        `Queue-only triage; live consent and manager review NOT verified. `+
        (queue.historical_records_may_be_truncated?'WARNING: source limit reached; incomplete totals possible.':'No source limit reached.'));
      renderStaff();renderCases();
    }catch(error){
      queue=null;
      $('workloadKpis713').querySelectorAll('strong').forEach(el=>{el.textContent='—';});
      $('staffWorkloadRows713').innerHTML='<tr><td colspan="5">Source unavailable; no staff workload verified.</td></tr>';
      $('workloadBars713').textContent='';$('workloadExceptions713').textContent='Could not verify exceptions.';
      source(error.message||'Queue source unavailable. No work may be considered complete.',true);
    }finally{$('workloadRefresh713').disabled=false;}
  }
  async function inspectQuote(quoteId){
    selected=null;selectedQuoteId=quoteId;
    $('workloadReviewNote713').value='';
    $('workloadExceptionCode713').replaceChildren(new Option('Checking current source…',''));
    $('workloadReviewHistory713').textContent='Live review being checked…';
    detailStatus('Verifying selected saved quote, booking, profile and audit markers…');
    $('workloadQuoteLink713').href=`/admin-quotes.html?quote_id=${encodeURIComponent(quoteId)}`;
    setDetailControls();renderCases();
    try{
      const data=await api(`/api/admin/quote_followup_workload?quote_id=${encodeURIComponent(quoteId)}`);
      if(selectedQuoteId!==quoteId)return;
      selected=data;
      const choices=data.live_exceptions||[];
      $('workloadExceptionCode713').replaceChildren(new Option(choices.length?'Select live exception':'No current live exception',''));
      for(const code of choices){
        const reviewed=data.reviewed_codes?.includes(code);
        $('workloadExceptionCode713').add(new Option(`${labels[code]||code}${reviewed?' · reviewed':''}`,code));
      }
      detailStatus(`${data.quote_number} · ${data.overdue?`Overdue ${data.overdue_days} day(s)`:'Not overdue'} · `+
        `${data.assigned_staff_name||'No current staff owner'} · `+
        `${choices.length} verified live exception(s), ${data.reviewed_codes?.length||0} assessed. `+
        `Current consent ${data.consent_allowed?'permits a prepared channel':'does not permit contact'}. `+
        (data.audit_closed?'Internal audit closed. ':'Internal audit not closed. ')+
        (data.event_history_may_be_truncated?'Event history limited; review writing blocked. ':'')+
        (data.manager_review_allowed?'Manager controls available.':'Manager role required to record assessments.'));
      $('workloadReviewHistory713').textContent=data.history?.length?
        data.history.map(e=>`${readable(e.created_at)} · ${e.actor_name||'Staff'} · ${labels[e.exception_code]||e.exception_code} · ${e.note||'No note'}`).join('\n'):
        'No management exception assessments recorded.';
      setDetailControls();
    }catch(error){
      if(selectedQuoteId!==quoteId)return;
      detailStatus(error.message||'Live review unavailable. Actions blocked.',true);
      $('workloadReviewHistory713').textContent='No validated source readback.';
      setDetailControls();
    }
  }
  async function recordReview(){
    if(!selected||selectedQuoteId!==selected.quote_id)return;
    const code=$('workloadExceptionCode713').value,note=$('workloadReviewNote713').value.trim();
    if(!selected.manager_review_allowed||!selected.live_exceptions.includes(code)||
      selected.reviewed_codes?.includes(code)||note.length<12||note.length>300)return;
    if(!window.confirm('Record an actual INTERNAL manager exception assessment? This does not close the task, contact a customer, or approve consent.'))return;
    const snapshot=selected,quoteId=selectedQuoteId;
    selected=null;setDetailControls();
    detailStatus('Recording manager assessment against current markers…');
    try{
      const result=await api('/api/admin/quote_followup_workload',{method:'POST',
        headers:{'Content-Type':'application/json'},body:JSON.stringify({quote_id:snapshot.quote_id,
          booking_id:snapshot.booking_id,action:'review_exception',exception_code:code,note,
          acknowledge_real_exception_review:true,expected_marker:snapshot.marker,
          expected_latest_outcome_event_id:snapshot.latest_outcome_event_id,
          expected_latest_resolution_event_id:snapshot.latest_resolution_event_id,
          expected_latest_assignment_event_id:snapshot.latest_assignment_event_id,
          expected_latest_consent_recheck_event_id:snapshot.latest_consent_recheck_event_id,
          expected_latest_escalation_event_id:snapshot.latest_escalation_event_id,
          expected_latest_exception_review_event_id:snapshot.latest_exception_review_event_id})});
      if(selectedQuoteId!==quoteId)return;
      $('workloadReviewNote713').value='';
      detailStatus(result.already_current?'This exact exception was already assessed.':'Manager assessment recorded; exception remains open until the underlying issue is resolved.');
    }catch(error){
      if(selectedQuoteId===quoteId)detailStatus(error.message||'Assessment not saved; refresh source.',true);
    }finally{if(selectedQuoteId===quoteId)await inspectQuote(quoteId);}
  }
  $('workloadRefresh713').addEventListener('click',refreshQueue);
  $('workloadFilter713').addEventListener('change',renderCases);
  $('workloadExceptions713').addEventListener('click',event=>{
    const button=event.target.closest('button[data-quote-id]');
    if(button)void inspectQuote(button.dataset.quoteId);
  });
  $('workloadExceptionCode713').addEventListener('change',setDetailControls);
  $('workloadReviewNote713').addEventListener('input',setDetailControls);
  $('workloadReviewSave713').addEventListener('click',()=>void recordReview());
  $('workloadDetailRefresh713').addEventListener('click',()=>selectedQuoteId&&void inspectQuote(selectedQuoteId));
  window.AdminShell.boot({pageKey:'admin-followup-workload',onReady:refreshQueue});
})();
