(function(){
  const el=id=>document.getElementById(id);
  const state={session:'',case:null,gifts:[],reviewers:[],owner:false,actor:null};
  const rules={
    owner_followup_assignment:{decisions:['review_assigned'],sources:['internal_exception_note']},
    independent_recipient_recheck:{
      decisions:['recipient_evidence_supported','recipient_not_confirmed','conflicting_evidence'],
      sources:['recipient_direct_reply','verified_phone_conversation','provider_dashboard_reference','internal_exception_note','recipient_reported_missing']},
    owner_no_resend_closeout:{decisions:[],sources:['internal_exception_note']}};
  const api=(url,opt)=>window.AdminAuth?.fetchWithAuth?
    window.AdminAuth.fetchWithAuth(url,opt):fetch(url,{...opt,credentials:'include'});
  function status(message,ok=false){el('review689Result').textContent=message;
    el('review689Result').dataset.state=ok?'ok':'error';}
  function selected(){return state.gifts.find(g=>g.id===el('review689Certificate').value);}
  function choices(id,items){const input=el(id),prev=input.value;input.replaceChildren();
    for(const [value,label] of items){const option=document.createElement('option');option.value=value;
      option.textContent=label;input.append(option);}if(items.some(x=>x[0]===prev))input.value=prev;}
  function draw(){const g=selected(),kind=el('review689Kind').value,rule=rules[kind];
    const allowed=kind==='owner_followup_assignment'?g?.can_assign:
      kind==='independent_recipient_recheck'?g?.can_review:g?.can_close;
    const r=kind==='owner_followup_assignment'?state.reviewers.filter(x=>g&&x.id!==g.original_operator_id)
      .map(x=>[x.id,`${x.full_name} · ${x.role_code}`]):
      g?.assigned_reviewer_id?[[g.assigned_reviewer_id,'Assigned independent reviewer']]:[];
    choices('review689Reviewer',r);
    const decisions=kind==='owner_no_resend_closeout'?(g?.suggested_decisions||[]):rule.decisions;
    choices('review689Decision',decisions.map(x=>[x,x.replaceAll('_',' ')]));
    choices('review689Source',rule.sources.map(x=>[x,x.replaceAll('_',' ')]));
    el('review689Reviewer').disabled=kind!=='owner_followup_assignment';
    el('review689Guide').textContent=g?
      `Line ${g.checkout_line_number} · ${g.recipient_email_masked}. Provider ${g.provider_outcome}. `+
      `Triage age: ${g.triage_age_hours??'not recorded'} h; assigned review age: ${g.assignment_age_hours??'not assigned'} h; `+
      `independent evidence age: ${g.review_age_hours??'not reviewed'} h. ${g.warning}`:
      'Choose a dispatched certificate from the exact checkout session. Review actions cannot trigger customer delivery.';
    el('review689Record').disabled=!allowed||!el('review689Reviewer').value||
      !el('review689Decision').value||!el('review689Source').value||
      !/^[A-Z0-9_-]{6,64}$/.test(el('review689Reference').value)||!el('review689Observed').value||
      !el('review689Exact').checked||!el('review689Genuine').checked||!el('review689NoResend').checked;
  }
  async function refresh(){const session=el('review676Session')?.value.trim()||'';
    if(!/^cs_(?:test|live)_[A-Za-z0-9_-]{8,220}$/.test(session)){
      status('Enter the exact checkout session ID above first.');return;}
    el('review689Refresh').disabled=true;
    try{const response=await api('/api/admin/gift_delivery_followup?'+
      new URLSearchParams({session_id:session}),{cache:'no-store'});
      const data=await response.json().catch(()=>({}));if(!response.ok||!data.ok)
        throw Error(data.error||'Independent follow-up unavailable');
      state.session=session;state.case=data.case;state.gifts=data.gifts||[];
      state.reviewers=data.reviewers||[];state.owner=!!data.is_owner;state.actor=data.actor_id;
      const prev=el('review689Certificate').value;
      choices('review689Certificate',[['','Choose exact certificate'],...state.gifts.map(g=>
        [g.id,`Line ${g.checkout_line_number} · ${g.overdue_followup?'overdue follow-up':g.provider_outcome}`])]);
      if(state.gifts.some(g=>g.id===prev))el('review689Certificate').value=prev;
      for(const id of ['review689Exact','review689Genuine','review689NoResend'])el(id).checked=false;
      draw();status(`${state.gifts.length} authorized follow-up certificates. ${data.safe_boundary}`,true);
    }catch(err){state.case=null;state.gifts=[];draw();status(`${err.message}. No customer action occurred.`);}
    finally{el('review689Refresh').disabled=false;}
  }
  async function save(){const g=selected();if(!g||!state.case||el('review689Record').disabled)return;
    el('review689Record').disabled=true;
    const eventKind=el('review689Kind').value;
    try{const body={session_id:state.session,case_id:state.case.id,certificate_id:g.id,
      attempt_id:g.attempt_id,review_id:crypto.randomUUID(),event_kind:eventKind,
      reviewer_id:el('review689Reviewer').value,decision_code:el('review689Decision').value,
      evidence_kind:el('review689Source').value,evidence_reference:el('review689Reference').value,
      observed_at:new Date(el('review689Observed').value).toISOString(),
      confirm_exact_attempt:el('review689Exact').checked,
      confirm_genuine_evidence:el('review689Genuine').checked,
      confirm_permanent_no_resend:el('review689NoResend').checked};
      const response=await api('/api/admin/gift_delivery_followup',{
        method:'POST',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      const data=await response.json().catch(()=>({}));if(!response.ok||!data.ok)
        throw Error(data.error||'Independent evidence check refused');
      await refresh();status(`${eventKind.replaceAll('_',' ')} recorded. No resend, charge or balance mutation.`,true);
    }catch(err){status(`${err.message}. Refresh before any other owner/reviewer action; never resend.`);}
    finally{draw();}
  }
  function init(){el('review689Refresh')?.addEventListener('click',refresh);
    for(const id of ['review689Certificate','review689Kind','review689Reviewer','review689Decision',
      'review689Source','review689Reference','review689Observed','review689Exact','review689Genuine','review689NoResend'])
      el(id)?.addEventListener(['review689Reference','review689Observed'].includes(id)?'input':'change',draw);
    el('review689Record')?.addEventListener('click',save);
    const now=new Date();el('review689Observed').value=
      new Date(now.getTime()-now.getTimezoneOffset()*60000).toISOString().slice(0,16);
    draw();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
