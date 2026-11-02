// Manager-only, on-demand booking quality review. No polling or automatic mutation retry.
(function(){'use strict';
  const $=id=>document.getElementById(id),esc=value=>String(value??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
  let current=null,busy=false;
  const notice=(message,bad=false)=>{const node=$('quality749AdminStatus');node.textContent=message;node.className=`notice ${bad?'bad':'ok'}`;};
  async function post(payload){
    const r=await fetch('/api/admin/quality_review_v749',{method:'POST',headers:{'content-type':'application/json'},credentials:'same-origin',body:JSON.stringify(payload)});
    const data=await r.json().catch(()=>({}));if(!r.ok||!data.ok)throw Error(data.error||`Review unavailable (${r.status})`);return data;
  }
  function render(){
    const s=current?.summary;$('quality749Review').disabled=!s?.submitted||!!s?.review||busy;
    const reworks=s?.issues?.filter(x=>!x.resolved&&['rework','missing_step'].includes(x.kind))||[];
    $('quality749Resolve').disabled=!reworks.length||busy;
    $('quality749Issue').innerHTML='<option value="">Choose loaded issue</option>'+reworks.map(x=>`<option value="${esc(x.id)}">${esc(x.kind)} · ${esc(x.id)}</option>`).join('');
    $('quality749Detail').innerHTML=s?`<strong>QC status: ${esc(s.status)}</strong><br>Revision: ${esc(s.revision)}<br>Private before/after: ${s.photos?.before?'yes':'missing'} / ${s.photos?.after?'yes':'missing'}<br>Missing checks: ${esc(s.missing?.join(', ')||'none')}<br>Open exceptions: ${s.open_issue_count}<br>`+
      (s.issues||[]).map(x=>`<div class="notice ${x.resolved?'ok':'warn'}">${esc(x.kind)} · ${esc(x.id)} · ${x.resolved?'Rework verified':'ON HOLD'}<div>${esc(x.note)}</div></div>`).join('')+
      (s.submitted?`<p>Submitted ${esc(s.submitted.at)} by staff ID ${esc(s.submitted.staff_user_id)}.</p>`:'No current staff submission.')+
      (s.review?`<p>Independent review: ${esc(s.review.decision)} — ${esc(s.review.note)}</p>`:''):'No booking quality source loaded.';
  }
  async function load(){const id=$('quality749BookingId').value.trim();if(!id)return notice('Enter a valid booking UUID.',true);busy=true;try{
    const data=await post({action:'load',booking_id:id});current=data;notice('Current private quality source reconciled. No mutation was made.');
  }catch(e){current=null;notice(e.message,true);}finally{busy=false;render();}}
  async function queue(){try{const data=await post({action:'queue'});$('quality749QueueList').innerHTML=(data.queue||[]).map(x=>`<button type="button" class="btn ghost" data-qc-booking="${esc(x.booking_id)}">${esc(x.booking_id)} · ${esc(x.staff_name)} · ${x.reviewed?'reviewed':'PENDING'}</button>`).join('')||'No review submissions yet.';
    $('quality749QueueList').querySelectorAll('[data-qc-booking]').forEach(b=>b.addEventListener('click',()=>{$('quality749BookingId').value=b.dataset.qcBooking;void load();}));
    notice(`Loaded ${data.queue?.length||0} bounded quality submissions. Damage/claim exceptions remain private.`);
  }catch(e){notice(e.message,true);}}
  async function review(){const s=current?.summary;if(!s?.submitted||s.review)return;
    const decision=$('quality749Decision').value,note=$('quality749ReviewNote').value.trim();
    if(!confirm(`Record ${decision.replaceAll('_',' ')} for this exact quality revision? This does not sign for the customer or settle any claim.`))return;
    try{await post({action:'review',booking_id:current.booking_id,expected_revision:s.revision,submission_id:s.submitted.id,decision,note});notice('Independent decision recorded. Reloading source.');await load();}
    catch(e){notice(`${e.message} Reload to verify before any retry.`,true);}}
  async function resolve(){const s=current?.summary;if(!s)return;
    const issue_id=$('quality749Issue').value,evidence_id=$('quality749Evidence').value.trim(),note=$('quality749ResolveNote').value.trim();
    if(!confirm('Verify only observed rework using genuine private job evidence? Damage, disputes, claims and refunds will remain held.'))return;
    try{await post({action:'resolve',booking_id:current.booking_id,expected_revision:s.revision,issue_id,evidence_id,note,operation_id:crypto.randomUUID()});notice('Independent rework verification recorded. Reloading source.');await load();}
    catch(e){notice(`${e.message} Reload source; do not create duplicate resolution.`,true);}}
  $('quality749Queue')?.addEventListener('click',queue);$('quality749Load')?.addEventListener('click',load);
  $('quality749Review')?.addEventListener('click',review);$('quality749Resolve')?.addEventListener('click',resolve);
})();
