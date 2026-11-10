// Build 841: accessible role-specific manual exception recovery; DOM-only.
// No timer, offline queue, local customer record or automatic mutation/replay.
(function(g){'use strict';
  const d=g.document,root=d?.querySelector('[data-jobday-841]');if(!root)return;
  const role=root.dataset.jobdayRole;
  const status=root.querySelector('[data-jobday-state]');
  const next=root.querySelector('[data-jobday-next]');
  const steps={
    customer:{online:'Connected to the internet. Refresh to verify the current server status; unsent actions were not saved or replayed.',offline:'You appear offline. The last visible job update may be old. Do not resubmit an approval or payment until you reconnect and refresh.',next:'Open your updates and messages. If a decision or signoff failed, refresh first and check whether it was already recorded.'},
    detailer:{online:'Connected to the internet. Refresh & reconcile your assigned job before continuing. No offline job action will be replayed.',offline:'You appear offline. Job actions and uploads are held. Keep private notes off shared devices, reconnect, then refresh & reconcile.',next:'Choose an assigned job, check arrival/worksite evidence, and use the existing canonical action buttons only when enabled.'}
  }[role];if(!steps)return;
  function announce(){const online=g.navigator?.onLine!==false;status.dataset.online=String(online);status.textContent=online?steps.online:steps.offline;next.textContent=steps.next;}
  function focusTarget(selector){const node=d.querySelector(selector);if(!node)return false;node.scrollIntoView({behavior:'auto',block:'start'});if(!node.hasAttribute('tabindex'))node.setAttribute('tabindex','-1');node.focus({preventScroll:true});return true;}
  root.addEventListener('click',event=>{
    const control=event.target.closest('[data-jobday-action]');if(!control)return;
    const action=control.dataset.jobdayAction;
    if(action==='refresh'){
      if(g.navigator?.onLine===false){status.textContent=steps.offline;status.focus();return;}
      const button=d.querySelector(role==='detailer'?'#refreshJobs':'#refreshProgressBtn');
      if(button&&!button.disabled){button.click();status.textContent='Manual refresh requested. Wait for the current source response before deciding to repeat an action.';}
      else status.textContent='Refresh is unavailable. Check your connection and role access.';
      status.focus();return;
    }
    const targets=role==='detailer'?{jobs:'#jobsList',onsite:'#onsite746Panel',exception:'#quality749Panel',progress:'#liveJobHost'}:{updates:'#updatesList',message:'#commentForm',signoff:'#signoffForm',summary:'#completedSummaryBox'};
    if(!focusTarget(targets[action])){status.textContent='That section is not available yet. Refresh the current job before continuing.';status.focus();}
  });
  g.addEventListener('online',announce);g.addEventListener('offline',announce);
  if(role==='customer'){
    const progress=d.querySelector('#pageNotice');
    if(progress)new MutationObserver(()=>{if(/error|failed|could not|offline|unavailable/i.test(progress.textContent||''))next.textContent='An action may not have saved. Reconnect, refresh and check the live record before retrying exactly once.';}).observe(progress,{childList:true,subtree:true,characterData:true});
  }
  announce();
})(window);
