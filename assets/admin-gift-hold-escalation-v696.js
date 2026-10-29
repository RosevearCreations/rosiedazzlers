(function(){
  const el=id=>document.getElementById(id);
  const api=url=>window.AdminAuth?.fetchWithAuth?
    window.AdminAuth.fetchWithAuth(url,{cache:'no-store'}):fetch(url,{credentials:'include',cache:'no-store'});
  function line(parent,label,value){const p=document.createElement('p');p.textContent=`${label}: ${value}`;parent.append(p);}
  async function refresh(){const btn=el('review696EscalationRefresh'),container=el('review696EscalationCases');
    btn.disabled=true;container.replaceChildren();
    try{const r=await api('/api/admin/gift_owner_hold_escalation_runbook'),d=await r.json().catch(()=>({}));
      if(!r.ok||!d.ok)throw Error(d.error||'HOLD runbook unavailable');
      for(const caseItem of d.runbook||[]){const item=document.createElement('div');item.className='panel';
        line(item,'Urgency',`${caseItem.priority} · ${caseItem.urgency}`);
        line(item,'Gift',`Line ${caseItem.checkout_line_number}; ${caseItem.attention}; ${caseItem.phase}`);
        const list=document.createElement('ol');for(const instruction of caseItem.internal_steps||[]){
          const li=document.createElement('li');li.textContent=instruction;list.append(li);}item.append(list);
        line(item,'Safety','Manual HOLD, permanent no-resend; nothing was recorded or sent.');
        const open=document.createElement('button');open.type='button';open.className='btn ghost';
        open.textContent='Review exact checkout (read-only)';open.addEventListener('click',()=>{
          const field=el('review676Session');if(!field)return;field.value=caseItem.session_id;
          el('review694AgingRefresh')?.click();el('review694SixthAging')?.scrollIntoView({block:'start',behavior:'smooth'});});
        item.append(open);container.append(item);}
      el('review696EscalationResult').textContent=`${d.runbook?.length||0} recent unresolved HOLD runbook(s). `+
        (d.truncated_possible?'Recent queue limit reached: older cases may require an independent full audit. ':'')+
        'Read-only owner guidance; no action executed.';
      el('review696EscalationResult').dataset.state='ok';
    }catch(e){container.replaceChildren();el('review696EscalationResult').textContent=e.message+'. Fail-closed manual HOLD.';
      el('review696EscalationResult').dataset.state='error';}finally{btn.disabled=false;}}
  function init(){el('review696EscalationRefresh')?.addEventListener('click',refresh);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
