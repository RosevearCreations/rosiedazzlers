(function(){
  const el=id=>document.getElementById(id),state={session:'',case:null,gifts:[],reviewers:[],actor:null};
  const rules={owner_exception_reopened:{sources:['internal_exception_note']},
    independent_aging_reassessed:{decisions:['still_unresolved','new_evidence_not_confirmed','evidence_conflicting'],
      sources:['recipient_direct_reply','verified_phone_conversation','recipient_reported_missing',
        'provider_dashboard_reference','internal_exception_note']},
    owner_hold_continuity_ack:{decisions:['manual_hold_acknowledged'],sources:['internal_exception_note']}};
  const api=(u,o)=>window.AdminAuth?.fetchWithAuth?window.AdminAuth.fetchWithAuth(u,o):fetch(u,{...o,credentials:'include'});
  const selected=()=>state.gifts.find(x=>x.id===el('review691Certificate').value);
  function status(message,ok=false){el('review691Result').textContent=message;
    el('review691Result').dataset.state=ok?'ok':'error';}
  function choices(id,items){const e=el(id),prior=e.value;e.replaceChildren();
    for(const [value,label] of items){const o=document.createElement('option');o.value=value;o.textContent=label;e.append(o);}
    if(items.some(x=>x[0]===prior))e.value=prior;}
  function draw(){const g=selected(),kind=el('review691Kind').value,ruleset=rules[kind];
    const reviewers=kind==='owner_exception_reopened'?
      state.reviewers.filter(r=>g&&!new Set([state.actor,g.original_operator_id,
        g.prior_reviewer_id,g.third_reviewer_id]).has(r.id)).map(r=>[r.id,`${r.full_name} · ${r.role_code}`]):
      g?.assigned_fourth_reviewer_id?[[g.assigned_fourth_reviewer_id,'Assigned fourth independent reviewer']]:[];
    choices('review691Reviewer',reviewers);
    choices('review691Decision',(kind==='owner_exception_reopened'?
      (g?.recurrence_decision==='recurrence_detected'?['reopen_recurrence_detected']:
        g?.recurrence_decision==='evidence_missing'?['reopen_missing_evidence']:[]):ruleset.decisions)
      .map(d=>[d,d.replaceAll('_',' ')]));
    choices('review691Source',ruleset.sources.map(s=>[s,s.replaceAll('_',' ')]));
    el('review691Reviewer').disabled=kind!=='owner_exception_reopened';
    el('review691Guide').textContent=g?`Line ${g.checkout_line_number} · ${g.recipient_email_masked}. `+
      `B690: ${g.recurrence_decision}; age ${g.audit_age_hours??'?'} h. Reopened: ${g.reopen_age_hours??'not yet'} h; `+
      `review: ${g.review_age_hours??'not yet'} h. ${g.aging_alert_due?'INTERNAL 24-HOUR ALERT. ':''}${g.warning}`:
      'Choose a B690 independently detected unresolved recurrence; no customer delivery is possible here.';
    const allowed=kind==='owner_exception_reopened'?g?.can_reopen:
      kind==='independent_aging_reassessed'?g?.can_reassess:g?.can_ack_hold;
    el('review691Record').disabled=!allowed||!el('review691Reviewer').value||
      !el('review691Decision').value||!el('review691Source').value||
      !/^[A-Z0-9_-]{6,64}$/.test(el('review691Reference').value)||!el('review691Observed').value||
      !el('review691Exact').checked||!el('review691Fourth').checked||!el('review691NoResend').checked;
  }
  async function refresh(){const session=el('review676Session')?.value.trim()||'';
    if(!/^cs_(?:test|live)_[A-Za-z0-9_-]{8,220}$/.test(session))return status('Enter exact checkout session above first.');
    el('review691Refresh').disabled=true;
    try{const r=await api('/api/admin/gift_delivery_reopened_exception?'+new URLSearchParams({session_id:session}),{cache:'no-store'});
      const d=await r.json().catch(()=>({}));if(!r.ok||!d.ok)throw Error(d.error||'Reopening evidence unavailable');
      state.session=session;state.case=d.case;state.gifts=d.gifts||[];
      state.reviewers=d.reviewers||[];state.actor=d.actor_id;
      const prior=el('review691Certificate').value;choices('review691Certificate',
        [['','Choose an unresolved recurrence'],...state.gifts.map(g=>[g.id,
          `Line ${g.checkout_line_number} · ${g.aging_alert_due?'AGING ALERT':'manual HOLD'}`])]);
      if(state.gifts.some(g=>g.id===prior))el('review691Certificate').value=prior;
      for(const id of ['review691Exact','review691Fourth','review691NoResend'])el(id).checked=false;
      const now=new Date();el('review691Observed').value=new Date(now.getTime()-now.getTimezoneOffset()*60000).toISOString().slice(0,16);
      draw();status(`${state.gifts.length} independently detected unresolved recurrence(s). No send, charge or reissue.`,true);
    }catch(e){state.gifts=[];state.case=null;draw();status(e.message+'. No customer action occurred.');}
    finally{el('review691Refresh').disabled=false;}}
  async function save(){const g=selected();if(!g||!state.case||el('review691Record').disabled)return;
    el('review691Record').disabled=true;
    try{const kind=el('review691Kind').value,body={session_id:state.session,case_id:state.case.id,
      certificate_id:g.id,attempt_id:g.attempt_id,recurrence_review_id:g.recurrence_review_id,
      event_id:crypto.randomUUID(),reviewer_id:el('review691Reviewer').value,event_kind:kind,
      decision_code:el('review691Decision').value,evidence_kind:el('review691Source').value,
      evidence_reference:el('review691Reference').value,
      observed_at:new Date(el('review691Observed').value).toISOString(),
      confirm_exact_recurrence:el('review691Exact').checked,
      confirm_fourth_independence:el('review691Fourth').checked,
      confirm_no_resend:el('review691NoResend').checked};
      const r=await api('/api/admin/gift_delivery_reopened_exception',{method:'POST',cache:'no-store',
        headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      const d=await r.json().catch(()=>({}));if(!r.ok||!d.ok)throw Error(d.error||'Immutable review denied');
      await refresh();status(`${kind.replaceAll('_',' ')} recorded. Exception stays on manual HOLD, no resend.`,true);
    }catch(e){status(`${e.message}. Refresh before recording another action; do not resend.`);}finally{draw();}}
  function init(){if(!el('review691Refresh'))return;el('review691Refresh').addEventListener('click',refresh);
    for(const id of ['review691Certificate','review691Kind','review691Reviewer','review691Decision',
      'review691Source','review691Reference','review691Observed','review691Exact','review691Fourth','review691NoResend'])
      el(id).addEventListener(['review691Reference','review691Observed'].includes(id)?'input':'change',draw);
    el('review691Record').addEventListener('click',save);
    const now=new Date();el('review691Observed').value=new Date(now.getTime()-now.getTimezoneOffset()*60000).toISOString().slice(0,16);draw();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
