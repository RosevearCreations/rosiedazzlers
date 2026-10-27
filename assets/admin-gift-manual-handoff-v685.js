(function(){
  const el=id=>document.getElementById(id);
  const state={session:'',case:null,gifts:[]};
  const fetcher=(url,options)=>window.AdminAuth?.fetchWithAuth?
    window.AdminAuth.fetchWithAuth(url,options):fetch(url,{...options,credentials:'include'});
  function say(message,ok=false){const target=el('review685Result');
    target.textContent=message;target.dataset.state=ok?'ok':'error';}
  function selected(){return state.gifts.find(g=>g.id===el('review685Certificate').value);}
  function render(){const gift=selected();
    el('review685Guide').textContent=gift?
      `Checkout line ${gift.checkout_line_number}: ${gift.warning}`:
      'Select a certificate with a current verified release.';
    el('review685Record').disabled=!state.case||!gift?.candidate||
      !el('review685Ack').checked||!el('review685NoSend').checked||
      !el('review685NoPrior').checked;
  }
  async function refresh(){
    const session=el('review676Session')?.value.trim()||'';
    if(!/^cs_(?:test|live)_[a-zA-Z0-9_-]{8,220}$/.test(session)){
      say('Enter the checkout session ID in the recovery session field above.');return;}
    const button=el('review685Refresh');button.disabled=true;
    try{
      const r=await fetcher('/api/admin/gift_manual_delivery_handoff?'+
        new URLSearchParams({session_id:session}),{cache:'no-store'});
      const data=await r.json().catch(()=>({}));
      if(!r.ok||!data.ok)throw Error(data.error||'Release receipt validation unavailable');
      state.session=session;state.case=data.case;state.gifts=data.gifts||[];
      const target=el('review685Certificate'),old=target.value;target.replaceChildren();
      const empty=document.createElement('option');empty.value='';
      empty.textContent='Choose a released certificate';target.append(empty);
      for(const gift of state.gifts){const option=document.createElement('option');
        option.value=gift.id;option.textContent=`Line ${gift.checkout_line_number} · ${gift.candidate?
          'verified handoff candidate':gift.previously_handed_off?'handoff recorded':'manual review required'}`;
        target.append(option);}
      if(state.gifts.some(g=>g.id===old))target.value=old;
      for(const id of ['review685Ack','review685NoSend','review685NoPrior'])el(id).checked=false;
      render();say(`${state.gifts.length} certificates, ${data.handoff_receipts?.length||0} handoff receipts. ${data.safe_boundary}`,true);
    }catch(e){state.case=null;state.gifts=[];render();say(e.message+' No handoff or send occurred.');}
    finally{button.disabled=false;}
  }
  async function handoff(){const gift=selected(),button=el('review685Record');button.disabled=true;
    if(!gift?.candidate||!state.case||!el('review685Ack').checked||
       !el('review685NoSend').checked||!el('review685NoPrior').checked){
      say('Select a valid release and confirm each safety item.');render();return;}
    try{
      const r=await fetcher('/api/admin/gift_manual_delivery_handoff',{
        method:'POST',cache:'no-store',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({event_id:crypto.randomUUID(),release_event_id:gift.release_event_id,
          case_id:state.case.id,certificate_id:gift.id,session_id:state.session,
          confirm_manual_handoff:true,confirm_no_delivery_attempt:true,
          confirm_no_automatic_send:true})});
      const data=await r.json().catch(()=>({}));
      if(!r.ok||!data.ok)throw Error(data.error||'Handoff refused');
      await refresh();say(`Manual handoff receipt: ${data.result?.id}. ${data.next_step}`,true);
    }catch(e){say(e.message+' No send or charge occurred.');render();}
  }
  function init(){
    el('review685Refresh')?.addEventListener('click',refresh);
    el('review685Certificate')?.addEventListener('change',render);
    for(const id of ['review685Ack','review685NoSend','review685NoPrior'])
      el(id)?.addEventListener('change',render);
    el('review685Record')?.addEventListener('click',handoff);
    render();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
