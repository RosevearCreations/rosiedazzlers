(function(){
  const el=id=>document.getElementById(id);
  const state={cases:[],role:null};
  const fetcher=(url,options)=>window.AdminAuth?.fetchWithAuth?
    window.AdminAuth.fetchWithAuth(url,options):fetch(url,{...options,credentials:'include'});
  function notice(lines,success=false){
    const ul=document.createElement('ul');
    for(const line of lines){const li=document.createElement('li');li.textContent=line;ul.append(li);}
    el('review681Result').replaceChildren(ul);
    el('review681Result').dataset.state=success?'ok':'error';
  }
  function options(target,values,prompt){
    const saved=target.value;target.replaceChildren();
    const empty=document.createElement('option');empty.value='';empty.textContent=prompt;target.append(empty);
    for(const [value,label] of values){const option=document.createElement('option');
      option.value=value;option.textContent=label;target.append(option);}
    if(values.some(([value])=>value===saved))target.value=saved;
  }
  function selected(){return state.cases.find(c=>c.id===el('review681Case').value);}
  function stage(){
    const c=selected(),last=c?.latest_continuity,monitor=c?.monitor;
    options(el('review681Action'),state.role==='owner'?
      [['hold_escalated','Open an internal HOLD escalation'],
       ['owner_continuity_closed','Record owner continuity closure (HOLD stays)']]:
      state.role==='independent_auditor'?
        [['independent_recheck_attested','Sign a separate independent evidence recheck']]:[],
      'Choose a role-authorized action');
    const action=el('review681Action').value;
    const supported=!!c?.reconciliation&&!!c?.source&&monitor?.phase!=='source_hold';
    const possible=supported&&(
      action==='hold_escalated'&&state.role==='owner'&&
        (!last||last.event_kind==='owner_continuity_closed')||
      action==='independent_recheck_attested'&&state.role==='independent_auditor'&&
        last?.event_kind==='hold_escalated'&&
        !['case_reopened','recurrence_reopened'].includes(monitor?.reason)||
      action==='owner_continuity_closed'&&state.role==='owner'&&
        last?.event_kind==='independent_recheck_attested'&&
        Date.now()-Date.parse(last.provider_checked_at)<2*3600000&&
        !['case_reopened','recurrence_reopened'].includes(monitor?.reason));
    el('review681Record').disabled=!possible;
    el('review681Guide').textContent=c?
      `${monitor?.phase||'HOLD'} · ${monitor?.aging_band||'unverified'} · ${monitor?.age_minutes??0} min · ${monitor?.summary||'Keep HOLD.'}`:
      'Refresh to load current signed Build 680 reconciliation evidence.';
  }
  async function refresh(){
    const button=el('review681Refresh');button.disabled=true;
    notice(['Checking recurrence, independent recheck and owner continuity; no customer messages.']);
    try{
      const session=el('review676Session')?.value.trim()||'';
      const url='/api/admin/gift_hold_continuity'+(session?'?'+new URLSearchParams({session_id:session}):'');
      const response=await fetcher(url,{cache:'no-store'}),data=await response.json().catch(()=>({}));
      if(!response.ok||!data.ok)throw Error(data.error||'Gift HOLD evidence unavailable');
      state.cases=data.cases||[];state.role=data.actor_role;
      options(el('review681Case'),state.cases.map(c=>[c.id,
        `${c.stripe_session_id} · ${c.monitor?.phase||'HOLD'} · ${c.monitor?.aging_band||'unverified'}`]),
        'Select a signed-in authorized gift case');
      stage();
      notice([`${state.cases.length} cases; ${data.continuity_events||0} immutable continuity receipts.`,
        ...state.cases.map(c=>`${c.stripe_session_id}: ${c.monitor?.summary}`),data.safe_boundary],true);
    }catch(e){notice([e.message,'Keep HOLD. No customer action was taken.']);}
    finally{button.disabled=false;}
  }
  async function record(){
    const button=el('review681Record');button.disabled=true;
    try{
      const c=selected(),action=el('review681Action').value;
      if(!c||!action||!el('review681Ack').checked)
        throw Error('Choose an eligible action and acknowledge that customer HOLD persists.');
      if(!c.reconciliation?.auditor_staff_user_id)throw Error('A different real independent auditor is required.');
      const response=await fetcher('/api/admin/gift_hold_continuity',{
        method:'POST',cache:'no-store',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({event_id:crypto.randomUUID(),case_id:c.id,
          closeout_event_id:c.closeout.id,reconciliation_event_id:c.reconciliation.id,
          source_audit_event_id:c.source.id,auditor_id:c.reconciliation.auditor_staff_user_id,
          action,escalation_reason:c.latest_continuity?.event_kind==='hold_escalated'||
            c.latest_continuity?.event_kind==='independent_recheck_attested'?
              c.latest_continuity.escalation_reason:c.monitor.reason,
          reference_event_id:action==='hold_escalated'?null:c.latest_continuity?.id,
          acknowledge_customer_hold:true})});
      const data=await response.json().catch(()=>({}));
      if(!response.ok||!data.ok)throw Error(data.error||'HOLD closure rejected');
      el('review681Ack').checked=false;await refresh();
      notice([`Recorded ${data.result?.event_kind||action}.`,data.next_step,
        'Customer HOLD remains: zero gift, payment, email, SMS or delivery changes.'],true);
    }catch(e){notice([e.message,'No gift or customer message was sent.']);}
    finally{stage();}
  }
  function init(){
    el('review681Refresh')?.addEventListener('click',refresh);
    el('review681Case')?.addEventListener('change',stage);
    el('review681Action')?.addEventListener('change',stage);
    el('review681Record')?.addEventListener('click',record);
    stage();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
