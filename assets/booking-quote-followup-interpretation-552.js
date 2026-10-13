// Build 552: authenticated, manual-only descriptive booking/quote follow-up review.
const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
export function initBookingQuoteInterpretation552(){
 const button=$("refreshFollowup552");if(!button)return;
 button.addEventListener("click",async()=>{
  button.disabled=true;$("followupStatus552").textContent="Loading current authorized comparable evidence…";
  try{
   const response=await fetch("/api/admin/booking_quote_experiment_follow_up_decision",{credentials:"include",cache:"no-store",headers:{Accept:"application/json"}});
   const data=await response.json().catch(()=>null);
   if(!response.ok||!data?.ok)throw Error(data?.error||"Protected evidence unavailable ("+response.status+")");
   const report=data.booking_quote_controlled_follow_up_interpretation_552||{};
   $("followupStatus552").textContent=(report.status||"source_unavailable")+" · "+(report.review_ready||0)+" of "+(report.definitions||0)+" definitions have current bounded descriptive evidence. This does not establish statistical causation or a winner.";
   const rows=Array.isArray(report.rows)?report.rows:[];
   $("followupRows552").innerHTML=rows.map(r=>'<article class="learning-priority"><div class="learning-priority-head"><strong>'+esc(r.area||r.key)+'</strong><span class="pill">'+esc(r.status)+'</span></div>'+
    '<p class="mini"><strong>Gaps:</strong> '+esc((r.gaps||[]).join(", ")||"none in verified descriptive evidence")+'</p>'+
    (r.arms||[]).map(a=>'<p class="mini">'+esc(a.arm)+': '+esc(a.observed_conversions)+' / '+esc(a.eligible)+' eligible (weather-excluded '+esc(a.weather_excluded)+'), observed '+esc(a.observed_rate_pct)+'% — descriptive only</p>').join('')+
    '<p class="mini">No winner, price/discount/booking rule change or automatic outreach.</p></article>').join("")||
    '<p class="learning-empty">No source-owned current follow-up observations; existing operational HOLD remains.</p>';
  }catch(error){$("followupStatus552").textContent="Evidence HOLD: "+(error?.message||"Unavailable");$("followupRows552").textContent="No change authorized.";}
  finally{button.disabled=false;}
 });
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",initBookingQuoteInterpretation552,{once:true});
else initBookingQuoteInterpretation552();
