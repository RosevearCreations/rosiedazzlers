import {compareEconomicRetests753,reviewOwnerReceipt753} from './economic-retest-v753-core.js';
// Two separate manual GETs. All owner receipt metadata stays in memory until local export.
const $=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
let baseline=null,retest=null,comparison=null,packet=null;
const empty='<p class="muted753">No independent owner approval or source repair has been authenticated.</p>';
function clearResult(){comparison=null;packet=null;$('outcomes753').innerHTML=empty;$('booking753').innerHTML='<option value="">No comparison</option>';$('receiptResult753').textContent='No receipt reviewed.';$('packet753').textContent='No export draft.';$('export753').disabled=true;}
async function fetchEvidence(){
  const month=Number($('month753').value),year=Number($('year753').value);
  if(!Number.isInteger(month)||month<1||month>12||!Number.isInteger(year)||year<2020||year>2100)throw Error('Select a valid month and year.');
  const res=await fetch(`/api/admin/economic_retest_v753?month=${month}&year=${year}`,{credentials:'include',cache:'no-store',headers:{Accept:'application/json'}});
  const body=await res.json().catch(()=>null);if(!res.ok||!body?.ok)throw Error(body?.error||'Protected source read failed.');
  return body;
}
async function captureBaseline(){
  $('baseline753').disabled=true;$('status753').textContent='Capturing first current-source snapshot…';
  baseline=null;retest=null;clearResult();
  try{baseline=await fetchEvidence();$('status753').textContent=`Baseline read ${new Date(baseline.read_at).toLocaleString('en-CA')} · SHA-256 ${baseline.snapshot_sha256} · No decision recorded.`;
    $('retest753').disabled=false;
  }catch(err){$('status753').textContent=err.message;$('retest753').disabled=true;}finally{$('baseline753').disabled=false;}
}
function renderComparison(result){
  $('summary753').textContent=`${result.comparison_status.replaceAll('_',' ')} · ${result.summary.booking_count} bookings · ${result.summary.disappeared_gap_candidates} disappeared-gap candidate(s) · ${result.summary.newly_appeared_issue_bookings} newly flagged · 0 verified corrections and 0 owner approvals.`;
  $('outcomes753').innerHTML=result.rows.length?`<table><thead><tr><th>Booking</th><th>Retest disposition</th><th>Issues before / now</th><th>Source change</th></tr></thead><tbody>${result.rows.map(row=>`<tr><td><code>${esc(row.booking_id.slice(0,8))}</code><div class="muted753">${esc(row.package_code||'Unknown')} / ${esc(row.vehicle_size||'Unknown')}</div></td><td><strong>${esc(row.retest_disposition.replaceAll('_',' '))}</strong><div class="muted753">HOLD · not an approval</div></td><td>${esc(row.baseline_issue_count)} / ${esc(row.retest_issue_count)}<div class="muted753">Disappeared ${esc(row.disappeared_issues.length)} · New ${esc(row.appeared_issues.length)}</div></td><td>${esc(row.changed_fields.join(', ')||'No listed field drift')}${row.global_provenance_changed?' · catalog provenance changed':''}</td></tr>`).join('')}</tbody></table>`:empty;
  $('booking753').innerHTML='<option value="">Select booking</option>'+result.rows.map(row=>`<option value="${esc(row.booking_id)}">${esc(row.booking_id.slice(0,8))} · ${esc(row.retest_disposition.replaceAll('_',' '))}</option>`).join('');
}
async function captureRetest(){
  if(!baseline)return;$('retest753').disabled=true;$('status753').textContent='Fetching a separate, later source read…';clearResult();
  try{retest=await fetchEvidence();comparison=compareEconomicRetests753(baseline,retest);renderComparison(comparison);
    $('status753').textContent=`Retest read ${new Date(retest.read_at).toLocaleString('en-CA')} · SHA-256 ${retest.snapshot_sha256} · Disappeared issues remain unclosed until independent source proof.`;
  }catch(err){retest=null;comparison=null;$('status753').textContent=err.message||'Retest failed; keep every hold open.';}finally{$('retest753').disabled=!baseline;}
}
function reviewReceipt(){
  const id=$('booking753').value;if(!comparison||!id){$('receiptResult753').textContent='Compare two reads and choose a booking first.';return;}
  const receipt={schema:'rosie-economic-approval-receipt-v1',booking_id:id,
    baseline_snapshot_sha256:comparison.baseline.snapshot_sha256,retest_snapshot_sha256:comparison.retest.snapshot_sha256,
    receipt_reference:$('receiptRef753').value.trim(),issuer_reference:$('issuer753').value.trim(),issued_at:$('issued753').value.trim(),
    proposed_disposition:$('disposition753').value};
  const verdict=reviewOwnerReceipt753(receipt,comparison,id);
  packet={schema:'rosie-economic-retest-review-draft-v753',status:'UNVERIFIED_NOT_APPROVED',source_correction_verified:false,
    owner_approval_verified:false,approval_receipt_authenticated:false,booking_id:id,baseline:comparison.baseline,retest:comparison.retest,
    comparison_outcome:comparison.rows.find(x=>x.booking_id===id),receipt_metadata:receipt,receipt_review:verdict,
    generated_at:new Date().toISOString()};
  $('receiptResult753').textContent=`${verdict.status.replaceAll('_',' ')}. ${verdict.next_step||'Receipt review remains on HOLD.'} Nothing has been written or approved.`;
  $('packet753').textContent=JSON.stringify(packet,null,2);$('export753').disabled=false;
}
function download(){if(!packet)return;const blob=new Blob([JSON.stringify(packet,null,2)+'\n'],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=`rosie-economic-retest-unverified-753-${packet.booking_id.slice(0,8)}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function invalidateReceipt(){packet=null;$('packet753').textContent='Review fields changed; reassess the receipt.';$('export753').disabled=true;}
document.addEventListener('DOMContentLoaded',()=>{
  window.AdminShell?.boot?.({pageKey:'admin-service-economics-commercial-capacity-review',onReady:async()=>{
    const d=new Date();$('month753').value=String(d.getMonth()+1);$('year753').value=String(d.getFullYear());$('issued753').value=d.toISOString();
    $('baseline753').addEventListener('click',captureBaseline);$('retest753').addEventListener('click',captureRetest);
    $('reviewReceipt753').addEventListener('click',reviewReceipt);$('export753').addEventListener('click',download);
    for(const id of ['booking753','receiptRef753','issuer753','issued753','disposition753'])$(id).addEventListener('input',invalidateReceipt);
    for(const id of ['month753','year753'])$(id).addEventListener('input',()=>{baseline=null;retest=null;clearResult();$('retest753').disabled=true;$('status753').textContent='Period changed. Capture a new baseline before retesting.';});
  }});
},{once:true});
