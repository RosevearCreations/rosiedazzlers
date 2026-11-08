// Build 823: read-only supervisor review drafts, safer preset rename, and visible source freshness.
// Drafts are returned to the current page only: never send them, log them, or persist them.
import {readPresets822, EXCEPTIONS_822} from './build822-followup-review-continuity.mjs';

const USER=/^[0-9a-f-]{36}$/i;
const EXCEPTIONS=new Set(EXCEPTIONS_822.map(item=>item.key));
const LIMIT=4;
const NAME=/[\x00-\x1f\x7f]/;
const STORAGE_PREFIX='rosie.followupComparisonPresets822.';
export const FRESHNESS_823=Object.freeze({warningAfterMs:5*60*1000,expireAfterMs:15*60*1000});

export function sourceFreshness823({loaded=false,loadedAt=null,now=Date.now()}={}){
  if(!loaded||!Number.isFinite(loadedAt)||loadedAt<=0||!Number.isFinite(now)||loadedAt>now+5000){
    return {status:'unavailable',allowReport:false,elapsedMinutes:null,message:'Report source is unavailable or its clock cannot be verified. Refresh the authenticated follow-up queue.'};
  }
  const elapsed=Math.max(0,now-loadedAt),elapsedMinutes=Math.floor(elapsed/60000);
  if(elapsed>=FRESHNESS_823.expireAfterMs){
    return {status:'expired',allowReport:false,elapsedMinutes,message:'Report source expired (15 minutes or older). Refresh the authenticated queue before reviewing or preparing a report. No previously loaded totals are current.'};
  }
  if(elapsed>=FRESHNESS_823.warningAfterMs){
    return {status:'warning',allowReport:true,elapsedMinutes,message:'Report source is more than 5 minutes old. Totals are a snapshot only; refresh before a supervisor decision.'};
  }
  return {status:'fresh',allowReport:true,elapsedMinutes,message:'Report source was refreshed recently. Figures are a bounded snapshot, not a live event stream.'};
}

export function renamePreset823(storage,actor,id,rawName){
  if(!USER.test(String(actor??''))||!storage)return {ok:false,reason:'A verified staff session and browser-tab storage are required.'};
  const name=typeof rawName==='string'?rawName.trim().replace(/\s+/g,' '):'';
  if(name.length<2||name.length>40||NAME.test(rawName)||!/^preset-[1-4]$/.test(String(id)))return {ok:false,reason:'Choose a valid preset and a 2–40 character name without control characters.'};
  const data=readPresets822(storage,actor);
  const previous=data.presets.find(p=>p.id===id);
  if(!previous)return {ok:false,reason:'Select an existing comparison preset to rename.'};
  if(data.presets.some(p=>p.id!==id&&p.name.toLocaleLowerCase()===name.toLocaleLowerCase()))return {ok:false,reason:'A preset with that name already exists.'};
  if(data.presets.length>LIMIT)return {ok:false,reason:'The preset list exceeds its validated limit.'};
  const presets=data.presets.map(p=>p.id===id?{...p,name}:p);
  try{
    storage.setItem(STORAGE_PREFIX+actor,JSON.stringify({version:1,presets,activeId:data.activeId}));
    return {ok:true,presets,activeId:data.activeId,name};
  }catch{return {ok:false,reason:'This tab could not rename the preset. The existing saved settings were not changed.'};}
}

export function validateReviewDraft823({actor,sourceReady=false,category,shown,text,now=Date.now()}={}){
  if(!USER.test(String(actor??''))||!sourceReady||!EXCEPTIONS.has(category)||!Number.isSafeInteger(shown)||shown<0||shown>150||!Number.isFinite(now)){
    return {ok:false,reason:'Load a verified, fresh supervisor queue and exception category before drafting notes.'};
  }
  // No HTML rendering, network calls, or persisted data. Text is only held in page memory.
  if(typeof text!=='string'||text.length>500||/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(text))return {ok:false,reason:'Review notes must be plain text of at most 500 characters.'};
  const value=text.trim();
  if(value.length<8)return {ok:false,reason:'Enter at least 8 characters of internal review context.'};
  return {ok:true,category,text:value,reviewedAt:new Date(now).toISOString(),shown};
}

export function reviewDraftSummary823(note,{actor,category,sourceReady}={}){
  if(!USER.test(String(actor??''))||!sourceReady||!note?.ok||note.category!==category)return 'No verified local draft for this exception category. Notes are not saved to the server.';
  return 'Internal draft for the selected exception is held only in this open page. It is not an official audit event, customer communication, or saved report; refreshing or leaving the page clears it.';
}
