// Build 631: final-review contact validation, independent of pricing/payment authority.
export const FINAL_REVIEW_SCHEMA_631 = "rosie-booking-final-review.v1";
const value = item => typeof item==="string" ? item.trim() : "";
export function validateFinalReviewContact631(input={}) {
  const name=value(input.name),email=value(input.email),address=value(input.address),postal=value(input.postal);
  const violations=[];
  if(!name) violations.push({field:"customer_name",code:"NAME_REQUIRED",message:"Enter your full name."});
  else if(name.length>160) violations.push({field:"customer_name",code:"NAME_TOO_LONG",message:"The name is too long. Use up to 160 characters."});
  if(!email) violations.push({field:"customer_email",code:"EMAIL_REQUIRED",message:"Enter your email address."});
  else if(email.length>254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))
    violations.push({field:"customer_email",code:"EMAIL_INVALID",message:"Enter an email address in the format name@example.ca."});
  if(!address) violations.push({field:"address_line1",code:"ADDRESS_REQUIRED",message:"Enter the service address."});
  else if(address.length>180) violations.push({field:"address_line1",code:"ADDRESS_TOO_LONG",message:"The service address is too long. Use up to 180 characters."});
  if(postal && !/^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][ -]?\d[ABCEGHJ-NPRSTV-Z]\d$/i.test(postal))
    violations.push({field:"postal_code",code:"POSTAL_INVALID",message:"Check the Canadian postal code or leave it blank for staff to confirm."});
  return {schema:FINAL_REVIEW_SCHEMA_631,ok:violations.length===0,issues:violations};
}
export function finalReviewDisclosure631({hasDate=false,hasSlot=false,hasPackage=false,hasSize=false}={}) {
  const missing=[];
  if(!hasDate) missing.push("date");
  if(!hasSlot) missing.push("time slot");
  if(!hasPackage) missing.push("service package");
  if(!hasSize) missing.push("vehicle size");
  return {
    ready_to_request:missing.length===0,
    missing,
    disclaimer:"The displayed amount is an estimate, not a completed booking. Current pricing, availability and deposit are checked by the server before payment.",
    confirmed_booking:false,charged:false
  };
}
