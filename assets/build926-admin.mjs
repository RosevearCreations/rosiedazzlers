const $=id=>document.getElementById(id),show=(id,v)=>$(id).textContent=JSON.stringify(v,null,2);
async function call(body){try{const r=await fetch('/api/admin/sysop_926',{credentials:'same-origin',cache:'no-store',...(body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});return {http:r.status,...await r.json()}}catch{return {state:'HOLD',error:'PRIVATE_API_UNAVAILABLE'}}}
$('refresh').onclick=async()=>show('status',await call());
$('issueEnrollment').onclick=async()=>{if(confirm('Issue a challenge for the pre-enrolled witness?'))show('enrollmentChallenge',await call({action:'issue_enrollment'}))};
$('issueRuntime').onclick=async()=>{if(confirm('Issue an original runtime observation challenge?'))show('runtimeCase',await call({action:'issue_runtime_case',reviewId:$('review').value.trim(),enrollmentId:$('enrollment').value.trim()}))};
async function submit(input,out,action){try{const b=JSON.parse($(input).value);if(confirm('Submit my own signed original evidence?')){const r=await call({...b,action});show(out,r);if(r.ok)$(input).value=''}}catch{show(out,{error:'INVALID_JSON'})}}
$('enroll').onclick=()=>submit('envelope','enrollmentResult','admit_enrollment');
$('certify').onclick=()=>submit('bundle','decision','certify');
$('refresh').click();
