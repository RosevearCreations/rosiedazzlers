(function(){
  const el=id=>document.getElementById(id);
  const state={session:'',case:null,gifts:[],owner:false};
  const fetcher=(url,opt)=>window.AdminAuth?.fetchWithAuth?
    window.AdminAuth.fetchWithAuth(url,opt):fetch(url,{...opt,credentials:'include'});
  function say(message,ok=false){const target=el('review687Result');
    target.textContent=message;target.dataset.state=ok?'ok':'error';}
  function selected(){return state.gifts.find(g=>g.id===el('review687Certificate').value);}
  function draw(){const g=selected();
    el('review687Guide').textContent=g?
      `Line ${g.checkout_line_number} · ${g.recipient_email_masked} · ${g.warning}`:
      'Choose one checked gift certificate. Owner approval and operator send are separate actions.';
    el('review687OwnerGroup').hidden=!state.owner;
    el('review687Approve').disabled=!state.owner||!g?.can_owner_approve||
      !el('review687AckRecipient').checked||!el('review687AckNoPrior').checked||
      !el('review687AckOwner').checked;
    el('review687Dispatch').disabled=!g?.can_operator_dispatch||!g?.is_assigned_operator||
      !el('review687AckFinalRecipient').checked||!el('review687AckIrreversible').checked;
  }
  async function refresh(){const session=el('review676Session')?.value.trim()||'';
    if(!/^cs_(?:test|live)_[a-zA-Z0-9_-]{8,220}$/.test(session)){
      say('Enter the exact checkout session ID in the session field above.');return;}
    el('review687Refresh').disabled=true;
    try{const response=await fetcher('/api/admin/gift_one_time_dispatch?'+
      new URLSearchParams({session_id:session}),{cache:'no-store'});
      const data=await response.json().catch(()=>({}));
      if(!response.ok||!data.ok)throw Error(data.error||'Gift dispatch verification unavailable');
      state.session=session;state.case=data.case;state.gifts=data.gifts||[];state.owner=!!data.is_owner;
      const select=el('review687Certificate'),prior=select.value;select.replaceChildren();
      const none=document.createElement('option');none.value='';none.textContent='Select a certificate';select.append(none);
      for(const gift of state.gifts){const option=document.createElement('option');option.value=gift.id;
        option.textContent=`Line ${gift.checkout_line_number} · ${gift.outcome==='not_dispatched'?
          gift.approval_id?'owner approved':gift.can_owner_approve?'owner review ready':'evidence review required':
          gift.outcome}`;select.append(option);}
      if(state.gifts.some(g=>g.id===prior))select.value=prior;
      for(const id of ['review687AckRecipient','review687AckNoPrior','review687AckOwner',
        'review687AckFinalRecipient','review687AckIrreversible'])el(id).checked=false;
      draw();say(`${state.gifts.length} gift lines visible for this staff role. ${data.safe_boundary}`,true);
    }catch(err){state.case=null;state.gifts=[];state.owner=false;draw();
      say(`${err.message}. If a send may have started, check provider receipts before taking any action.`);}
    finally{el('review687Refresh').disabled=false;}
  }
  async function act(action){const gift=selected();if(!gift||!state.case){say('Choose a gift first.');return;}
    const button=el(action==='approve'?'review687Approve':'review687Dispatch');button.disabled=true;
    const body={action,session_id:state.session,case_id:state.case.id,
      certificate_id:gift.id,approval_id:action==='approve'?crypto.randomUUID():gift.approval_id};
    if(action==='approve'){body.authorization_id=gift.authorization_id;
      body.confirm_exact_recipient=el('review687AckRecipient').checked;
      body.confirm_no_prior_send=el('review687AckNoPrior').checked;
      body.confirm_owner_dispatch_approval=el('review687AckOwner').checked;
    }else{body.attempt_id=crypto.randomUUID();body.notification_id=crypto.randomUUID();
      body.confirm_final_recipient=el('review687AckFinalRecipient').checked;
      body.confirm_irreversible_send=el('review687AckIrreversible').checked;}
    try{const response=await fetcher('/api/admin/gift_one_time_dispatch',{
      method:'POST',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      const data=await response.json().catch(()=>({}));
      if(!response.ok||!data.ok)throw Error(data.error||'Approval or send could not be verified');
      await refresh();say(data.next_step||'Receipt recorded. Never send this certificate a second time.',true);
    }catch(err){say(`${err.message}. ${action==='dispatch'?
      'A provider request may already have occurred. NEVER retry; inspect the one-time receipt and provider evidence.':
      'Refresh and review before any further owner action.'}`);}
    finally{draw();}
  }
  function init(){el('review687Refresh')?.addEventListener('click',refresh);
    el('review687Certificate')?.addEventListener('change',draw);
    for(const id of ['review687AckRecipient','review687AckNoPrior','review687AckOwner',
      'review687AckFinalRecipient','review687AckIrreversible'])el(id)?.addEventListener('change',draw);
    el('review687Approve')?.addEventListener('click',()=>act('approve'));
    el('review687Dispatch')?.addEventListener('click',()=>act('dispatch'));draw();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
