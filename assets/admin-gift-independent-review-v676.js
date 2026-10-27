(function () {
  const byId=(id)=>document.getElementById(id);
  const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const SESSION=/^cs_(?:test|live)_[a-zA-Z0-9_-]{8,220}$/;
  const state={cases:[],decisions:[],owner:false,actorId:null};
  const fetcher=(path,options)=>window.AdminAuth?.fetchWithAuth
    ?window.AdminAuth.fetchWithAuth(path,options)
    :fetch(path,{...options,credentials:'include'});
  function renderMessage(lines,ok=false) {
    const el=byId('review676Result');
    const list=document.createElement('ul');
    for(const line of lines){const li=document.createElement('li');li.textContent=line;list.append(li);}
    el.replaceChildren(list);el.dataset.state=ok?'ok':'error';
  }
  async function get(params) {
    const res=await fetcher('/api/admin/gift_independent_recovery_review?'+new URLSearchParams(params),{method:'GET',cache:'no-store'});
    const data=await res.json().catch(()=>({}));
    if(!res.ok||!data.ok)throw Error(data.error||'Review registry unavailable');
    return data;
  }
  async function post(data) {
    const res=await fetcher('/api/admin/gift_independent_recovery_review',{
      method:'POST',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)
    });
    const result=await res.json().catch(()=>({}));
    if(!res.ok||!result.ok)throw Error(result.error||'Review was held by the evidence gate');
    return result;
  }
  function options(select,items,label) {
    select.replaceChildren();
    const empty=document.createElement('option');empty.value='';empty.textContent=label;select.append(empty);
    for(const row of items){
      const opt=document.createElement('option');opt.value=row.value;opt.textContent=row.label;select.append(opt);
    }
  }
  async function load() {
    const button=byId('review676Refresh');
    button.disabled=true;renderMessage(['Reading current assignment, evidence aging and delivery handoff state…']);
    try{
      const sessionId=byId('review676Session').value.trim();
      if(sessionId&&!SESSION.test(sessionId))throw Error('Enter a valid Checkout session ID, or leave it blank for assigned cases.');
      const cases=await get({mode:'cases',...(sessionId?{session_id:sessionId}:{})});
      state.cases=cases.cases||[];state.owner=cases.owner===true;state.actorId=cases.actor_id||null;
      const caseOptions=state.cases.map(c=>({value:c.id,label:`${c.status} · ${c.stripe_session_id} · due ${c.due_at}`}));
      options(byId('review676Case'),caseOptions,'Select a case for independent review');
      byId('review676OwnerControls').hidden=!state.owner;
      if(state.owner){
        const [candidates,decisions]=await Promise.all([
          get({mode:'candidates'}),
          sessionId?get({mode:'decisions',session_id:sessionId}):Promise.resolve({decisions:[]})
        ]);
        state.decisions=decisions.decisions||[];
        options(byId('review676Decision'),state.decisions.map(d=>({
          value:d.id,label:`${d.action} · ${d.provider_check} · ${d.checked_at} · ${d.id}`
        })),'Select a Build 675 decision');
        options(byId('review676Reviewer'),(candidates.candidates||[]).map(s=>({
          value:s.id,label:`${s.full_name} · ${s.role_code}`
        })),'Select an independent active staff reviewer');
      }
      const lines=[`Review cases: ${state.cases.length}. ${state.owner?'Owner assignment enabled.':'Showing only cases assigned to this signed-in reviewer.'}`];
      for(const c of state.cases)lines.push(
        `${c.stripe_session_id} · ${c.status} · version ${c.version} · due ${c.due_at} · ${c.overdue?'OVERDUE by '+c.overdue_hours+' hour(s)':'not overdue'} · decision evidence ${c.decision_evidence_age_hours??'unknown'} hour(s) old · ${c.evidence_stale?'refresh required':'within 24-hour window'} · case ${c.id}`
      );
      lines.push(cases.safe_boundary);
      renderMessage(lines,true);
    }catch(error){renderMessage([error.message,'No assignment or outcome changed. Keep uncertain evidence on hold.']);}
    finally{button.disabled=false;}
  }
  async function assign() {
    const button=byId('review676Assign');button.disabled=true;
    try{
      const decisionId=byId('review676Decision').value,reviewerId=byId('review676Reviewer').value;
      const date=byId('review676Due').value;
      if(!UUID.test(decisionId)||!UUID.test(reviewerId)||!date)throw Error('Choose an owner decision, independent reviewer and due date.');
      const existing=state.cases.find(c=>c.decision_id===decisionId);
      const result=await post({action:'assign',case_id:existing?.id||crypto.randomUUID(),event_id:crypto.randomUUID(),
        decision_id:decisionId,reviewer_id:reviewerId,due_at:new Date(date).toISOString()});
      renderMessage([`Recorded ${result.result?.kind||'assignment'} for independent review.`,result.next_step],true);
      await load();
    }catch(error){renderMessage([error.message,'No case reassignment or handoff was confirmed.']);}
    finally{button.disabled=false;}
  }
  async function review() {
    const button=byId('review676Save');button.disabled=true;
    try{
      const caseId=byId('review676Case').value;
      const current=state.cases.find(c=>c.id===caseId);
      if(!current)throw Error('Choose your currently assigned case.');
      const outcome=byId('review676Outcome').value,reason=byId('review676Reason').value;
      const acknowledged=byId('review676Ack').checked;
      if(outcome==='handoff_review_ready'&&(!acknowledged||reason!=='independent_verified'))
        throw Error('Ready handoff needs independent verified evidence and no-dispatch acknowledgment.');
      const result=await post({action:'review',case_id:caseId,event_id:crypto.randomUUID(),
        expected_version:current.version,outcome,reason_code:reason,acknowledge_no_dispatch:acknowledged});
      renderMessage([`Independent review ${result.result?.outcome||outcome} recorded.`,result.next_step,
        'No gift issuance, balance update, payment, refund, notification or delivery occurred.'],true);
      byId('review676Ack').checked=false;
      await load();
    }catch(error){renderMessage([error.message,'Review remains held. Reload before any additional decision.']);}
    finally{button.disabled=false;}
  }
  function init(){
    byId('review676Refresh')?.addEventListener('click',load);
    byId('review676Assign')?.addEventListener('click',assign);
    byId('review676Save')?.addEventListener('click',review);
    // Assignment date default is 48 hours ahead; still explicitly editable.
    const dt=new Date(Date.now()+48*3600000);
    byId('review676Due').value=new Date(dt.getTime()-dt.getTimezoneOffset()*60000).toISOString().slice(0,16);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
