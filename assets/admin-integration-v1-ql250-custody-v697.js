(function(){
  const el=id=>document.getElementById(id);
  const api=(url,opts)=>window.AdminAuth?.fetchWithAuth?
    window.AdminAuth.fetchWithAuth(url,opts):fetch(url,{...opts,credentials:'include'});
  function draw(node,message,ok){node.textContent=message;node.dataset.state=ok?'ok':'error';}
  async function refresh(){const button=el('review697QL250Refresh');button.disabled=true;
    try{const response=await api('/api/admin/integration_v1_ql250_custody_reconciliation',{cache:'no-store'});
      const data=await response.json().catch(()=>({}));if(!response.ok||!data.ok)
        throw Error(data.error||'Readiness unavailable');
      draw(el('review697QL250Status'),'Custody: NOT_AVAILABLE; distinct witness: NOT_AVAILABLE; owner TEST-only authorization: NOT_GIVEN; connection: DISCONNECTED. Only public source-proof availability may be checked.',false);
    }catch(e){draw(el('review697QL250Status'),e.message+'. HOLD remains.',false);}
    finally{button.disabled=false;}}
  async function recheck(){const button=el('review697QL250Recheck');button.disabled=true;
    try{const response=await api('/api/admin/integration_v1_ql250_custody_reconciliation',{
      method:'POST',cache:'no-store',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action:'public_proof_recheck'})});
      const data=await response.json().catch(()=>({}));if(!response.ok||!data.ok)
        throw Error(data.error||'Public metadata unavailable');
      const result=`Public proof: ${data.proof_publication}; HTTP ${data.public_proof_http_status}; `+
        `GitHub main: ${data.checked_main_sha}. Public CI/head match: ${data.source_ci_head_match?'YES (public metadata only)':'NOT VERIFIED'}. `+
        'QL-250 custody/QL-251 witness and authenticated owner decision: NOT VERIFIED. No gateway request was made.';
      draw(el('review697QL250Result'),result,false);
    }catch(e){draw(el('review697QL250Result'),e.message+'. No gateway or customer action.',false);}
    finally{button.disabled=false;}}
  function init(){el('review697QL250Refresh')?.addEventListener('click',refresh);
    el('review697QL250Recheck')?.addEventListener('click',recheck);refresh();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
