// Build 266 — Operations / Supervisor modular runtime (Build 265 extraction retained).
// Hard rule: opening Operations loads no operational dataset. Every workstream is explicit/manual and no module creates a polling interval.
(function bootOperationsApp(globalScope){
  'use strict';
  const core=globalScope.RosieAppCore||{};
  const loader=core.ModuleLoader,resolver=core.ModuleResolver,api=core.ApiClient;
  const $=(id)=>document.getElementById(id);
  let currentKey=null,currentInstance=null;
  const modulePaths={
    today:'/apps/operations/today-module.js?v=20260829build266',
    schedule:'/apps/operations/schedule-module.js?v=20260829build266',
    blocks:'/apps/operations/blocks-module.js?v=20260829build266',
    assignments:'/apps/operations/assignments-module.js?v=20260829build266',
    live:'/apps/operations/live-module.js?v=20260829build266'
  };
  function status(message,type=''){const box=$('operationsStatus');box.hidden=!message;box.className=`notice ${type}`.trim();box.textContent=message||'';}
  function setMode(key){
    currentKey=key||null;
    document.querySelectorAll('[data-operations-module]').forEach((b)=>b.setAttribute('aria-current',b.dataset.operationsModule===key?'true':'false'));
    $('runtimeMode').textContent=key?`AWAKE: ${key.toUpperCase()}`:'IDLE';
    $('runtimeReason').textContent=key?'Only the selected workstream is loaded. Refresh remains manual.':'No operational dataset has been requested.';
  }
  async function openModule(key){
    if(!modulePaths[key])return;
    currentInstance?.suspend?.(); currentInstance=null;
    setMode(key); $('operationsHost').innerHTML='<div class="notice">Loading selected workstream once…</div>'; status('');
    try{
      const mod=await loader.load(`operations-${key}`,modulePaths[key]);
      currentInstance=await mod.mount({host:$('operationsHost'),api});
      status(`${key[0].toUpperCase()+key.slice(1)} loaded. No automatic refresh timer was started.`,'ok');
    }catch(error){$('operationsHost').innerHTML='<div class="notice bad">This workstream could not load. Use its legacy screen while the error is repaired.</div>';status(error.message||'Could not load workstream.','bad');}
  }
  function bind(){
    document.querySelectorAll('[data-operations-module]').forEach((button)=>button.addEventListener('click',()=>openModule(button.dataset.operationsModule)));
    $('sleepOperations').addEventListener('click',()=>{currentInstance?.suspend?.();currentInstance=null;$('operationsHost').innerHTML='<div class="idle-panel"><strong>Operations is asleep.</strong><p class="mini">No workstream is selected and no automatic network activity is running.</p></div>';setMode(null);status('Operational modules suspended.','ok');});
    document.addEventListener('visibilitychange',()=>currentInstance?.setVisibility?.(!document.hidden));
  }
  async function boot(){
    if(!loader||!resolver||!api)throw new Error('Build 266 app-core did not load.');
    bind();setMode(null);
    await globalScope.AdminShell.boot({pageKey:'app-operations',onReady:async({actor})=>{
      await resolver.loadRuntimeFlags();
      if(!resolver.canAccess('operations',actor)){location.replace('/app/');return;}
      resolver.remember('operations');status('Operations ready. Choose a workstream when you need it.','ok');
    }});
  }
  boot().catch((error)=>status(error.message||'Could not start Operations App.','bad'));
})(window);
