// Build 570 — preview-only, no network, storage, identity, pricing or booking authority.
export const WIZARD_STEPS_570 = Object.freeze(["vehicle", "goal", "condition", "extras", "review"]);
export const WIZARD_OPTIONS_570 = Object.freeze({
  vehicle: Object.freeze([
    Object.freeze({id:"small",label:"Car / compact",detail:"Sedan, coupe or smaller vehicle"}),
    Object.freeze({id:"mid",label:"SUV / crossover",detail:"Mid-size SUV or larger family vehicle"}),
    Object.freeze({id:"oversize",label:"Truck / van",detail:"Pickup, van or larger vehicle; size verified by staff"})
  ]),
  goal: Object.freeze([
    Object.freeze({id:"refresh",label:"Everyday refresh",detail:"A tidy maintenance wash and clean"}),
    Object.freeze({id:"interior",label:"Deep interior clean",detail:"Cabin, fabrics, carpets or odours"}),
    Object.freeze({id:"exterior",label:"Exterior & protection",detail:"Paint, wheels and surface care"}),
    Object.freeze({id:"complete",label:"Full inside & outside",detail:"A complete condition-based reset"})
  ]),
  condition: Object.freeze([
    Object.freeze({id:"light",label:"Light use",detail:"Regularly maintained; mostly dust or road film"}),
    Object.freeze({id:"moderate",label:"Everyday buildup",detail:"Some stains, debris or visible grime"}),
    Object.freeze({id:"heavy",label:"Needs assessment",detail:"Salt, pet hair, heavy soil or unknown condition"})
  ]),
  extras: Object.freeze([
    Object.freeze({id:"pet_hair",label:"Pet hair",detail:"Condition-specific evaluation"}),
    Object.freeze({id:"salt",label:"Salt / winter stains",detail:"May require special treatment"}),
    Object.freeze({id:"odour",label:"Odour concerns",detail:"Source and remedy need inspection"}),
    Object.freeze({id:"paint",label:"Paint correction",detail:"Scope and finish need review"}),
    Object.freeze({id:"coating",label:"Ceramic protection",detail:"Requires condition and suitability review"})
  ])
});
export const STEP_HEADINGS_570=Object.freeze({
 vehicle:"What are we detailing?",
 goal:"What would you like improved?",
 condition:"What is its current condition?",
 extras:"Any additional concerns?",
 review:"Review your preferences"
});
export const STEP_HELP_570=Object.freeze({
 vehicle:"Choose the closest size. Rosie will confirm the actual vehicle category.",
 goal:"Pick your main priority. These choices are guidance, not confirmed services.",
 condition:"An estimate may change after a vehicle inspection.",
 extras:"Optional. Select any that matter, or simply continue.",
 review:"Preview only. Nothing has been submitted, reserved, priced or charged."
});
const RECOMMENDATION=Object.freeze({
 refresh:"Premium Wash — discuss maintenance suitability",
 interior:"Interior Detail — staff to assess required depth",
 exterior:"Exterior Detail — staff to review paint and protection",
 complete:"Complete Detail — staff to review vehicle condition"
});
export function createWizardState570(){
 return {step:0,vehicle:null,goal:null,condition:null,extras:[]};
}
function valid(type,id){
 return WIZARD_OPTIONS_570[type]?.some(x=>x.id===id)===true;
}
export function selectWizardOption570(state,type,id){
 if(!WIZARD_OPTIONS_570[type]||!valid(type,id))return state;
 if(type==="extras"){
  const extras=state.extras.includes(id)?state.extras.filter(x=>x!==id):[...state.extras,id];
  return {...state,extras};
 }
 return {...state,[type]:id};
}
export function canAdvanceWizard570(state){
 if(state.step>=4)return false;
 const step=WIZARD_STEPS_570[state.step];
 return step==="extras"||valid(step,state[step]);
}
export function moveWizard570(state,direction){
 if(direction==="next"){
  return canAdvanceWizard570(state)?{...state,step:Math.min(4,state.step+1)}:state;
 }
 if(direction==="back")return {...state,step:Math.max(0,state.step-1)};
 return state;
}
export function wizardReview570(state){
 const label=(type,id)=>WIZARD_OPTIONS_570[type].find(x=>x.id===id)?.label||"Not selected";
 return Object.freeze({
  vehicle:label("vehicle",state.vehicle),
  goal:label("goal",state.goal),
  condition:label("condition",state.condition),
  extras:Object.freeze(state.extras.filter(id=>valid("extras",id)).map(id=>label("extras",id))),
  suggested_discussion:RECOMMENDATION[state.goal]||"Staff assessment required",
  estimate_status:"Not quoted",
  contact_collected:false,
  request_submitted:false,
  availability_checked:false,
  booking_confirmed:false,
  payment_collected:false,
  public_wizard_enabled:false
 });
}
