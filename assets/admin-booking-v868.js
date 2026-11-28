// Rosie 868: authenticated staff camera-first private detailing intake.
const $=id=>document.getElementById(id);
const capture={photos:'rdPhotoCapture',video:'rdVideoCapture',choose:'rdMediaPick'};
const state={draft:null,busy:false,retryFiles:new Map()};
const MIME={'jpg':'image/jpeg','jpeg':'image/jpeg','png':'image/png',
 'webp':'image/webp','heic':'image/heic','mp4':'video/mp4',
 'mov':'video/quicktime','webm':'video/webm'};
const capText={photos:'Photo(s)',video:'Video',choose:'Media'};
const quoteEndpoint='/api/admin/detailing_intake_v869';
async function authorizePrivateCapture(){
 const r=await fetch(quoteEndpoint,{method:'POST',credentials:'include',
  headers:{'Content-Type':'application/json'},
  body:JSON.stringify({action:'confirm_private_photo_permission',
   draft_id:state.draft.id,confirm_private_photo_permission:true})});
 const data=await r.json().catch(()=>({}));
 if(!r.ok||!data.ok)throw Error(data.error||'Could not record private capture permission');
}
async function compressForRoadside(file){
 const type=detect(file);
 if(!type.startsWith('image/')||file.size<500*1024)return file;
 if(typeof createImageBitmap!=='function')return file;
 let bitmap;
 try{
  bitmap=await createImageBitmap(file);
  const edge=Math.max(bitmap.width,bitmap.height);
  if(!edge||!bitmap.height||!bitmap.width)return file;
  const scale=Math.min(1,1800/edge);
  const canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(bitmap.width*scale));
  canvas.height=Math.max(1,Math.round(bitmap.height*scale));
  const ctx=canvas.getContext('2d',{alpha:false});
  if(!ctx)return file;
  ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
  const jpg=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.78));
  // Keep originals if no reduction or unsupported image (e.g. HEIC).
  if(!jpg||jpg.size<1||jpg.size>=file.size)return file;
  const base=(file.name||'roadside-photo').replace(/\.[^.]+$/,'');
  return new File([jpg],base+'.jpg',{type:'image/jpeg',
   lastModified:file.lastModified||Date.now()});
 }catch{return file;}
 finally{bitmap?.close?.();}
}

