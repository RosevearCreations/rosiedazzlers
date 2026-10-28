(function(){
  const el=id=>document.getElementById(id);
  const api=url=>window.AdminAuth?.fetchWithAuth?
    window.AdminAuth.fetchWithAuth(url,{cache:'no-store'}):fetch(url,{cache:'no-store',credentials:'include'});
  function row(node,label,value){const p=document.createElement('p');p.textContent=`${label}: ${value}`;node.append(p);}
  async function refresh(){const button=el('review695QueueRefresh'),node=el('review695QueueList');
    button.disabled=true;node.replaceChildren();
    try{const r=await api('/api/admin/gift_owner_hold_triage_queue'),d=await r.json().catch(()=>({}));
      if(!r.ok||!d.ok)throw Error(d.error||'Owner queue unavailable');
      for(const q of d.queue||[]){const item=document.createElement('div');item.className='panel';
        row(item,'Internal priority',`${q.priority} · ${q.attention}`);
        row(item,'Gift/hold',`Line ${q.checkout_line_number}; ${q.phase}; fifth ${q.fifth_review_age_hours??'unknown'}h`);
        row(item,'Sixth watch',`Age ${q.watch_age_hours??'not assigned'}h; owner ACK ${q.owner_ack_age_hours??'not recorded'}h`);
        row(item,'Boundary','Unresolved manual HOLD. No delivery assertion, customer contact or resend.');
        const open=document.createElement('button');open.type='button';open.className='btn ghost';
        open.textContent='Open exact checkout HOLD watch';open.addEventListener('click',()=>{
          const field=el('review676Session');if(!field)return;
          field.value=q.session_id;el('review694AgingRefresh')?.click();
          el('review694SixthAging')?.scrollIntoView({block:'start',behavior:'smooth'});});
        item.append(open);node.append(item);}
      el('review695QueueResult').textContent=`${d.queue?.length||0} recent unresolved case(s) in at most ${d.sample_limit} fifth reviews. `+
        (d.truncated_possible?'More evidence may exist; inspect the full ledger. ':'')+'Owner-only, read-only HOLD.';
      el('review695QueueResult').dataset.state='ok';
    }catch(e){node.replaceChildren();el('review695QueueResult').textContent=e.message+'. No case changed.';
      el('review695QueueResult').dataset.state='error';}finally{button.disabled=false;}}
  function init(){const button=el('review695QueueRefresh');if(button)button.addEventListener('click',refresh);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
