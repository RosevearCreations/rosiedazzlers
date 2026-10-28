(function(){
  const el=id=>document.getElementById(id);
  const state={session:'',case:null,gifts:[]};
  const choices={owner_provider_outcome_triage:{
    sources:['provider_receipt','provider_dashboard_reference','internal_exception_note']},
    owner_recipient_confirmation:{
      decisions:['recipient_explicitly_confirmed'],sources:['recipient_direct_reply','verified_phone_conversation']},
    owner_no_resend_escalation:{
      decisions:['recipient_not_confirmed','evidence_conflict','manual_followup_required'],
      sources:['provider_receipt','provider_dashboard_reference','internal_exception_note','recipient_reported_missing']}};
  const api=(url,opt)=>window.AdminAuth?.fetchWithAuth?
    window.AdminAuth.fetchWithAuth(url,opt):fetch(url,{...opt,credentials:'include'});
  function status(message,ok=false){el('review688Result').textContent=message;
    el('review688Result').dataset.state=ok?'ok':'error';}
  function selected(){return state.gifts.find(g=>g.id===el('review688Certificate').value);}
  function refill(select,entries,previous){select.replaceChildren();
    entries.forEach(([value,label])=>{const option=document.createElement('option');
      option.value=value;option.textContent=label;select.append(option);});
    if(entries.some(e=>e[0]===previous))select.value=previous;
  }
  function draw(){const gift=selected(),kind=el('review688Kind').value,rule=choices[kind];
    const existing=gift?.reviews||[];
    const allowed=kind==='owner_provider_outcome_triage'?gift?.can_triage:
      kind==='owner_recipient_confirmation'?gift?.can_record_recipient_confirmation:
      gift?.can_escalate_without_resend;
    el('review688Guide').textContent=gift?
      `Line ${gift.checkout_line_number} · ${gift.recipient_email_masked} · provider: ${gift.provider_outcome}. `+
      `Already recorded: ${existing.length?existing.map(e=>e.event_kind.replace('owner_','')).join(', '):'none'}. ${gift.warning}`:
      'Choose the exact certificate after refreshing its one-time provider receipt.';
    const decisions=kind==='owner_provider_outcome_triage'?
      gift?.triage_decision?[[gift.triage_decision,gift.triage_decision.replaceAll('_',' ')]]:[]:
      (rule?.decisions||[]).map(d=>[d,d.replaceAll('_',' ')]);
    refill(el('review688Decision'),decisions,el('review688Decision').value);
    refill(el('review688Source'),(rule?.sources||[]).map(d=>[d,d.replaceAll('_',' ')]),el('review688Source').value);
    el('review688Record').disabled=!allowed||!el('review688Decision').value||
      !el('review688Source').value||!/^[A-Z0-9_-]{6,64}$/.test(el('review688Reference').value)||
      !el('review688Observed').value||!el('review688Exact').checked||
      !el('review688Evidence').checked||!el('review688NoResend').checked;
  }
  async function refresh(){const session=el('review676Session')?.value.trim()||'';
    if(!/^cs_(?:test|live)_[a-zA-Z0-9_-]{8,220}$/.test(session)){
      status('Enter the full checkout session ID above first.');return;}
    el('review688Refresh').disabled=true;
    try{const response=await api('/api/admin/gift_delivery_outcome_review?'+new URLSearchParams({session_id:session}),{cache:'no-store'});
      const data=await response.json().catch(()=>({}));if(!response.ok||!data.ok)throw Error(data.error||'Owner review unavailable');
      state.session=session;state.case=data.case;state.gifts=data.gifts||[];
      const select=el('review688Certificate');refill(select,[['','Choose dispatched certificate'],
        ...state.gifts.filter(g=>g.attempt_id).map(g=>[g.id,`Line ${g.checkout_line_number} · ${g.provider_outcome}`])],select.value);
      for(const id of ['review688Exact','review688Evidence','review688NoResend'])el(id).checked=false;
      draw();status(`${state.gifts.length} certificates checked. ${data.safe_boundary}`,true);
    }catch(err){state.case=null;state.gifts=[];draw();status(`${err.message}. No send, retry or charge occurred.`);}
    finally{el('review688Refresh').disabled=false;}
  }
  async function save(){const g=selected();if(!state.case||!g||el('review688Record').disabled)return;
    el('review688Record').disabled=true;
    try{const observed=new Date(el('review688Observed').value).toISOString();
      const payload={session_id:state.session,case_id:state.case.id,certificate_id:g.id,
        attempt_id:g.attempt_id,review_id:crypto.randomUUID(),
        event_kind:el('review688Kind').value,decision_code:el('review688Decision').value,
        evidence_kind:el('review688Source').value,
        evidence_reference:el('review688Reference').value,observed_at:observed,
        confirm_exact_gift:el('review688Exact').checked,
        confirm_independent_evidence:el('review688Evidence').checked,
        confirm_no_resend:el('review688NoResend').checked};
      const response=await api('/api/admin/gift_delivery_outcome_review',{
        method:'POST',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      const data=await response.json().catch(()=>({}));if(!response.ok||!data.ok)throw Error(data.error||'Evidence entry refused');
      await refresh();status(`Saved ${payload.event_kind.replaceAll('_',' ')}. No send, resend or payment occurred.`,true);
    }catch(err){status(`${err.message}. Refresh before attempting another review; never resend.`);}
    finally{draw();}
  }
  function init(){el('review688Refresh')?.addEventListener('click',refresh);
    for(const id of ['review688Certificate','review688Kind','review688Decision','review688Source',
      'review688Reference','review688Observed','review688Exact','review688Evidence','review688NoResend'])
      el(id)?.addEventListener(id==='review688Reference'||id==='review688Observed'?'input':'change',draw);
    el('review688Record')?.addEventListener('click',save);
    const d=new Date();el('review688Observed').value=new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);
    draw();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
