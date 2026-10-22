// Build 613 — bounded, local-only guidance for the quote-first prototype.
// These are discussion prompts, not catalog offers, quotes or booking rules.
import {WIZARD_OPTIONS_570} from "./quote-first-wizard-model-v570.js";

const SERVICES = Object.freeze({
  premium_wash: Object.freeze({name:"Premium Wash",reason:"A maintenance-focused wash to discuss when the vehicle is regularly cared for."}),
  basic_detail: Object.freeze({name:"Basic Detail",reason:"A lighter interior-focused option to discuss if the actual condition permits."}),
  interior_detail: Object.freeze({name:"Interior Detail",reason:"A deeper cabin assessment for fabrics, carpets and interior surfaces."}),
  exterior_detail: Object.freeze({name:"Exterior Detail",reason:"An exterior-focused conversation about cleaning and protection needs."}),
  complete_detail: Object.freeze({name:"Complete Detail",reason:"A combined inside-and-out scope to review with staff."})
});

const BY_GOAL = Object.freeze({
  refresh: Object.freeze(["premium_wash","basic_detail"]),
  interior: Object.freeze(["interior_detail","basic_detail"]),
  exterior: Object.freeze(["exterior_detail","premium_wash"]),
  complete: Object.freeze(["complete_detail","interior_detail","exterior_detail"])
});

// Every selected concern is quote-required in the bundled fallback catalog.
// Server-side live catalog and staff judgement always supersede this display.
export const CONCERNS_613 = Object.freeze({
  pet_hair: Object.freeze({code:"pet_hair_removal",name:"Pet Hair Removal"}),
  salt: Object.freeze({code:"salt_stain_treatment",name:"Salt Stain Treatment"}),
  odour: Object.freeze({code:"odor_treatment",name:"Odor Treatment"}),
  paint: Object.freeze({code:"two_stage_polish",name:"Two Stage Polish"}),
  coating: Object.freeze({code:"external_ceramic_coating",name:"External Ceramic Coating"})
});

const CONDITION_NOTES = Object.freeze({
  light:"A lighter service may suit a well-maintained vehicle; Rosie must confirm the actual scope.",
  moderate:"Visible buildup can change the work required. Rosie will assess the vehicle before giving a price.",
  heavy:"Heavy soiling or uncertain condition needs a staff assessment before service scope or price is agreed."
});

export function buildQuoteDiscussion613(state){
  const goal = WIZARD_OPTIONS_570.goal.some(option=>option.id===state?.goal) ? state.goal : null;
  const condition = WIZARD_OPTIONS_570.condition.some(option=>option.id===state?.condition) ? state.condition : null;
  const extras = [...new Set(Array.isArray(state?.extras) ? state.extras : [])]
    .filter(id=>WIZARD_OPTIONS_570.extras.some(option=>option.id===id) && CONCERNS_613[id]);
  const packages = goal ? BY_GOAL[goal].slice(0,3).map(code=>Object.freeze({
    code,name:SERVICES[code].name,reason:SERVICES[code].reason,
    decision:"Discuss with Rosie — suitability and price not confirmed"
  })) : [];
  const concerns = extras.map(id=>Object.freeze({
    code:CONCERNS_613[id].code,name:CONCERNS_613[id].name,
    decision:"Manual staff review required; not an automatically priced add-on"
  }));
  return Object.freeze({
    packages:Object.freeze(packages),
    concerns:Object.freeze(concerns),
    condition_note:condition ? CONDITION_NOTES[condition] : "Select a condition before reviewing service discussions.",
    review_required:true,
    pricing_confirmed:false,
    availability_confirmed:false,
    booking_confirmed:false,
    payment_authorized:false,
    intake_enabled_by_guidance:false
  });
}
