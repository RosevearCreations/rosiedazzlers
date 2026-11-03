// Build 751 — private, read-only source-linked margin reviewer.
const $=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const currency=cents=>cents==null?'Not verified':new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD'}).format(Number(cents)/100);
let result751=null;
const pill=status=>`<span class="pill751 ${status==='review_ready'?'ready751':'review751'}">${esc(status==='review_ready'?'Review-ready':'Review')}</span>`;
const cohortTable=rows=>{
  if(!rows?.length)return '<div class="empty751">No eligible recorded booking cohorts this month.</div>';
  return `<table><thead><tr><th>Cohort</th><th>Bookings</th><th>Review-ready</th><th>Recognized revenue</th><th>Pre-travel contribution</th><th>Observed % (qualified only)</th></tr></thead><tbody>${rows.map(row=>`<tr><td>${esc(row.key)}</td><td>${esc(row.count)}</td><td>${esc(row.review_ready)} / ${esc(row.count)}</td><td>${esc(currency(row.recognized_revenue_cents))}</td><td>${esc(currency(row.review_ready_contribution_cents))}</td><td>${row.observed_margin_pct==null?'Incomplete cohort':esc(row.observed_margin_pct+'%')}</td></tr>`).join('')}</tbody></table>`;
};
function rowTable(){
  if(!result751)return;
  const filter=$('marginFilter751').value,raw=$('travelScenario751').value,rate=raw===''?null:Number(raw),scenario=rate!=null&&Number.isFinite(rate)&&rate>=0&&rate<=300?rate:null;
  const rows=(result751.rows||[]).filter(row=>filter==='all'||row.margin_review_status===filter);
  $('marginRows751').innerHTML=rows.length?`<table><thead><tr><th>Booking / package</th><th>Size / season / zone</th><th>Current guide</th><th>Recognized revenue</th><th>Frozen material / labour</th><th>Pre-travel contribution</th><th>Travel / scenario</th><th>Evidence</th></tr></thead><tbody>${rows.map(row=>{
    const sim=scenario==null||row.observed_travel_minutes==null?null:Math.round(row.observed_travel_minutes/60*scenario*100);
    return `<tr><td><strong>${esc(row.package_code||'Unclassified')}</strong><div class="mini751">Booking <code>${esc(row.booking_id||'unknown')}</code></div></td><td>${esc(row.vehicle_size||'Unverified')} · ${esc(row.season_bucket)}<div class="mini751">Zone: ${esc(row.travel_zone||'Unverified')}</div></td><td>${row.current_starting_price_cents==null?'Unknown':`Starting at ${esc(currency(row.current_starting_price_cents))}`}<div class="mini751">Zone charge guide: ${esc(currency(row.current_travel_zone_guide_cents))}</div></td><td>${esc(currency(row.recognized_revenue_cents))}</td><td>${esc(currency(row.recorded_material_cents))} consumables<div class="mini751">${esc(currency(row.recorded_direct_labor_cents))} estimated work labour</div></td><td>${esc(currency(row.review_ready_pre_travel_contribution_cents))}<div class="mini751">Not net profit</div></td><td>${row.observed_travel_minutes==null?'Unverified':`${esc(row.observed_travel_minutes)} minutes`}<div class="mini751">${sim==null?'No what-if':`What-if travel labour: ${esc(currency(sim))}`}</div></td><td>${pill(row.margin_review_status)}${(row.review_reasons||[]).map(msg=>`<div class="mini751">• ${esc(msg)}</div>`).join('')}</td></tr>`;
  }).join('')}</tbody></table>`:'<div class="empty751">No rows match this view. Missing evidence is not proof of zero cost.</div>';
}
function render(data){
  result751=data;const s=data.summary||{};
  const figures=[['Bookings observed',s.booking_count??0,'Source month only'],['Ready for pre-travel review',s.review_ready_booking_count??0,'Not full net margin'],['Needs evidence review',s.review_booking_count??0,'No missing-cost assumptions'],['Seasonal cohorts',(s.seasonal_cohorts||[]).length,'Calendar buckets only']];
  $('marginStats751').innerHTML=figures.map(([label,note,sub])=>`<article class="stat751"><strong>${esc(note)}</strong><span>${esc(label)}</span><div class="mini751">${esc(sub)}</div></article>`).join('');
  $('marginPackage751').innerHTML=cohortTable(s.package_size_cohorts);
  $('marginSeason751').innerHTML=cohortTable(s.seasonal_cohorts);
  $('marginZones751').innerHTML=cohortTable(s.travel_zone_cohorts);
  rowTable();
}
async function refresh(){
  const month=Number($('marginMonth751').value),year=Number($('marginYear751').value),button=$('loadMargin751');
  if(!Number.isInteger(month)||month<1||month>12||!Number.isInteger(year)||year<2020||year>2100){$('marginStatus751').textContent='Select a valid month and year.';return;}
  button.disabled=true;$('marginStatus751').textContent='Reading recorded accounting, stock, travel and booking sources. Nothing will be changed.';
  try{
    const r=await fetch(`/api/admin/margin_review_v751?month=${month}&year=${year}`,{credentials:'include',cache:'no-store',headers:{Accept:'application/json'}});
    const data=await r.json().catch(()=>null);
    if(!r.ok||!data?.ok)throw Error(data?.error||'Source evidence unavailable.');
    render(data);$('marginStatus751').textContent=`${data.evidence_status?.replaceAll('_',' ')} · ${data.summary?.booking_count||0} booking(s) · Updated ${new Date(data.generated_at||Date.now()).toLocaleString('en-CA')} · Read-only. No price or winter-availability decision.`;
  }catch(err){result751=null;for(const key of ['marginPackage751','marginSeason751','marginZones751','marginRows751'])$(key).innerHTML='<div class="empty751">Source unavailable. No margin or pricing inference permitted.</div>';
    $('marginStats751').innerHTML='<div class="stat751 error751">Evidence unavailable</div>';$('marginStatus751').textContent=err.message||'Read failed.';
  }finally{button.disabled=false;}
}
document.addEventListener('DOMContentLoaded',()=>{
  window.AdminShell?.boot?.({pageKey:'admin-service-economics-commercial-capacity-review',onReady:async()=>{
    const d=new Date();$('marginMonth751').value=String(d.getMonth()+1);$('marginYear751').value=String(d.getFullYear());
    $('loadMargin751').addEventListener('click',refresh);$('marginFilter751').addEventListener('change',rowTable);$('travelScenario751').addEventListener('input',rowTable);
  }});
},{once:true});
