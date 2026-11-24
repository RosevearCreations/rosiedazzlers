import {inventoryPlan927} from './build927-guided-readiness.mjs';
const $=id=>document.getElementById(id),out=(id,x)=>$(id).textContent=JSON.stringify(x,null,2);
let state=null,busy=false;
const map={aidp:'ai-data-platform',comms:'rosevear-comms-hub'};
function buttons(){for(const [id,receiver] of Object.entries(map))$(id).disabled=busy||!state?.receivers?.some(x=>x.receiverId===receiver&&x.ready)}
async function call(url,body){try{const r=await fetch(url,{credentials:'same-origin',cache:'no-store',...(body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});return {http:r.status,...await r.json()}}catch{return {ok:false,state:'HOLD',error:'PRIVATE_API_UNAVAILABLE'}}}
async function refresh(){state=null;buttons();const v=await call('/api/admin/sysop_927');if(v.ok)state=v;out('status',v);buttons()}
$('analyse').onclick=()=>{try{if($('inventory').value.length>200000)throw Error('INVENTORY_TOO_LARGE');out('inventoryResult',inventoryPlan927(JSON.parse($('inventory').value)))}catch{out('inventoryResult',{state:'HOLD',error:'INVALID_DIAGNOSTIC_INVENTORY'})}};
$('refresh').onclick=refresh;
for(const [id,receiver] of Object.entries(map))$(id).onclick=async()=>{
 const row=state?.receivers?.find(x=>x.receiverId===receiver&&x.ready);
 if(!row||busy||!confirm('Perform the original read-only HTTPS GET for '+receiver+'?'))return;
 busy=true;buttons();
 try{out('receiverStatus',await call('/api/admin/sysop_921',{action:'read_original_receiver_api',ledgerReviewId:row.ledgerReviewId}));await refresh()}finally{busy=false;buttons()}
};
refresh();
