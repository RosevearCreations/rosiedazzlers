// Build 630: privacy-minimized same-tab draft policy.
// Never store customer/vehicle identity, address, notes, photos, consent,
// voucher codes, price/deposit snapshots, selected appointment date or slot.
export const BOOKING_DRAFT_SCHEMA_630 = "rosie-booking-choices.v1";
export const BOOKING_DRAFT_MAX_AGE_630 = 6*60*60*1000;
export const BOOKING_DRAFT_FIELDS_630 = Object.freeze(["service_area","vehicle_size"]);
const sizes=new Set(["small","mid","oversize"]);
const clean=value=>typeof value==="string"?value.trim():"";
const code=value=>/^[a-z0-9][a-z0-9_-]{0,79}$/.test(clean(value))?clean(value):"";
const text=value=>clean(value).slice(0,120);
export function sanitizedBookingChoices630(value={},nowMs=Date.now()){
  const fields=value?.fields && typeof value.fields==="object"?value.fields:{};
  const size=sizes.has(clean(fields.vehicle_size))?fields.vehicle_size:"";
  const list=Array.isArray(value?.addon_codes)?value.addon_codes:[];
  const addons=[...new Set(list.map(code).filter(Boolean))].slice(0,20);
  const saved=Number(value?.saved_at);
  return {
    version:630,schema:BOOKING_DRAFT_SCHEMA_630,
    saved_at:Number.isFinite(saved)&&saved>=0&&saved<=nowMs+60000?saved:nowMs,
    fields:{vehicle_size:size,service_area:text(fields.service_area)},
    package_code:code(value?.package_code),addon_codes:addons
  };
}
export function parseBookingChoices630(raw,nowMs=Date.now()){
  let draft;
  try{draft=JSON.parse(raw);}catch{return null;}
  if(!draft||draft.schema!==BOOKING_DRAFT_SCHEMA_630||draft.version!==630)return null;
  const saved=Number(draft.saved_at);
  if(!Number.isFinite(saved)||saved>nowMs+60000||saved<0||nowMs-saved>BOOKING_DRAFT_MAX_AGE_630)return null;
  return sanitizedBookingChoices630(draft,nowMs);
}
export function reconcileBookingChoices630(draft,catalog={}){
  const current=sanitizedBookingChoices630(draft);
  const packages=Array.isArray(catalog?.packages)?catalog.packages:[];
  const addons=Array.isArray(catalog?.addons)?catalog.addons:[];
  const areas=Array.isArray(catalog?.service_areas)?catalog.service_areas:[];
  const chosenPackage=packages.find(p=>p?.code===current.package_code);
  const compatible=addon=>{
    if(!addon||addon.quote_required===true)return false; // estimates need fresh review, not auto-restored
    const required=Array.isArray(addon.requires_package_codes_any)?addon.requires_package_codes_any:[];
    return addon.standalone_allowed===true||required.length===0||required.includes(chosenPackage?.code);
  };
  return {
    fields:{
      vehicle_size:current.fields.vehicle_size,
      service_area:areas.some(row=>[row?.value,row?.label].some(value=>typeof value==="string"&&
        value.toLowerCase()===current.fields.service_area.toLowerCase()))?current.fields.service_area:""
    },
    package_code:chosenPackage?.code||"",
    addon_codes:current.addon_codes.filter(id=>compatible(addons.find(x=>x.code===id))),
    requires_availability_recheck:true,requires_price_recheck:true,restore_step:1,
    service_date:"",slot:"",stored_price_cents:null,holds_slot:false
  };
}
