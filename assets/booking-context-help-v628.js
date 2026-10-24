// Build 628 — contextual customer guidance. Read-only DOM enhancement only.
// The canonical planner still owns state, field validation, availability and checkout.
export const BOOKING_HELP_VERSION_628 = "rosie-booking-step-help.v1";
export const BOOKING_STEP_HELP_628 = Object.freeze([
  {
    step:1, title:"Date, area and vehicle",
    description:"Choose a preferred service date and an AM/PM slot, confirm the nearest town, and describe the vehicle.",
    tips:[
      "An available-looking date is not a reservation. The server rechecks capacity when checkout begins.",
      "Small, medium and oversized are detailing price classes. Vehicle type alone is not proof of the class; staff can review uncertain sizes.",
      "Rosie supplies standard detailing water and power. Safe parking and local site or weather restrictions still matter."
    ]
  },
  {
    step:2,title:"Your main cleaning service",
    description:"Select the cleaning package that best fits the work needed on your vehicle.",
    tips:[
      "Package prices depend on your selected vehicle size. The current catalog and checkout—not this help panel—set the actual price.",
      "An exterior wash, Basic Detail, Interior Detail, Exterior Detail and Complete Detail have different scopes.",
      "Unusual contamination, damage or restoration work may need an individual estimate before staff can confirm the scope."
    ]
  },
  {
    step:3,title:"Add-ons and discounts",
    description:"Choose only the extra treatments you need. Some extras require the right base package or a staff quote.",
    tips:[
      "An add-on marked as quote required is a request for review; it is not automatically included in the fixed price.",
      "Unavailable combinations must be changed before checkout. The live catalog validates compatibility.",
      "Gift and promo codes are optional and subject to server verification; do not rely on a displayed estimate as the final amount."
    ]
  },
  {
    step:4,title:"Safety and service requirements",
    description:"Read and confirm the practical conditions for mobile detailing at your location.",
    tips:[
      "Rosie normally brings water and power; the job still needs safe access and suitable working space.",
      "Water-use bylaws, driveway or parking access, weather and site restrictions may require a staff decision.",
      "A policy acknowledgement confirms you have read the requirement; it does not override a safety restriction or guarantee service."
    ]
  },
  {
    step:5,title:"Final review and deposit",
    description:"Check your vehicle, service, date, customer details and the amount shown before proceeding.",
    tips:[
      "The displayed estimate can exclude inspection-priced work, applicable taxes or travel adjustments.",
      "Submitting checkout sends you to the existing payment provider or approved confirmation path. This help panel never processes a payment.",
      "Do not assume a booking is confirmed until the payment or other approved confirmation is completed."
    ]
  }
]);
export const BOOKING_FIELD_HELP_628 = Object.freeze([
  {step:1,id:"service_date",text:"Choose your preferred day. Open-looking calendar dates are checked again at checkout."},
  {step:1,id:"service_area",text:"Choose the closest service town; staff verify the actual address and local restrictions."},
  {step:1,id:"vehicle_size",text:"Size changes the package price. Confirm your class using the size chart; ask staff if uncertain."},
  {step:1,id:"veh_year",text:"Your model year helps staff verify the vehicle and its expected size."},
  {step:3,id:"gift_code",text:"Optional. Gift balances and eligible redemption amounts are confirmed by the server."},
  {step:3,id:"promo_code",text:"Optional. Promotion eligibility is checked at checkout; displayed prices may change."},
  {step:5,id:"customer_email",text:"Use an email you can access for booking and payment confirmation."},
  {step:5,id:"address_line1",text:"Enter the location where the vehicle can be safely detailed; staff may confirm site access."}
]);
export function validateBookingHelpPlan628(steps=BOOKING_STEP_HELP_628,fields=BOOKING_FIELD_HELP_628) {
  if(!Array.isArray(steps)||steps.length!==5) return {ok:false,code:"STEPS_MISSING"};
  if(steps.some((row,index)=>row.step!==index+1 || !row.title || !row.description ||
     !Array.isArray(row.tips)||row.tips.length<2||row.tips.some(t=>typeof t!=="string"||!t.trim())))
    return {ok:false,code:"STEP_CONTENT_INVALID"};
  const seen=new Set();
  for(const row of fields){
    if(!Number.isInteger(row.step)||row.step<1||row.step>5||!row.id||!row.text?.trim()||seen.has(row.id))
      return {ok:false,code:"FIELD_HELP_INVALID"};
    seen.add(row.id);
  }
  return {ok:true,step_count:steps.length,field_count:fields.length};
}
function element(doc,tag,cls,text){
  const node=doc.createElement(tag);
  if(cls)node.className=cls;
  if(text!==undefined)node.textContent=text;
  return node;
}
export function installContextualBookingHelp628(doc=typeof document==="undefined"?null:document){
  if(!doc||!doc.documentElement||doc.documentElement.dataset.rdBookingHelp628==="ready")return false;
  if(!validateBookingHelpPlan628().ok)return false;
  const panels=[...doc.querySelectorAll(".wizard-step[data-step]")];
  if(panels.length!==5)return false;
  // Validate every insertion point before any writes, so partial pages stay unchanged.
  if(panels.some((panel,index)=>Number(panel.dataset.step)!==index+1 || !panel.querySelector(".step-head")))return false;
  for(const info of BOOKING_STEP_HELP_628){
    const panel=panels[info.step-1];
    const details=element(doc,"details","booking-628-step-help");
    details.id="bookingStepHelp628-"+info.step;
    const summary=element(doc,"summary","booking-628-step-help__summary");
    summary.appendChild(element(doc,"span","booking-628-info","i")).setAttribute("aria-hidden","true");
    summary.appendChild(element(doc,"span","", " Help with this step: "+info.title));
    details.appendChild(summary);
    details.appendChild(element(doc,"p","booking-628-help-intro",info.description));
    const list=element(doc,"ul","booking-628-help-list");
    for(const tip of info.tips)list.appendChild(element(doc,"li","",tip));
    details.appendChild(list);
    panel.querySelector(".step-head").insertAdjacentElement("afterend",details);
  }
  for(const item of BOOKING_FIELD_HELP_628){
    const field=doc.getElementById(item.id);
    const label=doc.querySelector('label[for="'+item.id+'"]');
    if(!field||!label || !panels[item.step-1].contains(field))continue;
    const hint=element(doc,"p","booking-628-field-hint",item.text);
    hint.id="bookingHelp628-"+item.id;
    const circle=element(doc,"span","booking-628-info","i");
    circle.setAttribute("aria-hidden","true");
    hint.prepend(circle);
    label.insertAdjacentElement("afterend",hint);
    const described=String(field.getAttribute("aria-describedby")||"").split(/\s+/).filter(Boolean);
    if(!described.includes(hint.id))described.push(hint.id);
    field.setAttribute("aria-describedby",described.join(" "));
  }
  doc.documentElement.dataset.rdBookingHelp628="ready";
  return true;
}
if(typeof document!=="undefined"){
  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",()=>installContextualBookingHelp628(),{once:true});
  }else installContextualBookingHelp628();
}
