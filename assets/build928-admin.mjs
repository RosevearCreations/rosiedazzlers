import {correlate928,verifyRuntimeDraft928} from './build928-original-correlation.mjs';
const $=id=>document.getElementById(id),out=(id,x)=>$(id).textContent=JSON.stringify(x,null,2);
let result=null,state=null,busy=false;
const ids={aidp:'ai-data-platform',comms:'rosevear-comms-hub'};
const parse=id=>{const s=$(id).value;if(s.length>200000)throw Error('INPUT_TOO_LARGE');return JSON.parse(s)};
$('analyse').onclick=()=>{result=null;try{result=correlate928(parse('inventory'));out('result',result)}catch{out('result',{state:'HOLD',error:'INVALID_ORIGINAL_CORRELATION'})}};
$('compare').onclick=()=>{try{out('comparison',verifyRuntimeDraft928({draft:result?.draft,expected:parse('pins')}))}catch{out('comparison',{state:'HOLD',error:'INVALID_PIN_MAP'})}};
function buttons(){for(const [id,r] of Object.entries(ids))$(id).disabled=busy||!state?.receivers?.some(x=>x.receiverId===r&&x.ready)}
async function call(url,body){try{const r=await fetch(url,{credentials:'same-origin',cache:'no-store',...(body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});return {http:r.status,...await r.json()}}catch{return {ok:false,error:'PRIVATE_API_UNAVAILABLE'}}}
async function refresh(){state=null;buttons();const r=await call('/api/admin/sysop_928');if(r.ok)state=r;out('status',r);$('steps').replaceChildren();for(const row of r.receivers||[]){const p=document.createElement('p');p.textContent=row.receiverId+': ';for(const step of row.closure?.steps||[]){if(!['/admin-sysop-919.html','/admin-sysop-920.html','/admin-sysop-921.html','/admin-sysop-927.html'].includes(step.url))continue;const a=document.createElement('a');a.href=step.url;a.textContent=step.step.replaceAll('_',' ');p.append(a,document.createTextNode(' · '))}$('steps').append(p)}buttons()}
$('refresh').onclick=refresh;
for(const [id,r] of Object.entries(ids))$(id).onclick=async()=>{const row=state?.receivers?.find(x=>x.receiverId===r&&x.ready);if(!row||busy||!confirm('Request original read-only receiver GET?'))return;busy=true;buttons();try{out('readback',await call('/api/admin/sysop_921',{action:'read_original_receiver_api',ledgerReviewId:row.ledgerReviewId}));await refresh()}finally{busy=false;buttons()}};
refresh();
