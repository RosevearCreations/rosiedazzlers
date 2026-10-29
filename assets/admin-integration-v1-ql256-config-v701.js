// Build 701: owner-only read-only binding inventory. Never renders secret values.
(()=>{
  const el=document.getElementById.bind(document);
  async function inspect(){
    const button=el('review701QL256Inspect'),out=el('review701QL256Result');
    if(!button||!out)return;button.disabled=true;
    out.textContent='Inspecting names and validity only; no secret values requested…';
    try{
      const r=await fetch('/api/admin/integration_v1_ql256_config_inventory',{
        method:'GET',credentials:'same-origin',cache:'no-store'});
      if(!r.ok)throw Error(`Owner-only inspection returned HTTP ${r.status}`);
      const data=await r.json();if(data.ok!==true||!Array.isArray(data.bindings))
        throw Error('Configuration report unavailable');
      const rows=data.bindings.map(row=>`${row.name}: ${row.configured?'PRESENT / VALID FORMAT':'MISSING / INVALID FORMAT'}`);
      out.textContent=`QL-256 runtime inventory (values always hidden):\n${rows.join('\n')}\n`+
        `Signer: ${data.signer_provisioning_decision}; private custodian/witness: NOT_VERIFIED. `+
        'Runtime presence is not trusted identity. Original gift HOLD and integration DISCONNECTED remain.';
      out.dataset.state='ok';
    }catch(e){out.textContent=`${e.message}. No change to HOLD.`;out.dataset.state='error';}
    finally{button.disabled=false;}
  }
  function init(){el('review701QL256Inspect')?.addEventListener('click',inspect);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
