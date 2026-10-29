(function(){
  const el=id=>document.getElementById(id);
  const api=(url,options)=>window.AdminAuth?.fetchWithAuth?
    window.AdminAuth.fetchWithAuth(url,options):fetch(url,{...options,credentials:'include'});
  async function recheck(){const button=el('review700QL254Recheck');button.disabled=true;
    try{const r=await api('/api/admin/integration_v1_ql254_original_proof_watch',{
      method:'POST',cache:'no-store',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action:'recheck_immutable_public_proof'})});
      const d=await r.json().catch(()=>({}));if(!r.ok||!d.ok)
        throw Error(d.error||'Original public proof check unavailable');
      el('review700QL254Result').textContent=`Immutable main: ${d.observed_main_sha}. `+
        `Original QL-246 proof at main: HTTP ${d.public_main_proof_http_status}; ${d.proof_publication}. `+
        `Source A: ${d.source_sha_A}; matching source CI: ${d.matching_source_green_ci_run_url}. `+
        `Proof B: ${d.proof_commit_sha_B}; raw proof digest: ${d.exact_raw_proof_sha256}. `+
        'Independent witness/custody: NOT_VERIFIED; owner TEST-only decision: NOT_GIVEN. '+
        'The Windows private relay is NOT installed. No app gateway GET, gift send, charge or booking write occurred.';
      el('review700QL254Result').dataset.state='error';
    }catch(e){el('review700QL254Result').textContent=e.message+'. All connections remain HELD.';
      el('review700QL254Result').dataset.state='error';}
    finally{button.disabled=false;}}
  function init(){el('review700QL254Recheck')?.addEventListener('click',recheck);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
