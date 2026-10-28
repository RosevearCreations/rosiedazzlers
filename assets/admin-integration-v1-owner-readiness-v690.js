(function(){
  const el=id=>document.getElementById(id),api=(u,o)=>window.AdminAuth?.fetchWithAuth?
    window.AdminAuth.fetchWithAuth(u,o):fetch(u,{...o,credentials:'include'});
  function status(message,ok=false){el('review690IntegrationResult').textContent=message;
    el('review690IntegrationResult').dataset.state=ok?'ok':'error';}
  function draw(){el('review690IntegrationRecord').disabled=
    !/^[A-Z0-9_-]{6,64}$/.test(el('review690IntegrationReference').value)||
    !el('review690IntegrationObserved').value||
    !['review690NoLive','review690NoGateway','review690NoPilot'].every(id=>el(id).checked);}
  async function refresh(){el('review690IntegrationRefresh').disabled=true;
    try{const r=await api('/api/admin/integration_v1_owner_readiness',{cache:'no-store'});
      const d=await r.json().catch(()=>({}));if(!r.ok||!d.ok)throw Error(d.error||'HOLD receipt unavailable');
      const parts=Object.entries(d.configuration_snapshot||{}).map(([k,v])=>`${k.replaceAll('_',' ')}: ${v?'yes':'no'}`);
      el('review690IntegrationGuide').textContent=`Connection ${d.connection_status}; NO gateway proof or owner pilot. `+
        `Local settings only: ${parts.join('; ')}. ${d.blockers?.join('; ')}`;
      status(`${d.reviews?.length||0} prior owner HOLD receipts. External calls: ${d.external_calls_made}. Integration remains disconnected.`,true);
    }catch(e){el('review690IntegrationGuide').textContent='Connection HOLD. Source receipt unavailable; no pilot authorized.';
      status(e.message+'. No external call was made.');}
    finally{el('review690IntegrationRefresh').disabled=false;}}
  async function save(){if(el('review690IntegrationRecord').disabled)return;
    el('review690IntegrationRecord').disabled=true;
    try{const b={evidence_reference:el('review690IntegrationReference').value,
      observed_at:new Date(el('review690IntegrationObserved').value).toISOString(),
      confirm_no_live_link:el('review690NoLive').checked,
      confirm_no_gateway_proof:el('review690NoGateway').checked,
      confirm_no_pilot_approval:el('review690NoPilot').checked};
      const r=await api('/api/admin/integration_v1_owner_readiness',{method:'POST',cache:'no-store',
        headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});
      const d=await r.json().catch(()=>({}));if(!r.ok||!d.ok)throw Error(d.error||'Receipt refused');
      status(`Owner HOLD receipt ${d.receipt?.id||'recorded'}. Not connected; no verified gateway or pilot approval.`,true);
      await refresh();
    }catch(e){status(e.message+'. Connection remains HOLD.');}finally{draw();}}
  function init(){if(!el('review690IntegrationRefresh'))return;
    el('review690IntegrationRefresh').addEventListener('click',refresh);
    for(const id of ['review690IntegrationReference','review690IntegrationObserved',
      'review690NoLive','review690NoGateway','review690NoPilot'])
      el(id).addEventListener(id==='review690IntegrationReference'||id==='review690IntegrationObserved'?'input':'change',draw);
    el('review690IntegrationRecord').addEventListener('click',save);
    const now=new Date();el('review690IntegrationObserved').value=
      new Date(now.getTime()-now.getTimezoneOffset()*60000).toISOString().slice(0,16);
    draw();refresh();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
