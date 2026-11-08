// Build 801: clearer next-step guidance, keeping canonical wizard validation.
export const STEP_GUIDANCE_801=Object.freeze([
  'Choose an available date and time, your service area, and vehicle details.',
  'Compare packages and choose the service that matches your vehicle.',
  'Review optional add-ons; quote-required work is assessed separately.',
  'Confirm the service address, site questions, and required acknowledgements.',
  'Review the live price, contact details, and deposit before continuing.'
]);
export function stepGuidance801(step){
  const index=Number.isInteger(Number(step))?Math.trunc(Number(step))-1:-1;
  return STEP_GUIDANCE_801[index]||'Review this step before continuing.';
}
export function initBookingWizardUx801(doc=document){
  const progress=doc.getElementById('wizardProgress627');
  const panels=[...doc.querySelectorAll('.wizard-step[data-step]')];
  if(!progress||panels.length!==5||doc.getElementById('wizardHelp801'))return false;
  const help=doc.createElement('div');help.id='wizardHelp801';
  help.className='rd-wizard-help-801';help.setAttribute('role','status');
  help.setAttribute('aria-live','polite');
  const explanation=doc.createElement('span');
  const button=doc.createElement('button');
  button.type='button';button.className='btn ghost small';
  button.textContent='Review this step';button.hidden=true;
  help.append(explanation,button);progress.parentElement.appendChild(help);
  function currentPanel(){return panels.find(panel=>!panel.hidden);}
  function update(){
    const panel=currentPanel();if(!panel)return;
    const step=Number(panel.dataset.step)||1;
    const error=doc.getElementById(`step${step}Error`);
    explanation.textContent=error?.textContent?.trim()
      ? `Please review Step ${step}: ${error.textContent.trim()}`
      : stepGuidance801(step);
    button.hidden=!error?.textContent?.trim();
  }
  button.addEventListener('click',()=>{
    const panel=currentPanel();if(!panel)return;
    const first=panel.querySelector('[aria-invalid="true"],input:invalid,select:invalid,textarea:invalid');
    const error=doc.getElementById(`step${panel.dataset.step}Error`);
    const target=first||error||panel.querySelector('h2');
    if(!target)return;
    if(!target.hasAttribute('tabindex'))target.setAttribute('tabindex','-1');
    target.scrollIntoView?.({behavior:'smooth',block:'center'});
    target.focus?.({preventScroll:true});
  });
  const observer=new MutationObserver(update);
  panels.forEach(panel=>observer.observe(panel,{attributes:true,attributeFilter:['hidden']}));
  for(let i=1;i<=5;i++){
    const error=doc.getElementById(`step${i}Error`);
    if(error)observer.observe(error,{childList:true,characterData:true,subtree:true});
  }
  update();return true;
}
if(typeof document!=='undefined'){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>initBookingWizardUx801(),{once:true});
  else initBookingWizardUx801();
}
