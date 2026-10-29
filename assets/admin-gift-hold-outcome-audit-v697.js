(function(){
  const el=id=>document.getElementById(id);
  const api=url=>window.AdminAuth?.fetchWithAuth?
    window.AdminAuth.fetchWithAuth(url,{cache:'no-store'}):fetch(url,{credentials:'include',cache:'no-store'});
  function line(parent,label,value){const p=document.createElement('p');p.textContent=`${label}: ${value}`;parent.append(p);}
  async function audit(){const button=el('review697OutcomeRefresh'),cases=el('review697OutcomeCases');
    button.disabled=true;cases.replaceChildren();
    try{const response=await api('/api/admin/gift_hold_escalation_outcome_audit');
      const data=await response.json().catch(()=>({}));if(!response.ok||!data.ok)
        throw Error(data.error||'Owner HOLD audit unavailable');
      const total=data.case_count||0,parts=Object.entries(data.counts||{})
        .filter(([,count])=>count>0).map(([type,count])=>`${type}: ${count}`);
      el('review697OutcomeResult').textContent=`${total} recent HOLD case(s); `+
        `${data.owner_follow_up_required_count||0} need manual owner follow-up. `+
        `${parts.join(' · ')||'No unresolved cases in the bounded sample.'} `+
        (data.truncated_possible?'Truncated recent sample; full history NOT audited. ':'')+
        'Zero delivery certifications and zero closure authorizations.';
      el('review697OutcomeResult').dataset.state='ok';
      for(const row of data.outcomes||[]){const item=document.createElement('div');item.className='panel';
        line(item,'Gift line',row.checkout_line_number);
        line(item,'Outcome',`${row.outcome} · ${row.evidence_disposition}`);
        line(item,'Required action',row.manual_owner_follow_up_required?'Manual owner follow-up; HOLD remains.':'Continue manual HOLD monitoring.');
        line(item,'Safety','No resend, recipient contact, delivery certificate or closure.');
        cases.append(item);}
    }catch(e){el('review697OutcomeResult').textContent=e.message+'. Manual HOLD remains.';
      el('review697OutcomeResult').dataset.state='error';cases.replaceChildren();}
    finally{button.disabled=false;}}
  function init(){el('review697OutcomeRefresh')?.addEventListener('click',audit);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
