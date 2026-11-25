import {capture931} from './build931-original-enrollment.mjs';
const $=id=>document.getElementById(id),out=(id,x)=>$(id).textContent=JSON.stringify(x,null,2);let ch=null,busy=false;
const parse=id=>{const s=$(id).value;if(s.length>200000)throw Error();return JSON.parse(s)};
async function call(body){try{const r=await fetch('/api/admin/sysop_931',{credentials:'same-origin',cache:'no-store',...(body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});return {http:r.status,...await r.json()}}catch{return {ok:false,error:'PRIVATE_API_UNAVAILABLE'}}}
async function refresh(){const v=await call();out('status',v);$('enroll').disabled=busy||!v.role||!v.storage;$('issue').disabled=busy||!v.readyForReceipt||v.role!=='CUSTODY_AUTHORITY';$('admit').disabled=$('issue').disabled}
async function run(fn){if(busy)return;busy=true;try{await fn()}finally{busy=false;await refresh()}}
$('refresh').onclick=refresh;
$('analyse').onclick=()=>{try{out('captureResult',capture931(parse('capture')))}catch{out('captureResult',{state:'INVALID_CAPTURE'})}};
$('enroll').onclick=()=>run(async()=>{ch=null;const r=await call({action:'issue_enrollment'});if(r.ok)ch=r.binding?.challengeId;out('challenge',r)});
$('submit').onclick=()=>run(async()=>{try{if(!ch)throw Error();out('enrollment',await call({action:'admit_enrollment',challengeId:ch,envelope:parse('envelope')}))}catch{out('enrollment',{state:'INVALID_ENROLLMENT_INPUT'})}});
$('issue').onclick=()=>run(async()=>out('case',await call({action:'issue_case'})));
$('admit').onclick=()=>run(async()=>{try{const b=parse('bundle');if(!confirm('Admit an immutable signed custody receipt?'))return;out('result',await call({...b,action:'admit_receipt'}))}catch{out('result',{state:'INVALID_BUNDLE'})}});
refresh();
