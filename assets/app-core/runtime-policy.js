// Build 264 — deterministic client runtime policy. No polling is created here.
(function attachRosieRuntimePolicy(globalScope){
  'use strict';
  const OPEN_STAGES=new Set(['arrived','detailing','paused']);
  const READY_STAGES=new Set(['accepted','dispatched']);
  const CLOSED_STAGES=new Set(['awaiting_payment','completed','cancelled','declined']);
  function text(v){return String(v||'').trim().toLowerCase();}
  function stage(job){return text(job?.current_workflow_stage || job?.job_status || job?.status);}
  function isOpen(job){return !!job && (text(job.job_status)==='in_progress' || OPEN_STAGES.has(stage(job)));}
  function isReady(job){return !!job && !isOpen(job) && (text(job.job_status)==='scheduled' || READY_STAGES.has(stage(job)) || text(job.detailer_response_status)==='accepted');}
  function isClosed(job){return !!job && (['completed','cancelled'].includes(text(job.job_status)) || CLOSED_STAGES.has(stage(job)));}
  function chooseActive(jobs){return (Array.isArray(jobs)?jobs:[]).find(isOpen)||null;}
  function deriveDetailer({jobs=[],selectedJob=null,documentVisible=true}={}){
    const list=Array.isArray(jobs)?jobs:[];
    const active=chooseActive(list);
    const selected=selectedJob||active||null;
    const anyReady=list.some(isReady);
    const selectedOpen=isOpen(selected);
    const selectedClosed=isClosed(selected);
    const mode=selectedOpen?'live':active?'live':anyReady||list.length?'ready':'idle';
    return Object.freeze({
      mode,
      active_job_count:list.filter(isOpen).length,
      active_job_id:active?.id||null,
      selected_job_id:selected?.id||null,
      has_assigned_jobs:list.length>0,
      has_ready_jobs:anyReady,
      selected_job_open:selectedOpen,
      selected_job_closed:selectedClosed,
      live_job_monitoring:false,
      automatic_refresh:false,
      timed_sync:false,
      photo_capture:selectedOpen,
      media_upload:selectedOpen,
      inventory_capture:selectedOpen,
      customer_live_status:selectedOpen && selected?.progress_enabled===true,
      may_load_live_module:selectedOpen && documentVisible===true,
      idle_reason:list.length?'no_open_job':'no_assigned_or_active_job'
    });
  }
  globalScope.RosieAppCore=globalScope.RosieAppCore||{};
  globalScope.RosieAppCore.RuntimePolicy={OPEN_STAGES,READY_STAGES,CLOSED_STAGES,stage,isOpen,isReady,isClosed,chooseActive,deriveDetailer};
})(window);
