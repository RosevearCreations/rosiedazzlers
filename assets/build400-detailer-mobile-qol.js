// Build 400 — additive Detailer Mobile QoL layer.
// This file never changes canonical job state, posts evidence, or performs background network activity.
(function build400DetailerQol(globalScope){
  'use strict';
  if(document.body?.dataset?.page!=='app-detailer') return;

  const host=document.getElementById('liveJobHost');
  const jobsList=document.getElementById('jobsList');
  if(!host) return;

  const style=document.createElement('style');
  style.textContent=`
    .b400-tools{position:sticky;top:8px;z-index:18;display:grid;gap:10px;padding:12px;border:1px solid var(--border);border-radius:16px;background:rgba(8,17,31,.96);backdrop-filter:blur(12px)}
    .b400-tools__head{display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap}
    .b400-tools__grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
    .b400-tools button{min-height:50px;touch-action:manipulation}
    .b400-timer{display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:8px 10px;border:1px solid var(--border);border-radius:12px}
    .b400-timer strong{font-variant-numeric:tabular-nums;font-size:1.15rem;min-width:7ch}
    .b400-target-flash{outline:3px solid rgba(56,189,248,.8)!important;outline-offset:3px}
    @media(max-width:720px){.b400-tools__grid{grid-template-columns:repeat(2,minmax(0,1fr))}.b400-tools{top:4px}.job-actions .btn,[data-job-action]{min-height:50px}}
  `;
  document.head.appendChild(style);

  const panel=document.createElement('section');
  panel.className='b400-tools';
  panel.setAttribute('aria-label','Build 400 field shortcuts');
  panel.innerHTML=`
    <div class="b400-tools__head"><div><span class="badge">Build 400 mobile QoL</span><strong style="display:block;margin-top:5px">Field capture shortcuts</strong></div><span class="mini">No automatic network activity</span></div>
    <div class="b400-tools__grid">
      <button class="btn ghost" type="button" data-b400-target="prepareBeforePhoto">Before photo</button>
      <button class="btn ghost" type="button" data-b400-target="saveFieldChecklist">Checklist</button>
      <button class="btn ghost" type="button" data-b400-target="fieldAddons">Add-ons</button>
      <button class="btn ghost" type="button" data-b400-target="fieldProducts">Materials</button>
      <button class="btn ghost" type="button" data-b400-target="fieldCompletion">Completion</button>
      <button class="btn ghost" type="button" data-b400-target="prepareAfterPhoto">After photo</button>
    </div>
    <div class="b400-timer" aria-label="Local work timer">
      <span class="mini">Local timer</span><strong data-b400-time>00:00</strong>
      <button class="btn ghost small" type="button" data-b400-timer="toggle">Start</button>
      <button class="btn ghost small" type="button" data-b400-timer="reset">Reset</button>
      <span class="mini">Device-only aid; never payroll, billing or job-state evidence.</span>
    </div>`;
  host.parentNode.insertBefore(panel,host);

  function selectedJobId(){return String(jobsList?.querySelector('[data-job-id][aria-current="true"]')?.dataset?.jobId||'unselected');}
  function timerKey(){return `rosie:b400:field-timer:${selectedJobId()}`;}
  function readTimer(){
    try{return JSON.parse(sessionStorage.getItem(timerKey())||'null')||{running:false,startedAt:0,elapsed:0};}
    catch{return {running:false,startedAt:0,elapsed:0};}
  }
  function writeTimer(value){try{sessionStorage.setItem(timerKey(),JSON.stringify(value));}catch{}}
  function timerElapsed(state){return Math.max(0,Number(state.elapsed||0)+(state.running?Date.now()-Number(state.startedAt||Date.now()):0));}
  function format(ms){const total=Math.floor(ms/1000),m=Math.floor(total/60),s=total%60;return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;}
  let frame=0;
  function paintTimer(){
    const state=readTimer();
    panel.querySelector('[data-b400-time]').textContent=format(timerElapsed(state));
    panel.querySelector('[data-b400-timer="toggle"]').textContent=state.running?'Pause':'Start';
    frame=state.running?requestAnimationFrame(paintTimer):0;
  }
  function stopFrame(){if(frame){cancelAnimationFrame(frame);frame=0;}}
  function toggleTimer(){
    stopFrame();
    const state=readTimer();
    if(state.running){state.elapsed=timerElapsed(state);state.running=false;state.startedAt=0;}
    else{state.running=true;state.startedAt=Date.now();}
    writeTimer(state);paintTimer();
  }
  function resetTimer(){stopFrame();writeTimer({running:false,startedAt:0,elapsed:0});paintTimer();}

  function resolveTarget(id){return host.querySelector(`#${CSS.escape(id)}`);}
  function updateShortcuts(){
    panel.querySelectorAll('[data-b400-target]').forEach((button)=>{button.disabled=!resolveTarget(button.dataset.b400Target);});
  }
  function revealTarget(id){
    const target=resolveTarget(id);
    if(!target) return;
    target.scrollIntoView({behavior:'smooth',block:'center'});
    if(/^(TEXTAREA|INPUT|SELECT)$/.test(target.tagName)) target.focus({preventScroll:true});
    else target.focus?.({preventScroll:true});
    target.classList.add('b400-target-flash');
    globalScope.setTimeout(()=>target.classList.remove('b400-target-flash'),1400);
  }

  panel.addEventListener('click',(event)=>{
    const shortcut=event.target.closest('[data-b400-target]');
    if(shortcut){revealTarget(shortcut.dataset.b400Target);return;}
    const timer=event.target.closest('[data-b400-timer]');
    if(timer?.dataset.b400Timer==='toggle') toggleTimer();
    if(timer?.dataset.b400Timer==='reset') resetTimer();
  });
  jobsList?.addEventListener('click',()=>{stopFrame();requestAnimationFrame(paintTimer);});
  new MutationObserver(updateShortcuts).observe(host,{childList:true,subtree:true});
  updateShortcuts();paintTimer();
})(window);
