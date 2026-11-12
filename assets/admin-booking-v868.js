// Rosie 868: authenticated staff camera-first private detailing intake.
const $=id=>document.getElementById(id);
const capture={photos:'rdPhotoCapture',video:'rdVideoCapture',choose:'rdMediaPick'};
const state={draft:null,busy:false};
const MIME={'jpg':'image/jpeg','jpeg':'image/jpeg','png':'image/png',
 'webp':'image/webp','heic':'image/heic','mp4':'video/mp4',
 'mov':'video/quicktime','webm':'video/webm'};
const capText={photos:'Photo(s)',video:'Video',choose:'Media'};
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
    const tab=window.open('about:blank','_blank');
    try{
     const data=await call('preview_private',{
      draft_id:state.draft?.id,asset_id:a.id});
     if(tab)tab.location.replace(data.preview_url);
     else status('Allow pop-ups to view private media.',true);
    }catch(e){if(tab)tab.close();status(e.message,true);}
   });
   p.append(view);
  }
  box.append(p);
 }
}
function showDraft(row,assets=[]){
 state.draft=row;
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
 toggleBusy(true);
 try{
  if(!state.draft)await create();
  let complete=0;
  for(const file of files){
   if(complete>=8)throw Error('Select no more than eight files per request');
   const type=detect(file),max=type.startsWith('video/')?40*1024*1024:12*1024*1024;
   if(!type||!file.size||file.size>max)
    throw Error('Unsupported media or too large: '+file.name+
     '. Photos must be 12 MB or less; videos 40 MB or less.');
   status('Preparing private upload for '+file.name+'…');
   const signed=await call('sign_upload',{
    draft_id:state.draft.id,filename:file.name,content_type:type,
    file_size_bytes:file.size});
   const response=await fetch(signed.upload_url,{
    method:'PUT',headers:{'Content-Type':type},body:file});
   if(!response.ok)throw Error('Private media transfer failed for '+file.name+
    '. The draft is still saved; use a shorter clip or retry.');
   const confirmed=await call('confirm_upload',{
    draft_id:state.draft.id,asset_id:signed.asset_id});
   if(confirmed.status!=='stored_private')throw Error('Private upload not yet confirmed');
   complete++;
   status('Uploaded '+complete+' '+capText[kind]+' file(s) privately.');
  }
  const refreshed=await read(state.draft.id);
  showDraft(refreshed.drafts[0],refreshed.media);
  await listSaved();
 }catch(e){status(e.message,true);}
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
  if(!state.busy)$(id).click();
 });
 for(const [kind,id] of Object.entries(capture)){
  $(id).addEventListener('change',event=>{
   const files=Array.from(event.target.files||[]);
   event.target.value='';
   uploadFiles(files,kind);
  });
 }
 $('rdCreateIntake').addEventListener('click',async ()=>{
  if(state.busy)return;toggleBusy(true);
  try{await create();}catch(e){status(e.message,true);}
  finally{toggleBusy(false);}
 });
 $('rdSaveIntake').addEventListener('click',save);
 listSaved();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
else boot();
