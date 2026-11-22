// Rosie 918 private Admin controls, no provider secrets, background polling or auto-accept.
const $=id=>document.getElementById(id),endpoint='/api/admin/sysop_918';
const show=(id,value)=>$(id).textContent=typeof value==='string'?value:JSON.stringify(value,null,2);
async function call(path,opt={}){try{const res=await fetch(path,{credentials:'same-origin',cache:'no-store',...opt});const body=await res.json();return {http:res.status,...body}}catch{return {ok:false,error:'PRIVATE_SOURCE_UNAVAILABLE'}}}
const send=body=>call(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
async function load(){
 const r=await call(endpoint);
 if(!r.ok){show('summary',{state:'ORIGINAL_SOURCE_HOLD',detail:r.error||r.http});return;}
 $('summary').textContent=(r.signedSourceCount||0)+' of 7 fresh signed source observations. Independent Master receiver/Windows-host recovery: HOLD.';
 $('sources').replaceChildren();
 for(const item of r.sources||[]){
  const tr=document.createElement('tr');
  for(const v of [item.appId,item.enrolled?'Public pin enrolled':'No independently enrolled pin',item.sourceState]){
   const td=document.createElement('td');td.textContent=String(v||'UNKNOWN');tr.append(td);
  }$('sources').append(tr);
 }
 show('host',r.originalHost);
}
$('load').addEventListener('click',load);
$('challenge').addEventListener('click',async()=>{
 const r=await send({action:'issue_challenge',app_id:$('app').value});
 show('challengeResult',r.ok?{appId:r.appId,challengeId:r.challengeId,challenge:r.challenge,expiresAt:r.expiresAt,validForSeconds:r.validForSeconds}:r);
 if(r.ok)$('challengeId').value=r.challengeId;
});
$('admit').addEventListener('click',async()=>{
 let signed;try{signed=JSON.parse($('envelope').value)}catch{show('admitResult','Valid signed JSON envelope required. Nothing recorded.');return;}
 if(!confirm('Verify and store this original signed source as SOURCE_ONLY? No Master CONNECTED or recovery acceptance is granted.'))return;
 show('admitResult',await send({action:'admit_signed',challenge_id:$('challengeId').value.trim(),envelope:signed}));
});
$('witness').addEventListener('click',async()=>{
 const f=$('hostFile').files[0];
 if(!f||f.size>10*1024*1024){show('witnessResult','Select an original evidence file (10 MB maximum); only its SHA-256 will leave this device.');return;}
 if(!confirm('Record second-staff observation only? This does not certify a physical host reboot.'))return;
 const digest=await crypto.subtle.digest('SHA-256',await f.arrayBuffer());
 const evidence_sha256=[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
 show('witnessResult',await send({action:'host_witness',receipt_id:$('hostReceipt').value.trim(),evidence_sha256}));
});
