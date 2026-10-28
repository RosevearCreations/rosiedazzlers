(function(){
  const el=id=>document.getElementById(id),state={case:null,session:'',gifts:[],reviewers:[],actor:null};
  const api=(url,options)=>window.AdminAuth?.fetchWithAuth?
    window.AdminAuth.fetchWithAuth(url,options):fetch(url,{...options,credentials:'include'});
  const rules={
    owner_fifth_recurrence_watch_opened:{decisions:['recurrence_watch_requested'],sources:['internal_exception_note']},
    independent_closure_risk_checked:{decisions:['discrepancy_still_open','new_discrepancy_detected','original_evidence_missing'],
      sources:['recipient_direct_reply','verified_phone_conversation','recipient_reported_missing',
        'provider_dashboard_reference','internal_exception_note']},
    owner_continued_hold_ack:{decisions:['continued_manual_hold'],sources:['internal_exception_note']}
  };
  function choice(id,items){const node=el(id),old=node.value;node.replaceChildren();
    for(const [value,label] of items){const o=document.createElement('option');o.value=value;o.textContent=label;node.append(o);}
    if(items.some(x=>x[0]===old))node.value=old;}
  const selected=()=>state.gifts.find(x=>x.id===el('review693Certificate').value);
  function status(message,ok=false){el('review693Result').textContent=message;
    el('review693Result').dataset.state=ok?'ok':'error';}
  function draw(){const g=selected(),kind=el('review693Kind').value,r=rules[kind];
    const reviewers=kind==='owner_fifth_recurrence_watch_opened'?state.reviewers.filter(x=>g&&
      !new Set([state.actor,g.original_operator_id,g.original_reviewer_id,g.third_reviewer_id,
        g.fourth_reviewer_id,g.fifth_reviewer_id]).has(x.id)).map(x=>[x.id,`${x.full_name} · ${x.role_code}`]):
      g?.assigned_sixth_witness_id?[[g.assigned_sixth_witness_id,'Assigned sixth witness']]:[];
    choice('review693Reviewer',reviewers);
    choice('review693Decision',r.decisions.map(x=>[x,x.replaceAll('_',' ')]));
    choice('review693Source',r.sources.map(x=>[x,x.replaceAll('_',' ')]));
    el('review693Reviewer').disabled=kind!=='owner_fifth_recurrence_watch_opened';
    el('review693Guide').textContent=g?`Line ${g.checkout_line_number} · ${g.recipient_email_masked}. `+
      `Fifth outcome: ${g.fifth_decision}; ${g.fifth_age_hours??'?'} hours old. `+
      `${g.internal_alert_due?'INTERNAL AGING ALERT. ':''}${g.warning}`:
      'Select an unresolved fifth-reviewer discrepancy with subsequent original owner HOLD.';
    const allowed=kind==='owner_fifth_recurrence_watch_opened'?g?.can_open:
      kind==='independent_closure_risk_checked'?g?.can_check:g?.can_ack_hold;
    el('review693Record').disabled=!allowed||!el('review693Reviewer').value||
      !/^[A-Z0-9_-]{6,64}$/.test(el('review693Reference').value)||!el('review693Observed').value||
      !el('review693FifthHold').checked||!el('review693SixthIndependent').checked||
      !el('review693NoResend').checked;}
  async function refresh(){const session=el('review676Session')?.value.trim()||'';
    if(!/^cs_(?:test|live)_[A-Za-z0-9_-]{8,220}$/.test(session))return status('Enter exact checkout session above.');
    el('review693Refresh').disabled=true;
    try{const r=await api('/api/admin/gift_fifth_recurrence_closure_watch?'+new URLSearchParams({session_id:session}),{cache:'no-store'});
      const d=await r.json().catch(()=>({}));if(!r.ok||!d.ok)throw Error(d.error||'Watch unavailable');
      state.session=session;state.case=d.case;state.gifts=d.gifts||[];
      state.reviewers=d.reviewers||[];state.actor=d.actor_id;
      const before=el('review693Certificate').value;
      choice('review693Certificate',[['','Choose held fifth-reviewer gift'],...state.gifts.map(g=>
        [g.id,`Line ${g.checkout_line_number} · ${g.internal_alert_due?'AGING ALERT':'manual HOLD'}`])]);
      if(state.gifts.some(g=>g.id===before))el('review693Certificate').value=before;
      for(const id of ['review693FifthHold','review693SixthIndependent','review693NoResend'])el(id).checked=false;
      draw();status(`${state.gifts.length} unresolved fifth-reviewer case(s). No recipient contact permitted.`,true);
    }catch(e){state.gifts=[];draw();status(e.message+' No customer action occurred.');}
    finally{el('review693Refresh').disabled=false;}}
  async function record(){const g=selected();if(!g||!state.case||el('review693Record').disabled)return;
    el('review693Record').disabled=true;
    try{const b={session_id:state.session,case_id:state.case.id,certificate_id:g.id,
      attempt_id:g.attempt_id,fifth_review_id:g.fifth_review_id,event_id:crypto.randomUUID(),
      reviewer_id:el('review693Reviewer').value,event_kind:el('review693Kind').value,
      decision_code:el('review693Decision').value,evidence_kind:el('review693Source').value,
      evidence_reference:el('review693Reference').value,
      observed_at:new Date(el('review693Observed').value).toISOString(),
      confirm_fifth_hold:el('review693FifthHold').checked,
      confirm_sixth_independence:el('review693SixthIndependent').checked,
      confirm_no_resend:el('review693NoResend').checked};
      const r=await api('/api/admin/gift_fifth_recurrence_closure_watch',{method:'POST',cache:'no-store',
        headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});
      const d=await r.json().catch(()=>({}));if(!r.ok||!d.ok)throw Error(d.error||'Evidence refused');
      await refresh();status('Immutable watch evidence recorded. Gift delivery is still unresolved; no resend.',true);
    }catch(e){status(e.message+' Refresh before attempting another event.');}finally{draw();}}
  function init(){if(!el('review693Refresh'))return;
    el('review693Refresh').addEventListener('click',refresh);el('review693Record').addEventListener('click',record);
    for(const id of ['review693Certificate','review693Kind','review693Reviewer','review693Decision',
      'review693Source','review693Reference','review693Observed','review693FifthHold',
      'review693SixthIndependent','review693NoResend'])el(id).addEventListener(
        ['review693Reference','review693Observed'].includes(id)?'input':'change',draw);
    const now=new Date();el('review693Observed').value=new Date(now.getTime()-now.getTimezoneOffset()*60000).toISOString().slice(0,16);draw();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
