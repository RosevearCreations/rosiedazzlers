import {staffBalance714} from './quote-followup-rebalance-v714.mjs';
(() => {
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const labels={overdue_without_owner:'Overdue without a current staff owner',
    overdue_consent_recheck:'Overdue; current consent recheck missing',
    escalation_owner_review_pending:'Escalation needs management ownership review',
    stale_escalation_audit:'Previous escalation audit is stale'};
  const proofLabels={current_staff_assignment:'Current staff assignment event',
    current_internal_consent_recheck:'Current internal consent recheck event',
    current_escalation_owner_review:'Current escalation owner-review event',
    current_escalation_audit:'Current escalation audit event'};
  const readable=v=>{const d=new Date(v);return v&&!Number.isNaN(d.getTime())?
    d.toLocaleString('en-CA',{dateStyle:'medium',timeStyle:'short'}):'Unknown';};
  let queue=null,roster=null,selected=null,selectedQuoteId='';
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
  function actionStatus714(id,message,error=false){
    $(id).textContent=message;$(id).dataset.state=error?'error':'ready';
  }
  function renderRoster714(){
    const select=$('rebalanceTarget714'),prior=select.value;
    select.replaceChildren(new Option('Select an active booking staff member',''));
    const members=staffBalance714(roster?.eligible_staff||[],queue?.staff||[]);
    for(const staff of members){
      select.add(new Option(`${staff.staff_name} · ${staff.assigned_sample} in current queue sample`,staff.staff_user_id));
    }
    if(members.some(x=>x.staff_user_id===prior))select.value=prior;
    actionStatus714('rebalanceRosterStatus714',roster?
      `${members.length} active booking-authorized staff member(s). Counts are from a limited quote sample, not verified availability or individual capacity. `+
      (roster.roster_may_be_truncated?'WARNING: roster source limit reached.':''):
      'Active staff roster unavailable. No reassignment can be recorded.',!roster);
    setDetailControls();
  }
  function renderResolution714(){
    const select=$('resolutionCode714'),prior=select.value;
    select.replaceChildren(new Option('Select an evidence-ready former exception',''));
    const ready=selected?.resolution_readiness||[];
    for(const proof of ready)select.add(new Option(`${labels[proof.exception_code]||proof.exception_code} · `+
      `${proofLabels[proof.proof_kind]||proof.proof_kind}${proof.verified?' · already recorded':''}`,proof.exception_code));
    if(ready.some(x=>x.exception_code===prior))select.value=prior;
    $('resolutionHistory714').textContent=selected?.evidence_history?.length?
      selected.evidence_history.map(e=>`${readable(e.created_at)} · ${e.actor_name||'Manager'} · `+
        `${labels[e.exception_code]||e.exception_code} · ${proofLabels[e.proof_kind]||e.proof_kind} · ${e.note||''}`).join('\n'):
      'No manager-verified resolution evidence receipts for this quote.';
    actionStatus714('resolutionActionStatus714',
      ready.length?`${ready.length} former exception signal(s) have an actual newer source event. `+
        'Evidence receipts remain internal and do not close the audit.':
        'No formerly reviewed exception has a confirmed newer remedy in the live source.');
    setDetailControls();
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
    const mayWrite=selected?.manager_review_allowed===true&&
      !selected.event_history_may_be_truncated;
    const target=$('rebalanceTarget714').value,reason=$('rebalanceNote714').value.trim();
    $('rebalanceTarget714').disabled=!mayWrite||!selected?.can_rebalance||!roster;
    $('rebalanceNote714').disabled=!mayWrite||!selected?.can_rebalance||!roster;
    $('rebalanceSave714').disabled=!mayWrite||!selected?.can_rebalance||
      !roster?.eligible_staff?.some(x=>x.id===target)||
      (selected.assignment_current&&target===selected.assigned_staff_user_id)||
      reason.length<12||reason.length>300;
    const code714=$('resolutionCode714').value,evidenceNote=$('resolutionNote714').value.trim(),
      proof=selected?.resolution_readiness?.find(x=>x.exception_code===code714);
    $('resolutionCode714').disabled=!mayWrite||!selected?.resolution_readiness?.length;
    $('resolutionNote714').disabled=!mayWrite||!proof||proof.verified;
    $('resolutionSave714').disabled=!mayWrite||!proof||proof.verified||
      evidenceNote.length<12||evidenceNote.length>300;
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
  function renderAnyQuote714(){
    const select=$('workloadAnyQuote714'),prior=selectedQuoteId;
    select.replaceChildren(new Option('Select a saved quote for actual live review',''));
    for(const item of queue?.items||[]){
      select.add(new Option(`${item.quote_number} · ${item.bucket.replaceAll('_',' ')} · `+
        `${item.assigned_staff_name||'No recorded owner'}`,item.quote_id));
    }
    select.disabled=!queue?.items?.length;
    if(queue?.items?.some(x=>x.quote_id===prior))select.value=prior;
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
      renderStaff();renderCases();renderAnyQuote714();
      try{roster=await api('/api/admin/quote_followup_rebalance');}
      catch(error){roster=null;actionStatus714('rebalanceRosterStatus714',error.message,true);}
      renderRoster714();
    }catch(error){
      queue=null;roster=null;
      $('workloadKpis713').querySelectorAll('strong').forEach(el=>{el.textContent='—';});
      $('staffWorkloadRows713').innerHTML='<tr><td colspan="5">Source unavailable; no staff workload verified.</td></tr>';
      $('workloadBars713').textContent='';$('workloadExceptions713').textContent='Could not verify exceptions.';
      renderAnyQuote714();
      source(error.message||'Queue source unavailable. No work may be considered complete.',true);
      renderRoster714();
    }finally{$('workloadRefresh713').disabled=false;}
  }
  async function inspectQuote(quoteId){
    selected=null;selectedQuoteId=quoteId;
    $('workloadReviewNote713').value='';
    $('workloadExceptionCode713').replaceChildren(new Option('Checking current source…',''));
    $('workloadReviewHistory713').textContent='Live review being checked…';
    $('rebalanceNote714').value='';$('resolutionNote714').value='';
    actionStatus714('rebalanceActionStatus714','Checking active assignment and current staff source…');
    actionStatus714('resolutionActionStatus714','Checking real evidence after the original review…');
    $('resolutionHistory714').textContent='Verifying audit history…';
    detailStatus('Verifying selected saved quote, booking, profile and audit markers…');
    $('workloadQuoteLink713').href=`/admin-quotes.html?quote_id=${encodeURIComponent(quoteId)}`;
    setDetailControls();renderCases();
    $('workloadAnyQuote714').value=quoteId;
    try{
      const data=await api(`/api/admin/quote_followup_rebalance?quote_id=${encodeURIComponent(quoteId)}`);
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
      renderRoster714();renderResolution714();
      actionStatus714('rebalanceActionStatus714',data.can_rebalance?
        `Current owner: ${data.assignment_current?data.assigned_staff_name||'Staff member':'unassigned or stale'}. `+
          'A new assignment requires another internal consent recheck.':
        'This quote cannot be assigned; it may be closed or otherwise not actionable.');
      setDetailControls();
    }catch(error){
      if(selectedQuoteId!==quoteId)return;
      detailStatus(error.message||'Live review unavailable. Actions blocked.',true);
      $('workloadReviewHistory713').textContent='No validated source readback.';
      $('resolutionHistory714').textContent='No validated evidence readback.';
      actionStatus714('rebalanceActionStatus714','Cannot verify live assignment.',true);
      actionStatus714('resolutionActionStatus714','Cannot verify live exception evidence.',true);
      renderResolution714();
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
  function expected714(snapshot){
    return {quote_id:snapshot.quote_id,booking_id:snapshot.booking_id,
      expected_marker:snapshot.marker,
      expected_latest_outcome_event_id:snapshot.latest_outcome_event_id,
      expected_latest_resolution_event_id:snapshot.latest_resolution_event_id,
      expected_latest_assignment_event_id:snapshot.latest_assignment_event_id,
      expected_latest_consent_recheck_event_id:snapshot.latest_consent_recheck_event_id,
      expected_latest_escalation_event_id:snapshot.latest_escalation_event_id,
      expected_latest_exception_review_event_id:snapshot.latest_exception_review_event_id,
      expected_latest_resolution_evidence_event_id:snapshot.latest_resolution_evidence_event_id,
      acknowledge_manager_review:true};
  }
  async function managerAction714(action){
    if(!selected||selectedQuoteId!==selected.quote_id||!selected.manager_review_allowed||
      selected.event_history_may_be_truncated)return;
    const rebalance=action==='rebalance_owner',statusId=rebalance?
      'rebalanceActionStatus714':'resolutionActionStatus714',snapshot=selected,
      target=$('rebalanceTarget714').value,code=$('resolutionCode714').value,
      note=$(rebalance?'rebalanceNote714':'resolutionNote714').value.trim();
    if(note.length<12||note.length>300||
      (rebalance&&!roster?.eligible_staff?.some(s=>s.id===target))||
      (!rebalance&&!snapshot.resolution_readiness?.some(p=>p.exception_code===code&&!p.verified)))return;
    const message=rebalance?
      'Confirm a REAL internal reassignment to the selected active staff member? This invalidates the previous consent recheck and does not notify the customer.':
      'Confirm this actual newer internal remedy event as evidence? It does not close an escalation audit or authorize customer contact.';
    if(!window.confirm(message))return;
    const quoteId=selectedQuoteId;
    selected=null;setDetailControls();
    actionStatus714(statusId,'Rechecking live quote, consent, assignment and exception evidence before writing…');
    let outcome='';let errorState=false;
    try{
      const result=await api('/api/admin/quote_followup_rebalance',{method:'POST',
        headers:{'Content-Type':'application/json'},body:JSON.stringify({...expected714(snapshot),
          action,note,...(rebalance?{target_staff_user_id:target}:{exception_code:code})})});
      outcome=result.already_current?'The same verified action was already current; nothing new was appended.':
        rebalance?'Assignment saved. The new owner must record a fresh internal consent recheck. No customer message sent.':
          'Resolution evidence receipt saved. The related audit stays separate and is not automatically closed.';
    }catch(error){outcome=error.message||'Could not verify or save the event. Refresh first.';errorState=true;}
    if(selectedQuoteId===quoteId){
      await inspectQuote(quoteId);
      actionStatus714(statusId,outcome,errorState);
      if(!errorState&&rebalance)await refreshQueue();
    }
  }
  const ownerCheckIds=['acceptDesktop714','acceptMobile714','acceptRoles714',
    'acceptEvidence714','acceptNoSend714'];
  function updateOwnerReceipt714(){
    $('ownerReceipt714').disabled=!ownerCheckIds.every(id=>$(id).checked)||
      !$('ownerName714').value.trim()||!$('ownerNote714').value.trim();
  }
  function downloadOwnerReceipt714(event){
    event.preventDefault();updateOwnerReceipt714();
    if($('ownerReceipt714').disabled)return;
    const timestamp=new Date().toISOString(),receipt={
      app:'Rosie Dazzlers',build:714,receipt_kind:'owner_self_attested_local_visual_review',
      generated_at:timestamp,owner_name:$('ownerName714').value.trim(),
      device_findings_note:$('ownerNote714').value.trim(),
      checked:Object.fromEntries(ownerCheckIds.map(id=>[id,$(id).checked])),
      page:'admin-followup-workload.html',server_acceptance_recorded:false,
      production_deployment_independently_verified_by_this_receipt:false,
      audit_closed_by_this_receipt:false,customer_contacted:false};
    const url=URL.createObjectURL(new Blob([JSON.stringify(receipt,null,2)],
      {type:'application/json'}));
    const link=document.createElement('a');link.href=url;
    link.download=`rosie-build714-owner-acceptance-${timestamp.slice(0,10)}.json`;
    document.body.append(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    actionStatus714('ownerAcceptanceStatus714',
      'Self-attested checklist downloaded on this device. Keep it as actual owner evidence; the app has not recorded a server approval.');
  }
  $('workloadRefresh713').addEventListener('click',refreshQueue);
  $('workloadFilter713').addEventListener('change',renderCases);
  $('workloadExceptions713').addEventListener('click',event=>{
    const button=event.target.closest('button[data-quote-id]');
    if(button)void inspectQuote(button.dataset.quoteId);
  });
  $('workloadAnyQuote714').addEventListener('change',event=>{
    if(event.target.value)void inspectQuote(event.target.value);
  });
  $('workloadExceptionCode713').addEventListener('change',setDetailControls);
  $('workloadReviewNote713').addEventListener('input',setDetailControls);
  $('workloadReviewSave713').addEventListener('click',()=>void recordReview());
  $('rebalanceTarget714').addEventListener('change',setDetailControls);
  $('rebalanceNote714').addEventListener('input',setDetailControls);
  $('rebalanceSave714').addEventListener('click',()=>void managerAction714('rebalance_owner'));
  $('resolutionCode714').addEventListener('change',setDetailControls);
  $('resolutionNote714').addEventListener('input',setDetailControls);
  $('resolutionSave714').addEventListener('click',()=>void managerAction714('verify_exception_resolution'));
  for(const id of ownerCheckIds)$(id).addEventListener('change',updateOwnerReceipt714);
  $('ownerName714').addEventListener('input',updateOwnerReceipt714);
  $('ownerNote714').addEventListener('input',updateOwnerReceipt714);
  $('ownerAcceptanceForm714').addEventListener('submit',downloadOwnerReceipt714);
  $('workloadDetailRefresh713').addEventListener('click',()=>selectedQuoteId&&void inspectQuote(selectedQuoteId));
  window.AdminShell.boot({pageKey:'admin-followup-workload',onReady:refreshQueue});
})();
