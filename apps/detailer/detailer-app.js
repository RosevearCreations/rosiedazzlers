// Historical Build 264 live bundle token: /apps/detailer/live-job-module.js?v=20260825build264
// Build 266 — Detailer Mobile App shell with role/module ceiling and cached runtime flags.
// Acceptance rule: no eligible active job = zero recurring live-job network activity.
(function bootDetailerApp(globalScope){
  'use strict';
  const core=globalScope.RosieAppCore||{};
  const api=core.ApiClient;
  const policy=core.RuntimePolicy;
  const loader=core.ModuleLoader;
  const resolver=core.ModuleResolver;
  const $=(id)=>document.getElementById(id);
  const esc=(v)=>String(v??'').replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let actor=null,jobs=[],selected=null,liveModule=null,currentPolicy=null;

  function status(message,type=''){
    const box=$('appStatus');box.hidden=!message;box.className=`notice ${type}`.trim();box.textContent=message||'';
  }
  function modeLabel(mode){return mode==='live'?'LIVE JOB':mode==='ready'?'READY / STANDBY':'IDLE';}
  function jobStage(job){return policy.stage(job)||'pending';}
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
    $('jobSummary').innerHTML=selected?`<strong>${esc(selected.customer_name||'Customer')}</strong><br>${esc(selected.service_date||'')} · ${esc(selected.start_slot||'')} · ${esc(selected.package_code||'')}<br>Stage: ${esc(jobStage(selected))}<br>Progress: ${selected.progress_enabled?'enabled':'not enabled'}`:'Choose an assigned job.';
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
  function selectJob(id){
    selected=jobs.find((job)=>String(job.id)===String(id))||null;
    renderJobs();renderSelected();
  }
  async function loadWorkspace({manual=false}={}){
    if(manual)status('Refreshing assigned jobs…');
    try{
      const out=await api.requestJson('/api/detailer/jobs?scope=workspace');
      actor=out.actor||actor;jobs=Array.isArray(out.jobs)?out.jobs:[];
      const keep=selected?.id;
      selected=(keep&&jobs.find((job)=>String(job.id)===String(keep)))||chooseSuggested();
      renderJobs();renderSelected();
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
      const mod=await loader.load('detailer-live-job','/apps/detailer/live-job-module.js?v=20260829build266');
      if(!liveModule){
        liveModule=await mod.mount({host:$('liveJobHost'),job:selected,policy:currentPolicy,api,onJobPatch:(patch)=>{selected={...selected,...patch};const idx=jobs.findIndex((j)=>String(j.id)===String(selected.id));if(idx>=0)jobs[idx]=selected;renderJobs();renderSelected();}});
      }else liveModule.setJob?.(selected,currentPolicy);
      $('liveJobHost').dataset.loaded='true';
      $('runtimeMessage').innerHTML='<strong>Live-job module awake.</strong><p class="mini">The module loaded because this job is open. Feed/photo activity is user-driven; there is still no recurring network timer.</p>';
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
    if(!api||!policy||!loader||!resolver)throw new Error('Build 267 app-core did not load.');
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
