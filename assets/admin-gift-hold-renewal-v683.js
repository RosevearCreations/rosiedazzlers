(function(){
  const el=id=>document.getElementById(id);
  const state={cases:[],role:null};
  const fetcher=(path,options)=>window.AdminAuth?.fetchWithAuth?
    window.AdminAuth.fetchWithAuth(path,options):fetch(path,{...options,credentials:'include'});
  function notice(lines,success=false){
    const list=document.createElement('ul');
    for(const line of lines){const li=document.createElement('li');li.textContent=line;list.append(li);}
    el('review683Result').replaceChildren(list);
    el('review683Result').dataset.state=success?'ok':'error';
  }
  function options(target,values,prompt){
    const previous=target.value;target.replaceChildren();
    const empty=document.createElement('option');empty.value='';empty.textContent=prompt;target.append(empty);
    for(const [value,label] of values){const option=document.createElement('option');
      option.value=value;option.textContent=label;target.append(option);}
    if(values.some(([value])=>value===previous))target.value=previous;
  }
  const chosen=()=>state.cases.find(c=>c.id===el('review683Case').value);
  function stage(){
    const c=chosen(),last=c?.latest_renewal,monitor=c?.monitor;
    options(el('review683Action'),state.role==='owner'?
      [['owner_renewal_requested','Request internal independent renewal (HOLD)'],
       ['owner_hold_continuity_acknowledged','Acknowledge separate HOLD reassessment (NO release)']]:
      state.role==='independent_auditor'?
        [['independent_recurrence_reassessed','Attest paid/receipt evidence and renewed recurrence HOLD']]:[],
      'Choose an action for your role');
    const action=el('review683Action').value;
    const possible=!!c?.base&&(
      action==='owner_renewal_requested'&&state.role==='owner'&&
        (!last||last.event_kind==='owner_hold_continuity_acknowledged')||
      action==='independent_recurrence_reassessed'&&state.role==='independent_auditor'&&
        last?.event_kind==='owner_renewal_requested'&&monitor?.source_current&&
        monitor?.reason!=='source_superseded'||
      action==='owner_hold_continuity_acknowledged'&&state.role==='owner'&&
        last?.event_kind==='independent_recurrence_reassessed'&&monitor?.source_current&&
        monitor?.reason!=='source_superseded'&&
        Date.now()-Date.parse(last.provider_checked_at)<2*3600000);
    el('review683Record').disabled=!possible;
    el('review683Guide').textContent=c?
      `${monitor?.phase||'HOLD'} · ${monitor?.aging_band||'unverified'} · ${monitor?.age_minutes??0} min · ${monitor?.summary||'Keep HOLD.'}`:
      'Refresh to find current linked Build 682 owner closeouts and recurrence evidence.';
  }
  async function refresh(){
    const button=el('review683Refresh');button.disabled=true;
    notice(['Checking source-linked follow-up renewal and recurrence. Customer HOLD remains.']);
    try{
      const session=el('review676Session')?.value.trim()||'';
      const url='/api/admin/gift_hold_renewal'+(session?'?'+new URLSearchParams({session_id:session}):'');
      const response=await fetcher(url,{cache:'no-store'});
      const data=await response.json().catch(()=>({}));
      if(!response.ok||!data.ok)throw Error(data.error||'HOLD renewal evidence unavailable');
      state.cases=data.cases||[];state.role=data.actor_role;
      options(el('review683Case'),state.cases.map(c=>[c.id,
        `${c.stripe_session_id} · ${c.monitor?.phase||'HOLD'} · ${c.monitor?.aging_band||'unverified'}`]),
        'Select an authorized Build 682 owner follow-up');
      stage();
      notice([`${state.cases.length} cases; ${data.renewal_events||0} immutable renewal receipts.`,
        ...state.cases.map(c=>`${c.stripe_session_id}: ${c.monitor?.summary}`),data.safe_boundary],true);
    }catch(e){notice([e.message,'No gift delivery or customer contact authorized.']);}
    finally{button.disabled=false;}
  }
  async function record(){
    const button=el('review683Record');button.disabled=true;
    try{
      const c=chosen(),action=el('review683Action').value;
      if(!c?.base||!action||!el('review683Ack').checked)
        throw Error('Choose an allowed source-linked action and acknowledge continued HOLD.');
      if(!c.base.auditor_staff_user_id)throw Error('An actual separate auditor is required.');
      const response=await fetcher('/api/admin/gift_hold_renewal',{
        method:'POST',cache:'no-store',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({event_id:crypto.randomUUID(),case_id:c.id,
          followup_event_id:c.base.id,auditor_id:c.base.auditor_staff_user_id,
          action,reason:action==='owner_renewal_requested'?c.monitor.reason:c.latest_renewal?.reason,
          reference_event_id:action==='owner_renewal_requested'?null:c.latest_renewal?.id,
          acknowledge_customer_hold:true})});
      const data=await response.json().catch(()=>({}));
      if(!response.ok||!data.ok)throw Error(data.error||'Renewal HOLD proof not accepted');
      el('review683Ack').checked=false;await refresh();
      notice([`Recorded ${data.result?.event_kind||action}.`,data.next_step,
        'Customer HOLD retained; no dispatch, payment, balance or integration event.'],true);
    }catch(e){notice([e.message,'The customer HOLD remains unchanged.']);}
    finally{stage();}
  }
  function init(){
    el('review683Refresh')?.addEventListener('click',refresh);
    el('review683Case')?.addEventListener('change',stage);
    el('review683Action')?.addEventListener('change',stage);
    el('review683Record')?.addEventListener('click',record);
    stage();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
