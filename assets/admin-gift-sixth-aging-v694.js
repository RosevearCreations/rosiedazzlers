(function(){
  const el=id=>document.getElementById(id),api=(url,options)=>window.AdminAuth?.fetchWithAuth?
    window.AdminAuth.fetchWithAuth(url,options):fetch(url,{...options,credentials:'include'});
  function status(message,ok=false){el('review694AgingResult').textContent=message;
    el('review694AgingResult').dataset.state=ok?'ok':'error';}
  function row(container,label,value){const p=document.createElement('p');
    p.textContent=`${label}: ${value}`;container.append(p);}
  async function refresh(){const session=el('review676Session')?.value.trim()||'';
    if(!/^cs_(?:test|live)_[A-Za-z0-9_-]{8,220}$/.test(session))return status('Enter exact checkout session above.');
    const node=el('review694AgingCases');node.replaceChildren();el('review694AgingRefresh').disabled=true;
    try{const r=await api('/api/admin/gift_sixth_witness_hold_aging?'+new URLSearchParams({session_id:session}),{cache:'no-store'});
      const d=await r.json().catch(()=>({}));if(!r.ok||!d.ok)throw Error(d.error||'HOLD view unavailable');
      for(const g of d.gifts||[]){const article=document.createElement('div');article.className='panel';
        row(article,'Gift',`Line ${g.checkout_line_number}, ${g.recipient_email_masked}`);
        row(article,'State',`${g.phase}, fifth review ${g.fifth_decision}, sixth risk ${g.sixth_decision||'pending'}`);
        row(article,'Evidence aging',`Witness ${g.watch_age_hours??'not opened'}h; independent result ${g.witness_age_hours??'not recorded'}h`);
        const alerts=[g.initial_24h_alert?'initial 24h':null,g.witness_24h_alert?'sixth witness 24h':null,
          g.owner_48h_alert?'owner HOLD 48h':null,g.review_window_expired?'14-day window expired':null].filter(Boolean);
        row(article,'Internal alerts',alerts.length?alerts.join(', '):'none currently due');
        row(article,'Safety',g.guidance+' No resend or delivery confirmation.');node.append(article);}
      status(`${d.gifts?.length||0} original unresolved case(s). Read-only; manual HOLD always applies.`,true);
    }catch(e){node.replaceChildren();status(e.message+'. No customer or ledger action occurred.');}
    finally{el('review694AgingRefresh').disabled=false;}}
  function init(){if(!el('review694AgingRefresh'))return;el('review694AgingRefresh').addEventListener('click',refresh);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
