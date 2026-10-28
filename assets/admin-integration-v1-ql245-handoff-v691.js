(function(){
  const el=id=>document.getElementById(id),api=(u,o)=>window.AdminAuth?.fetchWithAuth?
    window.AdminAuth.fetchWithAuth(u,o):fetch(u,{...o,credentials:'include'});
  function status(message,ok=false){el('review691QL245Result').textContent=message;
    el('review691QL245Result').dataset.state=ok?'ok':'error';}
  function draw(){el('review691QL245Record').disabled=
    !/^[A-Z0-9_-]{6,64}$/.test(el('review691QL245Reference').value)||
    !el('review691QL245Observed').value||
    !['review691QL245NoSignatures','review691QL245NoDenials','review691QL245NoPilot'].every(id=>el(id).checked);}
  async function refresh(){el('review691QL245Refresh').disabled=true;
    try{const r=await api('/api/admin/integration_v1_ql245_witness_handoff',{cache:'no-store'});
      const d=await r.json().catch(()=>({}));if(!r.ok||!d.ok)throw Error(d.error||'Evidence inventory unavailable');
      const neg=Object.entries(d.negative_tests_executed||{}).filter(([,v])=>!v).map(([k])=>k.replaceAll('_',' '));
      el('review691QL245Guide').textContent=`Connection ${d.connection_state}; source signer ${d.signer_state}; `+
        `independent witness ${d.witness_state}; owner authorization ${d.owner_authorization}. `+
        `${d.source_key_order?.length||0} schema fields mapped for an unsigned draft only. `+
        `Seven original denials still unverified: ${neg.join(', ')}. `+
        `${d.missing_proof?.join('; ')}`;
      status(`${d.handoffs?.length||0} previous owner inventories. ${d.safety_notice}`,true);
    }catch(e){el('review691QL245Guide').textContent='Connection DISCONNECTED. Missing witness and original audit evidence.';
      status(e.message+'. No gateway request was made.');}
    finally{el('review691QL245Refresh').disabled=false;}}
  async function save(){if(el('review691QL245Record').disabled)return;
    el('review691QL245Record').disabled=true;
    try{const b={evidence_reference:el('review691QL245Reference').value,
      observed_at:new Date(el('review691QL245Observed').value).toISOString(),
      confirm_no_signed_receipts:el('review691QL245NoSignatures').checked,
      confirm_all_denials_unverified:el('review691QL245NoDenials').checked,
      confirm_no_owner_pilot:el('review691QL245NoPilot').checked};
      const r=await api('/api/admin/integration_v1_ql245_witness_handoff',{method:'POST',cache:'no-store',
        headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});
      const d=await r.json().catch(()=>({}));if(!r.ok||!d.ok)throw Error(d.error||'HOLD record refused');
      status(`Owner unsigned checklist ${d.receipt?.id||'recorded'}. No signer or gateway receipt; DISCONNECTED.`,true);
      await refresh();
    }catch(e){status(e.message+'. The six-app connection remains DISCONNECTED.');}finally{draw();}}
  function init(){if(!el('review691QL245Refresh'))return;
    el('review691QL245Refresh').addEventListener('click',refresh);
    for(const id of ['review691QL245Reference','review691QL245Observed',
      'review691QL245NoSignatures','review691QL245NoDenials','review691QL245NoPilot'])
      el(id).addEventListener(['review691QL245Reference','review691QL245Observed'].includes(id)?'input':'change',draw);
    el('review691QL245Record').addEventListener('click',save);
    const now=new Date();el('review691QL245Observed').value=
      new Date(now.getTime()-now.getTimezoneOffset()*60000).toISOString().slice(0,16);
    draw();refresh();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
