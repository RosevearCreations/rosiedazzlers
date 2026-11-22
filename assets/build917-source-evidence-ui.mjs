// Rosie Build 917: same-origin and no browser provider/financial secrets.
const $=id=>document.getElementById(id);
const publication=()=> $('publication').value.trim();
const root='/api/admin/supplier_acceptance_v917';
async function call(path,opts={}){try{const res=await fetch(path,{credentials:'same-origin',cache:'no-store',...opts});return {http:res.status,...await res.json()};}catch{return {ok:false,error:'ORIGINAL_SOURCE_UNAVAILABLE'}}}
function output(id,value){$(id).textContent=JSON.stringify(value,null,2)}
$('refresh').addEventListener('click',async()=>{
 output('status',{state:'CHECKING_ORIGINAL_PRIVATE_SOURCES'});
 const d=await call(root+'?publication_id='+encodeURIComponent(publication()));
 output('status',d.ok?{business_state:d.business_state,counts:d.counts,blockers:d.blockers,revenue_attributed_cents:d.revenue_attributed_cents}:d);
});
const actionFields={
 native_receipt:()=>({provider_receipt_id:$('providerReceipt').value.trim(),provider_case_reference:$('providerCase').value.trim(),receipt_sha256:$('providerHash').value.trim()}),
 surface:()=>({surface_kind:$('surfaceKind').value,surface_host:$('surfaceHost').value.trim().toLowerCase(),observed_state:$('surfaceState').value,evidence_sha256:$('surfaceHash').value.trim()}),
 second_witness:()=>({device_evidence_id:$('deviceReceipt').value.trim(),evidence_sha256:$('deviceHash').value.trim()}),
 finance_chain:()=>({journal_entry_id:$('journal').value.trim(),payment_source_sha256:$('paymentHash').value.trim(),customer_source_sha256:$('customerHash').value.trim()})
};
const outputs={native_receipt:'nativeStatus',surface:'surfaceStatus',second_witness:'deviceStatus',finance_chain:'financeStatus'};
for(const button of document.querySelectorAll('button[data-action]'))button.addEventListener('click',async()=>{
 const action=button.dataset.action;
 if(!actionFields[action])return;
 if(!confirm('Store this genuine staff evidence as unverified original-source custody? No external provider deletion, payment or customer changes will occur.'))return;
 const id=outputs[action];output(id,{state:'RECORDING_UNVERIFIED_SOURCE'});
 const result=await call(root,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,publication_id:publication(),...actionFields[action]()})});
 output(id,result);
});
