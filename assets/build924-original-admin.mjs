// Rosie 924 original Admin field workbench: never exposes keys, service role or auto-certification.
const $=id=>document.getElementById(id),endpoint='/api/admin/sysop_924';
const show=(id,value)=>$(id).textContent=typeof value==='string'?value:JSON.stringify(value,null,2);
async function call(body){
 try{const r=await fetch(endpoint,{credentials:'same-origin',cache:'no-store',...(body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});
  const data=await r.json();return {http:r.status,...data};}
 catch{return {ok:false,state:'HOLD',error:'ORIGINAL_924_PRIVATE_API_UNAVAILABLE'}}
}
async function refresh(){
 const r=await call();show('history',r);
 if(!r.ok)return;
 const previous=$('source').value;$('source').replaceChildren();
 const initial=document.createElement('option');initial.value='';initial.textContent='Select authentic Build 923 app attestation';$('source').append(initial);
 for(const a of r.originalApps||[]){const opt=document.createElement('option');opt.value=a.id;opt.textContent=a.hostId+' · '+a.id;$('source').append(opt)}
 if([...$('source').options].some(x=>x.value===previous))$('source').value=previous;
 show('case',r.currentCaseDigestSha256?{
  identityWitnessId:r.identityWitnesses?.[0]?.id,caseDigestSha256:r.currentCaseDigestSha256,
  note:'Read-only case digest for a fresh signed owner review. Two distinct original owner keys must sign separately.'
 }:'HOLD: Run both fresh original receiver-native GETs using Build 921 and admit original service identity before signing. No automatic approval.');
}
$('refresh').addEventListener('click',refresh);
$('challengeButton').addEventListener('click',async()=>{
 const appAttestationId=$('source').value;if(!/^[a-f0-9-]{36}$/i.test(appAttestationId)){show('challenge','Select an original signed 923 source.');return}
 if(!confirm('Issue a 90-second original Windows read-only SCM service challenge?'))return;
 const r=await call({action:'issue_identity_challenge',appAttestationId});show('challenge',r);if(r.ok)await refresh();
});
$('identityButton').addEventListener('click',async()=>{
 let parsed;try{parsed=JSON.parse($('identityEnvelope').value);if(!parsed.challengeId||!parsed.envelope?.payload||!parsed.envelope?.signature)throw Error()}catch{show('identityResult','Valid original Windows inspector JSON required.');return}
 if(!confirm('Verify independent signed Windows service identity and store an immutable review record?'))return;
 const r=await call({action:'admit_service_identity',challengeId:parsed.challengeId,envelope:parsed.envelope});show('identityResult',r);if(r.ok)await refresh();
});
$('ownerButton').addEventListener('click',async()=>{
 let parsed;try{parsed=JSON.parse($('ownerEnvelope').value);if(!parsed.envelope?.payload||!parsed.envelope?.signature)throw Error()}catch{show('ownerResult','Valid separately signed original owner envelope required.');return}
 if(!confirm('Submit this owner-signed final field REVIEW? This does NOT issue operational certification.'))return;
 const r=await call({action:'record_owner_final_review',envelope:parsed.envelope});show('ownerResult',r);if(r.ok)await refresh();
});
refresh();
