(function(){
  const el=id=>document.getElementById(id);
  const state={cases:[],candidates:[],selected:null};
  const ACTIONS={
    recheck_assigned:'independent_recheck_requested',
    handoff_refreshed:'fresh_handoff_verified',
    owner_closeout_recorded:'closed_no_dispatch'
  };
  const fetcher=(path,options)=>window.AdminAuth?.fetchWithAuth
    ?window.AdminAuth.fetchWithAuth(path,options)
    :fetch(path,{...options,credentials:'include'});
  function say(lines,success=false){
    const list=document.createElement('ul');
    for(const line of lines){const li=document.createElement('li');li.textContent=line;list.append(li);}
    el('review678Result').replaceChildren(list);
    el('review678Result').dataset.state=success?'ok':'error';
  }
  function selected(){return state.cases.find(c=>c.id===el('review678Case').value);}
  function options(select,rows,placeholder){
    const previous=select.value;select.replaceChildren();
    const empty=document.createElement('option');empty.value='';empty.textContent=placeholder;select.append(empty);
    for(const row of rows){const item=document.createElement('option');item.value=row.value;item.textContent=row.label;select.append(item);}
    if(rows.some(row=>row.value===previous))select.value=previous;
  }
  function stage(){
    const c=selected();
    const action=el('review678Action').value;
    el('review678ReviewerRow').hidden=action!=='recheck_assigned';
    el('review678DueRow').hidden=action!=='recheck_assigned';
    const candidates=state.candidates.filter(s=>c&&s.id!==c.assigned_reviewer_id);
    options(el('review678Reviewer'),candidates.map(s=>({value:s.id,label:`${s.full_name} · ${s.role_code}`})),
      'Select a different active reviewer');
    const last=c?.latest_recheck;
    const valid=c?.current_recurrence&&(
      (action==='recheck_assigned'&&!last&&candidates.length>0)||
      (action==='handoff_refreshed'&&last?.event_kind==='recheck_assigned'&&c.fresh_review&&c.status==='ready_for_delivery_review')||
      (action==='owner_closeout_recorded'&&last?.event_kind==='handoff_refreshed'));
    el('review678Record').disabled=!valid;
    el('review678Guide').textContent=c
      ?action==='recheck_assigned'&&!last&&c.current_recurrence&&candidates.length===0
        ?'HOLD — no different active independent reviewer is available. An owner must activate a separate legitimate staff reviewer before assignment.'
        :c.safe_next_action
      :'Select a case with a current recheck request.';
  }
  async function refresh(){
    const button=el('review678Refresh');button.disabled=true;
    say(['Reconciling recurrence, reviewer reassignment, fresh paid issuance and internal closeout evidence…']);
    try{
      const session=el('review676Session')?.value.trim()||'';
      const url='/api/admin/gift_recheck_closeout'+(session?'?'+new URLSearchParams({session_id:session}):'');
      const response=await fetcher(url,{method:'GET',cache:'no-store'});
      const data=await response.json().catch(()=>({}));
      if(!response.ok||!data.ok)throw Error(data.error||'Could not inspect current recheck ledger');
      state.cases=data.cases||[];state.candidates=data.candidates||[];
      options(el('review678Case'),state.cases.map(c=>({value:c.id,label:
        `${c.stripe_session_id} · ${c.status} · version ${c.version}`})), 'Select owner recheck case');
      stage();
      say([`Found ${state.cases.length} cases and ${(data.rechecks||[]).length} recheck events.`,
        ...state.cases.map(c=>`${c.stripe_session_id} · ${c.safe_next_action}`),data.safe_boundary],true);
    }catch(error){say([error.message,'Nothing was sent or changed. Maintain owner hold.']);}
    finally{button.disabled=false;}
  }
  async function record(){
    const button=el('review678Record');button.disabled=true;
    try{
      const c=selected(),action=el('review678Action').value;
      if(!c?.current_recurrence)throw Error('No current independent recheck request. Refresh first.');
      if(action!=='recheck_assigned'&&!el('review678Ack').checked)
        throw Error('Confirm the no-dispatch boundary before owner handoff or closeout.');
      const reviewerId=action==='recheck_assigned'?el('review678Reviewer').value:c.assigned_reviewer_id;
      const reference=action==='handoff_refreshed'?c.fresh_review?.id:
        action==='owner_closeout_recorded'?c.latest_recheck?.id:null;
      if(!reviewerId||(action!=='recheck_assigned'&&!reference))
        throw Error('A current reviewer and exact predecessor evidence are required.');
      const date=action==='recheck_assigned'?el('review678Due').value:null;
      if(action==='recheck_assigned'&&!date)throw Error('Choose a new reviewer deadline.');
      const response=await fetcher('/api/admin/gift_recheck_closeout',{
        method:'POST',cache:'no-store',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({event_id:crypto.randomUUID(),case_id:c.id,
          recurrence_event_id:c.current_recurrence.id,expected_version:c.version,
          action,reason_code:ACTIONS[action],reviewer_id:reviewerId,reference_event_id:reference,
          due_at:date?new Date(date).toISOString():null,acknowledge_no_dispatch:el('review678Ack').checked})
      });
      const data=await response.json().catch(()=>({}));
      if(!response.ok||!data.ok)throw Error(data.error||'Recheck or closeout held');
      el('review678Ack').checked=false;
      await refresh();
      say([`Recorded ${data.result?.event_kind||action}.`,data.next_step,
        'No gift, Stripe, credit, refund, email, SMS or delivery mutation.'],true);
    }catch(error){say([error.message,'Reload current evidence before attempting another event.']);}
    finally{stage();}
  }
  function init(){
    el('review678Case')?.addEventListener('change',stage);
    el('review678Action')?.addEventListener('change',stage);
    el('review678Refresh')?.addEventListener('click',refresh);
    el('review678Record')?.addEventListener('click',record);
    const dt=new Date(Date.now()+48*3600000);
    el('review678Due').value=new Date(dt.getTime()-dt.getTimezoneOffset()*60000).toISOString().slice(0,16);
    stage();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
