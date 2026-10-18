// Build 573: the contact form is hidden until server-side approval + Turnstile credentials.
const root=document.getElementById("quote-first-intake-v573");
if(root){
 let selected=null,ready=false,token=null,requestId=null;
 const form=document.getElementById("quote-intake-form"),status=document.getElementById("quote-intake-status");
 const submit=document.getElementById("quote-intake-submit");
 window.addEventListener("rosie-quote-preview-review",event=>{
   selected=event.detail&&typeof event.detail==="object"?event.detail:null;
   root.hidden=!ready||!selected;
 });
 fetch("/api/quote_first_request",{cache:"no-store",credentials:"omit"})
  .then(r=>r.ok?r.json():null)
  .then(cap=>{
    if(cap?.enabled!==true||typeof cap.site_key!=="string")throw Error("disabled");
    ready=true;
    status.textContent="Ready to request a staff review. This is not a booking.";
    if(selected)root.hidden=false;
    const script=document.createElement("script");script.src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";script.async=true;script.onload=()=>{
      if(window.turnstile)window.turnstile.render("#quote-turnstile",{sitekey:cap.site_key,callback:value=>{token=value;submit.disabled=false;}, "expired-callback":()=>{token=null;submit.disabled=true;}});
    };document.head.append(script);
  }).catch(()=>{status.textContent="Quote intake is not enabled yet. For a real appointment, use the current booking page.";});
 form?.addEventListener("submit",async e=>{
  e.preventDefault();
  if(!ready||!selected||!token)return;
  const payload={...selected,request_id:requestId||(requestId=crypto.randomUUID()),
    full_name:form.elements.full_name.value,email:form.elements.email.value,phone:form.elements.phone.value,
    service_area:form.elements.service_area.value,notes:form.elements.notes.value,
    contact_consent:form.elements.contact_consent.checked,turnstile_token:token,
    website:form.elements.website.value};
  submit.disabled=true;status.textContent="Sending your inquiry for staff review…";
  try{
   const response=await fetch("/api/quote_first_request",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
   const result=await response.json();
   if(!response.ok||!result.received)throw Error(result?.error||"Unable to submit.");
   status.textContent="Inquiry received for manual staff review. No quote or booking has been created. Reference: "+result.reference;
   form.hidden=true;
  }catch(err){status.textContent=err.message+" Please try again or use the existing booking page.";
   if(window.turnstile)window.turnstile.reset();token=null;}
 });
}
