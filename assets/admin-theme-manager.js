import { STANDARD_PALETTE, clonePreviewTheme, contrastRatio, exportReviewReceipt, validateThemeDraft } from './theme-preview-contract.js';

const $=id=>document.getElementById(id),STORAGE='rosie_theme_preview_drafts_v1';
const paletteInputs={background:'themeBackground',surface:'themeSurface',text:'themeText',accent:'themeAccent'};
const fallback={id:'standard',label:'Standard',version:1,status:'baseline',palette:{...STANDARD_PALETTE},slots:{static:{},managed:{}}};
let drafts=[fallback],selected='standard',staticSlots=[],activeTab='static',actor=null;
function status(message,kind=''){const el=$('themeStatus');el.textContent=message;el.dataset.kind=kind;}
function current(){return drafts.find(d=>d.id===selected)||drafts[0];}
function display(){
  const draft=current(),editable=draft.id!=='standard';
  $('themePreviewHeading').textContent=`${draft.label} — v${draft.version} · ${draft.status}`;
  const preview=$('themePreview');for(const [key,value] of Object.entries(draft.palette))preview.style.setProperty(`--theme-${key==='background'?'bg':key}`,value);
  for(const [key,id] of Object.entries(paletteInputs)){$(id).value=draft.palette[key];$(id).disabled=!editable;}
  $('themeContrast').textContent=`Text/background contrast: ${contrastRatio(draft.palette.text,draft.palette.background).toFixed(2)}:1 · 4.5:1 minimum for review.`;
  $('themeAcknowledge').checked=!!draft.review?.acknowledged;$('themeAcknowledge').disabled=!editable;
  $('themeNotes').value=draft.review?.notes||'';$('themeNotes').disabled=!editable;
  $('themeSave').disabled=!editable;$('themeExport').disabled=!editable;
  renderSlots();
}
function renderSelect(){
  const sel=$('themeSelect');sel.replaceChildren();
  for(const draft of drafts){const opt=document.createElement('option');opt.value=draft.id;opt.textContent=`${draft.label} (v${draft.version})`;sel.append(opt);}
  sel.value=selected;display();
}
function loadLocal(){
  try{const saved=JSON.parse(localStorage.getItem(STORAGE)||'[]');if(Array.isArray(saved))for(const draft of saved.slice(0,20))if(draft?.id!=='standard'&&!validateThemeDraft(draft).length&&!drafts.some(d=>d.id===draft.id))drafts.push(draft);}catch{}
}
function saveLocal(){try{localStorage.setItem(STORAGE,JSON.stringify(drafts.filter(d=>d.id!=='standard')));return true;}catch{return false;}}
function applyEditor({refresh=true}={}){
  const draft=current();if(draft.id==='standard')return false;
  for(const [key,id] of Object.entries(paletteInputs))draft.palette[key]=$(id).value;
  draft.review={acknowledged:$('themeAcknowledge').checked,notes:$('themeNotes').value.slice(0,2000)};
  if(refresh)display();return true;
}
function renderSlots(){
  const container=$('themeSlots');container.replaceChildren();
  const rows=activeTab==='static'?staticSlots:[
    {slot:'approved_service_media',filename:'Managed in Photo Studio',notes:'Only media with verified provenance and public-use approval can be assigned'},
    {slot:'customer_before_after',filename:'Private unless explicitly approved',notes:'A theme clone never copies a private customer image'},
    {slot:'r2_library_media',filename:'R2 managed content',notes:'No R2 key, object or customer consent is inferred by a preview'}
  ];
  for(const row of rows){const item=document.createElement('div');item.className='theme-slot';
    const text=document.createElement('div');const name=document.createElement('strong');name.textContent=row.slot.replaceAll('_',' ');
    const detail=document.createElement('small');detail.textContent=`${row.filename||'No static file'} — ${row.notes||'Theme-owned illustration'}`;text.append(name,detail);
    const badge=document.createElement('span');badge.className='pill';badge.textContent=activeTab==='static'?'Static':'Managed · no auto-use';item.append(text,badge);container.append(item);}
}
function downloadReceipt(receipt,name){const blob=new Blob([JSON.stringify(receipt,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
async function init(){
  const [registry,manifest]=await Promise.all([
    fetch('/data/theme_preview_registry.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null),
    fetch('/data/standard_theme_image_slots.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null)
  ]);
  if(registry?.previewOnly!==true||registry?.activePublicTheme!=='standard')return status('Theme preview contract is missing or inconsistent. Editing is disabled.','error');
  staticSlots=Array.isArray(manifest?.entries)?manifest.entries:[];
  if(!staticSlots.length)return status('Static image manifest is unavailable. Theme preview is held.','error');
  drafts=[{...fallback,...registry.baseline,palette:{...STANDARD_PALETTE},slots:{static:{},managed:{}}}];loadLocal();renderSelect();
  $('themeWorkspace').hidden=false;status('Owner preview ready. Standard remains the only active public theme.','ok');
}
function handlers(){
  $('themeSelect').addEventListener('change',e=>{selected=e.target.value;display();});
  $('themeClone').addEventListener('click',()=>{try{
    const id=$('themeNewId').value.trim(),label=$('themeNewLabel').value.trim();
    if(drafts.some(d=>d.id===id))throw Error('That theme ID already exists. Choose another ID.');
    if(drafts.length>=21)throw Error('Local preview is limited to 20 drafts.');
    const draft=clonePreviewTheme(current(),id,label);drafts.push(draft);selected=draft.id;renderSelect();
    status(`Cloned ${draft.label} as a local v${draft.version} review draft. Public Standard is unchanged.`,'ok');
  }catch(error){status(error.message,'error');}});
  for(const id of Object.values(paletteInputs))$(id).addEventListener('input',()=>{applyEditor();});
  $('themeAcknowledge').addEventListener('change',()=>applyEditor({refresh:false}));$('themeNotes').addEventListener('input',()=>applyEditor({refresh:false}));
  $('themeSave').addEventListener('click',()=>{if(!applyEditor())return;const errors=validateThemeDraft(current());if(errors.length)return status(errors.join(' '),'error');const saved=saveLocal();status(saved?'Draft saved in this browser. Export a review receipt for a durable handoff.':'Browser storage failed. Export a receipt before leaving.',saved?'ok':'error');});
  $('themeReset').addEventListener('click',()=>{const saved=(()=>{try{return(JSON.parse(localStorage.getItem(STORAGE)||'[]')||[]).find(x=>x.id===selected);}catch{return null;}})();if(selected!=='standard'&&saved&&!validateThemeDraft(saved).length){drafts=drafts.map(x=>x.id===selected?saved:x);}display();status('Unsaved theme changes reset.','ok');});
  $('themeExport').addEventListener('click',()=>{try{applyEditor();const draft=current();if(!draft.review?.acknowledged)throw Error('Check the owner review acknowledgement before exporting.');const receipt=exportReviewReceipt(draft,actor?.email||actor?.full_name||'owner');downloadReceipt(receipt,`rosie-theme-${draft.id}-v${draft.version}-review.json`);status('Review receipt exported. It does not activate or approve public theme use.','ok');}catch(error){status(error.message,'error');}});
  for(const name of ['static','managed'])$(`theme${name[0].toUpperCase()+name.slice(1)}Tab`).addEventListener('click',()=>{activeTab=name;$('themeStaticTab').setAttribute('aria-selected',String(name==='static'));$('themeManagedTab').setAttribute('aria-selected',String(name==='managed'));renderSlots();});
}
window.AdminShell.boot({pageKey:'admin-app',onReady:async({actor:currentActor})=>{
  actor=currentActor;if(!['admin','owner','super_admin'].includes(String(actor?.role_code||'').toLowerCase()))return status('Owner/Admin access is required for this review workspace.','error');
  handlers();await init();
}});
