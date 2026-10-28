(function(){
  const el=id=>document.getElementById(id),api=(url,options)=>window.AdminAuth?.fetchWithAuth?
    window.AdminAuth.fetchWithAuth(url,options):fetch(url,{...options,credentials:'include'});
  function status(message,ok=false){el('review694QL248Result').textContent=message;
    el('review694QL248Result').dataset.state=ok?'ok':'error';}
  function draw(){const s=el('review694SourceRevision').value,p=el('review694ProofCommit').value,
    b=el('review694RawProofBase64').value.trim();
    el('review694QL248Verify').disabled=!/^[0-9a-f]{40}$/.test(s)||
      !/^[0-9a-f]{40}$/.test(p)||s===p||b.length<80||b.length>24000;}
  async function refresh(){el('review694QL248Refresh').disabled=true;
    try{const r=await api('/api/admin/integration_v1_ql248_proof_commit_readiness',{cache:'no-store'});
      const d=await r.json().catch(()=>({}));if(!r.ok||!d.ok)throw Error(d.error||'Unavailable');
      el('review694QL248Guide').textContent=`Source SHA: ${d.source_revision_configured?'configured':'PENDING'}; `+
        `separate proof SHA: ${d.proof_commit_configured?'configured':'PENDING'}; `+
        `raw digest: ${d.raw_proof_digest_configured?'configured':'PENDING'}; `+
        `independent SPKI: ${d.independent_public_pin_configured?'configured':'PENDING'}; `+
        `CI: ${d.source_ci_configured?'configured':'PENDING'}; challenge: ${d.operator_challenge_configured?'configured':'PENDING'}. `+
        `AI Data Platform agreement: ${d.consumer_agreement}. ${d.connection_state}.`;
      status('Only public offline metadata is checkable here; no original gateway witnesses are established.',true);
    }catch(e){status(e.message+'. Fail-closed HOLD.');}
    finally{el('review694QL248Refresh').disabled=false;}}
  async function verify(){if(el('review694QL248Verify').disabled)return;el('review694QL248Verify').disabled=true;
    try{const b={system:'rosiedazzlers',sourceRevisionSha:el('review694SourceRevision').value,
      proofCommitSha:el('review694ProofCommit').value,
      rawProofBase64:el('review694RawProofBase64').value.trim()};
      const r=await api('/api/admin/integration_v1_ql248_proof_commit_readiness',{
        method:'POST',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});
      const d=await r.json().catch(()=>({}));if(!r.ok||!d.ok)throw Error(d.error||'Preflight refused');
      status(`${d.public_metadata_check}: ${d.reason}. Consumer agreement and real gateway witnesses remain PENDING.`,
        !!d.signature_and_raw_digest_match);
    }catch(e){status(e.message+'. No proof saved or gateway contacted.');}finally{draw();}}
  function init(){if(!el('review694QL248Refresh'))return;
    el('review694QL248Refresh').addEventListener('click',refresh);
    el('review694QL248Verify').addEventListener('click',verify);
    for(const id of ['review694SourceRevision','review694ProofCommit','review694RawProofBase64'])
      el(id).addEventListener('input',draw);draw();refresh();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
