(function(){
  const el=id=>document.getElementById(id),state={gifts:[],reviewers:[],owner:false,actor:null,case:null,session:''};
  const rules={owner_watch_opened:{decisions:['watch_requested'],sources:['internal_exception_note']},
    independent_recurrence_audited:{decisions:['no_recurrence_observed','recurrence_detected','evidence_missing'],
      sources:['recipient_direct_reply','verified_phone_conversation','provider_dashboard_reference','recipient_reported_missing','internal_exception_note']},
    owner_no_resend_alert_ack:{decisions:['acknowledged_no_resend'],sources:['internal_exception_note']}};
  const api=(u,o)=>window.AdminAuth?.fetchWithAuth?window.AdminAuth.fetchWithAuth(u,o):fetch(u,{...o,credentials:'include'});
  function choices(id,items){const e=el(id),prev=e.value;e.replaceChildren();for(const [value,label] of items){
    const o=document.createElement('option');o.value=value;o.textContent=label;e.append(o);}
    if(items.some(x=>x[0]===prev))e.value=prev;}
  function selected(){return state.gifts.find(x=>x.id===el('review690Certificate').value);}
  function status(t,ok=false){el('review690Result').textContent=t;el('review690Result').dataset.state=ok?'ok':'error';}
  function draw(){const g=selected(),kind=el('review690Kind').value,rule=rules[kind];
    const reviewers=kind==='owner_watch_opened'?
      state.reviewers.filter(x=>g&&!new Set([state.actor,g.original_operator_id,g.prior_reviewer_id]).has(x.id))
        .map(x=>[x.id,`${x.full_name} · ${x.role_code}`]):
      g?.reviewer_staff_user_id?[[g.reviewer_staff_user_id,'Assigned third independent reviewer']]:[];
    choices('review690Reviewer',reviewers);
    choices('review690Decision',rule.decisions.map(x=>[x,x.replaceAll('_',' ')]));
    choices('review690Source',rule.sources.map(x=>[x,x.replaceAll('_',' ')]));
    el('review690Reviewer').disabled=kind!=='owner_watch_opened';
    el('review690Guide').textContent=g?
      `Line ${g.checkout_line_number} · ${g.recipient_email_masked}. Closure ${g.closure_decision}; closed ${g.closure_age_hours??'?'} h ago; `+
      `watch ${g.watch_age_hours??'not opened'} h; audit ${g.audit_age_hours??'not audited'} h. `+
      `${g.no_resend_alert_due?'INTERNAL NO-RESEND AGING ALERT. ':''}${g.guidance}`:
      'Choose a closed gift from the exact checkout session. An audit never contacts the recipient.';
    const allowed=kind==='owner_watch_opened'?g?.can_open_watch:
      kind==='independent_recurrence_audited'?g?.can_independent_audit:g?.can_acknowledge_alert;
    el('review690Record').disabled=!allowed||!el('review690Reviewer').value||!el('review690Decision').value||
      !el('review690Source').value||!/^[A-Z0-9_-]{6,64}$/.test(el('review690Reference').value)||
      !el('review690Observed').value||!el('review690Exact').checked||
      !el('review690Independent').checked||!el('review690NoResend').checked;
  }
  async function refresh(){const session=el('review676Session')?.value.trim()||'';
    if(!/^cs_(?:test|live)_[A-Za-z0-9_-]{8,220}$/.test(session))return status('Enter exact checkout session above first.');
    el('review690Refresh').disabled=true;
    try{const r=await api('/api/admin/gift_delivery_closure_recurrence?'+new URLSearchParams({session_id:session}),{cache:'no-store'});
      const data=await r.json().catch(()=>({}));if(!r.ok||!data.ok)throw Error(data.error||'Review unavailable');
      state.session=session;state.case=data.case;state.gifts=data.gifts||[];
      state.reviewers=data.reviewers||[];state.owner=!!data.is_owner;state.actor=data.actor_id;
      const prev=el('review690Certificate').value;choices('review690Certificate',
        [['','Choose closed certificate'],...state.gifts.map(x=>[x.id,`Line ${x.checkout_line_number} · ${x.no_resend_alert_due?'AGING ALERT':'closure watch'}`])]);
      if(state.gifts.some(x=>x.id===prev))el('review690Certificate').value=prev;
      for(const id of ['review690Exact','review690Independent','review690NoResend'])el(id).checked=false;
      const now=new Date();el('review690Observed').value=new Date(now.getTime()-now.getTimezoneOffset()*60000).toISOString().slice(0,16);
      draw();status(`${state.gifts.length} closed-gift records reviewed. No email, resend or charge.`,true);
    }catch(e){state.gifts=[];state.case=null;draw();status(e.message+' No send occurred.');}
    finally{el('review690Refresh').disabled=false;}}
  async function save(){const g=selected();if(!g||!state.case||el('review690Record').disabled)return;
    el('review690Record').disabled=true;
    try{const kind=el('review690Kind').value;const body={session_id:state.session,case_id:state.case.id,
      certificate_id:g.id,attempt_id:g.attempt_id,closure_id:g.closure_id,event_id:crypto.randomUUID(),
      reviewer_id:el('review690Reviewer').value,event_kind:kind,decision_code:el('review690Decision').value,
      evidence_kind:el('review690Source').value,evidence_reference:el('review690Reference').value,
      observed_at:new Date(el('review690Observed').value).toISOString(),
      confirm_exact_closure:el('review690Exact').checked,
      confirm_independent_source:el('review690Independent').checked,
      confirm_no_resend:el('review690NoResend').checked};
      const r=await api('/api/admin/gift_delivery_closure_recurrence',{method:'POST',cache:'no-store',
        headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      const data=await r.json().catch(()=>({}));if(!r.ok||!data.ok)throw Error(data.error||'Immutable check denied');
      await refresh();status('Saved '+kind.replaceAll('_',' ')+'. Original gift remains one-time, no resend.',true);
    }catch(e){status(`${e.message} Refresh before recording further evidence; never resend.`);}
    finally{draw();}}
  function init(){if(!el('review690Refresh'))return;el('review690Refresh').addEventListener('click',refresh);
    for(const id of ['review690Certificate','review690Kind','review690Reviewer','review690Decision',
      'review690Source','review690Reference','review690Observed','review690Exact','review690Independent','review690NoResend'])
      el(id).addEventListener(['review690Reference','review690Observed'].includes(id)?'input':'change',draw);
    el('review690Record').addEventListener('click',save);
    const now=new Date();el('review690Observed').value=new Date(now.getTime()-now.getTimezoneOffset()*60000).toISOString().slice(0,16);draw();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
