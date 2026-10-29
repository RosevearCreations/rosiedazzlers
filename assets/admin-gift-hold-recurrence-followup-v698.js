(function(){
  const el=id=>document.getElementById(id);
  const api=url=>window.AdminAuth?.fetchWithAuth?
    window.AdminAuth.fetchWithAuth(url,{cache:'no-store'}):fetch(url,{credentials:'include',cache:'no-store'});
  function add(parent,label,value){const p=document.createElement('p');p.textContent=`${label}: ${value}`;parent.append(p);}
  async function refresh(){const button=el('review698FollowupRefresh'),container=el('review698FollowupCases');
    button.disabled=true;container.replaceChildren();
    try{const response=await api('/api/admin/gift_hold_recurrence_followup');
      const data=await response.json().catch(()=>({}));if(!response.ok||!data.ok)
        throw Error(data.error||'Recurrence follow-up unavailable');
      el('review698FollowupResult').textContent=`${data.case_count||0} recent HOLD cases; `+
        `${data.manual_follow_up_count||0} need manual follow-up. Snapshot SHA-256: ${data.snapshot_sha256}. `+
        (data.truncated_possible?'Recent sample truncated; older events not covered. ':'')+
        'A first snapshot is NOT proof of historical recurrence or resolution. No delivery or closure certified.';
      el('review698FollowupResult').dataset.state='ok';
      for(const row of data.followups||[]){const panel=document.createElement('div');panel.className='panel';
        add(panel,'Gift line',row.checkout_line_number);
        add(panel,'Follow-up',row.follow_up_classification);
        add(panel,'Observed phase',row.phase);
        add(panel,'Age',`${row.fifth_review_age_hours??'unknown'} hours since fifth review`);
        add(panel,'Safety','Manual HOLD, no resend, no customer contact and no authorized closure.');
        container.append(panel);}
    }catch(e){container.replaceChildren();el('review698FollowupResult').textContent=e.message+'. Manual HOLD continues.';
      el('review698FollowupResult').dataset.state='error';}
    finally{button.disabled=false;}}
  function init(){el('review698FollowupRefresh')?.addEventListener('click',refresh);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
