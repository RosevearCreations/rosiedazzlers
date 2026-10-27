(function(){
  const el=id=>document.getElementById(id);
  const state={cases:[],auditors:[],role:null};
  const REASON={watch_opened:'post_closeout_watch',evidence_renewed:'fresh_paid_evidence',
    independent_audit_recorded:'independent_verified',owner_audit_acknowledged:'owner_no_dispatch_confirmed'};
  const fetcher=(path,options)=>window.AdminAuth?.fetchWithAuth
    ?window.AdminAuth.fetchWithAuth(path,options)
    :fetch(path,{...options,credentials:'include'});
  function notice(lines,ok=false){
    const ul=document.createElement('ul');
    for(const line of lines){const li=document.createElement('li');li.textContent=line;ul.append(li);}
    el('review679Result').replaceChildren(ul);
    el('review679Result').dataset.state=ok?'ok':'error';
  }
  function options(target,values,placeholder){
    const current=target.value;target.replaceChildren();
    const empty=document.createElement('option');empty.value='';empty.textContent=placeholder;target.append(empty);
    for(const entry of values){const option=document.createElement('option');option.value=entry.value;option.textContent=entry.label;target.append(option);}
    if(values.some(x=>x.value===current))target.value=current;
  }
  function chosen(){return state.cases.find(c=>c.id===el('review679Case').value);}
  function stage(){
    const c=chosen(),role=state.role;
    const actions=role==='owner'?
      [{value:'watch_opened',label:'Open watch and assign a separate auditor'},
        {value:'evidence_renewed',label:'Renew live Stripe / certificate evidence'},
        {value:'owner_audit_acknowledged',label:'Acknowledge independent audit (NO send)'}]:
      [{value:'independent_audit_recorded',label:'Sign independent customer-safe audit'}];
    options(el('review679Action'),actions,'Select an audit action');
    const action=el('review679Action').value,last=c?.latest_audit;
    el('review679AuditorRow').hidden=action!=='watch_opened';
    options(el('review679Auditor'),state.auditors.filter(s=>s.id!==c?.assigned_reviewer_id)
      .map(s=>({value:s.id,label:`${s.full_name} · ${s.role_code}`})),
      'Select a separate active auditor');
    const current=!!c?.latest_closeout&&c.audit_status!=='HOLD';
    const possible=current&&(
      action==='watch_opened'&&!last&&state.auditors.some(s=>s.id!==c.assigned_reviewer_id)||
      action==='evidence_renewed'&&last&&(['watch_opened','evidence_renewed'].includes(last.event_kind)
        ||['independent_audit_recorded','owner_audit_acknowledged'].includes(last.event_kind)
          &&Date.now()-Date.parse(last.provider_checked_at)>2*3600000)||
      action==='independent_audit_recorded'&&last?.event_kind==='evidence_renewed'
        &&Date.now()-Date.parse(last.provider_checked_at)<2*3600000||
      action==='owner_audit_acknowledged'&&last?.event_kind==='independent_audit_recorded'
        &&Date.now()-Date.parse(last.provider_checked_at)<2*3600000);
    el('review679Record').disabled=!possible;
    el('review679Guide').textContent=c?.safe_next_action||
      'Choose an owner-closed recheck. Auditor views show only their assigned watches.';
  }
  async function refresh(){
    const button=el('review679Refresh');button.disabled=true;
    notice(['Checking post-closeout recurrence and evidence age without contacting any customer…']);
    try{
      const session=el('review676Session')?.value.trim()||'';
      const url='/api/admin/gift_closeout_audit'+(session?'?'+new URLSearchParams({session_id:session}):'');
      const response=await fetcher(url,{cache:'no-store'});
      const data=await response.json().catch(()=>({}));
      if(!response.ok||!data.ok)throw Error(data.error||'Cannot inspect audit evidence');
      state.cases=data.cases||[];state.auditors=data.auditors||[];state.role=data.actor_role;
      options(el('review679Case'),state.cases.map(c=>({value:c.id,
        label:`${c.stripe_session_id} · ${c.audit_status}`})), 'Select a monitored gift case');
      stage();
      notice([`${state.cases.length} scoped cases, ${data.audit_events||0} audit records.`,
        ...state.cases.map(c=>`${c.stripe_session_id} · ${c.audit_status} · ${c.safe_next_action}`),
        data.safe_boundary],true);
    }catch(e){notice([e.message,'No audit or customer action was taken. Keep hold.']);}
    finally{button.disabled=false;}
  }
  async function record(){
    const button=el('review679Record');button.disabled=true;
    try{
      const c=chosen(),action=el('review679Action').value;
      if(!c?.latest_closeout||c.audit_status==='HOLD')throw Error('A current, unchallenged closeout is required.');
      if(!el('review679Ack').checked)throw Error('Confirm there will be no customer action.');
      const auditorId=action==='watch_opened'?el('review679Auditor').value:c.watch?.auditor_staff_user_id;
      if(!auditorId)throw Error('No different independent auditor is assigned. Keep the hold.');
      const response=await fetcher('/api/admin/gift_closeout_audit',{
        method:'POST',cache:'no-store',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({event_id:crypto.randomUUID(),case_id:c.id,
          closeout_event_id:c.latest_closeout.id,auditor_id:auditorId,
          action,reason_code:REASON[action],reference_event_id:action==='watch_opened'?null:c.latest_audit?.id,
          acknowledge_no_customer_action:true})
      });
      const data=await response.json().catch(()=>({}));
      if(!response.ok||!data.ok)throw Error(data.error||'Audit held by source checks');
      el('review679Ack').checked=false;
      await refresh();
      notice([`Recorded ${data.result?.event_kind||action}.`,data.next_step,
        'No payment, gift balance, certificate, email, SMS or delivery action.'],true);
    }catch(e){notice([e.message,'Reload current evidence before retrying. Nothing was sent.']);}
    finally{stage();}
  }
  function init(){
    el('review679Refresh')?.addEventListener('click',refresh);
    el('review679Case')?.addEventListener('change',stage);
    el('review679Action')?.addEventListener('change',stage);
    el('review679Record')?.addEventListener('click',record);
    stage();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
