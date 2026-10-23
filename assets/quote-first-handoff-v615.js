// Build 615: browser-memory-only request identity and intake-state policy.
// A retry of identical details keeps its UUID; any edited details get a fresh UUID.
export function requestIdentity615(previous, choices, fields, newId){
  const fingerprint=JSON.stringify({
    vehicle:choices?.vehicle||"",goal:choices?.goal||"",condition:choices?.condition||"",
    extras:Array.isArray(choices?.extras)?[...choices.extras]:[],
    full_name:fields.full_name,email:fields.email,phone:fields.phone,
    service_area:fields.service_area,notes:fields.notes,contact_consent:fields.contact_consent===true
  });
  if(previous?.fingerprint===fingerprint)return previous;
  return {fingerprint,id:newId()};
}

export function intakeState615(capability,hasReview){
  if(capability?.enabled!==true||!capability.site_key)return "disabled";
  return hasReview?"ready":"awaiting_review";
}
