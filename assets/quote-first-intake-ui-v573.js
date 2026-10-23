// Build 615 acceptance of Build 573 gated intake: disabled-state clarity,
// browser-memory-only retry identity and safe manual staff handoff.
import {intakeState615,requestIdentity615} from "./quote-first-handoff-v615.js";

const root=document.getElementById("quote-first-intake-v573");
if(root){
 let selected=null,capability=null,token=null,widgetId=null,identity=null,pending=false,accepted=false,securityLoading=false;
 const form=document.getElementById("quote-intake-form");
 const status=document.getElementById("quote-intake-status");
 const submit=document.getElementById("quote-intake-submit");
 const turnstile=document.getElementById("quote-turnstile");
 const statusMessage=(message,state="disabled")=>{
   status.textContent=message;
   status.dataset.state=state;
 };
 const state=()=>intakeState615(capability,Boolean(selected));
 const render=()=>{
   if(accepted)return;
   const current=state();
   form.hidden=current!=="ready";
   submit.disabled=pending||!token;
   if(current==="disabled")statusMessage("Quote intake is currently disabled. The preview does not collect or send personal details. For a real appointment, use the current booking page.");
   else if(current==="awaiting_review")statusMessage("Complete the vehicle-selection preview above to review your choices before the optional inquiry form can open.");
   else if(!token)statusMessage("Staff review inquiries are enabled. Complete the form and the security check to request contact. No booking or charge will be created.","ready");
   else statusMessage("You can request a manual staff review. Your consent applies to this inquiry only, not marketing.","ready");
 };
 const loadSecurity=()=>{
   if(securityLoading||state()!=="ready")return;
   securityLoading=true;
   const script=document.createElement("script");
   script.src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
   script.async=true;
   script.onload=()=>{
     if(!window.turnstile){statusMessage("Security verification is unavailable. No inquiry was sent.","error");return;}
     widgetId=window.turnstile.render(turnstile,{
       sitekey:capability.site_key,
       callback:value=>{token=value;render();},
       "expired-callback":()=>{token=null;render();}
     });
   };
   script.onerror=()=>statusMessage("Security verification did not load. No inquiry was sent.","error");
   document.head.append(script);
 };
 window.addEventListener("rosie-quote-preview-review",event=>{
   selected=event.detail&&typeof event.detail==="object"?event.detail:null;
   identity=null; // a fresh wizard review is always a new request
   render();
   loadSecurity();
 });
 render();
 fetch("/api/quote_first_request",{cache:"no-store",credentials:"omit"})
  .then(response=>response.ok?response.json():null)
  .then(result=>{
    capability=result;
    render();
    loadSecurity();
  }).catch(()=>{
    capability=null;render();
    statusMessage("Quote intake status could not be checked, so submissions remain unavailable. Please use the current booking page.","error");
  });
 form?.addEventListener("submit",async event=>{
   event.preventDefault();
   if(pending||accepted||state()!=="ready"||!token||!form.reportValidity())return;
   const fields={
     full_name:form.elements.full_name.value,email:form.elements.email.value,phone:form.elements.phone.value,
     service_area:form.elements.service_area.value,notes:form.elements.notes.value,
     contact_consent:form.elements.contact_consent.checked
   };
   identity=requestIdentity615(identity,selected,fields,()=>crypto.randomUUID());
   const payload={...selected,...fields,request_id:identity.id,
     turnstile_token:token,website:form.elements.website.value};
   pending=true;submit.disabled=true;
   statusMessage("Sending your inquiry for manual staff review. Please wait…","ready");
   try{
     const response=await fetch("/api/quote_first_request",{
       method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)
     });
     const result=await response.json().catch(()=>null);
     if(!response.ok||result?.received!==true){
       if(response.status===409)identity=null;
       throw Error(result?.error||"The inquiry could not be submitted.");
     }
     accepted=true;form.hidden=true;
     statusMessage(`Inquiry received for manual staff review. No quote, booking or payment was created. Reference: ${result.reference||identity.id}${result.replay?" (already received)":""}.`,"ready");
   }catch(error){
     statusMessage(`${error.message} Nothing is confirmed. Retry after verification or use the current booking page.`,"error");
     token=null;
     if(window.turnstile&&widgetId!==null)window.turnstile.reset(widgetId);
   }finally{pending=false;submit.disabled=!token||accepted;}
 });
}
