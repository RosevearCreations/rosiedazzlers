import {analyse929,mqttObservation929} from './build929-guest-custody.mjs';
const $=id=>document.getElementById(id),out=(id,x)=>$(id).textContent=JSON.stringify(x,null,2);
$('analyse').onclick=()=>{try{const s=$('inventory').value;if(s.length>200000)throw Error('TOO_LARGE');out('result',analyse929(JSON.parse(s)))}catch{out('result',{state:'HOLD',error:'INVALID_DIAGNOSTIC'})}};
$('review').onclick=()=>out('mqtt',mqttObservation929({online:$('online').checked,usernameConfigured:$('user').checked,passwordConfigured:$('pass').checked,guestEndpointConfirmed:$('guest').checked,observedAtMs:Date.now()}));
async function refresh(){try{const r=await fetch('/api/admin/sysop_929',{credentials:'same-origin',cache:'no-store'});out('receivers',{http:r.status,...await r.json()})}catch{out('receivers',{state:'HOLD',error:'PRIVATE_API_UNAVAILABLE'})}}
$('refresh').onclick=refresh;
refresh();
