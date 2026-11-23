// Rosie 923 admin-only evidence workbench; no HTML injection or secrets.
const $=id=>document.getElementById(id),endpoint='/api/admin/sysop_923';
const show=(id,val)=>$(id).textContent=typeof val==='string'?val:JSON.stringify(val,null,2);
async function request(body){
 try{const r=await fetch(endpoint,{credentials:'same-origin',cache:'no-store',...(body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});return {http:r.status,...await r.json()}}
 catch{return {ok:false,state:'HOLD',error:'ORIGINAL_EVIDENCE_API_UNAVAILABLE'}}
}
async function refresh(){
 const r=await request();if(!r.ok){show('history',r);return}
 show('history',{build:923,fieldGate:r.fieldGate,attestations:r.attestations,challenges:r.challenges,sevenSourceConnected:false,physicalRecoveryCertified:false});
 const prev=$('sample').value;$('sample').replaceChildren();const base=document.createElement('option');base.textContent='Select an original Windows signed 921 sample';base.value='';$('sample').append(base);
 for(const s of r.original921Samples||[]){const opt=document.createElement('option');opt.value=s.sampleId;opt.textContent=s.hostId+' · '+s.sampleId;$('sample').append(opt)}
 if([...$('sample').options].some(x=>x.value===prev))$('sample').value=prev;
}
$('refresh').addEventListener('click',refresh);
$('issue').addEventListener('click',async()=>{
 const healthSampleId=$('sample').value;
 if(!/^[a-f\d-]{36}$/i.test(healthSampleId)){show('challenge','Genuine original 921 sample required.');return}
 if(!confirm('Issue a one-time original Windows local read-only challenge? It will expire in 60 seconds.'))return;
 const r=await request({action:'issue_app_challenge',healthSampleId});show('challenge',r);if(r.ok)await refresh();
});
$('admit').addEventListener('click',async()=>{
 let obj;try{obj=JSON.parse($('envelope').value);if(!obj.challengeId||!obj.envelope?.payload||!obj.envelope?.signature)throw Error()}catch{show('admission','Valid original agent JSON required.');return}
 if(!confirm('Verify and retain the original signed observation? It does not certify physical recovery or application identity.'))return;
 const r=await request({action:'admit_app_attestation',challengeId:obj.challengeId,envelope:obj.envelope});show('admission',r);if(r.ok)await refresh();
});
refresh();
