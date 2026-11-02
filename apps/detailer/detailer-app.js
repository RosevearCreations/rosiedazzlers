// Historical Build 264 live bundle token: /apps/detailer/live-job-module.js?v=20260825build264
// Build 271 — Detailer Mobile App shell with role/module ceiling, deep-link job selection and cached runtime flags.
// Build 369 — Canonical pre-visit job readiness is loaded on demand from jobsite_intake; no background polling.
// Build 383 — Before-service and completion actions fail closed on booking-scoped field evidence.
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
  const requestedJobId=String(new URLSearchParams(location.search).get('job')||'').trim();
  const requestedMessages=location.hash==='#liveJobHost';
  let actor=null,jobs=[],selected=null,liveModule=null,currentPolicy=null,deepLinkHandled=false;
  let mobile745=null,boardFilter='all',reconciliationRequired=true,wasDisconnected=false,continuityEpoch=0;
  let readiness={jobId:null,state:'idle',intake:null,error:''};
  let readinessRequest=0;
  let workspaceLoading=false;
  let fieldGate={jobId:null,loaded:false,canStart:false,canComplete:false};

  function continuityVerified(){return !reconciliationRequired && navigator.onLine!==false && document.body.dataset.build745Sync==='verified';}
  function continuityState(verified,message){
    reconciliationRequired=!verified;
    document.body.dataset.build745Sync=verified?'verified':'review_required';
    const node=$('build745ContinuityStatus');
    if(node){node.className=`notice ${verified?'ok':'warn'}`;node.textContent=message||(
      verified?'Assignment and job revision verified.':'Snapshot only. Reconnect and manually refresh before any action.');}
    liveModule?.setVisibility?.(verified&&!document.hidden);
    updateActionButtons();
  }

  function status(message,type=''){
    const box=$('appStatus');
    box.hidden=!message;
    box.className=`notice ${type}`.trim();
    box.setAttribute('role',type==='bad'?'alert':'status');
    box.setAttribute('aria-live',type==='bad'?'assertive':'polite');
    box.textContent=message||'';
    if(type==='bad'&&message)box.focus({preventScroll:true});
  }
  function setWorkspaceBusy(busy){
    workspaceLoading=busy===true;
    const list=$('jobsList');
    if(list)list.setAttribute('aria-busy',workspaceLoading?'true':'false');
    for(const id of ['refreshJobs','mobileRefreshJobs']){
      const button=$(id);
      if(!button)continue;
      button.disabled=workspaceLoading;
      button.setAttribute('aria-busy',workspaceLoading?'true':'false');
    }
  }
  function modeLabel(mode){return mode==='live'?'LIVE JOB':mode==='ready'?'READY / STANDBY':'IDLE';}
  function jobStage(job){return policy.stage(job)||'pending';}
  function readinessValue(value){return value===true?'Confirmed':value===false?'Not confirmed':'Not recorded';}
  function readinessLine(label,value){return `<div class="mini"><strong>${esc(label)}:</strong> ${esc(readinessValue(value))}</div>`;}
  function readinessNote(label,value){const text=String(value??'').trim();return `<div class="mini"><strong>${esc(label)}:</strong> ${esc(text||'Not provided')}</div>`;}
  function renderReadinessCard(){
    if(!selected)return '';
    const serviceRule='<div class="notice"><strong>Service setup rule</strong><div class="mini">Rosie supplies normal detailing water and power. The customer provides an appropriate safe, private/permitted work area; unusual property, runoff, access or utility restrictions must be reviewed before dispatch.</div></div>';
    if(readiness.jobId!==String(selected.id)||readiness.state==='idle')return `<section class="panel" aria-label="Pre-visit site readiness"><strong>1–2. Arrival/readiness & keys/access</strong><div class="mini">Readiness has not been loaded for this job.</div>${serviceRule}</section>`;
    if(readiness.state==='loading')return `<section class="panel" aria-label="Pre-visit site readiness"><strong>1–2. Arrival/readiness & keys/access</strong><div class="mini">Loading the current staff-authorized job-site intake…</div>${serviceRule}</section>`;
    if(readiness.state==='error')return `<section class="panel" aria-label="Pre-visit site readiness"><strong>1–2. Arrival/readiness & keys/access</strong><div class="notice bad">${esc(readiness.error||'Job-site intake could not be loaded.')} No automatic retry was started. Use Refresh assigned jobs or reselect the job to try again.</div>${serviceRule}</section>`;
    const intake=readiness.intake;
    if(!intake)return `<section class="panel" aria-label="Pre-visit site readiness"><strong>1–2. Arrival/readiness & keys/access</strong><div class="notice warn">No job-site intake is recorded. Before dispatch, confirm the work area, vehicle access, key handoff, weather/site concerns and special notes.</div>${serviceRule}</section>`;
    const completion=String(intake.intake_complete??'').trim();
    return `<section class="panel" aria-label="Pre-visit site readiness"><strong>1–2. Arrival/readiness & keys/access</strong>`+
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
    if(currentPolicy.may_load_live_module&&continuityVerified()) ensureLiveModule(); else sleepLiveModule();
  }
  function renderJobs(){
    $('jobCount').textContent=`${jobs.length} job${jobs.length===1?'':'s'}`;
    const host=$('jobsList');
    if(!jobs.length){const count=$('build745VisibleCount');if(count)count.textContent='0 shown · schedule order, not route navigation';host.innerHTML='<div class="idle-panel"><strong>No current assigned work.</strong><p class="mini">The Detailer App is idle. It will not monitor progress, photos, inventory, or live customer status in the background.</p></div>';return;}
    const board=mobile745?.mobileBoardGroups745(jobs,{filter:boardFilter})||{groups:[{date:'',label:'Assigned jobs',jobs}],total:jobs.length};
    const count=$('build745VisibleCount');if(count)count.textContent=`${board.total} shown · schedule order, not route navigation`;
    host.innerHTML=board.groups.length?board.groups.map(group=>
      `<section class="build745-day" aria-label="${esc(group.label)}"><h3 class="build745-day-label">${esc(group.label)} · ${group.jobs.length} job${group.jobs.length===1?'':'s'}</h3>`+
      group.jobs.map((job)=>`<button class="panel job-button" type="button" data-job-id="${esc(job.id)}" data-service-date="${esc(job.service_date)}" aria-current="${selected?.id===job.id?'true':'false'}"><strong>${esc(job.customer_name||'Customer')}</strong><span class="mini">${esc(job.start_slot||'Time to confirm')} · ${esc(job.package_code||'Detailing')} · ${esc(job.service_area_municipality||job.city||job.service_area||'Area to verify')}</span><span class="mini">Stage: ${esc(jobStage(job))}${continuityVerified()?'':' · STALE SNAPSHOT — read only'}</span></button>`).join('')+'</section>'
    ).join(''):'<div class="idle-panel"><strong>No assigned jobs in this view.</strong><p class="mini">Change the day filter or refresh your authorized jobs. No bookings were changed.</p></div>';
    host.querySelectorAll('[data-job-id]').forEach((button)=>button.addEventListener('click',()=>selectJob(button.dataset.jobId)));
  }
  function allowedActions(){
    const stage=jobStage(selected);
    return {stage,allowed:new Set(selected?mobile745?.MOBILE_STAGE_ACTIONS745[stage]||[]:[])};
  }
  function updateActionButtons(){
    const {stage,allowed}=allowedActions();
    const gateCurrent=selected&&fieldGate.jobId===String(selected.id)&&fieldGate.loaded===true;
    document.querySelectorAll('[data-job-action]').forEach((button)=>{
      const action=button.dataset.jobAction;
      let enabled=!!selected&&allowed.has(action)&&continuityVerified();
      let reason='';
      if(!continuityVerified())reason='Disconnected or stale. Refresh assigned jobs after reconnecting; actions will not replay.';
      if(action==='start'&&stage==='arrived'&&(!gateCurrent||fieldGate.canStart!==true)){enabled=false;reason='Audited onsite review, customer acknowledgements, arrival photo and saved checklist are required before Start job.';}
      if(action==='complete'&&['detailing','paused'].includes(stage)&&(!gateCurrent||fieldGate.canComplete!==true)){enabled=false;reason='Complete all Build 383 field evidence, including after photos, before completing the job.';}
      button.disabled=!enabled;
      button.title=reason;
    });
  }
  function renderSelected(){
    $('jobSummary').innerHTML=selected?`<strong>${esc(selected.customer_name||'Customer')}</strong><br>${esc(selected.service_date||'')} · ${esc(selected.start_slot||'')} · ${esc(selected.package_code||'')}<br>Area: ${esc(selected.service_area_municipality||selected.city||selected.service_area||'Confirm with office')}<br>Stage: ${esc(jobStage(selected))}<br>Progress: ${selected.progress_enabled?'enabled':'not enabled'}<br><strong>Staff instructions:</strong> ${esc(selected.notes||'No additional service notes recorded.')}${continuityVerified()?'':'<div class="notice warn">Read-only last-seen snapshot; current assignment and instructions must be reverified.</div>'}${renderReadinessCard()}`:'Choose an assigned job.';
    updateActionButtons();
    renderRuntime();
  }
  function chooseSuggested(){return policy.chooseActive(jobs)||null;}
  async function loadSelectedReadiness(){
    const job=selected;
    const jobId=String(job?.id||'').trim();
    const requestId=++readinessRequest;
    if(!jobId){readiness={jobId:null,state:'idle',intake:null,error:''};renderSelected();return;}
    if(!continuityVerified()){readiness={jobId,state:'error',intake:null,error:'Offline or awaiting manual reconciliation. No intake was queried.'};renderSelected();return;}
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
    fieldGate={jobId:String(selected?.id||''),loaded:false,canStart:false,canComplete:false};
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
    if(workspaceLoading)return;
    if(navigator.onLine===false){wasDisconnected=true;continuityState(false,'Offline: last-seen assigned jobs remain visible in this tab only. Nothing can be sent or replayed.');status('Offline. Reconnect and tap Refresh assigned jobs; no request was queued.','warn');renderJobs();renderSelected();return;}
    setWorkspaceBusy(true);
    continuityState(false,'Verifying current staff session, assignments and job revisions. Actions are held.');
    const startedEpoch=continuityEpoch;
    if(manual)status('Refreshing assigned jobs…');
    try{
      const oldId=String(selected?.id||'');
      const oldStage=selected?jobStage(selected):null;
      const out=await api.requestJson('/api/detailer/jobs?scope=mobile_v745');
      if(startedEpoch!==continuityEpoch||navigator.onLine===false)throw new Error('Connection changed during refresh. Manually refresh again to reconcile current jobs.');
      if(out.workspace?.session_verified!==true||out.workspace?.canonical_assignment_only!==true)throw new Error('Mobile assignment verification was not confirmed.');
      actor=out.actor||actor;jobs=Array.isArray(out.jobs)?out.jobs:[];
      const keep=oldId;
      const next=resolveDeepLink()||(keep&&jobs.find((job)=>String(job.id)===String(keep)))||chooseSuggested();
      fieldGate={jobId:String(next?.id||''),loaded:false,canStart:false,canComplete:false};
      selected=next;
      continuityState(true,'Live session and canonical assignments checked. No offline changes were replayed.');
      renderJobs();renderSelected();void loadSelectedReadiness();
      const message=mobile745?.reconciliationMessage745({wasOffline:wasDisconnected,assignmentGone:!!oldId&&!jobs.some(job=>String(job.id)===oldId),stageChanged:!!oldId&&!!selected&&String(selected.id)===oldId&&jobStage(selected)!==oldStage})||'Current assignment verified.';
      if(manual||wasDisconnected||message.includes('no longer'))status(message,!!oldId&&!jobs.some(job=>String(job.id)===oldId)?'warn':'ok');
      wasDisconnected=false;
    }catch(error){
      continuityState(false,'Could not verify the current assignment. Last-seen data is read-only. Manually retry after reconnecting.');
      status(error.message||'Could not load assigned jobs. No automatic retry was started.','bad');
      if(jobs.length){renderJobs();renderSelected();}
      else $('jobsList').innerHTML='<div class="notice bad">Assigned jobs could not be loaded. No automatic retry was started. Use Refresh assigned jobs to retry manually.</div>';
    }finally{
      setWorkspaceBusy(false);
    }
  }
  async function runAction(action){
    if(!selected)return;
    if(!continuityVerified()){status('No change sent. Reconnect, refresh assigned jobs and review the current job first.','warn');return;}
    if(!selected.updated_at){continuityState(false,'Job revision unavailable. Refresh to reverify before any change.');status('The current job revision is missing; no action was sent.','warn');return;}
    if(!allowedActions().allowed.has(action)){status('Action unavailable at the current job stage. No change sent.','warn');return;}
    const stage=jobStage(selected),gateCurrent=fieldGate.jobId===String(selected.id)&&fieldGate.loaded===true;
    if(action==='start'&&stage==='arrived'&&(!gateCurrent||fieldGate.canStart!==true)){status('Before-service evidence is incomplete. Save the onsite review, customer acknowledgements, staff checklist and an arrival photo.','warn');return;}
    if(action==='complete'&&['detailing','paused'].includes(stage)&&(!gateCurrent||fieldGate.canComplete!==true)){status('Completion is blocked until approved-scope, product-use and completion records plus after photos are saved.','warn');return;}
    const reason=$('workflowReason').value.trim();
    const body={booking_id:selected.id,action,reason,client_v745:true,expected_stage:jobStage(selected),expected_updated_at:selected.updated_at};
    if(action==='start')body.expected_intake_updated_at=fieldGate.setupRevision;
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
      continuityState(false,'Job action outcome needs reconciliation. Refresh assigned jobs before any retry.');
      status(error.ambiguousMutation?`${error.message} Do not repeat the action until you verify the current job state.`:(error.message||'Could not update job.'),'bad');
    }finally{renderSelected();}
  }
  async function ensureLiveModule(){
    if(!currentPolicy?.may_load_live_module||!selected)return;
    $('liveJobHost').dataset.loaded='loading';
    try{
      const mod=await loader.load('detailer-live-job','/apps/detailer/live-job-module.js?v=20261102build746');
      if(!continuityVerified()||!currentPolicy?.may_load_live_module)return;
      if(!liveModule){
        liveModule=await mod.mount({host:$('liveJobHost'),job:selected,policy:currentPolicy,api,onJobPatch:(patch)=>{selected={...selected,...patch};const idx=jobs.findIndex((j)=>String(j.id)===String(selected.id));if(idx>=0)jobs[idx]=selected;renderJobs();renderSelected();},onFieldState:(next)=>{fieldGate=next||fieldGate;updateActionButtons();}});
      }else liveModule.setJob?.(selected,currentPolicy);
      $('liveJobHost').dataset.loaded='true';
      $('runtimeMessage').innerHTML='<strong>Build 383 field workflow awake.</strong><p class="mini">The module loaded because this job is open. Field evidence, media and messages are user-driven; there is still no recurring network timer.</p>';
      if(requestedMessages&&String(selected.id)===requestedJobId){requestAnimationFrame(()=>$('liveJobHost')?.scrollIntoView({block:'start'}));}
    }catch(error){fieldGate={jobId:String(selected?.id||''),loaded:false,canStart:false,canComplete:false};updateActionButtons();$('liveJobHost').dataset.loaded='false';$('liveJobHost').innerHTML=`<div class="notice bad">Could not load field workflow tools: ${esc(error.message||error)}</div>`;}
  }
  function sleepLiveModule(){
    liveModule?.suspend?.();
    $('liveJobHost').dataset.loaded=liveModule?'suspended':'false';
    if(!liveModule)$('liveJobHost').innerHTML='<div class="notice">Field workflow tools are asleep and their JavaScript has not been requested.</div>';
    $('runtimeMessage').innerHTML=currentPolicy?.mode==='idle'?'<strong>Idle mode.</strong><p class="mini">No live-job monitoring, photo sync, inventory capture, or customer-progress polling is running.</p>':'<strong>Standby mode.</strong><p class="mini">Assigned work can be reviewed and advanced manually. Field media/feed code stays asleep until the job is opened.</p>';
  }
  function bind(){
    $('refreshJobs').addEventListener('click',()=>loadWorkspace({manual:true}));$('mobileRefreshJobs').addEventListener('click',()=>loadWorkspace({manual:true}));
    document.querySelectorAll('[data-build745-filter]').forEach(button=>button.addEventListener('click',()=>{
      boardFilter=button.dataset.build745Filter;
      document.querySelectorAll('[data-build745-filter]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
      renderJobs();
    }));
    globalScope.addEventListener('offline',()=>{continuityEpoch++;wasDisconnected=true;continuityState(false,'Device offline. Last-seen jobs are read-only; no writes, background retry or replay.');renderJobs();renderSelected();status('Offline: reconnect, then manually refresh assigned jobs to verify changes.','warn');});
    globalScope.addEventListener('online',()=>{continuityEpoch++;wasDisconnected=true;continuityState(false,'Connection returned. Press Refresh assigned jobs to recheck assignment and stage; nothing runs automatically.');renderJobs();renderSelected();status('Connection restored. Review and refresh before any action.','warn');});
    document.querySelectorAll('[data-job-action]').forEach((button)=>button.addEventListener('click',()=>runAction(button.dataset.jobAction)));
    document.addEventListener('visibilitychange',()=>{renderRuntime();liveModule?.setVisibility?.(!document.hidden&&continuityVerified());});
  }
  async function boot(){
    if(!api||!policy||!loader||!resolver)throw new Error('Build 271 app-core did not load.');
    mobile745=await import('/assets/detailer-mobile-dayboard-v745.mjs?v=20261102build745');
    continuityState(false,'Waiting for staff session and assignment verification.');
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
