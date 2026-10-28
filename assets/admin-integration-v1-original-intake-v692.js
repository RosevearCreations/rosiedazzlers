(function(){
  const el=id=>document.getElementById(id),api=(url,options)=>window.AdminAuth?.fetchWithAuth?
    window.AdminAuth.fetchWithAuth(url,options):fetch(url,{...options,credentials:'include'});
  function status(message,ok=false){el('review692QL246Result').textContent=message;
    el('review692QL246Result').dataset.state=ok?'ok':'error';}
  function draw(){el('review692QL246Record').disabled=
    !/^[A-Z0-9_-]{6,64}$/.test(el('review692QL246Reference').value)||
    !/^np-[A-Za-z0-9_-]{6,120}$/.test(el('review692QL246Original').value)||
    (el('review692QL246Revision').value!==''&&!/^[0-9a-f]{40}$/.test(el('review692QL246Revision').value))||
    !el('review692QL246Observed').value||
    !['review692QL246Unverified','review692QL246NoPilot','review692QL246NoGateway'].every(id=>el(id).checked);}
  async function refresh(){el('review692QL246Refresh').disabled=true;
    try{const r=await api('/api/admin/integration_v1_original_receipt_intake',{cache:'no-store'});
      const d=await r.json().catch(()=>({}));if(!r.ok||!d.ok)throw Error(d.error||'Receipt list unavailable');
      el('review692QL246Guide').textContent=`${d.ql246_signed_payload_order?.length||0} canonical signed fields; `+
        `${d.ql246_denial_order?.length||0} real original denials required. ${d.ql246_gate} `+
        `Current state: ${d.connection_state}; approval: ${d.owner_authorization}.`;
      status(`${d.intakes?.length||0} source-reference candidate(s) stored, all UNVERIFIED. No external gateway calls.`,true);
    }catch(e){el('review692QL246Guide').textContent='No verified six-app source connection or signature.';
      status(e.message+'. Disconnected.');}finally{el('review692QL246Refresh').disabled=false;}}
  async function save(){if(el('review692QL246Record').disabled)return;
    el('review692QL246Record').disabled=true;
    try{const b={evidence_reference:el('review692QL246Reference').value,
      receipt_kind:el('review692QL246Kind').value,
      original_receipt_reference:el('review692QL246Original').value,
      source_revision:el('review692QL246Revision').value||null,
      observed_at:new Date(el('review692QL246Observed').value).toISOString(),
      confirm_independent_verification_pending:el('review692QL246Unverified').checked,
      confirm_no_owner_authorization:el('review692QL246NoPilot').checked,
      confirm_no_gateway_contact:el('review692QL246NoGateway').checked};
      const r=await api('/api/admin/integration_v1_original_receipt_intake',{method:'POST',cache:'no-store',
        headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});
      const d=await r.json().catch(()=>({}));if(!r.ok||!d.ok)throw Error(d.error||'Reference rejected');
      await refresh();status(`${b.receipt_kind} reference staged as UNVERIFIED, not a signed QL-246 source proof.`,true);
    }catch(e){status(e.message+' No gateway or pilot activated.');}finally{draw();}}
  function init(){if(!el('review692QL246Refresh'))return;
    el('review692QL246Refresh').addEventListener('click',refresh);
    el('review692QL246Record').addEventListener('click',save);
    for(const id of ['review692QL246Reference','review692QL246Original','review692QL246Revision',
      'review692QL246Kind','review692QL246Observed','review692QL246Unverified',
      'review692QL246NoPilot','review692QL246NoGateway'])el(id).addEventListener(
        ['review692QL246Reference','review692QL246Original','review692QL246Revision','review692QL246Observed'].includes(id)?'input':'change',draw);
    const now=new Date();el('review692QL246Observed').value=new Date(now.getTime()-now.getTimezoneOffset()*60000).toISOString().slice(0,16);
    draw();refresh();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
