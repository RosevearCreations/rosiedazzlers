(function(){
  const el=id=>document.getElementById(id);
  const state={cases:[],role:null};
  const fetcher=(path,options)=>window.AdminAuth?.fetchWithAuth?
    window.AdminAuth.fetchWithAuth(path,options):fetch(path,{...options,credentials:'include'});
  function notice(lines,success=false){
    const ul=document.createElement('ul');
    for(const line of lines){const li=document.createElement('li');li.textContent=line;ul.append(li);}
    el('review682Result').replaceChildren(ul);
    el('review682Result').dataset.state=success?'ok':'error';
  }
  function options(target,values,prompt){
    const previous=target.value;target.replaceChildren();
    const empty=document.createElement('option');empty.value='';empty.textContent=prompt;target.append(empty);
    for(const [value,label] of values){const option=document.createElement('option');
      option.value=value;option.textContent=label;target.append(option);}
    if(values.some(([value])=>value===previous))target.value=previous;
  }
  function chosen(){return state.cases.find(c=>c.id===el('review682Case').value);}
  function stage(){
    const c=chosen(),last=c?.latest_followup,monitor=c?.monitor;
    options(el('review682Action'),state.role==='owner'?
      [['exception_followup_opened','Open owner HOLD exception follow-up'],
       ['owner_followup_closed','Record owner follow-up closure (NO release)']]:
      state.role==='independent_auditor'?
        [['independent_outcome_rechecked','Record separate independent outcome recheck']]:[],
      'Choose an action for your role');
    const action=el('review682Action').value;
    const sourceCurrent=!!c?.source&&!!c?.closeout&&monitor?.phase!=='source_hold';
    const possible=sourceCurrent&&(
      action==='exception_followup_opened'&&state.role==='owner'&&
        (!last||last.event_kind==='owner_followup_closed')||
      action==='independent_outcome_rechecked'&&state.role==='independent_auditor'&&
        c.source.event_kind==='owner_continuity_closed'&&last?.event_kind==='exception_followup_opened'&&
        !['source_superseded','recurrence_reopened'].includes(monitor?.reason)||
      action==='owner_followup_closed'&&state.role==='owner'&&
        c.source.event_kind==='owner_continuity_closed'&&last?.event_kind==='independent_outcome_rechecked'&&
        Date.now()-Date.parse(last.provider_checked_at)<2*3600000&&
        !['source_superseded','recurrence_reopened'].includes(monitor?.reason));
    el('review682Record').disabled=!possible;
    el('review682Guide').textContent=c?
      `${monitor?.phase||'HOLD'} · ${monitor?.aging_band||'unverified'} · ${monitor?.age_minutes??0} min · ${monitor?.summary||'Keep HOLD.'}`:
      'Refresh to view current independent outcomes and follow-up aging.';
  }
  async function refresh(){
    const button=el('review682Refresh');button.disabled=true;
    notice(['Checking Build 681 closure recurrence and fresh independent proof. No customer contact.']);
    try{
      const session=el('review676Session')?.value.trim()||'';
      const url='/api/admin/gift_hold_followup'+(session?'?'+new URLSearchParams({session_id:session}):'');
      const res=await fetcher(url,{cache:'no-store'}),data=await res.json().catch(()=>({}));
      if(!res.ok||!data.ok)throw Error(data.error||'Gift follow-up evidence unavailable');
      state.cases=data.cases||[];state.role=data.actor_role;
      options(el('review682Case'),state.cases.map(c=>[c.id,
        `${c.stripe_session_id} · ${c.monitor?.phase||'HOLD'} · ${c.monitor?.aging_band||'unverified'}`]),
        'Select an authorized current gift case');
      stage();
      notice([`${state.cases.length} cases; ${data.followup_events||0} append-only follow-up receipts.`,
        ...state.cases.map(c=>`${c.stripe_session_id}: ${c.monitor?.summary}`),data.safe_boundary],true);
    }catch(e){notice([e.message,'Customer HOLD continues; no delivery occurred.']);}
    finally{button.disabled=false;}
  }
  async function record(){
    const button=el('review682Record');button.disabled=true;
    try{
      const c=chosen(),action=el('review682Action').value;
      if(!c?.source||!action||!el('review682Ack').checked)
        throw Error('Choose an allowed action and acknowledge continued customer HOLD.');
      if(!c.source.auditor_staff_user_id)throw Error('An actual separate signed-in auditor is required.');
      const res=await fetcher('/api/admin/gift_hold_followup',{
        method:'POST',cache:'no-store',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({event_id:crypto.randomUUID(),case_id:c.id,
          closeout_event_id:c.closeout.id,continuity_event_id:c.source.id,
          auditor_id:c.source.auditor_staff_user_id,action,
          reason:action==='exception_followup_opened'?c.monitor.reason:c.latest_followup?.reason,
          reference_event_id:action==='exception_followup_opened'?null:c.latest_followup?.id,
          acknowledge_customer_hold:true})});
      const data=await res.json().catch(()=>({}));
      if(!res.ok||!data.ok)throw Error(data.error||'Gift HOLD follow-up not accepted');
      el('review682Ack').checked=false;await refresh();
      notice([`Recorded ${data.result?.event_kind||action}.`,data.next_step,
        'HOLD retained: no customer messages, gifts, payments or deliveries.'],true);
    }catch(e){notice([e.message,'The customer HOLD remains unchanged.']);}
    finally{stage();}
  }
  function init(){
    el('review682Refresh')?.addEventListener('click',refresh);
    el('review682Case')?.addEventListener('change',stage);
    el('review682Action')?.addEventListener('change',stage);
    el('review682Record')?.addEventListener('click',record);
    stage();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
