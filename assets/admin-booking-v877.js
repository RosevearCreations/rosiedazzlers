// Rosie 877 — independent owner controls, never customer sends or payments.
const el877=id=>document.getElementById(id);
let draft877='',busy877=false;
const show877=(id,s,hold=true)=>{
 const el=el877(id);if(!el)return;el.textContent=s;el.className='notice mini'+(hold?' error':'');
};
async function get877(route,needsDraft=false){
 const suffix=needsDraft?'?draft_id='+encodeURIComponent(draft877):'';
 const r=await fetch(route+suffix,{credentials:'include',cache:'no-store',
   referrerPolicy:'no-referrer'});
 const data=await r.json().catch(()=>({}));
 if(!r.ok||data.ok!==true)throw Error(data.error||'Original owner readback unavailable');
 return data;
}
async function native877(){
 if(busy877)return;busy877=true;
 try{
  const d=await get877('/api/admin/roadside_provider_enrollment_v877');
  const status=d.enrollment_verified?'Original live provider webhook registration confirmed':
    'Original provider enrollment HOLD';
  show877('rd877EnrollmentStatus',status+' — '+d.reason+
   (d.signing_key_binding_verified?
    ' · Dedicated callback signing-key match confirmed.':
    ' · Webhook signing-key binding unverified; a native signed event is still required.'),
   !d.enrollment_verified||!d.signing_key_binding_verified);
 }catch(e){show877('rd877EnrollmentStatus','HOLD: '+e.message);}
 finally{busy877=false;}
}
async function audit877(){
 if(!draft877||busy877)return;busy877=true;
 try{
  const d=await get877('/api/admin/roadside_sla_audit_v877',true);
  const deadline=d.due_at?' · Due '+new Date(d.due_at).toLocaleString():'';
  show877('rd877SlaStatus',d.state+' · priority '+(d.policy?.severity||'UNKNOWN')+
   deadline+(d.overdue_minutes?' · '+d.overdue_minutes+' minutes overdue':'')+
   '. Original case clock is not reset by refresh. No payment or case changes.',
   d.state!=='NO_CURRENT_ALERT'&&d.state!=='SLA_WITHIN_POLICY');
 }catch(e){show877('rd877SlaStatus','HOLD: '+e.message);}
 finally{busy877=false;}
}
async function renew877(){
 if(!draft877||busy877)return;
 const f=el877('rd877Artifact')?.files?.[0];
 if(!f||f.size<20||f.size>65536||!(/\.json$/i.test(f.name))){
  show877('rd877ProvenanceStatus','HOLD: choose an original downloaded closure JSON file smaller than 64 KB.');
  return;
 }
 busy877=true;el877('rd877Renew').disabled=true;
 const chosen=draft877;
 try{
  const artifact=JSON.parse(await f.text());
  if(artifact?.schema!=='rosie-roadside-closure-export-v874')
   throw Error('Original source-bound closure export required');
  const r=await fetch('/api/admin/roadside_provenance_renew_v877',{
   method:'POST',credentials:'include',cache:'no-store',referrerPolicy:'no-referrer',
   headers:{'Content-Type':'application/json'},
   body:JSON.stringify({draft_id:chosen,artifact})});
  if(!r.ok){
   const data=await r.json().catch(()=>({}));
   throw Error(data.error||'Independent original issuer or source verification unavailable');
  }
  const data=await r.json();
  if(data.ok!==true||data.owner_key_signature_verified!==true||
     data.payload?.draft_id!==chosen)throw Error('Issuer proof did not match original owner dossier');
  if(chosen!==draft877)return;
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  try{
   const a=document.createElement('a');a.href=url;a.download='rosie-provenance-'+chosen.slice(0,8)+'-v877.json';
   document.body.append(a);a.click();a.remove();
  }finally{setTimeout(()=>URL.revokeObjectURL(url),15000);}
  show877('rd877ProvenanceStatus','Historical dossier source verified and dedicated issuer signature downloaded. This is not an independent third-party witness or current financial clearance.',false);
 }catch(e){show877('rd877ProvenanceStatus','HOLD: '+e.message);}
 finally{busy877=false;el877('rd877Renew').disabled=!draft877;}
}
function select877(id){
 draft877=id||'';
 for(const name of ['rd877Sla','rd877Artifact','rd877Renew']){
  if(el877(name))el877(name).disabled=!draft877;
 }
 if(el877('rd877Artifact'))el877('rd877Artifact').value='';
 show877('rd877SlaStatus',draft877?'Original owner SLA not yet independently checked.':'Select a roadside draft.');
 show877('rd877ProvenanceStatus',draft877?'Select a downloaded historical dossier for issuer renewal.':'Select a roadside draft.');
}
function boot877(){
 if(!el877('rd877Enrollment'))return;
 el877('rd877Enrollment').addEventListener('click',native877);
 el877('rd877Sla').addEventListener('click',audit877);
 el877('rd877Renew').addEventListener('click',renew877);
 window.addEventListener('rosie:intake-selected',e=>select877(e.detail?.id));
 window.addEventListener('rosie:roadside-consent-withdrawn',()=>select877(draft877));
 select877(el877('rdIntakeId')?.value);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot877);
else boot877();
