// Build 814: verified staff queue and response history, including audit actors.
import { eventTimeToronto813 } from './worksite-timeline-v813.mjs';
import { FOLLOWUP_LABELS_814,FOLLOWUP_KINDS_814 } from './customer-worksite-followups-v814.mjs';
import { readViews818,saveView818,selectView818,removeView818,viewStorage818 } from './build818-followup-view-state.mjs';
import { outcome819,latestReturnedHandoff819,outcomeSummary819 } from './build819-followup-outcomes.mjs';
import { COHORTS_820,trendSnapshot820,workloadSignals820,safeQueuePreview820 } from './build820-followup-trends.mjs';
import { COMPARISON_MODES_821,compareSnapshots821,workloadExplanations821,readableReport821 } from './build821-followup-comparisons.mjs';
import { readPresets822,savePreset822,selectPreset822,removePreset822,presetStorage822,EXCEPTIONS_822,drilldown822,exceptionCounts822,reportContinuity822 } from './build822-followup-review-continuity.mjs';
import { sourceFreshness823,renamePreset823,validateReviewDraft823,reviewDraftSummary823 } from './build823-supervisor-exception-review.mjs';
import { createSupervisorHandoff824 } from './build824-supervisor-handoff.mjs';
const $=id=>typeof document==='undefined'?null:document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&'+'#39;'}[c]));
const localDateTimeValue=v=>{if(!v)return '';const date=new Date(v);if(!Number.isFinite(date.getTime()))return '';const pad=n=>String(n).padStart(2,'0');return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;};
let records=[],events=[],escalations=[],escalationEvents=[],escalationReady=false,canEscalate=false,ownership=[],ownershipEvents=[],ownershipCandidates=[],ownershipReady=false,canAssign=false,staffId=null,busy=false,loaded=false;
let viewsActor=null,savedViews={views:[],activeId:''};
let presetsActor=null,savedPresets822={presets:[],activeId:''},sourceLoadedAt822=null;
let reviewDrafts823=new Map(); // volatile local-only drafts
let reviewHandoff824=null,lastSelection824=[];
function notice(message,err=false){const el=$('build814StaffStatus');if(el){el.className=err?'notice bad':'notice';el.textContent=message;}}
function viewNotice(message){const el=$('build818ViewStatus');if(el)el.textContent=message;}
function presetNotice822(message){const el=$('build822PresetStatus');if(el)el.textContent=message;}
function ensureOutcomeSurface819(){
  const counts=$('build814StaffCounts');if(!counts||$('build819OutcomeSummary'))return;
  const section=document.createElement('section');section.className='build819-summary';section.setAttribute('aria-label','Follow-up outcomes for the filtered queue');
  const heading=document.createElement('h3');heading.textContent='Follow-up outcomes and closure guidance';
  const summary=document.createElement('p');summary.id='build819OutcomeSummary';summary.setAttribute('role','status');summary.setAttribute('aria-live','polite');summary.textContent='Waiting for the authenticated outcome summary.';
  const handoff=document.createElement('p');handoff.id='build819HandoffStatus';handoff.className='muted';handoff.tabIndex=-1;handoff.setAttribute('role','status');handoff.setAttribute('aria-live','polite');handoff.textContent='Manual changes show readback and focus guidance here.';
  section.append(heading,summary,handoff);counts.before(section);
}
function ensureTrendSurface820(){
  const counts=$('build814StaffCounts');if(!counts||$('build820TrendRows'))return;
  const section=document.createElement('section');section.className='build820-insights';section.setAttribute('aria-labelledby','build820InsightsHeading');
  section.innerHTML=`<h3 id="build820InsightsHeading">Filtered follow-up trend snapshots and workload</h3>
    <p class="muted">Read-only request-date cohorts from the currently filtered, newest 150 authorized records at most. These are not complete historical trends, response-time promises or issue-closure totals. Switching filters changes the observed cohort.</p>
    <div class="build820-table-scroll" role="region" aria-label="Observed follow-up request cohorts" tabindex="0"><table class="build820-trend-table">
      <caption>Observed outcome status by request age</caption><thead><tr><th scope="col">Request cohort</th><th scope="col">Awaiting staff</th><th scope="col">Staff replied</th><th scope="col">Needs help</th><th scope="col">Answer confirmed</th><th scope="col">Source review</th><th scope="col">Shown</th></tr></thead>
      <tbody id="build820TrendRows"></tbody></table></div>
    <p id="build820Workload" class="build820-workload">Workload signals available after the authorized queue loads.</p>
    <details class="build820-preview"><summary>Preview aggregate-only queue CSV (no download)</summary><p class="muted">Only counts from the loaded filtered view are shown. No bookings, names, addresses, search text, messages, private notes or identifiers are included. Select text manually if needed; nothing is uploaded, sent, saved or downloaded.</p><pre id="build820SafeExportPreview" tabindex="0" aria-label="Aggregate-only comma separated values preview">Waiting for the authorized queue.</pre></details>
    <p id="build820SnapshotStatus" class="muted" role="status" aria-live="polite">Waiting for verified follow-up records.</p>`;
  counts.before(section);
}
function renderTrendSurface820(selection,available=true){
  const table=$('build820TrendRows'),workload=$('build820Workload'),preview=$('build820SafeExportPreview'),status=$('build820SnapshotStatus');
  if(!table||!workload||!preview||!status)return;
  if(!loaded||!available){table.textContent='';workload.textContent='Workload signals unavailable until the selected, authorized sources can be verified.';preview.textContent='No verified queue snapshot available for this review.';status.textContent='No verified source snapshot for the selected exception.';return;}
  const now=Date.now(),snapshot=trendSnapshot820(selection,now);
  const signals=workloadSignals820(selection,{now,ownershipReady,owners:ownership,escalationReady,escalations});
  table.innerHTML=COHORTS_820.map(({key,label})=>{
    const c=snapshot.cohorts[key];return `<tr><th scope="row">${esc(label)}</th><td>${c.waiting}</td><td>${c.responded}</td><td>${c.needs_help}</td><td>${c.confirmed}</td><td>${c.review}</td><td>${c.total}</td></tr>`;
  }).join('');
  workload.textContent=`In this filtered view: ${signals.waiting} awaiting staff · ${signals.older48h} over 48 hours without response · ${signals.unknownAge} with missing/future request dates · ${signals.unowned===null?'unowned count unavailable (owner source missing)':signals.unowned+' without a verified assigned owner'} · ${signals.reviewPast===null?'internal review targets unavailable':signals.reviewPast+' passed internal review targets'} · ${signals.openEscalations===null?'open supervisor reviews unavailable':signals.openEscalations+' open supervisor reviews among waiting follow-ups'}. These are review indicators, not customer deadlines.`;
  preview.textContent=safeQueuePreview820(snapshot,signals);
  status.textContent=`Observed ${snapshot.totals.total} of ${records.length} loaded authorized follow-ups after current filters (latest 150 maximum). Snapshot recalculated locally; no historic baseline or customer export was created.`;
  return {snapshot,signals};
}
function ensureComparisonSurface821(){
  const counts=$('build814StaffCounts');if(!counts||$('build821ComparisonMode'))return;
  const section=document.createElement('section');section.className='build821-comparison';section.setAttribute('aria-labelledby','build821ComparisonHeading');
  section.innerHTML=`<h3 id="build821ComparisonHeading">Compare bounded follow-up cohorts</h3>
    <fieldset class="build821-compare-controls"><legend>Choose the observed request groups</legend><label for="build821ComparisonMode">Comparison view</label>
      <select id="build821ComparisonMode" aria-describedby="build821ComparisonScope">${COMPARISON_MODES_821.map(mode=>`<option value="${esc(mode.key)}">${esc(mode.label)}</option>`).join('')}</select>
      <p id="build821ComparisonScope" class="muted">Comparison uses only the latest 150 authenticated, filtered records at most. Changes do not save or export customer data.</p></fieldset>
    <div class="build821-comparison-scroll" role="region" aria-label="Accessible follow-up cohort comparison" tabindex="0"><table class="build821-comparison-table"><caption>Side-by-side observed outcomes</caption>
      <thead><tr><th scope="col">Outcome</th><th id="build821LeftColumn" scope="col">First cohort</th><th id="build821RightColumn" scope="col">Second cohort</th><th scope="col">Difference if comparable</th></tr></thead><tbody id="build821ComparisonRows"></tbody></table></div>
    <p id="build821ComparisonStatus" class="build821-comparison-status" role="status" aria-live="polite" tabindex="-1">Comparison available when the authorized queue loads.</p>
    <details class="build821-explanations"><summary>Explain workload thresholds and missing sources</summary><ul id="build821ThresholdList"></ul></details>
    <div class="build821-readable"><h4>Accessible plain-language report preview</h4><p class="muted">Selectable aggregate text only. No file is made and no private follow-up, note or booking details are included.</p><p id="build821ReadableReport" tabindex="0" aria-label="Read-only accessible aggregate report">Waiting for verified records.</p></div>`;
  section.insertAdjacentHTML('beforeend',`<section class="build822-review" aria-labelledby="build822ReviewHeading"><h4 id="build822ReviewHeading">Saved comparisons and exception review</h4>
    <fieldset class="build822-presets"><legend>Comparison presets (this tab and staff account only)</legend>
      <label for="build822PresetName">Preset name — no customer information</label><input id="build822PresetName" type="text" minlength="2" maxlength="40" autocomplete="off" placeholder="Morning comparison" />
      <button id="build822SavePreset" class="btn ghost" type="button" disabled>Save comparison settings</button>
      <label for="build822PresetSelect">Saved comparison</label><select id="build822PresetSelect" disabled><option value="">Choose a saved comparison</option></select>
      <button id="build822RemovePreset" class="btn ghost" type="button" disabled>Remove selected comparison</button>
      <p class="muted" id="build822PresetStatus" role="status" aria-live="polite" tabindex="-1">Sign in to manage comparison presets.</p>
    </fieldset>
    <fieldset class="build822-exceptions"><legend>Source-verified exception drilldown</legend>
      <label for="build822ExceptionSelect">Review category</label><select id="build822ExceptionSelect" aria-describedby="build822ExceptionStatus">${EXCEPTIONS_822.map(item=>`<option value="${esc(item.key)}">${esc(item.label)}</option>`).join('')}</select>
      <button class="btn ghost" id="build822ClearException" type="button" disabled>Return to full filtered queue</button>
      <p id="build822ExceptionStatus" role="status" aria-live="polite" tabindex="-1">Choose an exception after loading verified source records.</p>
    </fieldset>
    <p class="build822-continuity" id="build822ReportContinuity" role="status" aria-live="polite">Report context appears after authorized records load.</p>
    <fieldset class="build823-preset-rename"><legend>Rename selected comparison preset</legend>
<label for="build823PresetRename">New name (settings stay unchanged)</label><input id="build823PresetRename" type="text" minlength="2" maxlength="40" autocomplete="off" />
<button id="build823RenamePreset" class="btn ghost" type="button" disabled>Rename selected preset</button>
<p id="build823PresetDetails" role="status" aria-live="polite">Select a preset to see its settings.</p></fieldset>
<fieldset class="build823-note-fieldset"><legend>Supervisor exception review draft — current page only</legend>
<label for="build823NoteText">Internal review note for the selected exception category</label>
<textarea id="build823NoteText" rows="3" maxlength="500" autocomplete="off" aria-describedby="build823NoteStatus" placeholder="Internal next step; avoid customer details."></textarea>
<button id="build823SaveNote" class="btn ghost" type="button" disabled>Hold draft in this page</button>
<button id="build823ClearNote" class="btn ghost" type="button" disabled>Clear draft</button>
<p id="build823NoteStatus" role="status" aria-live="polite" tabindex="-1">No draft. Refresh or leaving this page clears the note.</p>
<p id="build823NotePreview" class="build823-note-preview" aria-label="Internal unsaved draft preview"></p></fieldset>
<section class="build823-freshness" aria-labelledby="build823FreshnessHeading">
<h4 id="build823FreshnessHeading">Report source freshness</h4>
<p id="build823FreshnessAlert" role="status" aria-live="polite" data-status="unavailable">Refresh to check source age.</p>
<button id="build823RefreshNow" class="btn ghost" type="button">Refresh verified report source</button></section>
<p class="muted">Presets remember only comparison mode, status and internal target for this browser tab. Search, customer records, review notes, exception results and report text are not saved. A returning preset re-queries the authorized queue; no historical report is inferred.</p>
  </section>`);
  counts.before(section);
}
function renderComparisonSurface821(snapshotAndSignals){
  const rows=$('build821ComparisonRows'),leftHeading=$('build821LeftColumn'),rightHeading=$('build821RightColumn'),status=$('build821ComparisonStatus'),thresholds=$('build821ThresholdList'),report=$('build821ReadableReport');
  if(!rows||!leftHeading||!rightHeading||!status||!thresholds||!report)return;
  if(!loaded||!snapshotAndSignals){rows.textContent='';thresholds.textContent='';status.textContent='No authenticated cohort comparison available.';report.textContent='The authorized queue must load before an aggregate report can be shown.';return;}
  const {snapshot,signals}=snapshotAndSignals,comparison=compareSnapshots821(snapshot,$('build821ComparisonMode')?.value||'adjacent');
  if(!comparison.ok){rows.textContent='';status.textContent=comparison.reason;report.textContent=readableReport821(comparison,signals);return;}
  leftHeading.textContent=comparison.leftLabel;rightHeading.textContent=comparison.rightLabel;
  rows.innerHTML=[['waiting','Awaiting staff'],['responded','Staff replied'],['needs_help','Needs more help'],['confirmed','Answer confirmed'],['review','Source review'],['total','Total observed']].map(([field,label])=>
    `<tr><th scope="row">${esc(label)}</th><td>${comparison.left[field]}</td><td>${comparison.right[field]}</td><td>${comparison.difference===null?'Not comparable':comparison.left[field]-comparison.right[field]}</td></tr>`).join('');
  status.textContent=`${comparison.leftLabel}: ${comparison.left.total}. ${comparison.rightLabel}: ${comparison.right.total}. ${comparison.guidance} No historic baseline was saved.`;
  thresholds.innerHTML=workloadExplanations821(signals).map(item=>`<li><strong>${esc(item.label)}: ${item.count===null?'Source unavailable':item.count}</strong><p>${esc(item.explanation)}</p></li>`).join('');
  report.textContent=readableReport821(comparison,signals);
}
function presetControls822(){
  const select=$('build822PresetSelect');if(!select)return;
  select.innerHTML='<option value="">Choose a saved comparison</option>'+savedPresets822.presets.map(p=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('');
  select.value=savedPresets822.activeId;
  const ready=!!staffId;
  select.disabled=!ready||savedPresets822.presets.length===0;
  $('build822SavePreset').disabled=!ready;
  $('build822RemovePreset').disabled=!ready||!savedPresets822.activeId;
  const selected=savedPresets822.presets.find(p=>p.id===savedPresets822.activeId);
  $('build823RenamePreset').disabled=!ready||!selected;
  $('build823PresetRename').disabled=!ready||!selected;
  $('build823PresetRename').value=selected?.name||'';
  $('build823PresetDetails').textContent=selected?'Selected: '+selected.name+'. Comparison: '+selected.mode+'; status: '+selected.status+'; review target: '+selected.target+'.':'Select a saved preset to review its settings.';
}
function hydratePresets822(){
  if(presetsActor===staffId)return;
  presetsActor=staffId;savedPresets822=readPresets822(presetStorage822(),staffId);
  const selected=savedPresets822.presets.find(p=>p.id===savedPresets822.activeId);
  if(selected){
    $('build821ComparisonMode').value=selected.mode;
    $('build814StaffFilter').value=selected.status;
    $('build817ReviewTarget').value=selected.target;
    $('build817StaffSearch').value='';
    presetNotice822(`Restored “${selected.name}” settings. Search was cleared. The report will be freshly recalculated from authorized records.`);
  }else presetNotice822(staffId?'Comparison presets stay in this browser tab for the current staff account. No queue data is saved.':'Sign in to manage comparison presets.');
  presetControls822();
}
function clearPresetSelection822(){
  if(!savedPresets822.activeId)return;
  const data=selectPreset822(presetStorage822(),staffId,'');
  savedPresets822=data||{...savedPresets822,activeId:''};
  presetControls822();
}
function saveCurrentPreset822(){
  if(!staffId)return;
  const result=savePreset822(presetStorage822(),staffId,$('build822PresetName').value,{
    mode:$('build821ComparisonMode').value,status:$('build814StaffFilter').value,target:$('build817ReviewTarget').value});
  if(!result.ok){presetNotice822(result.reason);return;}
  savedPresets822=result;presetControls822();
  presetNotice822(`Saved “${result.preset.name}” comparison settings in this browser tab. Search and report results were not saved.`);
}
function applyPreset822(){
  const id=$('build822PresetSelect').value,preset=savedPresets822.presets.find(p=>p.id===id);
  if(!preset){clearPresetSelection822();return;}
  const data=selectPreset822(presetStorage822(),staffId,id);
  if(!data){presetNotice822('The preset could not be selected. Existing filters remain unchanged.');return;}
  savedPresets822=data;presetControls822();
  $('build821ComparisonMode').value=preset.mode;
  $('build814StaffFilter').value=preset.status;
  $('build817ReviewTarget').value=preset.target;
  $('build817StaffSearch').value='';$('build822ExceptionSelect').value='all';
  render();
  presetNotice822(`Applied “${preset.name}”. The authorized report is recalculated. Search and exception drilldown were cleared.${!ownershipReady&&preset.target!=='all'?' Internal review target source is unavailable; those records cannot be verified.':''}`);
  $('build822PresetStatus').focus?.({preventScroll:false});
}
function removeCurrentPreset822(){
  const id=savedPresets822.activeId;if(!id)return;
  const data=removePreset822(presetStorage822(),staffId,id);
  if(!data){presetNotice822('The saved comparison could not be removed.');return;}
  savedPresets822=data;presetControls822();presetNotice822('Comparison preset removed. Queue records, filters and report content were not changed.');
}
function renameCurrentPreset823(){
  if(!staffId||!savedPresets822.activeId)return;
  const result=renamePreset823(presetStorage822(),staffId,savedPresets822.activeId,$('build823PresetRename').value);
  if(!result.ok){presetNotice822(result.reason);return;}
  savedPresets822={presets:result.presets,activeId:result.activeId};
  presetControls822();
  presetNotice822('Comparison preset renamed. Its settings and current queue were not changed.');
  $('build822PresetStatus').focus({preventScroll:false});
}
function syncReviewDraftEditor823(){
  const key=$('build822ExceptionSelect')?.value||'all';
  $('build823NoteText').value=reviewDrafts823.get(key)?.text||'';
}
function renderSourceFreshness823(){
  const result=sourceFreshness823({loaded,loadedAt:sourceLoadedAt822});
  const alert=$('build823FreshnessAlert');
  if(alert){alert.dataset.status=result.status;alert.textContent=result.message;}
  const refresh=$('build823RefreshNow');if(refresh)refresh.disabled=busy;
  return result;
}
function tickSourceFreshness823(){
  const state=renderSourceFreshness823();
  reviewHandoff824?.update({staffId,canAssign,verified:loaded,sourceLoadedAt:sourceLoadedAt822,selection:lastSelection824});
  if(!state.allowReport){
    renderComparisonSurface821(renderTrendSurface820([],false));
    const context=$('build822ReportContinuity');
    if(context)context.textContent='Report source expired or unavailable. Refresh before relying on any aggregate totals.';
    renderReviewDraft823(false,$('build822ExceptionSelect')?.value||'all');
  }
}
function renderReviewDraft823(ready,category){
  const note=reviewDrafts823.get(category);
  $('build823SaveNote').disabled=!ready;
  $('build823ClearNote').disabled=!ready||!note;
  $('build823NoteStatus').textContent=reviewDraftSummary823(note,{actor:staffId,category,sourceReady:ready});
  $('build823NotePreview').textContent=ready&&note?.ok?note.text:'';
}
function saveCurrentReviewDraft823(){
  const key=$('build822ExceptionSelect')?.value||'all';
  const fresh=sourceFreshness823({loaded,loadedAt:sourceLoadedAt822});
  const filter=$('build814StaffFilter')?.value||'priority',target=$('build817ReviewTarget')?.value||'all';
  const ownerBlocked=!ownershipReady&&(filter==='unowned'||filter==='mine'||target!=='all');
  const escalationBlocked=!escalationReady&&filter==='escalated';
  const selected=loaded?selectFollowups817(records,{status:filter,query:$('build817StaffSearch')?.value||'',target,ownershipReady,owners:ownership,escalations:escalationReady?escalations:[],staffId}):[];
  const checked=drilldown822(selected,key,exceptionContext822());
  const result=validateReviewDraft823({actor:staffId,sourceReady:canAssign&&loaded&&fresh.allowReport&&!ownerBlocked&&!escalationBlocked&&checked.ok,category:key,
    shown:checked.ok?checked.count:0,text:$('build823NoteText').value});
  if(!result.ok){$('build823NoteStatus').textContent=result.reason;return;}
  reviewDrafts823.set(key,result);
  renderReviewDraft823(true,key);
  $('build823NoteStatus').focus({preventScroll:false});
}
function clearCurrentReviewDraft823(){
  const key=$('build822ExceptionSelect')?.value||'all';
  reviewDrafts823.delete(key);
  syncReviewDraftEditor823();
  renderReviewDraft823(!!canAssign&&!!staffId&&loaded&&sourceFreshness823({loaded,loadedAt:sourceLoadedAt822}).allowReport,key);
  $('build823NoteStatus').focus({preventScroll:false});
}
function exceptionContext822(){return {now:Date.now(),ownershipReady,owners:ownership,escalationReady,escalations};}
function renderExceptionControls822(selection,result,context){
  const select=$('build822ExceptionSelect');if(!select)return;
  const counts=exceptionCounts822(selection,context),selected=select.value;
  for(const option of Array.from(select.options)){
    const item=counts.find(entry=>entry.key===option.value);
    if(!item)continue;
    option.disabled=item.count===null;
    option.textContent=`${item.label} — ${item.count===null?'source unavailable':item.count+' shown'}`;
  }
  select.disabled=!loaded;
  $('build822ClearException').disabled=!loaded||selected==='all';
  $('build822ExceptionStatus').textContent=!loaded?'Exception review is unavailable until the authenticated queue loads.':
    !result.ok?result.reason:
    `${result.count} source-verified follow-ups match “${EXCEPTIONS_822.find(entry=>entry.key===selected)?.label||'current category'}” within the current bounded filters. The list and aggregate report reflect this drilldown. No customer message or review decision is made.`;
}
function viewControls818(){
  const select=$('build818SavedViews');if(!select)return;
  select.innerHTML='<option value="">Choose a saved view</option>'+savedViews.views.map(v=>`<option value="${esc(v.id)}">${esc(v.name)}</option>`).join('');
  select.value=savedViews.activeId;
  const ready=!!staffId;
  $('build818SaveView').disabled=!ready;
  $('build818RemoveView').disabled=!ready||!savedViews.activeId;
  select.disabled=!ready||savedViews.views.length===0;
}
function hydrateViews818(){
  if(viewsActor===staffId)return;
  viewsActor=staffId;savedViews=readViews818(viewStorage818(),staffId);
  const selected=savedViews.views.find(v=>v.id===savedViews.activeId);
  if(selected){$('build814StaffFilter').value=selected.status;$('build817ReviewTarget').value=selected.target;
    $('build817StaffSearch').value='';viewNotice(`Restored “${selected.name}” filters in this browser tab. Search text was not saved.`);
  }else viewNotice(staffId?'Views are saved only in this browser tab, for this staff account. Search and customer details are never saved.':'Sign in to manage saved views.');
  viewControls818();
}
function saveCurrentView818(){
  if(!staffId)return;
  const outcome=saveView818(viewStorage818(),staffId,$('build818ViewName').value,{
    status:$('build814StaffFilter').value,target:$('build817ReviewTarget').value});
  if(!outcome.ok){viewNotice(outcome.reason);return;}
  savedViews=outcome;viewControls818();viewNotice(`Saved “${outcome.view.name}” for this browser tab. Search and private notes were not stored.`);
}
function applySavedView818(){
  const id=$('build818SavedViews').value,view=savedViews.views.find(v=>v.id===id);
  if(!view){savedViews.activeId='';viewControls818();return;}
  const outcome=selectView818(viewStorage818(),staffId,id);
  if(!outcome){viewNotice('Could not remember this view in the current browser tab.');return;}
  savedViews=outcome;$('build814StaffFilter').value=view.status;$('build817ReviewTarget').value=view.target;
  $('build817StaffSearch').value='';viewControls818();render();
  viewNotice(`Applied “${view.name}”. Search was cleared. ${!ownershipReady&&view.target!=='all'?'Verified ownership is unavailable; this target view is paused.':''}`);
}
function removeSavedView818(){
  if(!savedViews.activeId)return;
  const outcome=removeView818(viewStorage818(),staffId,savedViews.activeId);
  if(!outcome){viewNotice('Saved view could not be removed.');return;}
  savedViews=outcome;viewControls818();viewNotice('Saved view removed. Current filters and queue records were not changed.');
}
export function advisoryAging815(row,now=Date.now()){if(row.status!=='awaiting_staff')return null;const ms=Date.parse(row.requested_at);if(!Number.isFinite(ms)||ms>now)return {band:'unknown',label:'Age unavailable'};
  const hours=Math.floor((now-ms)/3600000);return {band:hours>=48?'overdue':hours>=24?'attention':'new',label:hours>=48?'Over 48 hours — supervisor review suggested':hours>=24?'Over 24 hours — review soon':'Newer than 24 hours'};}
const escalationByFollowup=id=>escalations.find(e=>e.followup_id===id);
const ownershipFor=id=>ownership.find(e=>e.followup_id===id);
export function priority816(row,owner=null,escalation=null,now=Date.now()){
  if(row.status!=='awaiting_staff')return {level:7,label:'Not waiting for staff'};
  const band=advisoryAging815(row,now)?.band;
  if(escalation&&escalation.status!=='cleared'&&!owner)return {level:0,label:'Escalated — no owner'};
  if(band==='overdue'&&!owner)return {level:1,label:'Overdue — no owner'};
  if(band==='overdue')return {level:2,label:'Overdue — owner assigned'};
  if(escalation&&escalation.status!=='cleared')return {level:3,label:'Supervisor review — assigned'};
  if(band==='attention'&&!owner)return {level:4,label:'24+ hours — no owner'};
  if(band==='attention')return {level:5,label:'24+ hours — assigned'};
  return {level:6,label:'Recent follow-up'};
}
// Build 817: client-side triage over the authenticated, bounded staff queue.
// Missing ownership data must never be interpreted as an unassigned or overdue owner.
export function reviewTarget817(row,owner,now=Date.now()){
  if(row?.status!=='awaiting_staff'||!owner?.review_due_at)return 'none';
  const due=Date.parse(owner.review_due_at);
  if(!Number.isFinite(due))return 'unknown';
  return due<=now?'past':due<=now+86400000?'soon':'later';
}
export function selectFollowups817(rows,{status='priority',query='',target='all',ownershipReady=false,owners=[],escalations=[],staffId=null,now=Date.now()}={}){
  const ownerFor=id=>owners.find(e=>e.followup_id===id);
  const escalationFor=id=>escalations.find(e=>e.followup_id===id);
  const search=String(query).trim().toLocaleLowerCase().slice(0,100);
  return rows.filter(r=>{
    const owner=ownershipReady?ownerFor(r.id):null,escalation=escalationFor(r.id);
    const matchesStatus=status==='all'||r.status===status||(status==='priority'&&r.status==='awaiting_staff')||
      (status==='unowned'&&ownershipReady&&r.status==='awaiting_staff'&&!owner)||
      (status==='mine'&&ownershipReady&&owner?.owner_staff_user_id===staffId)||
      (status==='aging'&&['attention','overdue'].includes(advisoryAging815(r,now)?.band))||
      (status==='escalated'&&!!escalation&&escalation.status!=='cleared');
    if(!matchesStatus||target!=='all'&&(!ownershipReady||reviewTarget817(r,owner,now)!==target))return false;
    return !search||[r.booking_id,r.issue_category,r.request_kind,FOLLOWUP_KINDS_814[r.request_kind],r.request_text]
      .some(value=>String(value??'').toLocaleLowerCase().includes(search));
  }).sort((a,b)=>priority816(a,ownerFor(a.id),escalationFor(a.id),now).level-priority816(b,ownerFor(b.id),escalationFor(b.id),now).level||
    (Date.parse(a.requested_at)||0)-(Date.parse(b.requested_at)||0));
}
function ownerControls(row){if(row.status!=='awaiting_staff'&&!ownershipFor(row.id))return '';
  if(!ownershipReady)return '<p class="notice bad">Owner assignment source unavailable. Assignments are read-only until refresh.</p>';
  const current=ownershipFor(row.id),person=ownershipCandidates.find(s=>s.id===current?.owner_staff_user_id);
  const history=current?ownershipEvents.filter(e=>e.ownership_id===current.id).slice(0,12).reverse():[];
  return `<section class="build816-owner" aria-label="Internal supervisor ownership"><p><strong>Review owner:</strong> ${esc(person?.name|| (current?'Assigned staff member':'Not assigned'))}${current?.review_due_at?` · Internal review target ${esc(eventTimeToronto813(current.review_due_at))}`:''}</p>
    ${current&&canAssign?`<details class="build818-review-note"><summary>Private reviewer note (supervisors only)</summary><p>${current.private_note?esc(current.private_note):'No verified reviewer note is available.'}</p><p class="muted">Existing audited assignment note. Read-only here; editing requires an authorized assignment update.</p></details>`:''}
    ${current?`<details class="build813-timeline"><summary>Recorded ownership history (${history.length}${history.length===12?'+':''})</summary>${history.length?`<ol class="build813-event-list">${history.map(e=>`<li>${esc(eventTimeToronto813(e.recorded_at))} · ${esc(e.event_kind.replaceAll('_',' '))} · Rev ${esc(e.ownership_revision)} · Staff ${esc(String(e.actor_staff_user_id||'').slice(0,8))}</li>`).join('')}</ol>`:'<p class="muted">No audit events returned.</p>'}</details>`:''}
    ${canAssign&&row.status==='awaiting_staff'?`<form class="build816-owner-form" data-build816-owner="${esc(row.id)}"><label>Authorized owner<select name="owner" required><option value="">Choose a reviewer</option>${ownershipCandidates.map(s=>`<option value="${esc(s.id)}" ${current?.owner_staff_user_id===s.id?'selected':''}>${esc(s.name)}</option>`).join('')}</select></label>
    <label>Internal review target (optional, within 30 days)<input type="datetime-local" name="reviewDue" value="${esc(localDateTimeValue(current?.review_due_at))}" /></label>
    <label>Private assignment reason<textarea name="note" minlength="12" maxlength="600" rows="2" required placeholder="Explain what the owner should review and why">${esc(current?.private_note||'')}</textarea></label>
    <button type="submit" class="btn ghost">${current?'Update assigned owner':'Assign an owner'}</button><p class="muted">Internal target only. No promised customer response time or automatic message.</p></form>`:''}
  </section>`;
}
function supervisorHistory(record){if(!record)return '';const timeline=escalationEvents.filter(e=>e.escalation_id===record.id).slice(0,12).reverse();return `<details class="build813-timeline"><summary>Supervisor audit (${timeline.length}${timeline.length===12?'+':''})</summary><ol class="build813-event-list">${timeline.map(e=>`<li>${esc(eventTimeToronto813(e.recorded_at))} · Rev ${esc(e.escalation_revision)} · ${esc(e.event_kind.replaceAll('_',' '))} · Staff ${esc(String(e.actor_staff_user_id||'').slice(0,8))}</li>`).join('')}</ol></details>`;}
function supervisorControls(row){if(!escalationReady)return '<p class="notice bad">Supervisor state could not be verified. Escalation controls are unavailable until refresh.</p>';
  const existing=escalationByFollowup(row.id);const age=advisoryAging815(row);const ageBadge=age?`<p class="build815-age build815-age-${esc(age.band)}">Advisory age: ${esc(age.label)}. These bands are not a promised service deadline.</p>`:'';
  if(existing)return `${ageBadge}<div class="build815-escalation"><p><strong>Supervisor review:</strong> ${esc(existing.status)} · flagged ${esc(eventTimeToronto813(existing.flagged_at))}</p>
    <p class="muted">Internal reason: ${esc(existing.reason)} · supervisor ${esc(String(existing.flagged_by_staff_user_id||'').slice(0,8))}</p>
    ${existing.acknowledged_at?`<p class="muted">Acknowledged ${esc(eventTimeToronto813(existing.acknowledged_at))}</p>`:''}
    ${existing.cleared_at?`<p class="muted">Cleared ${esc(eventTimeToronto813(existing.cleared_at))}</p>`:''}
    ${canEscalate&&existing.status!=='cleared'?`<form data-build815-decision="${esc(row.id)}"><button type="submit" class="btn ghost">${existing.status==='flagged'?'Acknowledge supervisor review':'Clear supervisor review'}</button></form>`:''}
    ${supervisorHistory(existing)}</div>`;
  if(row.status!=='awaiting_staff')return '';
  return `${ageBadge}${canEscalate?`<form class="build814-staff-reply" data-build815-flag="${esc(row.id)}"><label>Private supervisor reason<textarea name="reason" minlength="12" maxlength="600" rows="2" required placeholder="Explain the safety, timing or service concern for the supervisor"></textarea></label><button class="btn ghost" type="submit">Flag for supervisor review</button><p class="muted">Manual review only; no automatic customer message or appointment change.</p></form>`:''}`;
}
function audit(id){const history=events.filter(e=>e.followup_id===id).slice(0,12).reverse();
  return `<details class="build813-timeline"><summary>Verified follow-up actions (${history.length}${history.length===12?'+':''})</summary>
    ${history.length?`<ol class="build813-event-list">${history.map(e=>`<li><time>${esc(eventTimeToronto813(e.recorded_at))}</time> · Rev ${esc(e.followup_revision)} · ${esc(e.event_kind.replaceAll('_',' '))}${e.actor_staff_user_id?` · Staff ${esc(e.actor_staff_user_id.slice(0,8))}`:''}</li>`).join('')}</ol>`:'<p class="muted">No recorded actions yet. History is not reconstructed.</p>'}
    <p class="muted">Actions are written by the database. Customers cannot see staff identity or the internal audit log.</p></details>`;}
function outcomeCard819(row){const result=outcome819(row),handoff=latestReturnedHandoff819(row,events);
  return `<section class="build819-outcome build819-${esc(result.kind)}" aria-label="Recorded follow-up outcome and manual next step">
    <h4>Follow-up outcome: ${esc(result.label)}</h4>
    <p><strong>Suggested manual next step:</strong> ${esc(result.guidance)}</p>
    <p class="muted"><strong>Latest returned follow-up audit event:</strong> ${handoff?`${esc(handoff.label)} · ${esc(eventTimeToronto813(handoff.recordedAt))} · revision ${esc(handoff.revision)}`:'No matching event was returned in the bounded audit history. Do not reconstruct missing actions.'}</p>
    <p class="muted">Follow-up outcome only. No automatic closure, outreach, booking, payment or dispatch action.</p>
  </section>`;}
function handoffFeedback819(id,action,readback){const status=$('build819HandoffStatus');if(!status)return;
  const card=Array.from($('build814StaffList')?.querySelectorAll('[data-build819-followup]')||[]).find(node=>node.getAttribute('data-build819-followup')===id);
  const record=records.find(row=>row.id===id);
  status.textContent=`${action}. ${!readback?'Relevant source readback unavailable; verify before further action.':card?`Current follow-up outcome: ${outcome819(record).label}.`:'Record is outside the current filtered or bounded view. Your filters were retained.'} No outbound message was sent.`;
  (card||status).focus({preventScroll:false});
}
function render(){const el=$('build814StaffList');if(!el)return;
  const filter=$('build814StaffFilter')?.value||'priority',query=$('build817StaffSearch')?.value||'',target=$('build817ReviewTarget')?.value||'all';
  const baseSelection=loaded?selectFollowups817(records,{status:filter,query,target,ownershipReady,owners:ownership,escalations:escalationReady?escalations:[],staffId}):[];
  const exceptionKey=$('build822ExceptionSelect')?.value||'all',exceptionContext=exceptionContext822();
  const requestedException=drilldown822(baseSelection,exceptionKey,exceptionContext);
  const ownerFilterUnavailable=!ownershipReady&&(filter==='unowned'||filter==='mine'||target!=='all');
  const escalationFilterUnavailable=!escalationReady&&filter==='escalated';
  const exception=ownerFilterUnavailable?{ok:false,reason:'Verified owner assignments are unavailable for the selected queue filter.',rows:[]}:
    escalationFilterUnavailable?{ok:false,reason:'Verified supervisor escalation data is unavailable for the selected queue filter.',rows:[]}:requestedException;
  const selection=exception.ok?exception.rows:[];
  renderExceptionControls822(baseSelection,exception,exceptionContext);
  const targetSelect=$('build817ReviewTarget');if(targetSelect)targetSelect.disabled=!ownershipReady;
  const summary=$('build819OutcomeSummary');if(summary){
    if(!loaded)summary.textContent='Outcome summary unavailable until the authenticated follow-up queue loads.';
    else{const counts=outcomeSummary819(selection);summary.textContent=`Shown follow-ups (${counts.total}; latest 150 loaded maximum): ${counts.waiting} awaiting staff · ${counts.responded} waiting for customer decision · ${counts.needs_help} requesting more help · ${counts.confirmed} customer-confirmed answers · ${counts.review} needing source review. ${ownershipReady?'Owner source available.':'Owner source unavailable.'} ${escalationReady?'Supervisor source available.':'Supervisor source unavailable.'} No booking or issue closures are inferred.`;}
  }
  const freshness823=renderSourceFreshness823();
  renderComparisonSurface821(renderTrendSurface820(selection,exception.ok&&freshness823.allowReport));
  renderReviewDraft823(!!canAssign&&!!staffId&&loaded&&exception.ok&&freshness823.allowReport,exceptionKey);
  lastSelection824=selection;
  reviewHandoff824?.update({staffId,canAssign,verified:loaded&&exception.ok,sourceLoadedAt:sourceLoadedAt822,selection});
  const context=$('build822ReportContinuity');if(context)context.textContent=reportContinuity822({loaded:loaded&&exception.ok&&freshness823.allowReport,loadedAt:sourceLoadedAt822,mode:$('build821ComparisonMode')?.value,status:filter,target,exception:exceptionKey,shown:selection.length,sourceCount:records.length});
  $('build814StaffCounts').textContent=loaded&&!exception.ok?`Selected exception review unavailable: ${exception.reason}`:loaded?`${selection.length} of ${records.length} loaded follow-ups shown (latest 150 maximum) · ${records.filter(r=>r.status==='awaiting_staff').length} waiting for staff · ${records.filter(r=>advisoryAging815(r)?.band==='overdue').length} over 48 hours · ${ownershipReady?records.filter(r=>r.status==='awaiting_staff'&&!ownershipFor(r.id)).length+' unowned waiting · '+records.filter(r=>reviewTarget817(r,ownershipFor(r.id))==='past').length+' passed internal review targets · ':target!=='all'?'review-target view paused until ownership can be verified · ':'ownership source unavailable · '}${escalationReady?escalations.filter(e=>e.status!=='cleared').length+' open supervisor reviews':'supervisor state unavailable'}.`:'Awaiting authenticated operations access.';
  if(!loaded){el.innerHTML='<p class="muted">Waiting for the authorized follow-up queue.</p>';return;}
  if(!exception.ok){el.innerHTML='<p class="notice bad">This exception view is paused because its verified source is unavailable. Choose another category or refresh the authenticated queue.</p>';return;}
  el.innerHTML=selection.length?selection.map(row=>`<article class="build811-issue" tabindex="-1" data-build819-followup="${esc(row.id)}">
    <span class="badge">${esc(FOLLOWUP_LABELS_814[row.status]||'Follow-up')}</span>${row.status==='awaiting_staff'?`<span class="badge build816-priority-label">${ownershipReady?esc(priority816(row,ownershipFor(row.id),escalationReady?escalationByFollowup(row.id):null).label):'Ownership priority unavailable'}</span>`:''}<h3>${esc(FOLLOWUP_KINDS_814[row.request_kind]||'Worksite question')}</h3>
    <p class="muted">${esc(row.issue_category||'Worksite report')} · Booking ${esc(row.booking_id||'Reference on file')} · ${esc(eventTimeToronto813(row.requested_at))}</p>
    <p><strong>Customer’s follow-up:</strong> ${esc(row.request_text)}</p>
    ${row.staff_response?`<p class="build814-response"><strong>Recorded response:</strong> ${esc(row.staff_response)} · ${esc(eventTimeToronto813(row.staff_responded_at))}</p>`:''}
    ${row.customer_decided_at?`<p><strong>Customer’s decision:</strong> ${esc(FOLLOWUP_LABELS_814[row.status])} · ${esc(eventTimeToronto813(row.customer_decided_at))}${row.customer_feedback?`<br>${esc(row.customer_feedback)}`:''}</p>`:''}
    ${outcomeCard819(row)}
    ${supervisorControls(row)}
    ${ownerControls(row)}
    ${audit(row.id)}
    ${row.status==='awaiting_staff'?`<form class="build814-staff-reply" data-build814-staff-reply="${esc(row.id)}" aria-busy="false"><label>Customer-visible response<textarea name="response" minlength="12" maxlength="1000" rows="3" required placeholder="Explain the answer and next step without internal staff notes"></textarea></label>
      <button class="btn primary" type="submit">Save response for customer account</button><p class="muted">Saves a response in My Account; does not email or text the customer.</p></form>`:''}
  </article>`).join(''):'<p class="muted">No follow-ups match this filter.</p>';
}
async function load(){if(busy)return;busy=true;loaded=false;sourceLoadedAt822=null;reviewDrafts823.clear();$('build823NoteText').value='';escalationReady=false;ownershipReady=false;$('build814StaffRefresh').disabled=true;render();notice('Loading verified staff follow-ups…');
  try{const response=await fetch('/api/admin/worksite_followups_v814',{credentials:'include',cache:'no-store'});const data=await response.json().catch(()=>null);
    if(!response.ok||!data?.ok||!Array.isArray(data.followups)||!Array.isArray(data.events))throw Error(data?.error||'Queue unavailable.');
    records=data.followups;events=data.events;loaded=true;sourceLoadedAt822=Date.now();
    try{const e=await fetch('/api/admin/worksite_escalations_v815',{credentials:'include',cache:'no-store'});const d=await e.json().catch(()=>null);
      if(!e.ok||!d?.ok||!Array.isArray(d.escalations)||!Array.isArray(d.events))throw Error('Unavailable');
      escalations=d.escalations;escalationEvents=d.events;canEscalate=d.can_escalate===true;escalationReady=true;
    }catch{escalations=[];escalationEvents=[];canEscalate=false;escalationReady=false;}
    try{const o=await fetch('/api/admin/worksite_ownership_v816',{credentials:'include',cache:'no-store'});const d=await o.json().catch(()=>null);
      if(!o.ok||!d?.ok||!Array.isArray(d.ownership)||!Array.isArray(d.events)||!Array.isArray(d.candidates))throw Error('Unavailable');
      ownership=d.ownership;ownershipEvents=d.events;ownershipCandidates=d.candidates;canAssign=d.can_assign===true;staffId=d.current_staff_user_id;ownershipReady=true;
    }catch{ownership=[];ownershipEvents=[];ownershipCandidates=[];canAssign=false;staffId=null;ownershipReady=false;}
    hydrateViews818();hydratePresets822();render();notice(escalationReady&&ownershipReady?'Priority queue, supervisor reviews and owner records loaded. No outbound message is sent.':'Follow-ups loaded, but some supervisor/owner records are unavailable. Their controls are disabled.',!escalationReady||!ownershipReady);return true;
  }catch(error){records=[];events=[];sourceLoadedAt822=null;staffId=null;hydrateViews818();hydratePresets822();render();notice(`${error.message||'Queue unavailable.'} Authenticated operations permission is required.`,true);return false;}
  finally{busy=false;$('build814StaffRefresh').disabled=false;$('build823RefreshNow').disabled=false;}
}
async function assignOwner(event){const form=event.target.closest?.('[data-build816-owner]');if(!form)return;event.preventDefault();
  if(busy||!ownershipReady||!canAssign||form.getAttribute('aria-busy')==='true')return;
  const row=records.find(r=>r.id===form.dataset.build816Owner);if(!row||row.status!=='awaiting_staff')return;
  const current=ownershipFor(row.id),owner=form.elements.namedItem('owner').value,note=form.elements.namedItem('note').value.trim(),localDue=form.elements.namedItem('reviewDue').value;
  if(!ownershipCandidates.some(s=>s.id===owner)||note.length<12||note.length>600){notice('Choose an authorized staff member and enter a private 12–600 character note.',true);return;}
  const parsedDue=localDue?new Date(localDue):null;
  if(parsedDue&&!Number.isFinite(parsedDue.getTime())){notice('Enter a valid review date.',true);return;}
  const reviewDue=parsedDue?parsedDue.toISOString():null;
  if(!window.confirm('Save this internal ownership decision? No customer notification or appointment change occurs.'))return;
  form.setAttribute('aria-busy','true');form.querySelector('button').disabled=true;notice('Saving assigned reviewer…');
  try{const response=await fetch('/api/admin/worksite_ownership_v816',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({followup_id:row.id,owner_staff_user_id:owner,private_note:note,review_due_at:reviewDue,expected_revision:current?.workflow_revision??null})});
    const data=await response.json().catch(()=>null);if(!response.ok||!data?.ok)throw Error(data?.error||'Assignment not confirmed.');const readback=await load()&&ownershipReady;handoffFeedback819(row.id,'Supervisor owner update accepted by source',readback);notice(readback?'Supervisor owner recorded with an auditable decision. No message was sent.':'Owner update accepted, but ownership readback is unavailable. Refresh to verify before further changes.',!readback);
  }catch(error){notice(`${error.message||'Owner not confirmed.'} Refresh before retrying.`,true);form.setAttribute('aria-busy','false');form.querySelector('button').disabled=false;}
}
async function escalate(event){const flag=event.target.closest?.('[data-build815-flag]'),form=flag||event.target.closest?.('[data-build815-decision]');if(!form)return;
  event.preventDefault();if(busy||!escalationReady||!canEscalate||form.getAttribute('aria-busy')==='true')return;
  const row=records.find(r=>r.id===(flag?form.dataset.build815Flag:form.dataset.build815Decision));if(!row)return;
  const existing=escalationByFollowup(row.id);const action=flag?'flag':existing?.status==='flagged'?'acknowledge':'clear';
  const reason=flag?form.elements.namedItem('reason')?.value.trim():undefined;
  if(flag&&(reason.length<12||reason.length>600)){notice('Provide a private supervisor reason of 12–600 characters.',true);return;}
  if(!window.confirm(`${action==='flag'?'Flag for':action==='acknowledge'?'Acknowledge':'Clear'} supervisor review? This is an internal record only; no message is sent.`))return;
  form.setAttribute('aria-busy','true');form.querySelector('button').disabled=true;notice('Saving supervisor decision…');
  try{const response=await fetch('/api/admin/worksite_escalations_v815',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,followup_id:row.id,...(flag?{reason}:{expected_revision:existing.workflow_revision})})});
    const data=await response.json().catch(()=>null);if(!response.ok||!data?.ok)throw Error(data?.error||'Not confirmed.');const readback=await load()&&escalationReady;handoffFeedback819(row.id,'Supervisor review decision accepted by source',readback);notice(readback?'Supervisor decision saved in the audited internal queue. No external notification was sent.':'Supervisor decision accepted, but escalation readback is unavailable. Refresh to verify before further changes.',!readback);
  }catch(error){notice(`${error.message||'Decision not confirmed.'} Refresh the queue before retrying.`,true);form.setAttribute('aria-busy','false');form.querySelector('button').disabled=false;}
}
async function submit(event){const form=event.target.closest?.('[data-build814-staff-reply]');if(!form)return;event.preventDefault();if(form.getAttribute('aria-busy')==='true'||busy)return;
  const row=records.find(r=>r.id===form.dataset.build814StaffReply);if(!row)return;
  const responseText=form.elements.namedItem('response').value.trim();if(responseText.length<12||responseText.length>1000){notice('Response must contain 12–1000 characters.',true);return;}
  if(!window.confirm('Save this response for the customer to read in My Account? No email or text is sent.'))return;
  form.setAttribute('aria-busy','true');form.querySelector('button').disabled=true;notice('Saving staff response…');
  try{const response=await fetch('/api/admin/worksite_followups_v814',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({followup_id:row.id,expected_revision:row.workflow_revision,response:responseText})});
    const data=await response.json().catch(()=>null);if(!response.ok||!data?.ok)throw Error(data?.error||'Response not saved.');
    const readback=await load();handoffFeedback819(row.id,'Staff response accepted by source',readback);notice(readback?'Staff response recorded and available to the customer in My Account after refresh. No outbound message was sent.':'Staff response accepted, but queue readback is unavailable. Refresh to verify before further changes.',!readback);
  }catch(error){notice(`${error.message||'Response not confirmed.'} Refresh the queue before trying again.`,true);form.setAttribute('aria-busy','false');form.querySelector('button').disabled=false;}
}
export function loadStaffWorksiteFollowups814(){if(!$('build814StaffList'))return;ensureOutcomeSurface819();ensureTrendSurface820();ensureComparisonSurface821();
  $('build814StaffRefresh').addEventListener('click',async()=>{const success=await load();const feedback=$('build819HandoffStatus');if(feedback)feedback.textContent=success?'Follow-up queue refreshed; active search and triage filters are retained. No message was sent.':'Follow-up refresh unavailable; filters are retained. No action was recorded.';});$('build814StaffFilter').addEventListener('change',()=>{clearPresetSelection822();render();});
  $('build817StaffSearch').addEventListener('input',render);$('build817ReviewTarget').addEventListener('change',()=>{clearPresetSelection822();render();});
  $('build821ComparisonMode').addEventListener('change',()=>{clearPresetSelection822();render();$('build821ComparisonStatus').focus({preventScroll:false});});
  $('build822SavePreset').addEventListener('click',saveCurrentPreset822);
  $('build822PresetSelect').addEventListener('change',applyPreset822);
  $('build822RemovePreset').addEventListener('click',removeCurrentPreset822);
   $('build823RenamePreset').addEventListener('click',renameCurrentPreset823);
   $('build823SaveNote').addEventListener('click',saveCurrentReviewDraft823);
   $('build823ClearNote').addEventListener('click',clearCurrentReviewDraft823);
   $('build823RefreshNow').addEventListener('click',load);
  $('build822ExceptionSelect').addEventListener('change',()=>{syncReviewDraftEditor823();render();$('build822ExceptionStatus').focus({preventScroll:false});});
  $('build822ClearException').addEventListener('click',()=>{$('build822ExceptionSelect').value='all';syncReviewDraftEditor823();render();$('build822ExceptionStatus').focus({preventScroll:false});});
  $('build818SaveView').addEventListener('click',saveCurrentView818);
  $('build818SavedViews').addEventListener('change',applySavedView818);
  $('build818RemoveView').addEventListener('click',removeSavedView818);
  window.setInterval(()=>{if(loaded)tickSourceFreshness823();},60000);
   document.addEventListener('visibilitychange',()=>{if(!document.hidden&&loaded)tickSourceFreshness823();});
   $('build814StaffList').addEventListener('submit',submit);$('build814StaffList').addEventListener('submit',escalate);$('build814StaffList').addEventListener('submit',assignOwner);load();}
