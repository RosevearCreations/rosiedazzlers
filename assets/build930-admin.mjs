const $=id=>document.getElementById(id),out=(id,v)=>$(id).textContent=JSON.stringify(v,null,2);let busy=false;
async function request(body){try{const r=await fetch('/api/admin/sysop_930',{credentials:'same-origin',cache:'no-store',...(body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});return {http:r.status,...await r.json()}}catch{return {ok:false,error:'PRIVATE_API_UNAVAILABLE'}}}
async function refresh(){const r=await request();out('status',r);$('issue').disabled=busy||r.state!=='READY_TO_ISSUE_CASE_NOT_CERTIFIED'}
$('refresh').onclick=refresh;
$('issue').onclick=async()=>{if(busy)return;busy=true;$('issue').disabled=true;try{out('case',await request({action:'issue_case'}))}finally{busy=false;await refresh()}};
$('admit').onclick=async()=>{if(busy)return;try{const s=$('bundle').value;if(s.length>45000)throw Error();const b=JSON.parse(s);if(Object.keys(b).length!==4||!['caseId','guest','launcher','authority'].every(k=>Object.hasOwn(b,k)))throw Error();if(!confirm('Verify and record an immutable original signed receipt?'))return;busy=true;$('admit').disabled=true;out('result',await request({...b,action:'admit_receipt'}));await refresh()}catch{out('result',{ok:false,error:'INVALID_BUNDLE'})}finally{busy=false;$('admit').disabled=false;await refresh()}};
refresh();
