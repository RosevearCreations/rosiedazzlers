// Build 432 — Detailer Mobile & Staff Workflow Refinement.
// DOM-only convenience layer. No API calls, background polling, automatic job/task mutation,
// role escalation, or persistent business-state storage is introduced here.
(function bootBuild432StaffWorkflow(globalScope){
  'use strict';

  const doc=globalScope.document;
  if(!doc||!doc.body)return;

  const page=String(doc.body.dataset.page||'');
  const SESSION_PREFIX='rd:b432:';

  function sessionGet(key){
    try{return globalScope.sessionStorage.getItem(SESSION_PREFIX+key)||'';}catch(_error){return '';}
  }
  function sessionSet(key,value){
    try{globalScope.sessionStorage.setItem(SESSION_PREFIX+key,String(value||''));}catch(_error){}
  }
  function sessionRemove(key){
    try{globalScope.sessionStorage.removeItem(SESSION_PREFIX+key);}catch(_error){}
  }
  function clickCanonical(target){
    if(!target||target.disabled)return false;
    target.click();
    return true;
  }
  function detailer(){
    const jobsList=doc.getElementById('jobsList');
    const nextLabel=doc.getElementById('workflowNextLabel');
    const nextButton=doc.getElementById('workflowNextAction');
    const mobileNext=doc.getElementById('mobileNextAction');
    const resumeButton=doc.getElementById('workflowResumeJob');
    const connection=doc.getElementById('workflowConnection');
    if(!jobsList||!nextLabel||!nextButton||!mobileNext||!resumeButton||!connection)return;

    const actionOrder=['accept','dispatch','arrive','start','pause','resume','complete'];
    const actionLabels={accept:'Accept job',dispatch:'On my way',arrive:'Arrived',start:'Start job',pause:'Pause job',resume:'Resume job',complete:'Complete job'};

    function selectedButton(){
      return jobsList.querySelector('[data-job-id][aria-current="true"]');
    }
    function currentActionButton(action){
      return doc.querySelector('[data-job-action="'+action+'"]');
    }
    function browserConnectionText(){
      return globalScope.navigator&&globalScope.navigator.onLine===false
        ? 'Browser reports offline. Nothing is queued or replayed automatically; reconnect and use the existing manual action again.'
        : 'Browser reports online. The server remains authoritative for every job action.';
    }
    function updateResume(){
      const remembered=sessionGet('detailer:last-job');
      const candidate=remembered?jobsList.querySelector('[data-job-id="'+CSS.escape(remembered)+'"]'):null;
      resumeButton.disabled=!candidate;
      resumeButton.dataset.jobId=candidate?remembered:'';
      resumeButton.textContent=candidate?'Resume last viewed assigned job':'No previous assigned job in this tab';
    }
    function updateNext(){
      const selected=selectedButton();
      if(selected&&selected.dataset.jobId)sessionSet('detailer:last-job',selected.dataset.jobId);
      const available=actionOrder.map((action)=>({action,button:currentActionButton(action)})).find((entry)=>entry.button&&!entry.button.disabled);
      if(!selected){
        nextLabel.textContent='Choose an assigned job to see the next available action.';
        nextButton.disabled=true;
        mobileNext.disabled=true;
        nextButton.dataset.action='';
        mobileNext.dataset.action='';
      }else if(available){
        const label=actionLabels[available.action]||'Continue';
        nextLabel.textContent='Next available canonical action: '+label+'.';
        nextButton.disabled=false;
        mobileNext.disabled=false;
        nextButton.dataset.action=available.action;
        mobileNext.dataset.action=available.action;
        nextButton.textContent=label;
        mobileNext.textContent=label;
      }else{
        const blocked=[...doc.querySelectorAll('[data-job-action][disabled][title]')].map((button)=>String(button.title||'').trim()).find(Boolean);
        nextLabel.textContent=blocked||'No workflow action is currently available. Refresh or review the selected job evidence.';
        nextButton.disabled=true;
        mobileNext.disabled=true;
        nextButton.dataset.action='';
        mobileNext.dataset.action='';
        nextButton.textContent='Next action unavailable';
        mobileNext.textContent='Next action';
      }
      connection.textContent=browserConnectionText();
      updateResume();
    }
    function runNext(event){
      const action=String(event.currentTarget.dataset.action||'');
      if(!action)return;
      clickCanonical(currentActionButton(action));
    }

    nextButton.addEventListener('click',runNext);
    mobileNext.addEventListener('click',runNext);
    resumeButton.addEventListener('click',()=>{
      const jobId=String(resumeButton.dataset.jobId||'');
      if(!jobId)return;
      const candidate=jobsList.querySelector('[data-job-id="'+CSS.escape(jobId)+'"]');
      clickCanonical(candidate);
    });

    jobsList.addEventListener('click',(event)=>{
      const button=event.target.closest('[data-job-id]');
      if(button&&button.dataset.jobId)sessionSet('detailer:last-job',button.dataset.jobId);
    });

    const observer=new MutationObserver(updateNext);
    observer.observe(jobsList,{childList:true,subtree:true,attributes:true,attributeFilter:['aria-current','disabled','title']});
    const actions=doc.getElementById('workflowActions');
    if(actions)observer.observe(actions,{subtree:true,attributes:true,attributeFilter:['disabled','title']});
    globalScope.addEventListener('online',updateNext);
    globalScope.addEventListener('offline',updateNext);
    updateNext();
  }

  function operations(){
    const resume=doc.getElementById('operationsResumeLast');
    const label=doc.getElementById('operationsResumeLabel');
    if(!resume||!label)return;
    function update(){
      const remembered=sessionGet('operations:last-workstream');
      const candidate=remembered?doc.querySelector('[data-operations-module="'+CSS.escape(remembered)+'"]'):null;
      resume.disabled=!candidate;
      resume.dataset.workstream=candidate?remembered:'';
      label.textContent=candidate
        ? 'Last workstream in this tab: '+String(candidate.textContent||remembered).trim()+'.'
        : 'Choose a workstream once and this tab can offer a manual resume shortcut.';
    }
    doc.addEventListener('click',(event)=>{
      const button=event.target.closest('[data-operations-module]');
      if(!button)return;
      sessionSet('operations:last-workstream',button.dataset.operationsModule||'');
      update();
    });
    resume.addEventListener('click',()=>{
      const key=String(resume.dataset.workstream||'');
      if(!key)return;
      clickCanonical(doc.querySelector('[data-operations-module="'+CSS.escape(key)+'"]'));
    });
    update();
  }

  function adminToday(){
    const reset=doc.getElementById('adminTodayResetFilters');
    const state=doc.querySelector('[data-b432-filter-state]');
    const ids=['urgencyFilter','ownershipFilter','timingFilter'];
    if(!reset||!state||ids.some((id)=>!doc.getElementById(id)))return;

    let restored=false;
    for(const id of ids){
      const select=doc.getElementById(id);
      const remembered=sessionGet('admin-today:'+id);
      if(remembered&&[...select.options].some((option)=>option.value===remembered)){
        select.value=remembered;
        restored=true;
      }
      select.addEventListener('change',()=>{
        sessionSet('admin-today:'+id,select.value);
        state.textContent='Filters are remembered only in this browser tab. No server preference was changed.';
      });
    }
    if(restored){
      for(const id of ids)doc.getElementById(id).dispatchEvent(new Event('change',{bubbles:true}));
      state.textContent='Session-only filters restored for this tab.';
    }
    reset.addEventListener('click',()=>{
      for(const id of ids){
        const select=doc.getElementById(id);
        select.value='';
        sessionRemove('admin-today:'+id);
        select.dispatchEvent(new Event('change',{bubbles:true}));
      }
      state.textContent='Session-only filters cleared. No server data was changed.';
    });
  }

  if(page==='app-detailer')detailer();
  if(page==='app-operations')operations();
  if(page==='admin-today')adminToday();
})(window);
