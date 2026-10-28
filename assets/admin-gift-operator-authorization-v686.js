(function(){
  const el=id=>document.getElementById(id);
  const state={session:'',case:null,gifts:[],operators:[],owner:false};
  const fetcher=(url,options)=>window.AdminAuth?.fetchWithAuth?
    window.AdminAuth.fetchWithAuth(url,options):fetch(url,{...options,credentials:'include'});
  function say(message,ok=false){const target=el('review686Result');
    target.textContent=message;target.dataset.state=ok?'ok':'error';}
  function selected(){return state.gifts.find(g=>g.id===el('review686Certificate').value);}
  function render(){const g=selected();
    el('review686Guide').textContent=g?
      `Checkout line ${g.checkout_line_number}: ${g.warning}`:
      'Select a verified certificate handoff to review the operator authorization.';
    el('review686OwnerControls').hidden=!state.owner;
    el('review686Record').disabled=!state.owner||!state.case||!g?.can_authorize||
      !el('review686Operator').value||!el('review686Ack').checked||
      !el('review686NoPrior').checked||!el('review686NoSend').checked;
  }
  async function refresh(){
    const session=el('review676Session')?.value.trim()||'';
    if(!/^cs_(?:test|live)_[a-zA-Z0-9_-]{8,220}$/.test(session)){
      say('Enter the exact Checkout session ID in the recovery session field above.');return;}
    const button=el('review686Refresh');button.disabled=true;
    try{
      const response=await fetcher('/api/admin/gift_operator_authorization?'+
        new URLSearchParams({session_id:session}),{cache:'no-store'});
      const data=await response.json().catch(()=>({}));
      if(!response.ok||!data.ok)throw Error(data.error||'Operator proof unavailable');
      state.session=session;state.case=data.case;state.owner=!!data.is_owner;
      state.gifts=data.gifts||[];state.operators=data.operators||[];
      const target=el('review686Certificate'),old=target.value;target.replaceChildren();
      const empty=document.createElement('option');empty.value='';
      empty.textContent='Choose a certificate handoff';target.append(empty);
      for(const g of state.gifts){const option=document.createElement('option');option.value=g.id;
        option.textContent=`Line ${g.checkout_line_number} · ${g.can_authorize?
          'owner assignment ready':g.authorization_recorded?'operator assigned':'reverification required'}`;
        target.append(option);}
      if(state.gifts.some(g=>g.id===old))target.value=old;
      const operators=el('review686Operator');operators.replaceChildren();
      const none=document.createElement('option');none.value='';
      none.textContent='Select another active operator';operators.append(none);
      for(const op of state.operators){const option=document.createElement('option');
        option.value=op.id;option.textContent=`${op.display_name} (${op.role_code.replaceAll('_',' ')})`;
        operators.append(option);}
      for(const id of ['review686Ack','review686NoPrior','review686NoSend'])el(id).checked=false;
      render();say(`${state.gifts.length} certificates visible for this signed-in role. ${data.safe_boundary}`,true);
    }catch(e){state.case=null;state.gifts=[];state.owner=false;render();
      say(e.message+' No authorization or customer action occurred.');}
    finally{button.disabled=false;}
  }
  async function authorize(){const g=selected(),button=el('review686Record');button.disabled=true;
    if(!g?.can_authorize||!state.case||!state.owner||!el('review686Operator').value||
      !el('review686Ack').checked||!el('review686NoPrior').checked||
      !el('review686NoSend').checked){say('Select a valid certificate and separate operator, then confirm each safeguard.');render();return;}
    try{
      const response=await fetcher('/api/admin/gift_operator_authorization',{
        method:'POST',cache:'no-store',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({event_id:crypto.randomUUID(),case_id:state.case.id,
          certificate_id:g.id,handoff_event_id:g.handoff_event_id,session_id:state.session,
          operator_staff_user_id:el('review686Operator').value,confirm_one_certificate:true,
          confirm_no_prior_send:true,confirm_preparation_only:true})});
      const data=await response.json().catch(()=>({}));
      if(!response.ok||!data.ok)throw Error(data.error||'Operator assignment refused');
      await refresh();say(`Operator preparation receipt ${data.result?.id}. ${data.next_step}`,true);
    }catch(e){say(e.message+' No send or payment action occurred.');render();}
  }
  function init(){el('review686Refresh')?.addEventListener('click',refresh);
    el('review686Certificate')?.addEventListener('change',render);
    el('review686Operator')?.addEventListener('change',render);
    for(const id of ['review686Ack','review686NoPrior','review686NoSend'])
      el(id)?.addEventListener('change',render);
    el('review686Record')?.addEventListener('click',authorize);render();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
