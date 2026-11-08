// Build 822: operator-only presentation preferences and source-bound exception drilldowns.
// Persist no authenticated records, customer search, identifiers, notes, or report content.
import { COMPARISON_MODES_821 } from './build821-followup-comparisons.mjs';

const MODES=new Set(COMPARISON_MODES_821.map(item=>item.key));
const STATUSES=new Set(['priority','unowned','mine','awaiting_staff','aging','escalated','staff_replied','needs_more_help','confirmed','all']);
const TARGETS=new Set(['all','past','soon','later','none']);
const MAX_PRESETS=4;
const validCount=value=>Number.isSafeInteger(value)&&value>=0&&value<=150;
const actorKey=actor=>/^[0-9a-f-]{36}$/i.test(String(actor??''))?`rosie.followupComparisonPresets822.${actor}`:null;
const cleanName=value=>typeof value==='string'?value.trim().replace(/\s+/g,' '):'';
const safePreset=value=>{
  if(!value||typeof value!=='object'||!/^preset-[1-4]$/.test(String(value.id)))return null;
  const name=cleanName(value.name);
  if(name.length<2||name.length>40||/[\x00-\x1f\x7f]/.test(value.name)||!MODES.has(value.mode)||!STATUSES.has(value.status)||!TARGETS.has(value.target))return null;
  return {id:value.id,name,mode:value.mode,status:value.status,target:value.target};
};

export function readPresets822(storage,actor){
  const key=actorKey(actor);
  if(!key||!storage)return {presets:[],activeId:''};
  try{
    const value=JSON.parse(storage.getItem(key)||'null');
    if(value?.version!==1||!Array.isArray(value.presets))return {presets:[],activeId:''};
    const seen=new Set(),presets=value.presets.slice(0,MAX_PRESETS).map(safePreset).filter(p=>{
      if(!p||seen.has(p.id)){return false;}seen.add(p.id);return true;
    });
    return {presets,activeId:presets.some(p=>p.id===value.activeId)?value.activeId:''};
  }catch{return {presets:[],activeId:''};}
}
function writePresets(storage,actor,value){
  const key=actorKey(actor);
  if(!key||!storage)return false;
  try{storage.setItem(key,JSON.stringify({version:1,presets:value.presets,activeId:value.activeId}));return true;}catch{return false;}
}
export function savePreset822(storage,actor,rawName,{mode,status,target}){
  const name=cleanName(rawName),data=readPresets822(storage,actor);
  if(name.length<2||name.length>40||/[\x00-\x1f\x7f]/.test(rawName)||!MODES.has(mode)||!STATUSES.has(status)||!TARGETS.has(target))return {ok:false,reason:'Choose valid comparison settings and a 2–40 character preset name.'};
  const previous=data.presets.find(p=>p.name.toLocaleLowerCase()===name.toLocaleLowerCase());
  const id=previous?.id||Array.from({length:MAX_PRESETS},(_,i)=>`preset-${i+1}`).find(slot=>!data.presets.some(p=>p.id===slot));
  if(!id)return {ok:false,reason:'Four comparison presets is the limit. Remove one before saving another.'};
  const preset={id,name,mode,status,target};
  data.presets=previous?data.presets.map(p=>p.id===id?preset:p):[...data.presets,preset];data.activeId=id;
  return writePresets(storage,actor,data)?{ok:true,...data,preset}:{ok:false,reason:'This browser tab cannot save presets. Current settings remain usable.'};
}
export function selectPreset822(storage,actor,id){
  const data=readPresets822(storage,actor);data.activeId=data.presets.some(p=>p.id===id)?id:'';
  return writePresets(storage,actor,data)?data:null;
}
export function removePreset822(storage,actor,id){
  const data=readPresets822(storage,actor);
  if(!data.presets.some(p=>p.id===id))return null;
  data.presets=data.presets.filter(p=>p.id!==id);
  if(data.activeId===id)data.activeId='';
  return writePresets(storage,actor,data)?data:null;
}
export function presetStorage822(){try{return window.sessionStorage;}catch{return null;}}

export const EXCEPTIONS_822=Object.freeze([
  {key:'all',label:'All records in current filters'},
  {key:'older48h',label:'Waiting over 48 hours'},
  {key:'unknownAge',label:'Waiting with unknown/future request date'},
  {key:'unowned',label:'Waiting without verified owner'},
  {key:'openEscalations',label:'Waiting with open supervisor review'},
  {key:'reviewPast',label:'Waiting past internal review target'},
]);
const exceptionKeys=new Set(EXCEPTIONS_822.map(item=>item.key));
const parsedTime=value=>typeof value==='string'?Date.parse(value):NaN;
export function drilldown822(rows,key,{now=Date.now(),ownershipReady=false,owners=[],escalationReady=false,escalations=[]}={}){
  if(!Array.isArray(rows)||rows.length>150||!rows.every(row=>row&&typeof row==='object')||!exceptionKeys.has(key)||!Number.isFinite(now))return {ok:false,reason:'The bounded exception source or requested category is invalid.',rows:[]};
  if((key==='unowned'||key==='reviewPast')&&(!ownershipReady||!Array.isArray(owners)))return {ok:false,reason:'Verified ownership source unavailable. This exception cannot be reviewed.',rows:[]};
  if(key==='openEscalations'&&(!escalationReady||!Array.isArray(escalations)))return {ok:false,reason:'Verified supervisor review source unavailable. This exception cannot be reviewed.',rows:[]};
  const selected=rows.filter(row=>{
    if(key==='all')return true;
    if(row.status!=='awaiting_staff')return false;
    const age=parsedTime(row.requested_at),owner=owners.find(o=>o.followup_id===row.id);
    switch(key){
      case 'older48h':return Number.isFinite(age)&&age<=now-48*3600000;
      case 'unknownAge':return !Number.isFinite(age)||age>now;
      case 'unowned':return !owner;
      case 'reviewPast':{const due=parsedTime(owner?.review_due_at);return Number.isFinite(due)&&due<=now;}
      case 'openEscalations':return escalations.some(e=>e.followup_id===row.id&&e.status!=='cleared');
      default:return false;
    }
  });
  return {ok:true,key,rows:selected,count:selected.length};
}
export function exceptionCounts822(rows,context){
  return EXCEPTIONS_822.map(item=>{
    const result=drilldown822(rows,item.key,context);
    return {key:item.key,label:item.label,count:result.ok?result.count:null,reason:result.ok?'':result.reason};
  });
}
export function reportContinuity822({loaded=false,loadedAt=null,mode,status,target,exception='all',shown,sourceCount}={}){
  if(!loaded||!Number.isFinite(loadedAt)||!validCount(shown)||!validCount(sourceCount)||shown>sourceCount)return 'No verified report context is available. Refresh the authenticated queue.';
  if(!MODES.has(mode)||!STATUSES.has(status)||!TARGETS.has(target)||!exceptionKeys.has(exception))return 'Report context is not verified. Choose valid filters and refresh.';
  const modeLabel=COMPARISON_MODES_821.find(item=>item.key===mode).label;
  const exceptionLabel=EXCEPTIONS_822.find(item=>item.key===exception).label;
  return `Live source loaded ${new Date(loadedAt).toISOString()}. ${shown} of ${sourceCount} authorized records included after current filters. Comparison: ${modeLabel}. Filter key: ${status}; internal target: ${target}; exception: ${exceptionLabel}. This is a current-session review, not a historic report. Saved presets contain settings only; reports and customer records are never persisted or exported.`;
}
