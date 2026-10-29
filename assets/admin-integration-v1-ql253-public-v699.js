(function(){
  const el=id=>document.getElementById(id);
  const api=(url,opts)=>window.AdminAuth?.fetchWithAuth?
    window.AdminAuth.fetchWithAuth(url,opts):fetch(url,{...opts,credentials:'include'});
  async function recheck(){const button=el('review699QL253Recheck');button.disabled=true;
    try{const r=await api('/api/admin/integration_v1_ql253_public_ci_continuity',{
      method:'POST',cache:'no-store',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action:'recheck_public_main_ci_proof'})});
      const d=await r.json().catch(()=>({}));if(!r.ok||!d.ok)
        throw Error(d.error||'QL-253 public recheck unavailable');
      el('review699QL253Result').textContent=`GitHub main: ${d.checked_main_sha}. `+
        `Exact-head source CI: ${d.public_source_ci}. CI URL: ${d.source_ci_run_url}. `+
        `Immutable proof status: ${d.public_proof_state}; HTTP ${d.public_proof_http_status}. `+
        'Proof commit B, independent registry/custodian/witness and owner TEST decision: NOT_AVAILABLE/NOT_GIVEN. '+
        'Connection DISCONNECTED / HOLD. This checked public GitHub only; no gateway or customer call.';
      el('review699QL253Result').dataset.state='error';
    }catch(e){el('review699QL253Result').textContent=e.message+'. HOLD continues.';
      el('review699QL253Result').dataset.state='error';}
    finally{button.disabled=false;}}
  function init(){el('review699QL253Recheck')?.addEventListener('click',recheck);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