function status(message,error=false){
 const el=$('rdIntakeStatus');if(!el)return;
 el.textContent=message;
 el.className=error?'notice error mini':'notice mini';
}
function toggleBusy(busy){
 state.busy=busy;
 for(const id of ['rdTakePhotos','rdTakeVideo','rdSelectMedia','rdCreateIntake',
  'rdSaveIntake']){const n=$(id);if(n)n.disabled=busy||
   (id==='rdSaveIntake'&&!state.draft);}
}
async function call(action,payload={}){
 const r=await fetch('/api/admin/detailing_intake_v868',{
  method:'POST',credentials:'include',
  headers:{'Content-Type':'application/json'},
  body:JSON.stringify({action,...payload})});
 const out=await r.json().catch(()=>({}));
 if(!r.ok||!out.ok)throw Error(out.error||'Private draft request failed');
 return out;
}
async function read(id=''){
 const path='/api/admin/detailing_intake_v868'+
  (id?'?draft_id='+encodeURIComponent(id):'');
 const r=await fetch(path,{credentials:'include'});
 const out=await r.json().catch(()=>({}));
 if(!r.ok||!out.ok)throw Error(out.error||'Could not read saved requests');
 return out;
}
function labelMedia(items){
 const box=$('rdIntakeMedia');box.replaceChildren();
 if(!Array.isArray(items)||!items.length){box.textContent='No private media saved for this request.';return;}
 for(const a of items){
  const p=document.createElement('div');p.className='panel';
  const name=document.createElement('strong');
  name.textContent=a.original_filename||'Private media';
  p.append(name);
  const meta=document.createElement('p');meta.className='mini';
  meta.textContent=(a.content_type?.startsWith('video/')?'Video':'Photo')+
   ' · '+(a.status==='stored_private'?'Saved privately':'Upload not yet confirmed');
  p.append(meta);
  if(a.status==='stored_private'){
   const view=document.createElement('button');
   view.type='button';view.className='btn ghost small';
   view.textContent='View private media';
   view.addEventListener('click',async ()=>{
    if(state.busy||state.draft?.id!==a.draft_id)return;
    const tab=window.open('about:blank','_blank');
    if(tab)tab.opener=null;
    try{
     const data=await call('preview_private',{
      draft_id:state.draft?.id,asset_id:a.id});
     if(tab)tab.location.replace(data.preview_url);
     else status('Allow pop-ups to view private media.',true);
    }catch(e){if(tab)tab.close();status(e.message,true);}
   });
   p.append(view);
  }
  if(a.status==='pending_upload'){
   const check=document.createElement('button');
   check.type='button';check.className='btn ghost small';
   check.textContent='Check saved upload';
   check.addEventListener('click',()=>checkPending894(a.id));
   p.append(check);
   const retained=state.retryFiles.get(a.id);
   if(retained?.draftId===state.draft?.id){
    const retry=document.createElement('button');
    retry.type='button';retry.className='btn small';
    retry.textContent='Retry this file';
    retry.addEventListener('click',()=>retryPending894(a.id));
    p.append(retry);
   }
  }
  box.append(p);
 }
}
async function reloadDraft894(draftId){
 const refreshed=await read(draftId);
 if(!refreshed.drafts?.[0])throw Error('Saved draft could not be reopened');
 if(state.draft?.id!==draftId)return;
 // Refresh media without replacing unsaved title/notes or reloading contact forms.
 state.draft=refreshed.drafts[0];
 labelMedia(refreshed.media||[]);
 await listSaved();
 window.dispatchEvent(new CustomEvent('rosie:intake-media-updated',
  {detail:{id:draftId}}));
}
async function checkPending894(assetId){
 if(state.busy||!state.draft)return;
 const draftId=state.draft.id;
 toggleBusy(true);
 try{
  const confirmed=await call('confirm_upload',{draft_id:draftId,asset_id:assetId});
  if(confirmed.status!=='stored_private')throw Error('File is not yet saved');
  state.retryFiles.delete(assetId);
  await reloadDraft894(draftId);
  status('Existing upload confirmed privately.');
 }catch(e){status((e.message||'Upload not confirmed')+
  '. If the original file is still in this tab, use Retry this file.',true);}
 finally{toggleBusy(false);}
}
async function retryPending894(assetId){
 if(state.busy||!state.draft)return;
 const draftId=state.draft.id;
 const retained=state.retryFiles.get(assetId);
 if(!retained||retained.draftId!==draftId){
  status('Original file is no longer in this tab. Check saved upload, then ask Admin to review the pending reservation.',true);
  return;
 }
 toggleBusy(true);
 try{
  // First check whether an earlier transfer succeeded but confirmation failed.
  const already=await call('confirm_upload',{draft_id:draftId,
   asset_id:assetId}).catch(()=>null);
  if(already?.status!=='stored_private'){
   const signed=await call('retry_upload',{draft_id:draftId,asset_id:assetId});
   if(signed.retry_existing!==true||signed.asset_id!==assetId||
      signed.content_type!==retained.type)
    throw Error('Private upload retry contract mismatch');
   const response=await fetch(signed.upload_url,{method:'PUT',
    headers:{'Content-Type':retained.type},body:retained.file});
   if(!response.ok)throw Error('Private transfer retry failed');
   const confirmed=await call('confirm_upload',{draft_id:draftId,
    asset_id:assetId});
   if(confirmed.status!=='stored_private')throw Error('Retry is awaiting confirmation');
  }
  state.retryFiles.delete(assetId);
  await reloadDraft894(draftId);
  status('Retried file stored privately; no additional draft or media slot created.');
 }catch(e){status((e.message||'Private retry failed')+
  '. Draft retained. Retry here or ask Admin to review pending storage.',true);}
 finally{toggleBusy(false);}
}
function showDraft(row,assets=[]){
 const changed=state.draft?.id!==row.id;
 if(changed){state.retryFiles.clear();$('rdPrivatePhotoConsent').checked=row.private_photo_permission===true;}
 state.draft=row;
 try{sessionStorage.setItem('rd-intake-active-v869',row.id);}catch{}
 if(changed)window.dispatchEvent(new CustomEvent('rosie:intake-selected',{detail:{id:row.id}}));
 $('rdIntakeId').value=row.id;
 $('rdIntakeLabel').value=row.display_title||row.temporary_label;
 $('rdIntakeLabel').disabled=false;
 $('rdIntakeNotes').value=row.notes||'';
 $('rdIntakeNotes').disabled=false;
 $('rdSaveIntake').disabled=false;
 labelMedia(assets);
 status('Draft '+row.temporary_label+' saved privately. Add media, notes, or resume later. No booking has been confirmed.');
}
async function create(){
 const saved=await call('create');
 showDraft(saved.draft);
 await listSaved();
 return saved.draft;
}
async function open(id){
 if(state.busy)return;
 if(state.draft?.id!==id&&state.draft&&($('rdIntakeLabel').value!==(state.draft.display_title||state.draft.temporary_label)||$('rdIntakeNotes').value!==(state.draft.notes||'')||state.retryFiles.size)&&!window.confirm('Switch requests? Unsaved title/notes and same-tab retry files will be discarded. Saved private records remain.'))return;
 toggleBusy(true);
 try{
  const response=await read(id);
  if(!response.drafts?.[0])throw Error('Saved request not found');
  showDraft(response.drafts[0],response.media||[]);
 }catch(e){status(e.message,true);}
 finally{toggleBusy(false);}
}
async function listSaved(){
 const el=$('rdSavedIntakes');
 try{
  const {drafts=[]}=await read();
  el.replaceChildren();
  if(!drafts.length){el.textContent='No saved detailing requests yet.';return;}
  for(const item of drafts){
   const p=document.createElement('div');p.className='panel';
   const name=document.createElement('strong');name.textContent=item.display_title;
   const meta=document.createElement('p');meta.className='kicker';
   meta.textContent=item.temporary_label+' · Saved '+new Date(item.updated_at).toLocaleString('en-CA');
   const button=document.createElement('button');button.className='btn small';
   button.type='button';button.textContent='Resume request';
   button.addEventListener('click',()=>open(item.id));
   p.append(name,meta,button);el.append(p);
  }
 }catch(e){el.textContent='Sign in as booking staff to view saved requests.';}
}
function detect(file){
 const byType=String(file.type||'').toLowerCase();
 if(Object.values(MIME).includes(byType))return byType;
 return MIME[(file.name.split('.').pop()||'').toLowerCase()]||'';
}
async function uploadFiles(files,kind){
 if(state.busy||!files.length)return;
 if(!$('rdPrivatePhotoConsent')?.checked){
  status('Confirm the customer allowed private estimate photos first.',true);
  return;
 }
 toggleBusy(true);
 try{
  if(!state.draft){await create();$('rdPrivatePhotoConsent').checked=true;}
  await authorizePrivateCapture();
  const before=await read(state.draft.id);
  if((before.media||[]).length+files.length>8)
   throw Error('This private draft permits at most eight total saved or pending files. Check any unfinished uploads before selecting more.');
  let complete=0;
  for(const original of files){
   const file=await compressForRoadside(original);
   if(complete>=8)throw Error('Select no more than eight files per request');
   const type=detect(file),max=type.startsWith('video/')?40*1024*1024:12*1024*1024;
   if(file!==original)status('Compressed '+original.name+' from '+
    Math.round(original.size/1024)+' KB to '+Math.round(file.size/1024)+
    ' KB for a faster private upload.');
   if(!type||!file.size||file.size>max)
    throw Error('Unsupported media or too large: '+file.name+
     '. Photos must be 12 MB or less; videos 40 MB or less.');
   status('Preparing private upload for '+file.name+'…');
   const signed=await call('sign_upload',{
    draft_id:state.draft.id,filename:file.name,content_type:type,
    file_size_bytes:file.size});
   if(signed.status!=='pending_upload'||signed.content_type!==type||!signed.asset_id)throw Error('Private upload reservation mismatch');
   // Retain the exact compressed bytes only in this tab, before any transfer.
   state.retryFiles.set(signed.asset_id,{file,type,draftId:state.draft.id});
   const response=await fetch(signed.upload_url,{
    method:'PUT',headers:{'Content-Type':type},body:file});
   if(!response.ok)throw Error('Private media transfer failed for '+file.name+
    '. The draft is still saved; use a shorter clip or retry.');
   const confirmed=await call('confirm_upload',{
    draft_id:state.draft.id,asset_id:signed.asset_id});
   if(confirmed.status!=='stored_private')throw Error('Private upload not yet confirmed');
   state.retryFiles.delete(signed.asset_id);
   complete++;
   status('Uploaded '+complete+' '+capText[kind]+' file(s) privately.');
  }
  await reloadDraft894(state.draft.id);
 }catch(e){
  const message=e.message||'Private media transfer could not finish';
  if(state.draft){try{await reloadDraft894(state.draft.id);}catch{}}
  status(message+'. The draft remains private. Check saved upload or retry the file from this tab.',true);
 }
 finally{toggleBusy(false);}
}
async function save(){
 if(!state.draft||state.busy)return;
 toggleBusy(true);
 try{
  const data=await call('save',{
   draft_id:state.draft.id,
   display_title:$('rdIntakeLabel').value,
   notes:$('rdIntakeNotes').value});
  showDraft(data.draft,(await read(data.draft.id)).media);
  await listSaved();
  status('Request '+data.draft.temporary_label+' saved. No appointment or payment was created.');
 }catch(e){status(e.message,true);}
 finally{toggleBusy(false);}
}
function boot(){
 if(!$('newDetailingRequest'))return;
 const bindings=[['rdTakePhotos',capture.photos],
  ['rdTakeVideo',capture.video],['rdSelectMedia',capture.choose]];
 for(const [btn,id] of bindings)$(btn).addEventListener('click',()=>{
  if(state.busy)return;
  if(!$('rdPrivatePhotoConsent')?.checked){
   if(!window.confirm('Confirm we have permission to take private vehicle-condition photos or video for this quote. No public posting.'))return;
   $('rdPrivatePhotoConsent').checked=true;
  }
  $(id).click();
 });
 for(const [kind,id] of Object.entries(capture)){
  $(id).addEventListener('change',event=>{
   const files=Array.from(event.target.files||[]);
   event.target.value='';
   uploadFiles(files,kind);
  });
 }
 $('rdCreateIntake').addEventListener('click',async ()=>{
  if(state.busy)return;
  if(state.draft&&($('rdIntakeLabel').value!==(state.draft.display_title||state.draft.temporary_label)||$('rdIntakeNotes').value!==(state.draft.notes||'')||state.retryFiles.size)&&!window.confirm('Start a new request? Unsaved title/notes and same-tab retry files will be discarded. Saved private records remain.'))return;
  toggleBusy(true);
  try{await create();}catch(e){status(e.message,true);}
  finally{toggleBusy(false);}
 });
 $('rdSaveIntake').addEventListener('click',save);
 listSaved();
 let last=null;try{last=sessionStorage.getItem('rd-intake-active-v869');}catch{}
 if(last&&/^[0-9a-f-]{36}$/i.test(last))open(last);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
else boot();
