// Build 555 manual GET-only production learning panel.
const refresh=document.getElementById("productionLearning555Refresh");
if(refresh)refresh.addEventListener("click",async()=>{
 if(refresh.disabled)return;refresh.disabled=true;refresh.textContent="Checking source evidence…";
 const status=document.getElementById("productionLearning555Status"),list=document.getElementById("productionLearning555Rows");
 status.textContent="Loading retained Build 546–554 owner decisions…";list.replaceChildren();
 try{
  const res=await fetch("/api/admin/production_learning_roadmap_555",{credentials:"same-origin",cache:"no-store"});
  if(!res.ok)throw new Error("Source HTTP "+res.status);
  const data=await res.json(),r=data.review||{};
  status.textContent="Build 555: "+String(r.status||"production_learning_hold")+" — "+String(r.review_required_count??9)+" release records need owner review. No HOLD changed.";
  for(const entry of r.rows||[]){
   const item=document.createElement("article");item.className="review-candidate";
   const label=document.createElement("strong");label.textContent="Build "+entry.build+" · "+entry.status;
   const note=document.createElement("p");note.className="mini";note.textContent=(entry.gaps||[]).join(", ")||"Source review record reconciled; no automatic approval.";
   item.append(label,note);list.append(item);
  }
 }catch(e){status.textContent="Production learning HOLD — "+e.message;}
 finally{refresh.disabled=false;refresh.textContent="Review governed release learning";}
});
