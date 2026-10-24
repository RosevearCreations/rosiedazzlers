// Build 625: read-only, accessible customer fit-check UI.
const $=id=>document.getElementById(id);
function option(value,label){const o=document.createElement("option");o.value=value;o.textContent=label;return o;}
async function load(){
 try{
 const response=await fetch("/api/pricing_catalog_public",{cache:"no-store"});
 if(!response.ok)throw Error("Pricing catalog unavailable.");
 const catalog=await response.json();
 if(!catalog.ok || !Array.isArray(catalog.packages)||!Array.isArray(catalog.service_areas))
   throw Error("Pricing catalog is incomplete.");
 $("fitPackage").append(option("","Choose a package"));
 for(const p of catalog.packages)if(p.code) $("fitPackage").append(option(p.code,p.name||p.code));
 $("fitArea").append(option("","Choose service area"));
 for(const area of catalog.service_areas)if(area.value||area.label)
   $("fitArea").append(option(area.value||area.label,area.label||area.value));
 $("fitForm").hidden=false;$("fitStatus").textContent="Ready for a vehicle and service fit check.";
 }catch(error){$("fitStatus").textContent="The service list is unavailable. Please use the regular booking page instead.";}
}
$("fitForm").addEventListener("submit",async event=>{
 event.preventDefault();
 const button=$("fitSubmit");button.disabled=true;$("fitStatus").textContent="Checking the selected service and vehicle…";
 try{
  const params=new URLSearchParams(new FormData(event.currentTarget));
  const response=await fetch("/api/booking_contract_623?"+params.toString(),{cache:"no-store"});
  const data=await response.json();
  $("fitResult").hidden=false;$("fitResult").dataset.status=data.decision||"hold";
  $("fitResultHeading").textContent="Review result: "+String(data.decision||"hold").replaceAll("_"," ");
  const vehicle=data.eligibility?.vehicle_profile;
  $("fitDecision").textContent=vehicle?.status==="review_ready"
    ? "Vehicle profile is complete for staff review. Your booking is not confirmed."
    : vehicle?.status==="quote_review_required"?"Vehicle condition or type needs staff review and potentially a personal quote."
    : "There are details to confirm before proceeding. No appointment has been reserved.";
  const dollars=n=>typeof n==="number"?"$"+(n/100).toFixed(2)+" CAD":"Not available";
  $("fitPrice").textContent="Displayed package estimate: "+dollars(data.pricing?.displayed_total_cents)+
    ". Price agreement: "+(data.pricing?.parity_status||"unverified")+". Tax and travel are not included.";
  $("fitIssues").replaceChildren();
  for(const e of (data.issues||[]).slice(0,14)){const li=document.createElement("li");li.textContent=e.message||e.code;$("fitIssues").append(li);}
  $("fitStatus").textContent="Assessment generated. No data was saved as a booking.";
 }catch{ $("fitStatus").textContent="Could not complete the check. Please use the regular booking page."; }
 finally{button.disabled=false;}
});
load();
