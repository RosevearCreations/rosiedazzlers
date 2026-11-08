// Build 818: bounded, tab-only supervisor filter presets. Never store search,
// customer content, reviewer notes, queue records or authentication tokens.
const STATUSES=new Set(['priority','unowned','mine','awaiting_staff','aging','escalated','staff_replied','needs_more_help','confirmed','all']);
const TARGETS=new Set(['all','past','soon','later','none']);
const MAX_VIEWS=5;
const actorKey=actor=>/^[0-9a-f-]{36}$/i.test(String(actor||''))?`rosie.followupViews818.${actor}`:null;
const safeView=view=>{
  if(!view||typeof view!=='object'||!/^slot-[1-5]$/.test(String(view.id)))return null;
  const name=typeof view.name==='string'?view.name.replace(/[\x00-\x1f\x7f]/g,'').trim().replace(/\s+/g,' ').slice(0,40):'';
  if(name.length<2||!STATUSES.has(view.status)||!TARGETS.has(view.target))return null;
  return {id:view.id,name,status:view.status,target:view.target};
};
export function readViews818(storage,actor){
  const key=actorKey(actor);
  if(!key||!storage)return {views:[],activeId:''};
  try{
    const data=JSON.parse(storage.getItem(key)||'null');
    if(data?.version!==1||!Array.isArray(data.views))return {views:[],activeId:''};
    const used=new Set();
    const views=data.views.slice(0,MAX_VIEWS).map(safeView).filter(view=>{
      if(!view||used.has(view.id))return false;
      used.add(view.id);return true;
    });
    return {views,activeId:views.some(v=>v.id===data.activeId)?data.activeId:''};
  }catch{return {views:[],activeId:''};}
}
function persist(storage,actor,data){
  const key=actorKey(actor);
  if(!key||!storage)return false;
  try{storage.setItem(key,JSON.stringify({version:1,...data}));return true;}catch{return false;}
}
export function saveView818(storage,actor,rawName,{status,target}){
  const name=typeof rawName==='string'?rawName.trim().replace(/\s+/g,' '):'';
  if(name.length<2||name.length>40||/[\x00-\x1f\x7f]/.test(name)||!STATUSES.has(status)||!TARGETS.has(target))return {ok:false,reason:'Enter a 2–40 character view name and valid filters.'};
  const data=readViews818(storage,actor);
  const existing=data.views.find(v=>v.name.toLocaleLowerCase()===name.toLocaleLowerCase());
  const slot=existing?.id||Array.from({length:MAX_VIEWS},(_,i)=>`slot-${i+1}`).find(id=>!data.views.some(v=>v.id===id));
  if(!slot)return {ok:false,reason:'Five saved views is the limit. Remove one before saving another.'};
  const view={id:slot,name,status,target};
  data.views=existing?data.views.map(v=>v.id===slot?view:v):[...data.views,view];
  data.activeId=slot;
  return persist(storage,actor,data)?{ok:true,...data,view}:{ok:false,reason:'This browser tab cannot save views. Filters remain usable.'};
}
export function selectView818(storage,actor,id){
  const data=readViews818(storage,actor);
  data.activeId=data.views.some(v=>v.id===id)?id:'';
  return persist(storage,actor,data)?data:null;
}
export function removeView818(storage,actor,id){
  const data=readViews818(storage,actor);
  if(!data.views.some(v=>v.id===id))return null;
  data.views=data.views.filter(v=>v.id!==id);
  if(data.activeId===id)data.activeId='';
  return persist(storage,actor,data)?data:null;
}
export function viewStorage818(){try{return window.sessionStorage;}catch{return null;}}
