import {WIZARD_STEPS_570,WIZARD_OPTIONS_570,STEP_HEADINGS_570,STEP_HELP_570,createWizardState570,selectWizardOption570,canAdvanceWizard570,moveWizard570,wizardReview570} from "./quote-first-wizard-model-v570.js";

// Accessible, memory-only prototype; no fetch, localStorage, cookies, analytics or API calls.
const root=document.getElementById("quote-first-preview");
if(root){
 let state=createWizardState570();
 const el=id=>document.getElementById(id);
 const choices=el("wizard-choices");
 const summary=el("wizard-review");
 const prev=el("wizard-back");
 const next=el("wizard-next");
 const heading=el("wizard-heading");
 const help=el("wizard-help");
 const progress=el("wizard-progress");
 const error=el("wizard-error");
 const status=el("wizard-status");
 const clear=node=>{while(node.firstChild)node.removeChild(node.firstChild);};
 function addLine(parent,term,value){
  const row=document.createElement("div");row.className="qf-review-row";
  const label=document.createElement("strong");label.textContent=term;
  const text=document.createElement("span");text.textContent=value;
  row.append(label,text);parent.append(row);
 }
 function render(){
  const step=WIZARD_STEPS_570[state.step];
  progress.textContent=`Step ${state.step+1} of ${WIZARD_STEPS_570.length}`;
  heading.textContent=STEP_HEADINGS_570[step];
  help.textContent=STEP_HELP_570[step];
  error.hidden=true;
  clear(choices);clear(summary);
  choices.hidden=step==="review";
  summary.hidden=step!=="review";
  if(step==="review"){
    const r=wizardReview570(state);
    addLine(summary,"Vehicle",r.vehicle);
    addLine(summary,"Main goal",r.goal);
    addLine(summary,"Condition",r.condition);
    addLine(summary,"Additional concerns",r.extras.join(", ")||"None selected");
    addLine(summary,"Suggested discussion",r.suggested_discussion);
    const notice=document.createElement("p");notice.className="qf-review-notice";
    notice.textContent="Quote preview only. No request was sent. Pricing and availability are not confirmed.";
    summary.append(notice);
  }else{
    const options=WIZARD_OPTIONS_570[step];
    for(const opt of options){
      const selected=step==="extras"?state.extras.includes(opt.id):state[step]===opt.id;
      const button=document.createElement("button");button.type="button";
      button.className="qf-option";button.setAttribute("aria-pressed",String(selected));
      button.dataset.id=opt.id;
      const title=document.createElement("strong");title.textContent=opt.label;
      const hint=document.createElement("span");hint.textContent=opt.detail;
      button.append(title,hint);
      button.addEventListener("click",()=>{
        state=selectWizardOption570(state,step,opt.id);render();
        // Keep keyboard focus on the selected action if it still exists.
        choices.querySelectorAll("button").forEach(item=>{if(item.dataset.id===opt.id)item.focus({preventScroll:true});});
      });
      choices.append(button);
    }
  }
  prev.disabled=state.step===0;
  next.disabled=step==="review";
  next.textContent=step==="extras"?"Review choices":"Continue";
  status.textContent=step==="review"?"Review complete. A real inquiry is only available if intake is explicitly enabled.":"Selections stay only in this page while it is open.";
  if(step==="review")window.dispatchEvent(new CustomEvent("rosie-quote-preview-review",{detail:{vehicle:state.vehicle,goal:state.goal,condition:state.condition,extras:[...state.extras]}}));
 }
 prev.addEventListener("click",()=>{state=moveWizard570(state,"back");render();heading.focus();});
 next.addEventListener("click",()=>{
   if(!canAdvanceWizard570(state)){
     error.textContent="Please choose an option before continuing.";error.hidden=false;error.focus();return;
   }
   state=moveWizard570(state,"next");render();heading.focus();
 });
 render();
}
