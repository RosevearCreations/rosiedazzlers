// Build 553 — staff-only, manual authenticated field evidence panel.
const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function init(){
 const b=$("refreshStaffField553");if(!b)return;
 b.addEventListener("click",async()=>{
  b.disabled=true;$("staffFieldStatus553").textContent="Loading authenticated field evidence…";
  try{
   const response=await fetch("/api/admin/staff_mobile_remediation_closure_readiness",{credentials:"include",cache:"no-store",headers:{Accept:"application/json"}});
   const d=await response.json().catch(()=>null);
   if(!response.ok||!d?.ok)throw Error(d?.error||"Source unavailable");
   const report=d.staff_mobile_field_regression_553||{},rows=report.rows||[];
   $("staffFieldStatus553").textContent=(report.status||"unavailable")+" · "+(report.ready||0)+"/"+(report.definitions||0)+" like-for-like cohort(s) operator-reviewable; causation and fault undecided.";
   $("staffFieldRows553").innerHTML=rows.map(r=>'<article class="learning-candidate"><strong>'+esc(r.area||r.key)+'</strong> · '+esc(r.status)+
     '<p class="mini">Before '+esc(r.before_failures??"—")+'/'+esc(r.before_total??"—")+'; after '+esc(r.after_failures??"—")+'/'+esc(r.after_total??"—")+'</p>'+
     '<p class="mini">Review gaps: '+esc((r.gaps||[]).join(", ")||"none in source-matched descriptive evidence")+'</p><p class="mini">No staff blame, device fault, role change or auto-closure.</p></article>').join('')||
     '<p class="learning-empty">No source-owned current field cohorts. HOLD retained.</p>';
  }catch(e){$("staffFieldStatus553").textContent="Evidence HOLD: "+(e.message||"Unavailable");$("staffFieldRows553").textContent="No automatic changes authorized.";}
  finally{b.disabled=false;}
 });
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
