(function(){
  const el=id=>document.getElementById(id);
  const api=(url,opts)=>window.AdminAuth?.fetchWithAuth?
    window.AdminAuth.fetchWithAuth(url,opts):fetch(url,{...opts,credentials:'include'});
  let ready=false;
  function status(message,ok=false){const node=el('review696QL249Result');node.textContent=message;
    node.dataset.state=ok?'ok':'error';}
  function draw(){const source=el('review694SourceRevision')?.value||'',proof=el('review694ProofCommit')?.value||'';
    el('review696QL249Verify').disabled=!ready||!/^[0-9a-f]{40}$/.test(source)||
      !/^[0-9a-f]{40}$/.test(proof)||source===proof;}
  async function refresh(){el('review696QL249Refresh').disabled=true;ready=false;draw();
    try{const r=await api('/api/admin/integration_v1_ql249_github_origin_intake',{cache:'no-store'});
      const d=await r.json().catch(()=>({}));if(!r.ok||!d.ok)throw Error(d.error||'Origin readiness unavailable');
      ready=!!d.independent_public_pins_configured;
      el('review696QL249Guide').textContent=`Independently pinned public metadata: ${ready?'configured':'PENDING'}; `+
        `consumer agreement: ${d.consumer_agreement}; independent origin: ${d.independent_origin_attestation}; `+
        `gateway denials: ${d.original_genuine_gateway_denials}; ${d.connection_state}.`;
      status('No independent GitHub origin attestation or gateway witness is established.',true);
    }catch(e){status(e.message+'. HOLD; no external request made.');}
    finally{el('review696QL249Refresh').disabled=false;draw();}}
  async function verify(){if(el('review696QL249Verify').disabled)return;el('review696QL249Verify').disabled=true;
    try{const body={sourceRevisionSha:el('review694SourceRevision').value,
      proofCommitSha:el('review694ProofCommit').value};
      const r=await api('/api/admin/integration_v1_ql249_github_origin_intake',{
        method:'POST',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      const d=await r.json().catch(()=>({}));if(!r.ok||!d.ok)throw Error(d.error||'Public origin check refused');
      status(`${d.public_github_check}: ${d.reason}. Independent operator attestation, consumer agreement and real gateway evidence remain PENDING.`,!!d.remote_public_metadata_match);
    }catch(e){status(e.message+'. No gateway, gift or payment action occurred.');}finally{draw();}}
  function init(){if(!el('review696QL249Refresh'))return;
    el('review696QL249Refresh').addEventListener('click',refresh);
    el('review696QL249Verify').addEventListener('click',verify);
    for(const id of ['review694SourceRevision','review694ProofCommit'])el(id)?.addEventListener('input',draw);
    refresh();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
