// Build 554 protected admin review panel: GET-only, manual refresh, no persistent polling.
const button=document.getElementById("ownerReview554Refresh");
if(button)button.addEventListener("click",async()=>{
 if(button.disabled)return;button.disabled=true;button.textContent="Checking owner evidence…";
 const summary=document.getElementById("ownerReview554Status"), rows=document.getElementById("ownerReview554Rows");
 summary.textContent="Retrieving independent owner evidence…";rows.replaceChildren();
 try{
  const response=await fetch("/api/admin/service_economics_capacity_technical_owner_review",{credentials:"same-origin",cache:"no-store"});
  if(!response.ok)throw new Error("Owner review unavailable (HTTP "+response.status+")");
  const data=await response.json(),report=data.review||{};
  summary.textContent="Build 554: "+String(report.status||"owner_review_hold")+" · "+String(report.review_required_count??4)+" of four domains need review. No automatic changes.";
  for(const row of report.rows||[]){
   const card=document.createElement("article");card.className="review-candidate";
   const heading=document.createElement("strong");heading.textContent=row.domain.replaceAll("_"," ")+" — "+row.owner_review_state;
   const detail=document.createElement("p");detail.className="mini";
   detail.textContent=(row.gaps||[]).join(", ")||"Owner evidence source matches retained controls; business HOLDs are not closed.";
   card.append(heading,detail);rows.append(card);
  }
 }catch(error){summary.textContent="Build 554 review HOLD: "+error.message;}
 finally{button.disabled=false;button.textContent="Review four owner domains";}
});
