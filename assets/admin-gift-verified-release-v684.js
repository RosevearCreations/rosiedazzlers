(function(){
  const el=id=>document.getElementById(id);
  const state={case:null,gifts:[],renewal:null,session:''};
  const fetcher=(url,options)=>window.AdminAuth?.fetchWithAuth?
    window.AdminAuth.fetchWithAuth(url,options):fetch(url,{...options,credentials:'include'});
  function say(message,ok=false){
    const target=el('review684Result');target.textContent=message;
    target.dataset.state=ok?'ok':'error';
  }
  function selected(){return state.gifts.find(g=>g.id===el('review684Certificate').value);}
  function render(){
    const g=selected();
    el('review684Guide').textContent=g?
      `Checkout line ${g.checkout_line_number}: ${g.warning}`:
      'Select a verified checkout line from the current session.';
    el('review684Record').disabled=!g?.candidate||!state.case||!state.renewal||
      !el('review684Ack').checked;
  }
  async function refresh(){
    const session=el('review676Session')?.value.trim()||'';
    if(!/^cs_(?:test|live)_[a-zA-Z0-9_-]{8,220}$/.test(session)){
      say('Enter an actual gift Checkout session ID in the field above, then refresh.');return;
    }
    const button=el('review684Refresh');button.disabled=true;
    try{
      const response=await fetcher('/api/admin/gift_verified_release?'+
        new URLSearchParams({session_id:session}),{cache:'no-store'});
      const data=await response.json().catch(()=>({}));
      if(!response.ok||!data.ok)throw Error(data.error||'Unable to verify session');
      state.session=session;state.case=data.case;state.renewal=data.latest_renewal;
      state.gifts=data.gifts||[];
      const target=el('review684Certificate'),previous=target.value;
      target.replaceChildren();const empty=document.createElement('option');
      empty.value='';empty.textContent='Select one certificate';target.append(empty);
      for(const gift of state.gifts){const option=document.createElement('option');
        option.value=gift.id;option.textContent=`Line ${gift.checkout_line_number} · ${gift.candidate?'ready for final verification':gift.previously_released?'release already recorded':'review needed'}`;
        target.append(option);}
      if(state.gifts.some(g=>g.id===previous))target.value=previous;
      el('review684Ack').checked=false;render();
      say(`${state.gifts.length} certificates found; ${data.release_receipts?.length||0} release receipts. ${data.safe_boundary}`,true);
    }catch(e){state.case=null;state.gifts=[];state.renewal=null;
      el('review684Record').disabled=true;say(e.message+' No certificate released.');}
    finally{button.disabled=false;}
  }
  async function release(){
    const button=el('review684Record'),gift=selected();button.disabled=true;
    if(!gift?.candidate||!el('review684Ack').checked||!state.case||!state.renewal){
      say('Select one eligible certificate and explicitly confirm the owner decision.');render();return;
    }
    try{
      const response=await fetcher('/api/admin/gift_verified_release',{
        method:'POST',cache:'no-store',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({event_id:crypto.randomUUID(),case_id:state.case.id,
          certificate_id:gift.id,renewal_event_id:state.renewal.id,session_id:state.session,
          confirm_single_certificate_release:true,confirm_no_prior_send:true})});
      const data=await response.json().catch(()=>({}));
      if(!response.ok||!data.ok)throw Error(data.error||'Release declined');
      await refresh();say(`Certificate release decision recorded: ${data.result?.id}. ${data.next_step}`,true);
    }catch(e){say(e.message+' No send, payment or gift mutation occurred.');render();}
  }
  function init(){
    el('review684Refresh')?.addEventListener('click',refresh);
    el('review684Certificate')?.addEventListener('change',render);
    el('review684Ack')?.addEventListener('change',render);
    el('review684Record')?.addEventListener('click',release);
    render();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
