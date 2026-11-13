// Rosie 876: native-provider readback, automatic owner escalation policy,
// and source-bound historical dossier revalidation; session-only and read-only.
const e876=id=>document.getElementById(id);
let active876='',loading876=false;
function notice876(id,message,hold=true){
 const el=e876(id);if(!el)return;
 el.textContent=message;el.className='notice mini'+(hold?' error':'');
}
async function ownerRead876(path){
 const url=path+'?draft_id='+encodeURIComponent(active876);
 const r=await fetch(url,{method:'GET',credentials:'include',cache:'no-store',
  referrerPolicy:'no-referrer'});
 const data=await r.json().catch(()=>({}));
 if(!r.ok||data.ok!==true)throw Error(data.error||'Original owner source unavailable');
 return data;
}
async function showNative876(){
 if(!active876||loading876)return;
 loading876=true;
 try{
  const result=await ownerRead876('/api/admin/roadside_native_field_v876');
  notice876('rd876NativeStatus',
   result.state+' — '+result.reason+
   (result.original_native_signature_proven?
    '. Signed native source and live provider response corroborate delivery; customer open/read remains unverified.':
    '. Native provider signature/live source not established; HOLD.'),
   result.state!=='NATIVE_PROVIDER_DELIVERED');
 }catch(ex){notice876('rd876NativeStatus','HOLD: '+ex.message);}
 finally{loading876=false;}
}
async function showPolicy876(){
 if(!active876||loading876)return;
 loading876=true;
 try{
  const result=await ownerRead876('/api/admin/roadside_refund_drift_v875');
  const policy=result.escalation_policy||{};
  notice876('rd876PolicyStatus',
   'Owner priority '+(policy.severity||'UNKNOWN')+
   ' · '+(policy.action||'manual_review')+
   ' · '+(policy.reason||result.reason)+
   (policy.due_at?' · recommended follow-up by '+new Date(policy.due_at).toLocaleString():'')+
   '. No payment/refund changes or external customer notices.',
   policy.owner_alert!==false);
 }catch(ex){notice876('rd876PolicyStatus','HOLD: '+ex.message);}
 finally{loading876=false;}
}
async function verifyArtifact876(){
 if(!active876||loading876)return;
 const file=e876('rd876ArtifactFile')?.files?.[0];
 if(!file){notice876('rd876ArtifactStatus','Choose the original downloaded closure JSON first.');return;}
 if(file.size<20||file.size>65536||!(/\.json$/i.test(file.name))){
  notice876('rd876ArtifactStatus','HOLD: select an original JSON evidence file smaller than 64 KB.');return;
 }
 loading876=true;e876('rd876Revalidate').disabled=true;
 try{
  const artifact=JSON.parse(await file.text());
  if(artifact?.schema!=='rosie-roadside-closure-export-v874')
   throw Error('Selected file is not an original closure dossier');
  const original=active876;
  const response=await fetch('/api/admin/roadside_artifact_revalidate_v876',{
   method:'POST',credentials:'include',cache:'no-store',referrerPolicy:'no-referrer',
   headers:{'Content-Type':'application/json'},
   body:JSON.stringify({draft_id:original,artifact})});
  const data=await response.json().catch(()=>({}));
  if(original!==active876)return;
  if(!response.ok||data.ok!==true)throw Error(data.error||'Original dossier revalidation failed');
  notice876('rd876ArtifactStatus',
   'Historical closure artifact revalidated against the original private ledger. '+
   'This is NOT a current refund clearance or independent external signature.'+
   (data.current_refund_case_hold?' Current refund HOLD case still exists.':''),false);
 }catch(ex){notice876('rd876ArtifactStatus','HOLD: '+ex.message);}
 finally{loading876=false;e876('rd876Revalidate').disabled=!active876;}
}
function select876(id){
 active876=id||'';
 const enabled=Boolean(active876);
 for(const name of ['rd876NativeCheck','rd876Policy','rd876Revalidate','rd876ArtifactFile']){
  const el=e876(name);if(el)el.disabled=!enabled;
 }
 if(e876('rd876ArtifactFile'))e876('rd876ArtifactFile').value='';
 notice876('rd876NativeStatus',enabled?'Original native delivery not yet rechecked.':'Choose a saved roadside request.',true);
 notice876('rd876PolicyStatus',enabled?'Run the original provider drift escalation check.':'Choose a saved roadside request.',true);
 notice876('rd876ArtifactStatus',enabled?'Choose a downloaded owner closure file to revalidate.':'No original request selected.',true);
}
function init876(){
 if(!e876('rd876NativeCheck'))return;
 e876('rd876NativeCheck').addEventListener('click',showNative876);
 e876('rd876Policy').addEventListener('click',showPolicy876);
 e876('rd876Revalidate').addEventListener('click',verifyArtifact876);
 window.addEventListener('rosie:intake-selected',e=>select876(e.detail?.id));
 window.addEventListener('rosie:roadside-consent-withdrawn',()=>select876(active876));
 select876(e876('rdIntakeId')?.value);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init876);
else init876();
