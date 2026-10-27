(function(){
  const el=id=>document.getElementById(id);
  const REASONS={
    overdue_escalated:[['reviewer_overdue','Reviewer overdue']],
    handoff_receipt_confirmed:[['owner_receipt_acknowledged','Owner acknowledged safe internal handoff']],
    recurrence_opened:[['overdue_review','Reviewer escalation recurred'],['handoff_not_received','Handoff acknowledgement missing'],
      ['evidence_changed','Independent evidence changed'],['delivery_attention','Recipient/copy delivery attention'],
      ['recurring_exception','Other recurring hold']],
    recurrence_followup_recorded:[['hold_continues','Hold continues'],['recheck_requested','Request another independent recheck'],
      ['closed_no_dispatch','Close follow-up with NO delivery']]
  };
  const state={cases:[],events:[]};
  const fetcher=(path,options)=>window.AdminAuth?.fetchWithAuth
    ?window.AdminAuth.fetchWithAuth(path,options)
    :fetch(path,{...options,credentials:'include'});
  function msg(lines,success=false){
    const parent=el('review677Result'),items=document.createElement('ul');
    for(const line of lines){const li=document.createElement('li');li.textContent=line;items.append(li);}
    parent.replaceChildren(items);parent.dataset.state=success?'ok':'error';
  }
  function reasons(){
    const select=el('review677Reason');select.replaceChildren();
    for(const [value,title] of (REASONS[el('review677Action').value]||[])){
      const opt=document.createElement('option');opt.value=value;opt.textContent=title;select.append(opt);
    }
  }
  function selected(){return state.cases.find(c=>c.id===el('review677Case').value);}
  function latestReference(c,action){
    if(action==='overdue_escalated')return null;
    if(action==='handoff_receipt_confirmed')return c.last_review?.id||null;
    if(action==='recurrence_followup_recorded')return c.last_followup?.event_kind==='recurrence_opened'?c.last_followup.id:null;
    return c.last_followup?.id||c.last_review?.id||null;
  }
  async function refresh(){
    const button=el('review677Refresh');button.disabled=true;
    msg(['Checking current case versions, overdue assignments, handoff receipts and recurrence evidence…']);
    try{
      const search=el('review676Session')?.value.trim()||'';
      const url='/api/admin/gift_review_followup'+(search?'?'+new URLSearchParams({session_id:search}):'');
      const response=await fetcher(url,{method:'GET',cache:'no-store'});
      const data=await response.json().catch(()=>({}));
      if(!response.ok||!data.ok)throw Error(data.error||'Unable to read owner follow-ups.');
      state.cases=data.cases||[];state.events=data.events||[];
      const select=el('review677Case'),previous=select.value;
      select.replaceChildren();
      const initial=document.createElement('option');initial.value='';initial.textContent='Select a case';select.append(initial);
      for(const c of state.cases){
        const opt=document.createElement('option');opt.value=c.id;
        opt.textContent=`${c.stripe_session_id} · ${c.status} · version ${c.version}`;select.append(opt);
      }
      if(state.cases.some(c=>c.id===previous))select.value=previous;
      const lines=[`Found ${state.cases.length} independent cases and ${state.events.length} owner follow-up events.`];
      for(const c of state.cases){
        lines.push(`${c.stripe_session_id} · ${c.safe_next_action} · overdue ${c.overdue_hours} hour(s) · `+
          `receipt ${c.handoff_receipt_recorded?'recorded':'not recorded'} · recurrence ${c.recurrence_open?'OPEN':'not open'} · case ${c.id}`);
      }
      lines.push(data.safe_boundary);msg(lines,true);
    }catch(error){msg([error.message,'No case or customer data was modified. Maintain the hold.']);}
    finally{button.disabled=false;}
  }
  async function record(){
    const button=el('review677Record');button.disabled=true;
    try{
      const c=selected(),action=el('review677Action').value,reason=el('review677Reason').value;
      if(!c)throw Error('Choose a current case.');
      const ref=latestReference(c,action);
      if(action!=='overdue_escalated'&&!ref)throw Error('No current independent event exists for this action.');
      if((action==='handoff_receipt_confirmed'||reason==='closed_no_dispatch')&&!el('review677Ack').checked)
        throw Error('Explicit no-delivery acknowledgement is required.');
      const response=await fetcher('/api/admin/gift_review_followup',{
        method:'POST',cache:'no-store',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({event_id:crypto.randomUUID(),case_id:c.id,expected_version:c.version,
          action,reason_code:reason,reference_event_id:ref,
          acknowledge_no_dispatch:el('review677Ack').checked})
      });
      const data=await response.json().catch(()=>({}));
      if(!response.ok||!data.ok)throw Error(data.error||'Follow-up held by evidence rules.');
      el('review677Ack').checked=false;
      await refresh();
      msg([`Recorded ${data.result?.event_kind||action}.`,data.next_step,
        'Zero payments, credits, gift issuances, resends, SMS or emails.'],true);
    }catch(error){msg([error.message,'Reload evidence before retrying. Nothing was dispatched.']);}
    finally{button.disabled=false;}
  }
  function init(){
    el('review677Action')?.addEventListener('change',reasons);
    el('review677Refresh')?.addEventListener('click',refresh);
    el('review677Record')?.addEventListener('click',record);
    reasons();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
