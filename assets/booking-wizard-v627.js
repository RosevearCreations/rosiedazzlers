// Build 627 — progressive enhancement only. Canonical planner validation and
// checkout remain authoritative. This file never submits a booking or a charge.
export const BOOKING_WIZARD_UI_VERSION_627 = "rosie-booking-wizard-ui.v1";
export const BOOKING_WIZARD_STEPS_627 = Object.freeze([
  "Date, area & vehicle","Choose your service","Optional add-ons",
  "Requirements & review","Contact details & deposit"
]);
export function wizardStepPresentation627(step, total = 5) {
  const length=Number.isInteger(total)&&total>0?total:5;
  const current=Math.max(1,Math.min(length,Number.isFinite(Number(step))?Math.trunc(Number(step)):1));
  return Object.freeze({
    current,total:length,percent:Math.round(current/length*100),
    label:"Step "+current+" of "+length,
    name:BOOKING_WIZARD_STEPS_627[current-1]||"Booking step",
    completed:current-1
  });
}
export function initBookingWizard627(doc = typeof document === "undefined" ? null : document) {
  if(!doc||doc.documentElement.dataset.rdWizard627==="ready")return false;
  const nav=doc.getElementById("wizardNav");
  const panels=[...doc.querySelectorAll(".wizard-step[data-step]")];
  const progress=doc.getElementById("wizardProgress627");
  const output=doc.getElementById("wizardProgressText627");
  const announcer=doc.getElementById("wizardStepAnnounce627");
  if(!nav||panels.length!==5||!progress||!output||!announcer)return false;
  const stepHeadings=panels.map((panel,i)=>{
    const heading=panel.querySelector("h2");
    const id="bookingStepHeading627-"+(i+1);
    const panelId="bookingStepPanel627-"+(i+1);
    panel.id=panelId;
    if(heading) {heading.id=id;panel.setAttribute("aria-labelledby",id);}
    panel.setAttribute("role","region");
    const error=doc.getElementById("step"+(i+1)+"Error");
    if(error){error.setAttribute("role","alert");error.setAttribute("aria-live","assertive");}
    return heading;
  });
  nav.setAttribute("aria-label","Booking wizard steps");
  nav.setAttribute("role","navigation");
  let oldStep=0,keyboardOrButtonAdvance=false;
  function sync() {
    const active=panels.find(panel=>!panel.hidden);
    if(!active)return;
    const step=Number(active.dataset.step)||1;
    const state=wizardStepPresentation627(step,panels.length);
    progress.max=state.total;progress.value=state.current;
    progress.setAttribute("aria-valuetext",state.label+": "+state.name);
    output.textContent=state.label+" — "+state.name+" · "+state.percent+"% of form steps";
    const buttons=[...nav.querySelectorAll("[data-step-nav]")];
    buttons.forEach(button=>{
      const n=Number(button.dataset.stepNav);
      button.setAttribute("aria-controls","bookingStepPanel627-"+n);
      if(n===state.current){button.setAttribute("aria-current","step");button.dataset.wizardStage="current";}
      else {button.removeAttribute("aria-current");button.dataset.wizardStage=n<state.current?"visited":"upcoming";}
    });
    if(state.current!==oldStep) {
      announcer.textContent=state.label+" — "+state.name;
      if(oldStep>0 && keyboardOrButtonAdvance && stepHeadings[step-1]){
        stepHeadings[step-1].setAttribute("tabindex","-1");
        try{stepHeadings[step-1].focus({preventScroll:true});}catch{stepHeadings[step-1].focus();}
      }
      oldStep=state.current;
      keyboardOrButtonAdvance=false;
    }
  }
  doc.addEventListener("click",event=>{
    const target=event.target?.closest?.("#nextStepBtn,#prevStepBtn,[data-step-nav],[data-inline-next-step]");
    if(target)keyboardOrButtonAdvance=true;
  },true);
  const observer=new MutationObserver(sync);
  panels.forEach(panel=>observer.observe(panel,{attributes:true,attributeFilter:["hidden"]}));
  observer.observe(nav,{childList:true});
  doc.documentElement.dataset.rdWizard627="ready";
  sync();
  return true;
}
if(typeof document!=="undefined"){
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>initBookingWizard627(),{once:true});
  else initBookingWizard627();
}
