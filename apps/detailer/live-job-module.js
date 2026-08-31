// Build 266 — lazy Detailer live-job module (Build 264 architecture retained).
// Loaded only for Arrived/Detailing/Paused jobs. No setInterval, no background polling.
const esc=(v)=>String(v??'').replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(v)=>{try{return v?new Date(v).toLocaleString('en-CA'):'';}catch{return String(v||'');}};

export async function mount({host,job,policy,api,onJobPatch}){
  let currentJob=job,currentPolicy=policy,feed={updates:[],media:[],proof_media_status:{stage_counts:{}}},uploadXhr=null,lastFile=null,visible=true;
  host.innerHTML=`
    <section class="panel stack" data-live-module="build264">
      <div class="job-actions" style="justify-content:space-between"><div><span class="badge">Lazy live-job module</span><h2 style="margin:8px 0 0">Two-way job messages, media & customer progress</h2></div><button class="btn ghost" id="liveRefreshFeed" type="button">Refresh feed</button></div>
      <div class="notice ok">This module was loaded because the selected job is open. It performs no automatic refresh.</div>
      <div class="runtime-strip"><div class="runtime-card"><span class="mini">Photo/video capture</span><strong id="liveMediaState">ON</strong></div><div class="runtime-card"><span class="mini">Customer progress</span><strong id="liveProgressState">${currentJob.progress_enabled?'ON':'OFF'}</strong></div><div class="runtime-card"><span class="mini">Background polling</span><strong>OFF</strong></div></div>
      <div class="job-actions"><button class="btn ghost" id="enableLiveProgress" type="button">Enable customer progress</button><button class="btn ghost" id="copyLiveProgress" type="button">Copy customer link</button><a class="btn ghost" id="liveIncidentLink" href="/admin-incident-reports.html">Incident report</a></div>
      <div class="hr"></div>
      <div class="stack">
        <label>Stage<select id="liveStage"><option value="arrival">Arrival / setup</option><option value="pre_existing">Pre-existing condition</option><option value="during" selected>During the detail</option><option value="final">Final result</option><option value="recommendation">Recommendation</option><option value="issue">Issue / concern</option><option value="general">General update</option></select></label>
        <label>Visibility<select id="liveAudience"><option value="customer">Customer now</option><option value="review">Admin review first</option><option value="internal">Staff only</option></select></label>
        <label>Message / update<textarea id="liveNote" rows="3" maxlength="4000" placeholder="What should the customer or team know?"></textarea></label>
        <label class="check-row"><input id="liveActionRequired" type="checkbox"/> Customer response or decision is requested</label>
        <button class="btn primary" id="postLiveNote" type="button">Send message / update</button>
      </div>
      <div class="hr"></div>
      <div class="stack">
        <label>Photo or video<input id="liveMediaFile" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,video/mp4,video/quicktime" capture="environment"/></label>
        <label>Caption<input id="liveMediaCaption" maxlength="240" placeholder="Example: Driver seat after extraction"/></label>
        <label>Retention<select id="liveMediaRetention"><option value="standard_365_days">Job + 365 days</option><option value="temporary_90_days">Job + 90 days</option><option value="permanent_proof">Permanent evidence</option></select></label>
        <div id="livePreview" class="idle-panel"><span class="mini">Choose a file to preview locally. No upload occurs until you press Upload.</span></div>
        <div class="job-actions"><button class="btn primary" id="uploadLiveMedia" type="button">Upload media</button><button class="btn ghost" id="cancelLiveUpload" type="button" disabled>Cancel upload</button><button class="btn ghost" id="retryLiveUpload" type="button" disabled>Retry manually</button></div>
        <div class="mini" id="liveUploadStatus">Direct storage upload is event-driven. Rosie only requests a signed upload URL and then saves the completed media record.</div>
      </div>
      <div class="hr"></div>
      <div id="liveProof" class="runtime-strip"></div>
      <div id="liveFeedStats" class="badges"></div>
      <div id="liveFeed" class="stack"><div class="notice">Loading this open job feed once…</div></div>
    </section>`;

  const q=(id)=>host.querySelector(`#${id}`);
  function isUsable(){return visible&&currentPolicy?.selected_job_open===true;}
  function setControls(){const enabled=isUsable();q('liveMediaState').textContent=enabled?'ON':'SUSPENDED';q('liveProgressState').textContent=currentJob?.progress_enabled?'ON':'OFF';['postLiveNote','uploadLiveMedia','enableLiveProgress'].forEach((id)=>{if(q(id))q(id).disabled=!enabled;});q('liveIncidentLink').href=currentJob?`/admin-incident-reports.html?booking_id=${encodeURIComponent(currentJob.id)}`:'/admin-incident-reports.html';}
  function stage(){return q('liveStage').value;}
  function audience(){return q('liveAudience').value;}
  function renderFeed(){
    const counts=feed?.proof_media_status?.stage_counts||feed?.proof_media_status?.counts||{};
    q('liveProof').innerHTML=['arrival','during','final'].map((key)=>`<div class="runtime-card"><span class="mini">${key[0].toUpperCase()+key.slice(1)} proof</span><strong>${Number(counts[key]||0)}</strong></div>`).join('');
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
  }
  async function loadFeed({manual=false}={}){
    if(!currentJob||!isUsable())return;
    if(manual)q('liveFeed').innerHTML='<div class="notice">Refreshing feed…</div>';
    try{feed=await api.requestJson('/api/detailer/live_feed',{method:'POST',body:JSON.stringify({booking_id:currentJob.id})});renderFeed();}
    catch(error){q('liveFeed').innerHTML=`<div class="notice bad">${esc(error.message||'Could not load feed.')} No automatic retry was started.</div>`;}
  }
  async function postNote(){
    if(!isUsable())return;
    const note=q('liveNote').value.trim();if(!note)return;
    q('postLiveNote').disabled=true;
    try{
      const out=await api.requestJson('/api/detailer/job_note_post',{method:'POST',body:JSON.stringify({booking_id:currentJob.id,note,audience:audience(),stage:stage(),customer_action_required:q('liveActionRequired').checked})});
      if(out.update){feed.updates=Array.isArray(feed.updates)?feed.updates:[];feed.updates.unshift(out.update);}
      q('liveNote').value='';q('liveActionRequired').checked=false;renderFeed();
    }catch(error){alert(error.ambiguousMutation?`${error.message}\nVerify the feed before repeating the note.`:(error.message||'Could not post note.'));}
    finally{setControls();}
  }
  function preview(){const file=q('liveMediaFile').files?.[0],box=q('livePreview');if(!file){box.innerHTML='<span class="mini">Choose a file to preview locally. No upload occurs until you press Upload.</span>';return;}const url=URL.createObjectURL(file);box.innerHTML=file.type.startsWith('video/')?`<video controls preload="metadata" style="width:100%;max-height:280px" src="${url}"></video>`:`<img style="width:100%;max-height:280px;object-fit:contain" src="${url}" alt="Selected local preview">`;}
  function directPut(url,file){return new Promise((resolve,reject)=>{const xhr=new XMLHttpRequest();uploadXhr=xhr;xhr.open('PUT',url,true);xhr.setRequestHeader('Content-Type',file.type||'application/octet-stream');xhr.upload.onprogress=(e)=>{if(e.lengthComputable)q('liveUploadStatus').textContent=`Uploading directly to storage… ${Math.round(e.loaded/e.total*100)}%`;};xhr.onload=()=>xhr.status>=200&&xhr.status<300?resolve():reject(new Error(`Direct storage upload failed (${xhr.status}).`));xhr.onerror=()=>reject(new Error('Direct storage upload failed.'));xhr.onabort=()=>reject(new Error('Upload cancelled.'));xhr.send(file);});}
  async function videoDuration(file){if(!file.type.startsWith('video/'))return null;return new Promise((resolve)=>{const video=document.createElement('video'),url=URL.createObjectURL(file);video.preload='metadata';video.onloadedmetadata=()=>{const d=Number(video.duration||0)||null;URL.revokeObjectURL(url);resolve(d);};video.onerror=()=>{URL.revokeObjectURL(url);resolve(null);};video.src=url;});}
  async function upload(fileOverride=null){
    if(!isUsable())return;
    const file=fileOverride||q('liveMediaFile').files?.[0];if(!file)return;lastFile=file;q('uploadLiveMedia').disabled=true;q('cancelLiveUpload').disabled=false;q('retryLiveUpload').disabled=true;let signed=null;
    try{
      if(!navigator.onLine)throw new Error('Offline. Reconnect, then use Retry manually.');
      const mediaKind=file.type.startsWith('video/')?'video':'image',duration=await videoDuration(file);
      q('liveUploadStatus').textContent='Requesting one signed storage upload…';
      signed=await api.requestJson('/api/detailer/media_upload_url',{method:'POST',body:JSON.stringify({booking_id:currentJob.id,filename:file.name,content_type:file.type||'application/octet-stream',file_size_bytes:file.size,media_kind:mediaKind,duration_seconds:duration,retention_policy:q('liveMediaRetention').value,visibility:audience()==='customer'?'customer':'internal'})});
      if(signed.upload_session_id)await api.requestJson('/api/detailer/media_upload_session',{method:'POST',body:JSON.stringify({booking_id:currentJob.id,upload_session_id:signed.upload_session_id,action:'uploading'})});
      await directPut(signed.upload_url,file);
      q('liveUploadStatus').textContent='Saving completed media record…';
      const out=await api.requestJson('/api/detailer/media_post',{method:'POST',body:JSON.stringify({booking_id:currentJob.id,kind:mediaKind==='image'?'photo':'video',caption:q('liveMediaCaption').value.trim()||file.name,audience:audience(),stage:stage(),customer_action_required:q('liveActionRequired').checked,storage_bucket:signed.bucket,storage_path:signed.path,content_type:file.type,file_size_bytes:file.size,duration_seconds:duration,retention_policy:q('liveMediaRetention').value,upload_session_id:signed.upload_session_id})});
      if(out.media){feed.media=Array.isArray(feed.media)?feed.media:[];feed.media.unshift(out.media);const key=stage();if(['arrival','during','final'].includes(key)){feed.proof_media_status=feed.proof_media_status||{};feed.proof_media_status.stage_counts=feed.proof_media_status.stage_counts||{};feed.proof_media_status.stage_counts[key]=Number(feed.proof_media_status.stage_counts[key]||0)+1;}}
      q('liveMediaFile').value='';q('liveMediaCaption').value='';preview();renderFeed();q('liveUploadStatus').textContent='Media saved. No feed reload or background sync was required.';lastFile=null;
    }catch(error){
      if(signed?.upload_session_id){try{await api.requestJson('/api/detailer/media_upload_session',{method:'POST',body:JSON.stringify({booking_id:currentJob.id,upload_session_id:signed.upload_session_id,action:String(error.message).includes('cancel')?'cancelled':'failed',error:String(error.message||'upload failed').slice(0,300)})});}catch{}}
      q('liveUploadStatus').textContent=error.ambiguousMutation?`${error.message} Verify job media before retrying.`:(error.message||'Upload failed.');q('retryLiveUpload').disabled=!lastFile;
    }finally{uploadXhr=null;q('cancelLiveUpload').disabled=true;setControls();}
  }
  async function enableProgress(){
    if(!isUsable())return;
    try{const out=await api.requestJson('/api/detailer/progress_enable',{method:'POST',body:JSON.stringify({booking_id:currentJob.id})});currentJob={...currentJob,progress_enabled:true,progress_token:out.progress_token||currentJob.progress_token};onJobPatch?.({progress_enabled:true,progress_token:currentJob.progress_token});setControls();}
    catch(error){alert(error.message||'Could not enable customer progress.');}
  }
  async function copyProgress(){if(!currentJob?.progress_token){alert('Enable customer progress first.');return;}const url=`${location.origin}/progress.html?token=${encodeURIComponent(currentJob.progress_token)}`;try{await navigator.clipboard.writeText(url);q('liveUploadStatus').textContent='Customer progress link copied.';}catch{prompt('Copy customer progress link:',url);}}

  q('liveRefreshFeed').addEventListener('click',()=>loadFeed({manual:true}));q('postLiveNote').addEventListener('click',postNote);q('liveMediaFile').addEventListener('change',preview);q('uploadLiveMedia').addEventListener('click',()=>upload());q('retryLiveUpload').addEventListener('click',()=>lastFile&&upload(lastFile));q('cancelLiveUpload').addEventListener('click',()=>uploadXhr?.abort());q('enableLiveProgress').addEventListener('click',enableProgress);q('copyLiveProgress').addEventListener('click',copyProgress);
  setControls();
  await loadFeed();

  return {
    setJob(nextJob,nextPolicy){currentJob=nextJob||currentJob;currentPolicy=nextPolicy||currentPolicy;setControls();},
    setVisibility(nextVisible){visible=nextVisible!==false;setControls();},
    suspend(){visible=false;setControls();},
    resume(){visible=true;setControls();}
  };
}
