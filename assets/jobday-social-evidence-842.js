// Build 842 — owner-supervised job-day device, derivative and delivery evidence.
(function(g){
  'use strict';
  const d=g.document;if(!d||!d.getElementById('job842Refresh'))return;
  const $=id=>d.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let busy=false,latest=[];
  function status(t,kind='soft'){$('job842Status').textContent=t;$('job842Status').className='notice '+kind;}
  function booking(){return $('job841Select')?.value||'';}
  async function api(method,body){
    const id=booking();if(!id)throw Error('Select an active/previous job in Create from Job first.');
    const uri='/api/admin/jobday_social_evidence_842'+(method==='GET'?'?booking_id='+encodeURIComponent(id):'');
    const r=await g.AdminAuth.fetchWithAuth(uri,{method,cache:'no-store',...(body?{headers:{'Content-Type':'application/json'},body:JSON.stringify({booking_id:id,...body})}:{})});
    const out=await r.json().catch(()=>({}));if(!r.ok||!out.ok)throw Error(out.error||(out.blockers||[]).join(' ')||`Request failed (${r.status})`);return out;
  }
  function render(out){
    latest=out.posts||[];
    const selector=$('job842Post');
    selector.innerHTML='<option value="">Choose a DAIP-tagged Draft</option>'+latest.filter(p=>p.status==='draft'&&!p.media_attached).map(p=>`<option value="${esc(p.id)}">${esc(p.platform)} · ${esc(p.id.slice(0,8))} · source ${esc(p.source_id?.slice(0,8)||'unknown')}</option>`).join('');
    const gate=out.handoff?.ready?'DAIP source and consent gates currently READY':'DAIP HOLD: '+(out.handoff?.reason||'Approval pending');
    const rows=[`<article class="readiness-item"><strong>${esc(gate)}</strong><p class="mini">Independent public-derivative lineage and original device acceptance are not inferred.</p></article>`];
    for(const r of out.device_reviews||[]){rows.push(`<article class="readiness-item"><strong>Original-device owner observation · ${esc(r.created_at||'')}</strong><p class="mini">${esc(r.summary)}</p><p class="mini">Owner-attested only; independent acceptance HOLD.</p></article>`);}
    for(const p of latest){rows.push(`<article class="readiness-item"><strong>${esc(p.platform)} · ${esc(p.status)}</strong><p class="mini">${esc(p.media_attached?'Public derivative owner-attached':'Metadata-only draft')} · ${esc(p.evidence)}${p.delivery_at?' · '+esc(p.delivery_at):''}</p>${p.external_post_url?`<p class="mini">External post URL reported; verify independently on the platform.</p>`:''}</article>`);}
    $('job842Timeline').innerHTML=rows.join('');
    status(`${latest.length} DAIP-tagged social draft(s), ${(out.device_reviews||[]).length} original-device observation(s). No private uploads or credentials returned.`,'ok');
  }
  async function run(button,fn){if(busy)return;busy=true;button.disabled=true;try{await fn();}catch(e){status(e.message||'Owner review could not complete. No publishing occurred.','bad');}finally{busy=false;button.disabled=false;}}
  async function refresh(){status('Inspecting source consent, original device notes and social delivery attempts…');render(await api('GET'));}
  $('job842Refresh').addEventListener('click',()=>run($('job842Refresh'),refresh));
  $('job842Record').addEventListener('click',()=>run($('job842Record'),async()=>{
    const reference=$('job842DeviceRef').value.trim();
    if(!reference||!$('job842Accessibility').checked||!$('job842Recovery').checked)throw Error('Please complete the device review checklist and its non-sensitive evidence reference.');
    if(!confirm('Record this as an owner-observed device outcome only? It does NOT certify real device acceptance.'))return;
    await api('POST',{action:'record_device_observation',device_type:$('job842Device').value,result:$('job842Result').value,evidence_reference:reference,accessibility_checked:true,recovery_checked:true});
    await refresh();
  }));
  $('job842Attach').addEventListener('click',()=>run($('job842Attach'),async()=>{
    const photo=$('job842PhotoId').value.trim(),reference=$('job842Lineage').value.trim(),id=$('job842Post').value;
    if(!id||!photo||!reference||!$('job842LineageAck').checked||!$('job842PrivacyAck').checked)throw Error('Choose the draft/public Photo Studio image and attest its verified source, export and privacy checks.');
    if(!confirm('Attach this owner-attested PUBLIC image to the review-only draft? No private source is copied and nothing is posted.'))return;
    await api('POST',{action:'attach_public_derivative',post_id:id,photo_id:photo,lineage_reference:reference,lineage_attested:true,privacy_review_attested:true});
    await refresh();$('refreshBtn')?.click();
  }));
  $('job841Select')?.addEventListener('change',()=>{$('job842Post').innerHTML='<option value="">Inspect selected job first</option>';$('job842Timeline').textContent='Job changed. Select Inspect selected job evidence.';status('Refresh Build 842 evidence for this job.');});
})(window);
