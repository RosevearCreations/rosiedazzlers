// Build 383 — field-ready Detailer live-job workflow. Build 264 lazy/event-driven architecture retained.
// Loaded only for Arrived/Detailing/Paused jobs. No setInterval, no background polling.
import {fieldGuide805,proofCounts805} from '../../assets/detailer-job-guide-v805.mjs';
const esc=(v)=>String(v??'').replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(v)=>{try{return v?new Date(v).toLocaleString('en-CA'):'';}catch{return String(v||'');}};
const FIELD_PREFIX={checklist:'[FIELD CHECKLIST]',products:'[PRODUCT USAGE]',addons:'[APPROVED ADD-ONS]',completion:'[COMPLETION EVIDENCE]'};

export async function mount({host,job,policy,api,onJobPatch,onFieldState}){
  let currentJob=job,currentPolicy=policy,feed={updates:[],media:[],proof_media_status:{stage_counts:{}}},uploadXhr=null,lastFile=null,visible=true,pendingCapture747=null;
  let feedVerified805=false,feedLoading805=false,feedSequence805=0,previewUrl805=null;
  let lastFieldSignature='',onsite746={loaded:false,intake:null,assessment:null,receipt:null};
  host.innerHTML=`
    <section class="panel stack" data-live-module="build383">
      <div class="job-actions" style="justify-content:space-between"><div><span class="badge">Build 383 field workflow</span><h2 style="margin:8px 0 0">Field evidence, scope control & customer handoff</h2></div><button class="btn ghost" id="liveRefreshFeed" type="button">Refresh feed</button></div>
      <div class="notice ok">This module loads only for an open assigned job. Every field record is user-driven; no automatic refresh or background polling is created.</div>

      <section class="stack" aria-label="Build 383 field workflow">
        <div class="job-actions" style="justify-content:space-between"><div><strong>Field workflow readiness</strong><div class="mini">Arrival/readiness and keys/access remain server-authoritative. Before-service and completion evidence below are booking-scoped.</div></div><span class="badge" id="fieldOverallState">CHECKING</span></div>
        <div class="runtime-strip" id="fieldWorkflowStatus"></div>
        <div class="notice" id="fieldGateMessage">Load the job feed to calculate field readiness.</div>
      </section>

      <section class="panel stack field-guide805" id="fieldGuide805" aria-labelledby="fieldGuide805Title">
        <div class="job-actions" style="justify-content:space-between"><div><span class="badge">Build 805 · mobile job guide</span><h3 id="fieldGuide805Title" style="margin:7px 0">What's done, what's next</h3></div><strong id="fieldGuide805Count">Checking evidence…</strong></div>
        <p class="mini" style="margin:0">Progress is calculated from this job's verified staff feed. These shortcuts never save, approve, send, or replay an action.</p>
        <div id="fieldGuide805Steps" class="field-guide805-grid" role="list"></div>
        <div id="fieldGuide805Message" class="notice warn" role="status" aria-live="polite">Refresh the assigned job and evidence to see current steps.</div>
        <div class="job-actions"><button class="btn ghost" id="fieldGuide805Recheck" type="button">Recheck job evidence</button><button class="btn ghost" id="fieldGuide805Inspect" type="button">Inspect pending photo</button><button class="btn ghost" id="fieldGuide805Assignment" type="button">Refresh assigned jobs first</button></div>
        <div class="field-guide805-pair" id="fieldGuide805Photos" aria-label="Private before and after photo status"></div>
      </section>

      <section class="panel stack" aria-label="Onsite setup and pre-damage inspection" id="onsite746Panel" tabindex="-1">
        <h3 style="margin:0">Build 746 · Onsite setup & customer property</h3>
        <p class="mini" style="margin:0">Complete after arrival, before Start. These are staff-recorded observations and customer acknowledgements, not a customer signature. Rosie normally brings water and power; confirm the source actually available and safe today. No fee is charged here.</p>
        <div class="notice warn" id="onsite746Status" role="status" aria-live="polite">Load this assigned job's current onsite intake before editing.</div>
        <div id="onsite746Missing" class="mini"></div>
        <div class="job-actions"><button class="btn ghost" id="onsite746Reload" type="button">Reload onsite evidence</button><span class="mini" id="onsite746Revision"></span></div>
        <form id="onsite746Form" class="stack" autocomplete="off">
          <fieldset class="stack" style="min-width:0"><legend><strong>Arrival, workspace & utilities</strong></legend>
            <label class="check-row"><input data-onsite-check="vehicle_accessible_and_safe" type="checkbox">Safe, permitted work area and vehicle access inspected</label>
            <label class="check-row"><input data-onsite-check="keys_collected" type="checkbox">Keys or vehicle access received</label>
            <label class="check-row"><input data-onsite-check="water_hookup_located" type="checkbox">Usable water source located (Rosie or approved site source)</label>
            <label class="check-row"><input data-onsite-check="water_tested" type="checkbox">Water source tested</label>
            <label class="check-row"><input data-onsite-check="power_hookup_located" type="checkbox">Usable power source located (Rosie or approved site source)</label>
            <label class="check-row"><input data-onsite-check="power_tested" type="checkbox">Power source tested safely</label>
            <label class="check-row"><input data-onsite-check="owner_present_for_visual_inspection" type="checkbox">Customer present for visual inspection (leave unchecked if absent)</label>
            <label>Weather, access or site exceptions<textarea id="onsite746Weather" rows="2" maxlength="1500" placeholder="Record hazards or say None observed"></textarea></label>
          </fieldset>
          <fieldset class="stack" style="min-width:0"><legend><strong>Pre-existing damage, valuables & private photos</strong></legend>
            <label>Existing damage/condition notes (write None observed if none)<textarea id="onsite746Damage" rows="3" maxlength="1500"></textarea></label>
            <label>Valuables seen<select id="onsite746Valuables"><option value="">Select after checking</option><option value="false">None seen</option><option value="true">Yes — handling recorded</option></select></label>
            <label>Valuables handling / exceptions<textarea id="onsite746ValuablesNotes" rows="2" maxlength="1500" placeholder="Do not put money values or sensitive details in customer-visible notes"></textarea></label>
            <label>Customer permission for private job-evidence photos<select id="onsite746Consent" required><option value="not_recorded">Not recorded / awaiting decision</option><option value="internal_job_evidence">Customer explicitly agreed to private evidence</option><option value="declined">Customer declined — hold for owner review</option></select></label>
            <p class="mini">Use the existing <strong>Before photo</strong> control below for arrival and damage evidence. Photos remain internal by default; this permission never authorizes public gallery or marketing use.</p>
          </fieldset>
          <fieldset class="stack" style="min-width:0"><legend><strong>Garbage bag policy & acknowledgement</strong></legend>
            <p class="mini" style="margin:0">One medium white Glad bag is included. Each additional bag may cost $5, subject to customer/owner review. This form does not approve or collect payment.</p>
            <label>Bag estimate<select id="onsite746Bags"><option value="">Review before selecting</option><option value="1 medium white Glad bag or less">One bag or less (included)</option><option value="More than 1 medium white Glad bag">More than one bag</option></select></label>
            <label>Additional bags beyond the first<input id="onsite746ExtraCount" type="number" min="0" max="25" step="1" value="0" required></label>
            <label>Extra-bag review notes<textarea id="onsite746ExtraNotes" rows="2" maxlength="1500" placeholder="Required when there are additional bags"></textarea></label>
            <label class="check-row"><input id="onsite746BagAck" type="checkbox">Customer acknowledged possible $5 per additional bag (only tick after actual discussion)</label>
            <div class="mini" id="onsite746ChargePreview">Potential additional charge: $0.00 — not billed</div>
          </fieldset>
          <fieldset class="stack" style="min-width:0"><legend><strong>Customer acknowledgements before Start</strong></legend>
            <label class="check-row"><input data-onsite-check="inspection_acknowledged" type="checkbox">Customer acknowledged pre-work inspection</label>
            <label class="check-row"><input data-onsite-check="existing_condition_acknowledged" type="checkbox">Customer acknowledged existing conditions/notes</label>
            <label class="check-row"><input data-onsite-check="keys_handed_over_acknowledged" type="checkbox">Customer acknowledged key/access handoff</label>
            <label>Customer discussion, outstanding exceptions or approver notes<textarea id="onsite746OwnerNotes" rows="3" maxlength="1500" placeholder="Record who needs to review, not a fabricated approval"></textarea></label>
          </fieldset>
          <button class="btn primary" id="onsite746Save" type="submit">Save onsite review · no charge or message</button>
        </form>
      </section>

      <div class="runtime-strip"><div class="runtime-card"><span class="mini">Photo/video capture</span><strong id="liveMediaState">ON</strong></div><div class="runtime-card"><span class="mini">Customer progress</span><strong id="liveProgressState">${currentJob.progress_enabled?'ON':'OFF'}</strong></div><div class="runtime-card"><span class="mini">Background polling</span><strong>OFF</strong></div></div>
      <div class="job-actions"><button class="btn ghost" id="enableLiveProgress" type="button">Enable customer progress</button><button class="btn ghost" id="copyLiveProgress" type="button">Copy customer link</button><a class="btn ghost" id="liveIncidentLink" href="/admin-incident-reports.html">Incident report</a></div>

      <div class="hr"></div>
      <section class="stack" aria-label="Before-service evidence">
        <h3 style="margin:0">3. Before photos</h3>
        <div class="mini">Capture at least one arrival/pre-service photo before starting work. Existing damage should be visible and described.</div>
        <button class="btn ghost" id="prepareBeforePhoto" type="button">Prepare before-photo upload</button>

        <h3 style="margin:8px 0 0">4. Service checklist</h3>
        <label class="check-row"><input type="checkbox" id="fieldCheckCondition805" data-field-check="condition"/> Vehicle condition and pre-existing concerns reviewed</label>
        <label class="check-row"><input type="checkbox" data-field-check="scope"/> Package/service scope confirmed</label>
        <label class="check-row"><input type="checkbox" data-field-check="hazards"/> Valuables, accessories, hazards and special instructions reviewed</label>
        <label class="check-row"><input type="checkbox" data-field-check="setup"/> Work area, keys/access and safe setup confirmed</label>
        <button class="btn ghost" id="saveFieldChecklist" type="button">Save checklist evidence</button>

        <h3 style="margin:8px 0 0">5. Approved add-ons / scope changes</h3>
        <div class="mini">Record only add-ons already approved through the existing authority, or enter “None”. A detailer note does not approve, price or charge an add-on.</div>
        <textarea id="fieldAddons" rows="2" maxlength="1200" placeholder="Example: None — or approved Pet Hair Removal per current job authority"></textarea>
        <button class="btn ghost" id="saveFieldAddons" type="button">Save approved-scope record</button>

        <h3 style="margin:8px 0 0">6. Product usage</h3>
        <div class="mini">Record meaningful product/chemical usage or “Standard package consumables only”. This is operational evidence, not inventory posting.</div>
        <textarea id="fieldProducts" rows="2" maxlength="1200" placeholder="Example: Interior APC 150 mL; extractor rinse 2 L"></textarea>
        <button class="btn ghost" id="saveFieldProducts" type="button">Save product-use record</button>
      </section>

      <div class="hr"></div>
      <div class="stack">
        <label>Stage<select id="liveStage"><option value="arrival">Arrival / before service</option><option value="pre_existing">Pre-existing condition</option><option value="during" selected>During the detail</option><option value="final">Final / after service</option><option value="recommendation">Recommendation</option><option value="issue">Issue / concern</option><option value="general">General update</option></select></label>
        <label>Visibility<select id="liveAudience"><option value="customer">Customer now</option><option value="review">Admin review first</option><option value="internal">Staff only</option></select></label>
        <label>Message / update<textarea id="liveNote" rows="3" maxlength="4000" placeholder="What should the customer or team know?"></textarea></label>
        <label class="check-row"><input id="liveActionRequired" type="checkbox"/> Customer response or decision is requested</label>
        <button class="btn primary" id="postLiveNote" type="button">Send message / update</button>
      </div>
      <div class="hr"></div>
      <div class="stack">
        <div class="job-actions"><button class="btn ghost" id="prepareBeforePhoto2" type="button">Before photo</button><button class="btn ghost" id="prepareAfterPhoto" type="button">After photo</button></div>
        <p class="mini"><strong>Build 747 · original before/after evidence.</strong> Staff captures remain private, even when the message audience above is Customer. Original file only; no automatic crop, thumbnail, gallery or marketing export. Record public-use permission and redaction separately in the approved Photo Studio workflow.</p>
        <label>Photo or video<input id="liveMediaFile" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,video/mp4,video/quicktime" capture="environment"/></label>
        <label>Caption<input id="liveMediaCaption" maxlength="240" placeholder="Example: Driver seat after extraction"/></label>
        <label class="check-row"><input type="checkbox" id="capture747Reviewed"/> I checked the original for faces, number plates, addresses and other private identifiers.</label>
        <label>Privacy review result<select id="capture747Privacy"><option value="">Select after inspection</option><option value="clear">No identifying details visible</option><option value="sensitive_private">Identifying details present — keep private; redaction needed before any public use</option></select></label>
        <label>Retention<select id="liveMediaRetention"><option value="standard_365_days">Job + 365 days</option><option value="temporary_90_days">Job + 90 days</option><option value="permanent_proof">Permanent evidence</option></select></label>
        <div id="livePreview" class="idle-panel"><span class="mini">Choose a file to preview locally. No upload occurs until you press Upload.</span></div>
        <div class="job-actions"><button class="btn primary" id="uploadLiveMedia" type="button">Upload private original</button><button class="btn ghost" id="cancelLiveUpload" type="button" disabled>Cancel upload</button><button class="btn ghost" id="retryLiveUpload" type="button" disabled>Retry manually</button><button class="btn ghost" id="inspect747Upload" type="button">Inspect / recover pending upload</button></div>
        <div class="mini" id="liveUploadStatus">Direct storage upload is event-driven. Rosie only requests a signed upload URL and then saves the completed media record.</div>
      </div>

      <div class="hr"></div>
      <section class="stack" aria-label="Completion evidence and handoff">
        <h3 style="margin:0">7. Completion evidence</h3>
        <textarea id="fieldCompletion" rows="3" maxlength="1600" placeholder="Summarize completed scope, unresolved concerns, customer discussion and anything Operations should know."></textarea>
        <button class="btn ghost" id="saveFieldCompletion" type="button">Save completion evidence</button>
        <h3 style="margin:8px 0 0">8. After photos</h3>
        <button class="btn ghost" id="prepareAfterPhoto2" type="button">Prepare after-photo upload</button>
        <h3 style="margin:8px 0 0">9. Customer / final-balance handoff</h3>
        <div class="mini">This handoff opens or copies the customer payment page only. The Detailer App never marks a balance paid and never changes provider/payment state.</div>
        <div class="job-actions"><a class="btn ghost" id="finalBalanceLink" href="#">Open customer final-balance page</a><button class="btn ghost" id="copyFinalBalance" type="button">Copy final-balance link</button></div>
      </section>

      <div class="hr"></div>
      <div id="liveProof" class="runtime-strip"></div>
      <div id="liveFeedStats" class="badges"></div>
      <div id="liveFeed" class="stack"><div class="notice">Loading this open job feed once…</div></div>
    </section>`;

  const q=(id)=>host.querySelector(`#${id}`);
  function isUsable(){return visible&&currentPolicy?.selected_job_open===true&&document.body.dataset.build745Sync==='verified'&&navigator.onLine!==false;}
  function setControls(){
    const enabled=isUsable();
    q('liveMediaState').textContent=enabled?'ON':'SUSPENDED';
    q('liveProgressState').textContent=currentJob?.progress_enabled?'ON':'OFF';
    ['postLiveNote','uploadLiveMedia','enableLiveProgress','saveFieldChecklist','saveFieldAddons','saveFieldProducts','saveFieldCompletion','prepareBeforePhoto','prepareBeforePhoto2','prepareAfterPhoto','prepareAfterPhoto2'].forEach((id)=>{if(q(id))q(id).disabled=!enabled;});
    q('liveIncidentLink').href=currentJob?`/admin-incident-reports.html?booking_id=${encodeURIComponent(currentJob.id)}`:'/admin-incident-reports.html';
    const handoff=currentJob?`/final-balance-payment.html?booking_id=${encodeURIComponent(currentJob.id)}`:'#';
    q('finalBalanceLink').href=handoff;
    q('finalBalanceLink').setAttribute('aria-disabled',enabled?'false':'true');
    q('copyFinalBalance').disabled=!enabled;
    q('onsite746Reload').disabled=!enabled;
    q('fieldGuide805Recheck').disabled=!enabled||feedLoading805;
    q('fieldGuide805Inspect').disabled=!enabled||!pendingCapture747;
    const canEdit=enabled&&String(currentJob?.current_workflow_stage||'').toLowerCase()==='arrived'&&onsite746.loaded;
    q('onsite746Save').disabled=!canEdit;
    [...q('onsite746Form').elements].forEach(element=>{if(element!==q('onsite746Save'))element.disabled=!canEdit;});
  }
  function stage(){return q('liveStage').value;}
  function audience(){return q('liveAudience').value;}
  function setOnsiteStatus(message,tone='warn'){
    const node=q('onsite746Status');node.className=`notice ${tone}`;node.textContent=message;
  }
  function fillOnsite746(intake,receipt){
    const data=intake||{};
    host.querySelectorAll('[data-onsite-check]').forEach(input=>{input.checked=data[input.dataset.onsiteCheck]===true;});
    q('onsite746Weather').value=data.site_weather_notes||'';
    q('onsite746Damage').value=data.existing_damage_notes||'';
    q('onsite746Valuables').value=data.valuables_present==null?'':String(data.valuables_present);
    q('onsite746ValuablesNotes').value=data.valuables_notes||'';
    q('onsite746Consent').value=receipt?.photo_consent||'not_recorded';
    q('onsite746Bags').value=data.garbage_bag_estimate||'';
    q('onsite746ExtraCount').value=data.extra_bag_count??0;
    q('onsite746ExtraNotes').value=data.extra_charge_notes||'';
    q('onsite746BagAck').checked=receipt?.extra_bag_fee_acknowledged===true;
    q('onsite746OwnerNotes').value=data.owner_notes||'';
    renderBagPreview746();
  }
  function renderBagPreview746(){
    const count=Number(q('onsite746ExtraCount').value);
    q('onsite746ChargePreview').textContent=`Potential extra-bag charge: ${Number.isInteger(count)&&count>=0&&count<=25?new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD'}).format(count*5):'Invalid count'} — NOT billed or approved here.`;
  }
  function renderOnsite746(){
    const state=onsite746,assessment=state.assessment;
    q('onsite746Revision').textContent=state.intake?.updated_at?`Intake revised ${fmt(state.intake.updated_at)}`:'No intake saved yet';
    q('onsite746Missing').innerHTML=assessment?.missing?.length?`<strong>To resolve before Start:</strong><ul>${assessment.missing.map(item=>`<li>${esc(item)}</li>`).join('')}</ul>`:'No outstanding onsite checklist items.';
    if(state.loaded){
      const readonly=String(currentJob?.current_workflow_stage||'')!=='arrived';
      setOnsiteStatus(readonly?'Original onsite evidence loaded read-only. Customer private-photo permission remains binding; no new consent or approval was inferred.':
        assessment?.ready?'Onsite review recorded. Take an arrival photo and save the service checklist before Start.':
        'Onsite review held. Save or correct the items below; exceptions need customer/owner follow-up.',readonly?'warn':assessment?.ready?'ok':'warn');
    }
    renderFieldWorkflow();setControls();
  }
  async function loadOnsite746({manual=false}={}){
    const jobId=String(currentJob?.id||'');
    q('onsite746Panel').hidden=!['arrived','detailing','paused'].includes(String(currentJob?.current_workflow_stage||'').toLowerCase());
    if(q('onsite746Panel').hidden||!isUsable())return;
    onsite746={loaded:false,intake:null,assessment:null,receipt:null};
    setControls();setOnsiteStatus('Checking the current onsite record and audit receipt…');
    try{
      const result=await api.requestJson('/api/detailer/onsite_setup_v746',{method:'POST',body:JSON.stringify({booking_id:jobId,action:'load'})});
      if(String(currentJob?.id||'')!==jobId)return;
      if(String(result.booking_revision||'')!==String(currentJob?.updated_at||''))throw new Error('The job changed since the mobile board was loaded. Refresh assigned jobs first.');
      onsite746={loaded:true,intake:result.intake||null,assessment:result.assessment||null,receipt:result.receipt||null};
      fillOnsite746(onsite746.intake,onsite746.receipt);
      renderOnsite746();
    }catch(error){
      if(String(currentJob?.id||'')!==jobId)return;
      onsite746={loaded:false,intake:null,assessment:null,receipt:null};
      setOnsiteStatus(`${error.message||'Onsite review unavailable.'} ${manual?'No change sent.':'Manually reload after resolving the issue.'}`,'bad');
      renderFieldWorkflow();setControls();
    }
  }
  async function saveOnsite746(event){
    event.preventDefault();
    if(!isUsable()||!onsite746.loaded||String(currentJob?.current_workflow_stage||'')!=='arrived')return;
    const checks=Object.fromEntries([...host.querySelectorAll('[data-onsite-check]')].map(input=>[input.dataset.onsiteCheck,input.checked]));
    const rawValuables=q('onsite746Valuables').value;
    const body={booking_id:currentJob.id,action:'save',expected_stage:'arrived',expected_booking_updated_at:currentJob.updated_at,
      expected_intake_updated_at:onsite746.intake?.updated_at||null,...checks,
      existing_damage_notes:q('onsite746Damage').value.trim(),valuables_present:rawValuables===''?null:rawValuables==='true',
      valuables_notes:q('onsite746ValuablesNotes').value.trim(),photo_consent:q('onsite746Consent').value,
      garbage_bag_estimate:q('onsite746Bags').value,extra_bag_count:Number(q('onsite746ExtraCount').value),
      extra_charge_notes:q('onsite746ExtraNotes').value.trim(),extra_bag_fee_acknowledged:q('onsite746BagAck').checked,
      owner_notes:q('onsite746OwnerNotes').value.trim(),site_weather_notes:q('onsite746Weather').value.trim()};
    onsite746.loaded=false;setControls();setOnsiteStatus('Saving current intake and its booking audit receipt…');
    try{
      const out=await api.requestJson('/api/detailer/onsite_setup_v746',{method:'POST',body:JSON.stringify(body)});
      if(String(currentJob?.id||'')!==String(body.booking_id))return;
      onsite746={loaded:true,intake:out.intake,assessment:out.assessment,receipt:out.receipt};
      renderOnsite746();
      setOnsiteStatus(out.message||'Onsite review saved.',out.assessment?.ready?'ok':'warn');
    }catch(error){
      onsite746={loaded:false,intake:null,assessment:null,receipt:null};
      setOnsiteStatus(`${error.message||'Save outcome unconfirmed.'} Manually reload onsite evidence before attempting another save. No automatic replay.`, 'bad');
      renderFieldWorkflow();setControls();
    }
  }
  function hasFieldRecord(prefix){return (Array.isArray(feed.updates)?feed.updates:[]).some((x)=>String(x.note||'').includes(prefix));}
  function calculateFieldState(){
    const counts=feed?.proof_media_status?.stage_counts||feed?.proof_media_status?.counts||{};
    const beforePhoto=Number(counts.arrival||0)>0;
    const afterPhoto=Number(counts.final||0)>0;
    const checklist=hasFieldRecord(FIELD_PREFIX.checklist);
    const addons=hasFieldRecord(FIELD_PREFIX.addons);
    const products=hasFieldRecord(FIELD_PREFIX.products);
    const completion=hasFieldRecord(FIELD_PREFIX.completion);
    const onsiteReady=onsite746.loaded&&onsite746.dirty!==true&&onsite746.assessment?.ready===true;
    const verified=feedVerified805&&isUsable();
    return {jobId:String(currentJob?.id||''),loaded:verified,beforePhoto:verified&&beforePhoto,checklist:verified&&checklist,onsiteReady:verified&&onsiteReady,
      setupRevision:onsiteReady?onsite746.assessment.revision:null,addons,products,completion,afterPhoto,
      canStart:verified&&beforePhoto&&checklist&&onsiteReady,canComplete:verified&&beforePhoto&&checklist&&addons&&products&&completion&&afterPhoto};
  }
  function renderGuide805(state){
    const guide=fieldGuide805({fieldState:state,stage:currentJob?.current_workflow_stage,
      assignmentVerified:isUsable(),feedVerified:feedVerified805,online:navigator.onLine!==false,pendingUpload:pendingCapture747});
    q('fieldGuide805Count').textContent=guide.current?`${guide.complete} of ${guide.total} recorded`:'Recheck required';
    q('fieldGuide805Steps').innerHTML=guide.steps.map(step=>`<div class="field-guide805-step" role="listitem" data-status="${step.status}"><span><strong>${esc(step.label)}</strong><small>${step.status==='done'?'Recorded':step.status==='open'?'Action needed':step.status==='review'?'Review original job audit':'Not verified'}</small></span><button class="btn ghost small" type="button" data-guide805-target="${esc(step.target)}" ${guide.current?'':'disabled'}>Go to step</button></div>`).join('');
    q('fieldGuide805Message').className=`notice ${guide.current&&!guide.pending?'':'warn'}`.trim();
    q('fieldGuide805Message').textContent=guide.message;
    const proof=proofCounts805(guide.current?feed.proof_media_status:null);
    q('fieldGuide805Photos').innerHTML=[['Before','arrival','prepareBeforePhoto2',proof.before],['After','final','prepareAfterPhoto2',proof.after]].map(([label,stage,target,count])=>
      `<div class="field-guide805-photo"><strong>${label} photos</strong><span>${guide.current?`${count} private original(s) recorded`:'Verification required'}</span><small>${stage==='arrival'?'Record condition and pre-existing damage.':'Capture final result from matching angles where practical.'}</small><button class="btn ghost small" type="button" data-guide805-target="${target}" ${guide.current?'':'disabled'}>Prepare ${label.toLowerCase()} capture</button></div>`).join('');
  }
  function renderFieldWorkflow(){
    const state=calculateFieldState();
    const entries=[['Onsite setup',state.onsiteReady],['Before photo',state.beforePhoto],['Checklist',state.checklist],['Approved add-ons',state.addons],['Product usage',state.products],['Completion evidence',state.completion],['After photo',state.afterPhoto]];
    q('fieldWorkflowStatus').innerHTML=entries.map(([label,ok])=>`<div class="runtime-card"><span class="mini">${esc(label)}</span><strong>${ok?'DONE':'OPEN'}</strong></div>`).join('');
    q('fieldOverallState').textContent=!state.loaded?'RECHECK REQUIRED':state.canComplete?'READY TO HAND OFF':state.canStart?'IN PROGRESS':'PRE-SERVICE OPEN';
    q('fieldGateMessage').className=`notice ${state.canComplete?'ok':state.canStart?'':'warn'}`.trim();
    q('fieldGateMessage').innerHTML=!state.loaded?'<strong>Evidence not verified.</strong> Refresh the assigned job and recheck its private field feed before proceeding. No stale proof can unlock an action.':state.canComplete?'<strong>Field evidence complete.</strong> The job may proceed to customer/final-balance handoff and the normal server-authoritative completion action.':state.canStart?'<strong>Start evidence complete.</strong> Continue the approved work, then finish product/add-on records, completion evidence and after photos before completing the job.':'<strong>Before-service gate open.</strong> Save onsite acknowledgements, the service checklist, and an arrival photo before starting the job.';
    renderGuide805(state);
    const signature=JSON.stringify(state);
    if(signature!==lastFieldSignature){lastFieldSignature=signature;onFieldState?.(state);}
    return state;
  }
  function renderFeed(){
    const counts=feed?.proof_media_status?.stage_counts||feed?.proof_media_status?.counts||{};
    q('liveProof').innerHTML=['arrival','during','final'].map((key)=>`<div class="runtime-card"><span class="mini">${key==='arrival'?'Before':key==='final'?'After':'During'} proof</span><strong>${Number(counts[key]||0)}</strong></div>`).join('');
    const updates=Array.isArray(feed.updates)?feed.updates:[],media=Array.isArray(feed.media)?feed.media:[];
    const rows=[...updates.map((x)=>({...x,_type:'note'})),...media.map((x)=>({...x,_type:'media'}))].sort((a,b)=>new Date(b.created_at||0)-new Date(a.created_at||0));
    const customer=rows.filter((r)=>r.visibility==='customer').length,review=rows.filter((r)=>r.review_status==='pending'||r.requires_admin_review===true).length;
    q('liveFeedStats').innerHTML=`<span class="badge">${rows.length} items</span><span class="badge">${customer} customer</span><span class="badge">${review} review</span>`;
    q('liveFeed').innerHTML=rows.length?rows.map((item)=>{
      let mediaHtml='';
      if(item._type==='media'&&item.media_url){mediaHtml=item.kind==='video'?`<video controls preload="metadata" style="width:100%;max-height:320px" src="${esc(item.media_url)}"></video>`:`<img loading="lazy" style="width:100%;max-height:320px;object-fit:contain" src="${esc(item.media_url)}" alt="${esc(item.caption||'Job photo')}">`;}
      const customerOrigin=String(item.source_channel||'').toLowerCase()==='customer';
      return `<article class="card stack">${mediaHtml}<div class="badges"><span class="badge">${esc(item.stage||'general')}</span><span class="badge">${esc(item.visibility||'internal')}</span><span class="badge">${item._type}</span>${customerOrigin?'<span class="badge">CUSTOMER MESSAGE</span>':''}</div><strong>${esc(item._type==='media'?(item.caption||item.kind||'Media'):(item.created_by||'Update'))}</strong>${item._type==='note'?`<p>${esc(item.note||'')}</p>`:''}<span class="mini">${esc(fmt(item.created_at))}</span></article>`;
    }).join(''):'<div class="notice">No live updates yet.</div>';
    renderFieldWorkflow();
  }
  async function loadFeed({manual=false}={}){
    if(!currentJob||!isUsable())return false;
    const jobId=String(currentJob.id),revision=String(currentJob.updated_at||''),sequence=++feedSequence805;
    feedVerified805=false;feedLoading805=true;renderFieldWorkflow();setControls();
    if(manual)q('liveFeed').innerHTML='<div class="notice">Refreshing feed…</div>';
    try{
      const result=await api.requestJson('/api/detailer/live_feed',{method:'POST',body:JSON.stringify({booking_id:jobId})});
      if(sequence!==feedSequence805||String(currentJob?.id)!==jobId||String(currentJob?.updated_at||'')!==revision||!isUsable())return false;
      feed=result;feedVerified805=true;renderFeed();return true;
    }catch(error){
      if(sequence!==feedSequence805||String(currentJob?.id)!==jobId)return false;
      feedVerified805=false;feed={updates:[],media:[],proof_media_status:{stage_counts:{}}};
      q('liveFeed').innerHTML=`<div class="notice bad">${esc(error.message||'Could not load feed.')} No automatic retry was started.</div>`;
      renderFieldWorkflow();return false;
    }finally{if(sequence===feedSequence805){feedLoading805=false;setControls();}}
  }
  async function recheckEvidence805(){
    if(!isUsable())return void(q('fieldGuide805Message').textContent='Refresh current assigned jobs first. Offline or unverified changes cannot be replayed.');
    const read=await loadFeed({manual:true});
    if(String(currentJob?.current_workflow_stage||'').toLowerCase()==='arrived' ||
       ['detailing','paused'].includes(String(currentJob?.current_workflow_stage||'').toLowerCase()))await loadOnsite746({manual:true});
    if(!read)q('fieldGuide805Message').textContent='Evidence read was not verified. No job action was unlocked. Refresh the assignment and try again manually.';
  }
  function goToStep805(targetId){
    if(!isUsable())return;
    const target=q(targetId);
    if(!target||target.disabled)return;
    if(targetId==='prepareBeforePhoto2'||targetId==='prepareAfterPhoto2')target.click();
    target.scrollIntoView({block:'center',behavior:'smooth'});
    target.focus({preventScroll:true});
  }
  async function postUpdate({note,noteStage='general',noteAudience='internal',customerActionRequired=false}){
    const jobId=String(currentJob.id);
    const out=await api.requestJson('/api/detailer/job_note_post',{method:'POST',body:JSON.stringify({booking_id:jobId,note,audience:noteAudience,stage:noteStage,customer_action_required:customerActionRequired})});
    if(String(currentJob?.id)!==jobId)return out; // Never apply a prior job's receipt to the new selection.
    if(out.update){feed.updates=Array.isArray(feed.updates)?feed.updates:[];feed.updates.unshift(out.update);}
    else if(!await loadFeed())throw new Error('The save response did not contain a confirmed item. Recheck the staff feed before attempting another save.');
    renderFeed();
    return out;
  }
  async function postNote(){
    if(!isUsable())return;
    const note=q('liveNote').value.trim();if(!note)return;
    q('postLiveNote').disabled=true;
    try{await postUpdate({note,noteStage:stage(),noteAudience:audience(),customerActionRequired:q('liveActionRequired').checked});q('liveNote').value='';q('liveActionRequired').checked=false;}
    catch(error){alert(error.ambiguousMutation?`${error.message}\nVerify the feed before repeating the note.`:(error.message||'Could not post note.'));}
    finally{setControls();}
  }
  async function saveFieldRecord(kind,value){
    if(!isUsable())return;
    const prefix=FIELD_PREFIX[kind];
    const text=String(value||'').trim();
    if(!prefix||!text){alert('Enter the field record before saving.');return;}
    const button=q(kind==='checklist'?'saveFieldChecklist':kind==='products'?'saveFieldProducts':kind==='addons'?'saveFieldAddons':'saveFieldCompletion');
    if(button)button.disabled=true;
    try{await postUpdate({note:`${prefix} ${text}`.slice(0,4000),noteStage:kind==='completion'?'final':kind==='addons'?'recommendation':'during',noteAudience:'internal'});q('liveUploadStatus').textContent=`${kind==='checklist'?'Checklist':kind==='products'?'Product usage':kind==='addons'?'Approved-scope':'Completion evidence'} saved to the booking-scoped staff feed.`;}
    catch(error){alert(error.ambiguousMutation?`${error.message}\nVerify the feed before repeating this record.`:(error.message||'Could not save field record.'));}
    finally{setControls();}
  }
  function saveChecklist(){
    const checks=[...host.querySelectorAll('[data-field-check]')];
    const missing=checks.filter((x)=>!x.checked);
    if(missing.length){alert('Complete all four service-checklist confirmations before saving.');return;}
    saveFieldRecord('checklist','Condition, approved package scope, hazards/special instructions, work area and keys/access confirmed.');
  }
  function preparePhoto(photoStage){
    q('liveStage').value=photoStage;
    q('liveAudience').value='internal';
    q('liveMediaCaption').placeholder=photoStage==='arrival'?'Example: Driver-side condition before service':'Example: Driver-side result after service';
    q('liveMediaFile').focus();
    q('liveUploadStatus').textContent=photoStage==='arrival'?'Before-photo mode. Private consent + original privacy review required.':'After-photo mode. Private consent + original privacy review required.';
  }
  function preview(){
    if(previewUrl805){URL.revokeObjectURL(previewUrl805);previewUrl805=null;}
    const file=q('liveMediaFile').files?.[0],box=q('livePreview');
    if(!file){box.innerHTML='<span class="mini">Choose a file to preview locally. No upload occurs until you press Upload.</span>';return;}
    previewUrl805=URL.createObjectURL(file);
    box.innerHTML=file.type.startsWith('video/')?`<video controls preload="metadata" style="width:100%;max-height:280px" src="${previewUrl805}"></video>`:`<img style="width:100%;max-height:280px;object-fit:contain" src="${previewUrl805}" alt="Selected local preview">`;
  }
  function directPut(url,file){return new Promise((resolve,reject)=>{const xhr=new XMLHttpRequest();uploadXhr=xhr;xhr.open('PUT',url,true);xhr.setRequestHeader('Content-Type',file.type||'application/octet-stream');xhr.upload.onprogress=(e)=>{if(e.lengthComputable)q('liveUploadStatus').textContent=`Uploading directly to storage… ${Math.round(e.loaded/e.total*100)}%`;};xhr.onload=()=>xhr.status>=200&&xhr.status<300?resolve():reject(new Error(`Direct storage upload failed (${xhr.status}).`));xhr.onerror=()=>reject(new Error('Direct storage upload failed.'));xhr.onabort=()=>reject(new Error('Upload cancelled.'));xhr.send(file);});}
  async function videoDuration(file){if(!file.type.startsWith('video/'))return null;return new Promise((resolve)=>{const video=document.createElement('video'),url=URL.createObjectURL(file);video.preload='metadata';video.onloadedmetadata=()=>{const d=Number(video.duration||0)||null;URL.revokeObjectURL(url);resolve(d);};video.onerror=()=>{URL.revokeObjectURL(url);resolve(null);};video.src=url;});}
  const captureKey747=()=>`rosie:private-capture-v747:${currentJob.id}`;
  function canRecoverPending805(){
    try{const key='rosie:private-capture-storage-check-v805';sessionStorage.setItem(key,'1');sessionStorage.removeItem(key);return true;}
    catch{return false;}
  }
  const savePending747=()=>{
    try{if(pendingCapture747)sessionStorage.setItem(captureKey747(),JSON.stringify(pendingCapture747));else sessionStorage.removeItem(captureKey747());}
    catch{
      q('liveUploadStatus').textContent='Upload recovery storage unavailable. Keep this tab open and request Operations review before another capture.';
      if(pendingCapture747)throw new Error('Private upload session could not be saved for recovery. No original file was transferred.');
    }
  };
  function restorePending747(){try{pendingCapture747=JSON.parse(sessionStorage.getItem(captureKey747())||'null');}catch{pendingCapture747=null;}if(pendingCapture747)q('liveUploadStatus').textContent=`Unresolved original ${pendingCapture747.filename}. Inspect the session before another upload; no automatic replay.`;}
  async function originalHash747(file){if(file.type.startsWith('video/'))return null;const bytes=await crypto.subtle.digest('SHA-256',await file.arrayBuffer());return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');}
  async function matchingOriginal747(pending){const file=lastFile||q('liveMediaFile').files?.[0];if(!file||file.name!==pending.filename||file.size!==pending.file_size_bytes)return false;return !pending.original_sha256||(await originalHash747(file))===pending.original_sha256;}
  function finishCapture747(out,pending){
    if(out.media&&!feed.media.some(row=>row.id===out.media.id)){feed.media.unshift(out.media);const key=pending.stage;if(['arrival','pre_existing','during','final'].includes(key)){feed.proof_media_status=feed.proof_media_status||{};feed.proof_media_status.stage_counts=feed.proof_media_status.stage_counts||{};feed.proof_media_status.stage_counts[key]=Number(feed.proof_media_status.stage_counts[key]||0)+1;}}
    pendingCapture747=null;savePending747();lastFile=null;q('liveMediaFile').value='';q('liveMediaCaption').value='';preview();renderFeed();q('retryLiveUpload').disabled=true;
    q('liveUploadStatus').textContent='Private original confirmed. No thumbnail or public gallery/marketing permission was created.';
  }
  async function commit747(pending){
    if(!await matchingOriginal747(pending))throw new Error('Re-select and review the exact original file (same name, size and SHA-256) before manual recovery.');
    const jobId=String(currentJob.id);
    q('liveUploadStatus').textContent='Registering verified private original…';
    const out=await api.requestJson('/api/detailer/media_post',{method:'POST',body:JSON.stringify({booking_id:jobId,kind:pending.kind,caption:pending.caption,audience:'internal',stage:pending.stage,customer_action_required:false,storage_bucket:pending.bucket,storage_path:pending.path,content_type:pending.content_type,file_size_bytes:pending.file_size_bytes,duration_seconds:pending.duration_seconds,retention_policy:pending.retention_policy,upload_session_id:pending.upload_session_id,original_sha256:pending.original_sha256,privacy_review:pending.privacy_review})});
    if(String(currentJob?.id)!==jobId)return; // Original job retains its pending session for inspection.
    finishCapture747(out,pending);
  }
  async function inspect747(){
    if(!pendingCapture747)return void(q('liveUploadStatus').textContent='No local pending session. Select the job where the upload was started; completed photos can be checked in its feed.');
    const jobId=String(currentJob.id),sessionId=pendingCapture747.upload_session_id;
    try{
      const out=await api.requestJson('/api/detailer/media_recovery_v747',{method:'POST',body:JSON.stringify({booking_id:jobId,upload_session_id:sessionId,action:'inspect'})});
      if(String(currentJob?.id)!==jobId||pendingCapture747?.upload_session_id!==sessionId)return;
      if(out.state==='media_saved'){pendingCapture747=null;savePending747();lastFile=null;q('retryLiveUpload').disabled=true;q('liveUploadStatus').textContent='Server confirms original was saved once. Refresh the job feed to see it.';return;}
      pendingCapture747.recovery_state=out.state;pendingCapture747.session_status=out.session_status;savePending747();
      q('retryLiveUpload').disabled=!['uploaded_unregistered','file_missing'].includes(out.state);
      q('liveUploadStatus').textContent=`${out.state}: ${out.action_hint} ${out.session_status==='committing'?'A stuck commit must age at least 3 minutes before explicit reopen.':''}`;
    }catch(error){q('retryLiveUpload').disabled=true;q('liveUploadStatus').textContent=`Inspection unavailable: ${error.message}. Do not create a second upload.`;}
    finally{renderFieldWorkflow();setControls();}
  }
  async function retry747(){
    if(!pendingCapture747)return lastFile&&upload(lastFile);
    if(pendingCapture747.recovery_state==='file_missing'){pendingCapture747=null;savePending747();return lastFile&&upload(lastFile);}
    if(pendingCapture747.recovery_state!=='uploaded_unregistered')return void(q('liveUploadStatus').textContent='Inspect first. Uncertain uploads must not be duplicated.');
    try{
      if(pendingCapture747.session_status==='committing'){
        await api.requestJson('/api/detailer/media_recovery_v747',{method:'POST',body:JSON.stringify({booking_id:currentJob.id,upload_session_id:pendingCapture747.upload_session_id,action:'reopen'})});
      }
      await commit747(pendingCapture747);
    }catch(error){q('retryLiveUpload').disabled=true;q('liveUploadStatus').textContent=`Manual recovery not confirmed: ${error.message}. Inspect again before retrying.`;}
  }
  async function upload(fileOverride=null){
    if(!isUsable())return;
    const captureJobId=String(currentJob.id);
    if(pendingCapture747){q('liveUploadStatus').textContent='There is an unresolved upload. Inspect or recover it before creating another signed upload.';return;}
    if(!onsite746.loaded||onsite746.receipt?.photo_consent!=='internal_job_evidence'){
      q('liveUploadStatus').textContent='Current, explicit private-job-photo permission is required for every capture. Reload onsite setup.';
      return;
    }
    if(!q('capture747Reviewed').checked||!q('capture747Privacy').value){q('liveUploadStatus').textContent='Inspect the original for faces, plates and addresses, then classify its privacy status.';return;}
    if(!['arrival','pre_existing','during','final','issue','general'].includes(stage())){q('liveUploadStatus').textContent='Select a before, during, after, issue or general capture stage.';return;}
    if(!canRecoverPending805()){q('liveUploadStatus').textContent='This browser cannot store the private recovery session. No upload started. Enable session storage or ask Operations for help.';return;}
    const file=fileOverride||q('liveMediaFile').files?.[0];if(!file)return;lastFile=file;q('uploadLiveMedia').disabled=true;q('cancelLiveUpload').disabled=false;q('retryLiveUpload').disabled=true;let signed=null;
    try{
      if(!navigator.onLine)throw new Error('Offline. Reconnect, then use Retry manually.');
      const mediaKind=file.type.startsWith('video/')?'video':'image',duration=await videoDuration(file);
      const hash=await originalHash747(file),privacy={faces_plates_addresses_checked:true,finding:q('capture747Privacy').value};
      if(String(currentJob?.id)!==captureJobId)throw new Error('Selected job changed before the upload session was prepared.');
      q('liveUploadStatus').textContent='Requesting one signed storage upload…';
      signed=await api.requestJson('/api/detailer/media_upload_url',{method:'POST',body:JSON.stringify({booking_id:captureJobId,filename:file.name,content_type:file.type||'application/octet-stream',file_size_bytes:file.size,media_kind:mediaKind,duration_seconds:duration,retention_policy:q('liveMediaRetention').value,visibility:'internal',stage:stage(),privacy_review:privacy})});
      if(String(currentJob?.id)!==captureJobId)throw new Error('Selected job changed. The unused signed upload is not being sent.');
      pendingCapture747={upload_session_id:signed.upload_session_id,bucket:signed.bucket,path:signed.path,filename:file.name,content_type:file.type,file_size_bytes:file.size,kind:mediaKind==='image'?'photo':'video',duration_seconds:duration,retention_policy:q('liveMediaRetention').value,stage:stage(),caption:q('liveMediaCaption').value.trim()||file.name,original_sha256:hash,privacy_review:privacy,recovery_state:'needs_inspect'};savePending747();
      if(signed.upload_session_id)await api.requestJson('/api/detailer/media_upload_session',{method:'POST',body:JSON.stringify({booking_id:captureJobId,upload_session_id:signed.upload_session_id,action:'uploading'})});
      if(String(currentJob?.id)!==captureJobId)return;
      await directPut(signed.upload_url,file);
      if(String(currentJob?.id)!==captureJobId)return;
      pendingCapture747.recovery_state='uploaded_unregistered';savePending747();
      await commit747(pendingCapture747);
    }catch(error){
      if(String(currentJob?.id)!==captureJobId)return;
      q('liveUploadStatus').textContent=pendingCapture747?`${error.message||'Upload unconfirmed.'} Inspect the pending session before any retry; the original may already exist.`:(error.message||'Upload failed before a session was created.');
      q('retryLiveUpload').disabled=!!pendingCapture747||!lastFile;
    }finally{uploadXhr=null;q('cancelLiveUpload').disabled=true;renderFieldWorkflow();setControls();}
  }
  async function enableProgress(){
    if(!isUsable())return;
    try{const out=await api.requestJson('/api/detailer/progress_enable',{method:'POST',body:JSON.stringify({booking_id:currentJob.id})});currentJob={...currentJob,progress_enabled:true,progress_token:out.progress_token||currentJob.progress_token};onJobPatch?.({progress_enabled:true,progress_token:currentJob.progress_token});setControls();}
    catch(error){alert(error.message||'Could not enable customer progress.');}
  }
  async function copyProgress(){if(!currentJob?.progress_token){alert('Enable customer progress first.');return;}const url=`${location.origin}/progress.html?token=${encodeURIComponent(currentJob.progress_token)}`;try{await navigator.clipboard.writeText(url);q('liveUploadStatus').textContent='Customer progress link copied.';}catch{prompt('Copy customer progress link:',url);}}
  async function copyFinalBalance(){if(!currentJob)return;const url=`${location.origin}/final-balance-payment.html?booking_id=${encodeURIComponent(currentJob.id)}`;try{await navigator.clipboard.writeText(url);q('liveUploadStatus').textContent='Customer final-balance handoff link copied. Payment state was not changed.';}catch{prompt('Copy customer final-balance link:',url);}}

  q('liveRefreshFeed').addEventListener('click',()=>loadFeed({manual:true}));
  q('fieldGuide805Recheck').addEventListener('click',recheckEvidence805);
  q('fieldGuide805Inspect').addEventListener('click',inspect747);
  q('fieldGuide805Assignment').addEventListener('click',()=>{
    const button=document.getElementById('refreshJobs');
    if(button&&!button.disabled)button.click();
    else q('fieldGuide805Message').textContent='Assigned-job refresh is unavailable. No action was queued.';
  });
  q('fieldGuide805Steps').addEventListener('click',event=>{const button=event.target.closest('[data-guide805-target]');if(button)goToStep805(button.dataset.guide805Target);});
  q('fieldGuide805Photos').addEventListener('click',event=>{const button=event.target.closest('[data-guide805-target]');if(button)goToStep805(button.dataset.guide805Target);});
  q('postLiveNote').addEventListener('click',postNote);
  q('liveMediaFile').addEventListener('change',preview);
  q('uploadLiveMedia').addEventListener('click',()=>upload());
  q('retryLiveUpload').addEventListener('click',retry747);
  q('inspect747Upload').addEventListener('click',inspect747);
  q('cancelLiveUpload').addEventListener('click',()=>uploadXhr?.abort());
  q('enableLiveProgress').addEventListener('click',enableProgress);
  q('copyLiveProgress').addEventListener('click',copyProgress);
  q('copyFinalBalance').addEventListener('click',copyFinalBalance);
  q('saveFieldChecklist').addEventListener('click',saveChecklist);
  q('saveFieldAddons').addEventListener('click',()=>saveFieldRecord('addons',q('fieldAddons').value));
  q('saveFieldProducts').addEventListener('click',()=>saveFieldRecord('products',q('fieldProducts').value));
  q('saveFieldCompletion').addEventListener('click',()=>saveFieldRecord('completion',q('fieldCompletion').value));
  q('onsite746Reload').addEventListener('click',()=>loadOnsite746({manual:true}));
  q('onsite746Form').addEventListener('submit',saveOnsite746);
  q('onsite746Form').addEventListener('input',()=>{
    if(!onsite746.loaded)return;
    onsite746.dirty=true;setOnsiteStatus('Unsaved onsite changes. Save and verify them before Start.','warn');
    renderFieldWorkflow();
  });
  q('onsite746Form').addEventListener('change',()=>{
    if(!onsite746.loaded)return;
    onsite746.dirty=true;setOnsiteStatus('Unsaved onsite changes. Save and verify them before Start.','warn');
    renderFieldWorkflow();
  });
  q('onsite746ExtraCount').addEventListener('input',renderBagPreview746);
  q('prepareBeforePhoto').addEventListener('click',()=>preparePhoto('arrival'));
  q('prepareBeforePhoto2').addEventListener('click',()=>preparePhoto('arrival'));
  q('prepareAfterPhoto').addEventListener('click',()=>preparePhoto('final'));
  q('prepareAfterPhoto2').addEventListener('click',()=>preparePhoto('final'));
  restorePending747();
  setControls();
  await loadFeed();
  await loadOnsite746();

  return {
    setJob(nextJob,nextPolicy){
      const oldId=String(currentJob?.id||''),newId=String(nextJob?.id||oldId);
      const oldRevision=String(currentJob?.updated_at||''),newRevision=String(nextJob?.updated_at||oldRevision);
      const changed=newId!==oldId||newRevision!==oldRevision;
      currentJob=nextJob||currentJob;currentPolicy=nextPolicy||currentPolicy;
      if(changed){
        feedSequence805++;feedVerified805=false;feedLoading805=false;
        feed={updates:[],media:[],proof_media_status:{stage_counts:{}}};
        onsite746={loaded:false,intake:null,assessment:null,receipt:null};lastFieldSignature='';
        if(newId!==oldId){
          // An unfinished original is recoverable only within its own booking.
          uploadXhr?.abort();pendingCapture747=null;lastFile=null;q('liveMediaFile').value='';preview();restorePending747();
        }
        q('liveFeed').innerHTML='<div class="notice">Rechecking selected job evidence once…</div>';
      }
      setControls();renderFieldWorkflow();
      if(isUsable()&&!feedVerified805&&!feedLoading805){void loadFeed();void loadOnsite746();}
    },
    getFieldState(){return calculateFieldState();},
    setVisibility(nextVisible){visible=nextVisible!==false;if(!visible)feedVerified805=false;setControls();renderFieldWorkflow();},
    suspend(){visible=false;feedVerified805=false;setControls();renderFieldWorkflow();},
    resume(){visible=true;setControls();renderFieldWorkflow();}
  };
}
