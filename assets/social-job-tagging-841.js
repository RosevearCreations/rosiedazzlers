// Build 841: deliberate, metadata-only job source tagging for DAIP/social drafts.
(function(g){
  'use strict';
  const d=g.document;if(!d)return;
  const $=id=>d.getElementById(id);
  const els={status:$('job841Status'),jobs:$('job841Select'),media:$('job841Media'),tag:$('job841Tag'),draft:$('job841Draft'),intake:$('job841Intake')};
  if(!els.status||!els.jobs||!els.media)return;
  const state={bookingId:'',mediaId:'',projectId:'',tagged:false,busy:false};
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function note(message,kind='soft'){els.status.className='notice '+kind;els.status.textContent=message;}
  function controls(){els.tag.disabled=state.busy||!state.bookingId||!state.mediaId||!state.projectId;els.draft.disabled=state.busy||!state.tagged;}
  function resetSource(){state.mediaId='';state.projectId='';state.tagged=false;els.media.textContent='Load uploads for this job.';els.intake.href='/admin-daip-media.html';$('job841ProjectLink').href='/admin-creative-projects.html';controls();}
  async function api(path,method='GET',body){
    const r=await g.AdminAuth.fetchWithAuth(path,{method,cache:'no-store',...(body?{headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});
    const out=await r.json().catch(()=>({}));if(!r.ok||out.ok===false)throw new Error(out.error||`Request failed (${r.status})`);return out;
  }
  async function run(button,task){if(state.busy)return;state.busy=true;button.disabled=true;controls();try{await task();}catch(err){note(err.message||'Action failed. Nothing was published.','bad');}finally{state.busy=false;controls();}}
  async function loadJobs(){
    note('Loading up to 30 recent authorized jobs…');
    const data=await api('/api/admin/social_job_sources');
    const rows=data.bookings||[];
    els.jobs.innerHTML='<option value="">Choose active or previous job</option>'+rows.map(b=>`<option value="${esc(b.id)}">${esc(b.service_date||'Date pending')} · ${esc(b.package_code||'Detail')} · ${esc(b.job_status||b.status||'Pending')}</option>`).join('');
    state.bookingId='';resetSource();note(rows.length?`${rows.length} jobs loaded. Choose one and load its uploads.`:'No recent jobs found. Use your booking workflow to create a job first.');
  }
  async function inspectJob(){
    const id=els.jobs.value;state.bookingId=id;resetSource();if(!id){note('Choose an authorized job first.','warn');return;}
    note('Loading upload metadata. Original images stay private…');
    const out=await api('/api/admin/social_job_sources?booking_id='+encodeURIComponent(id));
    if(!out.bookings?.length)throw new Error('Job no longer exists. Refresh choices.');
    const rows=out.media||[];
    els.media.innerHTML=rows.length?rows.map(m=>`<label class="readiness-item" style="display:flex;gap:9px;align-items:start;cursor:pointer"><input type="radio" name="job841MediaPick" value="${esc(m.id)}" style="margin-top:5px"><span><strong>${esc(m.kind||'Photo')} · ${esc(m.stage||'General')}</strong><span class="kicker" style="display:block">${esc(m.caption||'Untitled private upload')}</span><span class="kicker" style="display:block">${esc(m.visibility||'Private')} · ${esc(m.review_status||'Review status not recorded')}</span></span></label>`).join(''):'<div class="notice warn">No uploads for this job. Upload in the Detailer/Progress workspace first.</div>';
    const project=await api('/api/admin/creative_project_booking_link?booking_id='+encodeURIComponent(id));
    if(project.project?.id){state.projectId=project.project.id;els.intake.href='/admin-daip-media.html?project_id='+encodeURIComponent(state.projectId);$('job841ProjectLink').href='/admin-creative-projects.html?project_id='+encodeURIComponent(state.projectId);}
    controls();note(rows.length?`${rows.length} upload(s) found. Select one, then link/tag it in DAIP.`:'Job loaded, but no upload is available.','soft');
  }
  function selectedMedia(){const id=d.querySelector('input[name="job841MediaPick"]:checked')?.value||'';state.mediaId=id;state.tagged=false;controls();}
  async function openProject(){
    if(!state.bookingId){note('Choose and load a job first.','warn');return;}
    note('Linking a private Creative Project to this job…');
    const out=await api('/api/admin/creative_project_booking_link','POST',{booking_id:state.bookingId});
    if(!out.project?.id)throw new Error('Creative Project not available.');
    state.projectId=out.project.id;state.tagged=false;els.intake.href='/admin-daip-media.html?project_id='+encodeURIComponent(state.projectId);$('job841ProjectLink').href='/admin-creative-projects.html?project_id='+encodeURIComponent(state.projectId);
    note(out.created?'Private DAIP Creative Project created. Select the upload and tag it.':'Existing private DAIP Creative Project linked. Select the upload and tag it.','ok');
  }
  async function tag(){
    if(!state.mediaId||!state.projectId)throw new Error('Choose one upload and link its DAIP Creative Project first.');
    const out=await api('/api/admin/social_job_sources','POST',{action:'tag',booking_id:state.bookingId,media_id:state.mediaId,project_id:state.projectId});
    state.tagged=out.tagged===true;note(state.tagged?'Source ID tagged in the DAIP project. No image was copied or published. You can create review-only social drafts.':'Source tag did not save.','ok');
  }
  async function draft(){
    if(!state.tagged)throw new Error('Tag the private source in DAIP first.');
    const caption=$('job841Caption').value.trim();if(!caption)throw new Error('Write a customer-safe caption first.');
    const platforms=[...d.querySelectorAll('input[name="job841Platform"]:checked')].map(x=>x.value);if(!platforms.length)throw new Error('Choose a platform for review.');
    const out=await api('/api/admin/social_job_sources','POST',{action:'draft',booking_id:state.bookingId,media_id:state.mediaId,project_id:state.projectId,caption,platforms});
    note(`${out.count||0} review-only draft(s) saved. No private image attached; inspect the Draft queue below and complete public consent/derivative review before any dispatch.`,'ok');
    $('refreshBtn')?.click();
  }
  $('job841Reload').addEventListener('click',()=>run($('job841Reload'),loadJobs));
  $('job841Inspect').addEventListener('click',()=>run($('job841Inspect'),inspectJob));
  $('job841Project').addEventListener('click',()=>run($('job841Project'),openProject));
  els.tag.addEventListener('click',()=>run(els.tag,tag));
  els.draft.addEventListener('click',()=>run(els.draft,draft));
  els.jobs.addEventListener('change',()=>{state.bookingId=els.jobs.value;resetSource();note('Job chosen. Select Load uploads to inspect its current source state.');});
  els.media.addEventListener('change',selectedMedia);
  controls();
})(window);
