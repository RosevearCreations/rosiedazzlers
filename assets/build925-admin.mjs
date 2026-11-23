const $=id=>document.getElementById(id);
const show=(id,v)=>$(id).textContent=JSON.stringify(v,null,2);
async function call(body){try{const r=await fetch('/api/admin/sysop_925',{credentials:'same-origin',cache:'no-store',...(body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});return {http:r.status,...await r.json()}}catch{return {state:'HOLD',error:'PRIVATE_API_UNAVAILABLE'}}}
$('refresh').onclick=async()=>show('status',await call());
$('issue').onclick=async()=>{if(confirm('Issue a private original evidence case?'))show('case',await call({action:'issue_case',appAttestationId:$('app').value.trim()}))};
$('admit').onclick=async()=>{try{const b=JSON.parse($('bundle').value);if(confirm('Verify and retain these independent signed reviews?')){const r=await call({...b,action:'admit_review'});show('result',r);if(r.ok)$('bundle').value=''}}catch{show('result',{error:'INVALID_JSON'})}};
$('refresh').click();
