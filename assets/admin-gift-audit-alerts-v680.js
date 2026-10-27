(function(){
  const el=id=>document.getElementById(id);
  const state={cases:[],role:null};
  const fetcher=(url,init)=>window.AdminAuth?.fetchWithAuth?
    window.AdminAuth.fetchWithAuth(url,init):fetch(url,{...init,credentials:'include'});
  const choices={owner:[
    ['alert_opened','Record new owner HOLD alert (internal only)'],
    ['renewal_requested','Request a new independent evidence review'],
    ['owner_hold_reconciled','Reconcile owner HOLD after separate signed audit']],
  independent_auditor:[['independent_renewal_attested','Attest independently renewed evidence']]};
  function say(lines,ok=false){
    const ul=document.createElement('ul');
    for(const line of lines){const li=document.createElement('li');li.textContent=line;ul.append(li);}
    el('review680Result').replaceChildren(ul);
    el('review680Result').dataset.state=ok?'ok':'error';
  }
  function options(target,values,placeholder){
    const prior=target.value;target.replaceChildren();
    const first=document.createElement('option');first.value='';first.textContent=placeholder;target.append(first);
    for(const [value,label] of values){const item=document.createElement('option');item.value=value;item.textContent=label;target.append(item);}
    if(values.some(([v])=>v===prior))target.value=prior;
  }
  function selected(){return state.cases.find(c=>c.id===el('review680Case').value);}
  function stage(){
    const c=selected(),last=c?.latest_alert,audit=c?.latest_audit;
    options(el('review680Action'),choices[state.role]||[], 'Choose an action for our signed-in role');
    const action=el('review680Action').value;
    const newerAudit=last&&audit&&Date.parse(audit.created_at)>Date.parse(last.created_at);
    const can=!!c?.closeout&&!!c?.watch?.auditor_staff_user_id&&(
      action==='alert_opened'&&state.role==='owner'&&c.monitor?.owner_hold&&!last||
      action==='renewal_requested'&&state.role==='owner'&&last?.event_kind==='alert_opened'&&
        last.source_audit_event_id===audit?.id||
      action==='independent_renewal_attested'&&state.role==='independent_auditor'&&
        last?.event_kind==='renewal_requested'&&audit?.event_kind==='independent_audit_recorded'&&newerAudit&&
        Date.now()-Date.parse(audit.provider_checked_at)<2*3600000||
      action==='owner_hold_reconciled'&&state.role==='owner'&&
        last?.event_kind==='independent_renewal_attested'&&
        audit?.event_kind==='owner_audit_acknowledged'&&newerAudit&&
        audit.reference_event_id===last.source_audit_event_id&&
        Date.now()-Date.parse(audit.provider_checked_at)<2*3600000);
    el('review680Record').disabled=!can;
    el('review680Guide').textContent=c?
      `${c.monitor?.priority?.toUpperCase()||'HOLD'} · ${c.monitor?.aging_band||'unverified'} · ${c.monitor?.age_minutes||0} minutes · ${c.monitor?.summary||'Keep HOLD.'}`:
      'Refresh, then choose a permitted current post-closeout audit case.';
  }
  async function refresh(){
    const b=el('review680Refresh');b.disabled=true;
    say(['Inspecting owner HOLD, recurrence and independent evidence age. No customer contact.']);
    try{
      const session=el('review676Session')?.value.trim()||'';
      const url='/api/admin/gift_audit_alerts'+(session?'?'+new URLSearchParams({session_id:session}):'');
      const res=await fetcher(url,{cache:'no-store'}),data=await res.json().catch(()=>({}));
      if(!res.ok||!data.ok)throw Error(data.error||'Evidence unavailable');
      state.cases=data.cases||[];state.role=data.actor_role;
      options(el('review680Case'),state.cases.map(c=>[c.id,
        `${c.stripe_session_id} · ${c.monitor?.priority||'HOLD'} · ${c.monitor?.aging_band||'unknown'}`]),
        'Select an authorized case');
      stage();say([`${state.cases.length} cases; ${data.alert_events||0} append-only alert receipts.`,
        ...state.cases.map(c=>`${c.stripe_session_id}: ${c.monitor?.summary}`),data.safe_boundary],true);
    }catch(e){say([e.message,'Keep owner HOLD; no reconciliation was made.']);}
    finally{b.disabled=false;}
  }
  async function record(){
    const b=el('review680Record');b.disabled=true;
    try{
      const c=selected(),action=el('review680Action').value;
      if(!c||!action||!el('review680Ack').checked)throw Error('Select a valid action and explicitly retain customer HOLD.');
      if(!c.watch?.auditor_staff_user_id)throw Error('A distinct real B679 auditor is required. Keep HOLD.');
      const res=await fetcher('/api/admin/gift_audit_alerts',{
        method:'POST',cache:'no-store',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({event_id:crypto.randomUUID(),case_id:c.id,
          closeout_event_id:c.closeout.id,auditor_id:c.watch.auditor_staff_user_id,
          action,reference_event_id:action==='alert_opened'?null:c.latest_alert?.id,
          source_audit_event_id:c.latest_audit?.id||null,
          alert_reason:c.latest_alert?.alert_reason||c.monitor?.reason,
          acknowledge_customer_hold:true})});
      const data=await res.json().catch(()=>({}));
      if(!res.ok||!data.ok)throw Error(data.error||'Source rejected the alert');
      el('review680Ack').checked=false;await refresh();
      say([`Recorded ${data.result?.event_kind||action}.`,data.next_step,
        'Owner HOLD persists. Zero messages, payment mutations or customer deliveries.'],true);
    }catch(e){say([e.message,'No alert email or customer action was sent.']);}
    finally{stage();}
  }
  function init(){
    el('review680Refresh')?.addEventListener('click',refresh);
    el('review680Case')?.addEventListener('change',stage);
    el('review680Action')?.addEventListener('change',stage);
    el('review680Record')?.addEventListener('click',record);
    stage();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
