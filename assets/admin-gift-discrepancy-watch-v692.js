(function(){
  const el=id=>document.getElementById(id),state={case:null,session:'',gifts:[],reviewers:[],actor:null};
  const api=(url,options)=>window.AdminAuth?.fetchWithAuth?
    window.AdminAuth.fetchWithAuth(url,options):fetch(url,{...options,credentials:'include'});
  const rules={owner_discrepancy_watch_opened:{decisions:['discrepancy_review_requested'],sources:['internal_exception_note']},
    independent_discrepancy_reassessed:{decisions:['still_disputed','documentary_gap','contradiction_not_resolved'],
      sources:['recipient_direct_reply','verified_phone_conversation','recipient_reported_missing',
        'provider_dashboard_reference','internal_exception_note']},
    owner_no_resend_hold_ack:{decisions:['continued_manual_hold'],sources:['internal_exception_note']}};
  const choice=(id,items)=>{const node=el(id),old=node.value;node.replaceChildren();
    for(const [value,label] of items){const o=document.createElement('option');o.value=value;o.textContent=label;node.append(o);}
    if(items.some(x=>x[0]===old))node.value=old;};
  const selected=()=>state.gifts.find(x=>x.id===el('review692Certificate').value);
  function status(message,ok=false){el('review692Result').textContent=message;
    el('review692Result').dataset.state=ok?'ok':'error';}
  function draw(){const g=selected(),kind=el('review692Kind').value,r=rules[kind];
    const reviewers=kind==='owner_discrepancy_watch_opened'?state.reviewers.filter(x=>g&&
      !new Set([state.actor,g.original_operator_id,g.original_reviewer_id,
        g.third_reviewer_id,g.fourth_reviewer_id]).has(x.id)).map(x=>[x.id,`${x.full_name} · ${x.role_code}`]):
      g?.assigned_fifth_reviewer_id?[[g.assigned_fifth_reviewer_id,'Assigned fifth reviewer']]:[];
    choice('review692Reviewer',reviewers);choice('review692Decision',r.decisions.map(x=>[x,x.replaceAll('_',' ')]));
    choice('review692Source',r.sources.map(x=>[x,x.replaceAll('_',' ')]));
    el('review692Reviewer').disabled=kind!=='owner_discrepancy_watch_opened';
    el('review692Guide').textContent=g?`Line ${g.checkout_line_number} · ${g.recipient_email_masked}. `+
      `Fourth reviewer: ${g.discrepancy_decision}; ${g.fourth_age_hours??'?'} hours ago. `+
      `Fifth watch: ${g.watch_age_hours??'not opened'} hours. `+
      `${g.aging_alert_due?'INTERNAL AGING ALERT. ':''}${g.warning}`:
      'Select an original evidence discrepancy that received independent fourth review and a subsequent owner HOLD.';
    const allowed=kind==='owner_discrepancy_watch_opened'?g?.can_open:
      kind==='independent_discrepancy_reassessed'?g?.can_reassess:g?.can_ack_hold;
    el('review692Record').disabled=!allowed||!el('review692Reviewer').value||
      !/^[A-Z0-9_-]{6,64}$/.test(el('review692Reference').value)||!el('review692Observed').value||
      !el('review692ConfirmFourth').checked||!el('review692ConfirmFifth').checked||
      !el('review692NoResend').checked;}
  async function refresh(){const session=el('review676Session')?.value.trim()||'';
    if(!/^cs_(?:test|live)_[A-Za-z0-9_-]{8,220}$/.test(session))return status('Enter the exact checkout session above.');
    el('review692Refresh').disabled=true;
    try{const r=await api('/api/admin/gift_delivery_discrepancy_watch?'+new URLSearchParams({session_id:session}),{cache:'no-store'});
      const d=await r.json().catch(()=>({}));if(!r.ok||!d.ok)throw Error(d.error||'Independent watch unavailable');
      state.session=session;state.case=d.case;state.gifts=d.gifts||[];
      state.reviewers=d.reviewers||[];state.actor=d.actor_id;
      const before=el('review692Certificate').value;
      choice('review692Certificate',[['','Choose conflicting reopened gift'],...state.gifts.map(g=>
        [g.id,`Line ${g.checkout_line_number} · ${g.aging_alert_due?'AGING ALERT':'manual HOLD'}`])]);
      if(state.gifts.some(g=>g.id===before))el('review692Certificate').value=before;
      for(const id of ['review692ConfirmFourth','review692ConfirmFifth','review692NoResend'])el(id).checked=false;
      draw();status(`${state.gifts.length} unresolved discrepancy case(s); no customer action permitted.`,true);
    }catch(e){state.gifts=[];draw();status(e.message+' No customer action occurred.');}
    finally{el('review692Refresh').disabled=false;}}
  async function record(){const g=selected();if(!g||!state.case||el('review692Record').disabled)return;
    el('review692Record').disabled=true;
    try{const b={session_id:state.session,case_id:state.case.id,certificate_id:g.id,
      attempt_id:g.attempt_id,fourth_review_id:g.fourth_review_id,
      event_id:crypto.randomUUID(),reviewer_id:el('review692Reviewer').value,
      event_kind:el('review692Kind').value,decision_code:el('review692Decision').value,
      evidence_kind:el('review692Source').value,evidence_reference:el('review692Reference').value,
      observed_at:new Date(el('review692Observed').value).toISOString(),
      confirm_fourth_discrepancy:el('review692ConfirmFourth').checked,
      confirm_fifth_independence:el('review692ConfirmFifth').checked,
      confirm_no_resend:el('review692NoResend').checked};
      const r=await api('/api/admin/gift_delivery_discrepancy_watch',{method:'POST',cache:'no-store',
        headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});
      const d=await r.json().catch(()=>({}));if(!r.ok||!d.ok)throw Error(d.error||'Evidence denied');
      await refresh();status(`${b.event_kind.replaceAll('_',' ')} recorded. Manual HOLD continues; no resend.`,true);
    }catch(e){status(e.message+'. Refresh before attempting another action.');}finally{draw();}}
  function init(){if(!el('review692Refresh'))return;
    el('review692Refresh').addEventListener('click',refresh);el('review692Record').addEventListener('click',record);
    for(const id of ['review692Certificate','review692Kind','review692Reviewer','review692Decision',
      'review692Source','review692Reference','review692Observed','review692ConfirmFourth',
      'review692ConfirmFifth','review692NoResend'])el(id).addEventListener(
        ['review692Reference','review692Observed'].includes(id)?'input':'change',draw);
    const now=new Date();el('review692Observed').value=new Date(now.getTime()-now.getTimezoneOffset()*60000).toISOString().slice(0,16);draw();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
