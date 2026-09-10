// Historical Build 264 live bundle token: /apps/detailer/live-job-module.js?v=20260825build264
// Build 271 — Detailer Mobile App shell with role/module ceiling, deep-link job selection and cached runtime flags.
// Build 369 — Canonical pre-visit job readiness is loaded on demand from jobsite_intake; no background polling.
// Acceptance rule: no eligible active job = zero recurring live-job network activity.
(function bootDetailerApp(globalScope){
  'use strict';
  const core=globalScope.RosieAppCore||{};
  const api=core.ApiClient;
  const policy=core.RuntimePolicy;
  const loader=core.ModuleLoader;
  const resolver=core.ModuleResolver;
  const $=(id)=>document.getElementById(id);
  const esc=(v)=>String(v??'').replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
  const requestedJobId=String(new URLSearchParams(location.search).get('job')||'').trim();
  const requestedMessages=location.hash==='#liveJobHost';
  let actor=null,jobs=[],selected=null,liveModule=null,currentPolicy=null,deepLinkHandled=false;
  let readiness={jobId:null,state:'idle',intake:null,error:''};
  let readinessRequest=0;

  function status(message,type=''){
    const box=$('appStatus');box.hidden=!message;box.className=`notice ${type}`.trim();box.textContent=message||'';
  }
  function modeLabel(mode){return mode==='live'?'LIVE JOB':mode==='ready'?'READY / STANDBY':'IDLE';}
  function jobStage(job){return policy.stage(job)||'pending';}
  function readinessValue(value){return value===true?'Confirmed':value===false?'Not confirmed':'Not recorded';}
  function readinessLine(label,value){return `<div class="mini"><strong>${esc(label)}:</strong> ${esc(readinessValue(value))}</div>`;}
  function readinessNote(label,value){const text=String(value??'').trim();return `<div class="mini"><strong>${esc(label)}:</strong> ${esc(text||'Not provided')}</div>`;}
  function renderReadinessCard(){
    if(!selected)return '';
    const serviceRule='<div class="notice"><strong>Service setup rule</strong><div class="mini">Rosie supplies normal detailing water and power. The customer provides an appropriate safe, private/permitted work area; unusual property, runoff, access or utility restrictions must be reviewed before dispatch.</div></div>';
    if(readiness.jobId!==String(selected.id)||readiness.state==='idle')return `<section class="panel" aria-label="Pre-visit site readiness"><strong>Pre-visit site readiness</strong><div class="mini">Readiness has not been loaded for this job.</div>${serviceRule}</section>`;
    if(readiness.state==='loading')return `<section class="panel" aria-label="Pre-visit site readiness"><strong>Pre-visit site readiness</strong><div class="mini">Loading the current staff-authorized job-site intake…</div>${serviceRule}</section>`;
    if(readiness.state==='error')return `<section class="panel" aria-label="Pre-visit site readiness"><strong>Pre-visit site readiness</strong><div class="notice bad">${esc(readiness.error||'Job-site intake could not be loaded.')} No automatic retry was started. Use Refresh assigned jobs or reselect the job to try again.</div>${serviceRule}</section>`;
    const intake=readiness.intake;
    if(!intake)return `<section class="panel" aria-label="Pre-visit site readiness"><strong>Pre-visit site readiness</strong><div class="notice warn">No job-site intake is recorded. Before dispatch, confirm the work area, vehicle access, key handoff, weather/site concerns and special notes.</div>${serviceRule}</section>`;
    const completion=String(intake.intake_complete??'').trim();
    return `<section class="panel" aria-label="Pre-visit site readiness"><strong>Pre-visit site readiness</strong>`+
      `<div class="mini"><strong>Intake status:</strong> ${esc(completion||'Not marked complete')}</div>`+
      readinessLine('Safe work area / vehicle access',intake.vehicle_accessible_and_safe)+
      readinessLine('Keys collected',intake.keys_collected)+
      readinessLine('Key handoff acknowledged',intake.keys_handed_over_acknowledged)+
      readinessLine('Owner present for visual inspection',intake.owner_present_for_visual_inspection)+
      readinessLine('Inspection acknowledged',intake.inspection_acknowledged)+
      readinessLine('Existing condition acknowledged',intake.existing_condition_acknowledged)+
      readinessNote('Existing damage / condition concerns',intake.existing_damage_notes)+
      readinessNote('Weather / site concerns',intake.site_weather_notes)+
      readinessNote('Customer special notes',intake.owner_notes)+
      readinessNote('Detailer pre-job notes',intake.detailer_pre_job_notes)+
      serviceRule+'</section>';
  }
  function renderRuntime(){
    currentPolicy=policy.deriveDetailer({jobs,selectedJob:selected,documentVisible:!document.hidden});
    $('runtimeMode').textContent=modeLabel(currentPolicy.mode);
    $('runtimeMode').className=`mode-${currentPolicy.mode}`;
    $('monitorState').textContent='OFF';
    $('runtimeReason').textContent=currentPolicy.mode==='idle'?'No assigned/open job. All live-job logic is asleep.':currentPolicy.mode==='ready'?'Assigned work exists, but no job is open. No live monitoring is running.':'An open job is selected. Live tools are available on demand; no polling interval is running.';
    if(currentPolicy.may_load_live_module) ensureLiveModule(); else sleepLiveModule();
  }
  function renderJobs(){
    $('jobCount').textContent=`${jobs.length} job${jobs.length===1?'':'s'}`;
    const host=$('jobsList');
    if(!jobs.length){host.innerHTML='<div class="idle-panel"><strong>No current assigned work.</strong><p class="mini">The Detailer App is idle. It will not monitor progress, photos, inventory, or live customer status in the background.</p></div>';return;}
    host.innerHTML=jobs.map((job)=>`<button class="panel job-button" type="button" data-job-id="${esc(job.id)}" aria-current="${selected?.id===job.id?'true':'false'}"><strong>${esc(job.customer_name||'Customer')}</strong><span class="mini">${esc(job.service_date||'')} · ${esc(job.start_slot||'')} · ${esc(job.package_code||'')}</span><span class="mini">Stage: ${esc(jobStage(job))}</span></button>`).join('');
    host.querySelectorAll('[data-job-id]').forEach((button)=>button.addEventListener('click',()=>selectJob(button.dataset.jobId)));
  }
  function renderSelected(){
    $('jobSummary').innerHTML=selected?`<strong>${esc(selected.customer_name||'Customer')}</strong><br>${esc(selected.service_date||'')} · ${esc(selected.start_slot||'')} · ${esc(selected.package_code||'')}<br>Stage: ${esc(jobStage(selected))}<br>Progress: ${selected.progress_enabled?'enabled':'not enabled'}${renderReadinessCard()}`:'Choose an assigned job.';
    const stage=jobStage(selected);
    const allowed=new Set();
    if(selected){
      if(['pending','scheduled',''].includes(stage)) {allowed.add('accept');allowed.add('decline');}
      if(['accepted','scheduled'].includes(stage)) {allowed.add('dispatch');allowed.add('decline');}
      if(stage==='dispatched') allowed.add('arrive');
      if(stage==='arrived') allowed.add('start');
      if(stage==='detailing') {allowed.add('pause');allowed.add('complete');}
      if(stage==='paused') {allowed.add('resume');allowed.add('complete');}
    }
    document.querySelectorAll('[data-job-action]').forEach((button)=>{button.disabled=!selected||!allowed.has(button.dataset.jobAction);});
    renderRuntime();
  }
  function chooseSuggested(){return policy.chooseActive(jobs)||null;}
  async function loadSelectedReadiness(){
    const job=selected;
    const jobId=String(job?.id||'').trim();
    const requestId=++readinessRequest;
    if(!jobId){readiness={jobId:null,state:'idle',intake:null,error:''};renderSelected();return;}
    readiness={jobId,state:'loading',intake:null,error:''};
    renderSelected();
    try{
      const out=await api.requestJson('/api/jobsite_intake_get',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({booking_id:jobId})});
      if(requestId!==readinessRequest||String(selected?.id||'')!==jobId)return;
      readiness={jobId,state:'ready',intake:out.intake||null,error:''};
      renderSelected();
    }catch(error){
      if(requestId!==readinessRequest||String(selected?.id||'')!==jobId)return;
      readiness={jobId,state:'error',intake:null,error:error.message||'Job-site intake could not be loaded.'};
      renderSelected();
    }
  }
  function selectJob(id){
    selected=jobs.find((job)=>String(job.id)===String(id))||null;
    renderJobs();renderSelected();void loadSelectedReadiness();
  }
  function resolveDeepLink(){
    if(deepLinkHandled||!requestedJobId)return null;
    const match=jobs.find((job)=>String(job.id)===requestedJobId)||null;
    deepLinkHandled=true;
    if(!match){status('The linked job is not in this bounded Detailer workspace. Use Refresh assigned jobs or open it from Operations.','warn');return null;}
    return match;
  }
  async function loadWorkspace({manual=false}={}){
    if(manual)status('Refreshing assigned jobs…');
    try{
      const out=await api.requestJson('/api/detailer/jobs?scope=workspace');
      actor=out.actor||actor;jobs=Array.isArray(out.jobs)?out.jobs:[];
      const keep=selected?.id;
      selected=resolveDeepLink()||(keep&&jobs.find((job)=>String(job.id)===String(keep)))||chooseSuggested();
      renderJobs();renderSelected();void loadSelectedReadiness();
      if(out.workspace?.bounded===true && manual) status(`Assigned jobs refreshed. ${jobs.length} bounded workspace job(s) loaded.`,'ok');
      else if(manual)status('Assigned jobs refreshed.','ok');
    }catch(error){status(error.message||'Could not load assigned jobs.','bad');$('jobsList').innerHTML='<div class="notice bad">Assigned jobs could not be loaded. No automatic retry was started.</div>';}
  }
  async function runAction(action){
    if(!selected)return;
    const reason=$('workflowReason').value.trim();
    const body={booking_id:selected.id,action,reason};
    if(action==='arrive'&&navigator.geolocation){
      try{const pos=await new Promise((resolve,reject)=>navigator.geolocation.getCurrentPosition(resolve,reject,{enableHighAccuracy:true,timeout:12000,maximumAge:60000}));body.arrived_latitude=pos.coords.latitude;body.arrived_longitude=pos.coords.longitude;}catch{status('Arrival will continue without device geolocation.','warn');}
    }
    const button=document.querySelector(`[data-job-action="${CSS.escape(action)}"]`);if(button)button.disabled=true;
    try{
      const out=await api.requestJson('/api/detailer/job_action',{method:'POST',body:JSON.stringify(body)});
      if(out.booking){
        const index=jobs.findIndex((job)=>String(job.id)===String(selected.id));
        const merged={...selected,...out.booking};
        if(index>=0)jobs[index]=merged;selected=merged;
      }
      $('workflowReason').value='';
      renderJobs();renderSelected();
      liveModule?.setJob?.(selected,currentPolicy);
      status(`Job updated: ${action}. Local state was updated from the authoritative response; no follow-up polling was started.`,'ok');
    }catch(error){
      status(error.ambiguousMutation?`${error.message} Do not repeat the action until you verify the current job state.`:(error.message||'Could not update job.'),'bad');
    }finally{renderSelected();}
  }
  async function ensureLiveModule(){
    if(!currentPolicy?.may_load_live_module||!selected)return;
    $('liveJobHost').dataset.loaded='loading';
    try{
      const mod=await loader.load('detailer-live-job','/apps/detailer/live-job-module.js?v=20260829build271');
      if(!liveModule){
        liveModule=await mod.mount({host:$('liveJobHost'),job:selected,policy:currentPolicy,api,onJobPatch:(patch)=>{selected={...selected,...patch};const idx=jobs.findIndex((j)=>String(j.id)===String(selected.id));if(idx>=0)jobs[idx]=selected;renderJobs();renderSelected();}});
      }else liveModule.setJob?.(selected,currentPolicy);
      $('liveJobHost').dataset.loaded='true';
      $('runtimeMessage').innerHTML='<strong>Live-job module awake.</strong><p class="mini">The module loaded because this job is open. Feed/photo activity is user-driven; there is still no recurring network timer.</p>';
      if(requestedMessages&&String(selected.id)===requestedJobId){requestAnimationFrame(()=>$('liveJobHost')?.scrollIntoView({block:'start'}));}
    }catch(error){$('liveJobHost').dataset.loaded='false';$('liveJobHost').innerHTML=`<div class="notice bad">Could not load live-job tools: ${esc(error.message||error)}</div>`;}
  }
  function sleepLiveModule(){
    liveModule?.suspend?.();
    $('liveJobHost').dataset.loaded=liveModule?'suspended':'false';
    if(!liveModule)$('liveJobHost').innerHTML='<div class="notice">Live-job tools are asleep and their JavaScript has not been requested.</div>';
    $('runtimeMessage').innerHTML=currentPolicy?.mode==='idle'?'<strong>Idle mode.</strong><p class="mini">No live-job monitoring, photo sync, inventory capture, or customer-progress polling is running.</p>':'<strong>Standby mode.</strong><p class="mini">Assigned work can be reviewed and advanced manually. Live media/feed code stays asleep until the job is opened.</p>';
  }
  function bind(){
    $('refreshJobs').addEventListener('click',()=>loadWorkspace({manual:true}));$('mobileRefreshJobs').addEventListener('click',()=>loadWorkspace({manual:true}));
    document.querySelectorAll('[data-job-action]').forEach((button)=>button.addEventListener('click',()=>runAction(button.dataset.jobAction)));
    document.addEventListener('visibilitychange',()=>{renderRuntime();liveModule?.setVisibility?.(!document.hidden);});
  }
  async function boot(){
    if(!api||!policy||!loader||!resolver)throw new Error('Build 271 app-core did not load.');
    bind();
    await globalScope.AdminShell.boot({pageKey:'app-detailer',onReady:async({actor:currentActor})=>{
      actor=currentActor||null;
      await resolver.loadRuntimeFlags();
      if(!resolver.canAccess('detailer',actor)){location.replace('/app/');return;}
      resolver.remember('detailer');
      globalScope.RosieAppCore.ModuleNavigation?.renderHome?.('detailer');
      await loadWorkspace();
    }});
  }
  boot().catch((error)=>status(error.message||'Could not start Detailer App.','bad'));
})(window);
