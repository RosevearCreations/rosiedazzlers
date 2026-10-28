(function(){
  const el=id=>document.getElementById(id),api=(url,options)=>window.AdminAuth?.fetchWithAuth?
    window.AdminAuth.fetchWithAuth(url,options):fetch(url,{...options,credentials:'include'});
  function status(message,ok=false){el('review693QL246Result').textContent=message;
    el('review693QL246Result').dataset.state=ok?'ok':'error';}
  function draw(){const v=el('review693QL246Envelope').value;
    el('review693QL246Verify').disabled=v.length<50||v.length>12000;}
  async function refresh(){el('review693QL246Refresh').disabled=true;
    try{const r=await api('/api/admin/integration_v1_ql246_signature_readiness',{cache:'no-store'});
      const d=await r.json().catch(()=>({}));if(!r.ok||!d.ok)throw Error(d.error||'Unavailable');
      el('review693QL246Guide').textContent=`Out-of-band pin: ${d.trust_pin_configured?'configured':'PENDING'}; `+
        `immutable source: ${d.immutable_source_configured?'configured':'PENDING'}; `+
        `CI: ${d.ci_reference_configured?'configured':'PENDING'}; `+
        `challenge: ${d.operator_challenge_configured?'configured':'PENDING'}. `+
        `Seven original denials: UNVERIFIED. ${d.connection_state}; authorization: ${d.owner_authorization}.`;
      status('No gateway or source receipt is validated by this readiness check.',true);
    }catch(e){status(e.message+'. Disconnected, fail closed.');}
    finally{el('review693QL246Refresh').disabled=false;}}
  async function verify(){if(el('review693QL246Verify').disabled)return;
    el('review693QL246Verify').disabled=true;
    try{const publicEnvelope=el('review693QL246Envelope').value;
      const r=await api('/api/admin/integration_v1_ql246_signature_readiness',{
        method:'POST',cache:'no-store',headers:{'Content-Type':'application/json'},body:publicEnvelope});
      const d=await r.json().catch(()=>({}));if(!r.ok||!d.ok)throw Error(d.error||'Verification unavailable');
      status(`${d.cryptographic_verification}: ${d.reason}. `+
        'Original gateway observations and seven independent denials remain UNVERIFIED; no pilot authorized.',!!d.signature_check);
    }catch(e){status(e.message+'. Nothing stored; no gateway contact.');}finally{draw();}}
  function init(){if(!el('review693QL246Refresh'))return;
    el('review693QL246Refresh').addEventListener('click',refresh);
    el('review693QL246Verify').addEventListener('click',verify);
    el('review693QL246Envelope').addEventListener('input',draw);draw();refresh();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
