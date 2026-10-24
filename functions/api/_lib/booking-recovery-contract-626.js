// Build 626: pure, fail-closed recovery match and booking state planner.
// This module cannot reserve a slot, issue payment credentials or create bookings.
export const RECOVERY_CONTRACT_626 = "rosie-booking-recovery.v1";
const clean = v => String(v ?? "").trim();
const norm = v => clean(v).toLowerCase();
const code = (v) => clean(v).toLowerCase();
const cents = n => typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 1e6
  ? Math.round(n*100) : null;
function uniqueCodes(value) {
  if(!Array.isArray(value)) return null;
  const items=value.map(x=>typeof x==="string" ? clean(x) : clean(x?.code)).filter(Boolean);
  return items.length === value.length && new Set(items).size === items.length ? items.sort() : null;
}
export function normalizedRecoverySlots626(startSlot,durationSlots) {
  const slot=clean(startSlot).toUpperCase(),duration=Number(durationSlots);
  if(!["AM","PM"].includes(slot) || ![1,2].includes(duration) || (duration===2 && slot!=="AM"))
    return [];
  return duration===2 ? ["AM","PM"] : [slot];
}
export function classifyBookingState626(row, nowMs=Date.now(),holdMinutes=30) {
  const status=norm(row?.status);
  if(["cancelled","canceled","void","refunded","failed"].includes(status))
    return {status:"inactive",holds_slot:false};
  if(status==="confirmed") return {status:"confirmed",holds_slot:true};
  if(status!=="pending") return {status:"inactive",holds_slot:false};
  const created=Date.parse(row?.created_at||"");
  if(!Number.isFinite(created) || created>nowMs+60*1000)
    return {status:"unverified",holds_slot:false};
  const age=nowMs-created;
  const active=age>=0 && age < holdMinutes*60*1000;
  return {status:active?"pending_hold":"expired_hold",holds_slot:active};
}
export function priceSnapshot626(catalog,selection) {
  const packages=Array.isArray(catalog?.packages)?catalog.packages:[];
  const addonRows=Array.isArray(catalog?.addons)?catalog.addons:[];
  const pkg=packages.find(x=>x?.code===selection?.package_code);
  const size=selection?.vehicle_size;
  if(!pkg || !["small","mid","oversize"].includes(size)) return {ok:false,code:"PACKAGE_OR_SIZE_UNVERIFIED"};
  const base=cents(pkg.prices_cad?.[size]);if(base===null)return{ok:false,code:"PACKAGE_PRICE_UNVERIFIED"};
  const requested=uniqueCodes(selection?.addon_codes);
  if(!requested)return {ok:false,code:"ADDON_SELECTION_INVALID"};
  const addons=[];let total=base;
  for(const addonCode of requested){
    const addon=addonRows.find(a=>a?.code===addonCode);
    if(!addon)return{ok:false,code:"ADDON_UNAVAILABLE"};
    const requires=Array.isArray(addon.requires_package_codes_any)?addon.requires_package_codes_any:[];
    if(requires.length && addon.standalone_allowed!==true && !requires.includes(pkg.code))
      return{ok:false,code:"ADDON_INCOMPATIBLE"};
    const amount=cents(addon.prices_cad?.[size]);
    if(addon.quote_required===true || amount===null)
      return{ok:false,code:"QUOTE_REQUIRED"};
    addons.push(addonCode);total+=amount;
  }
  const configuredDeposit=cents(pkg.deposit_cad);
  const deposit=configuredDeposit && configuredDeposit>0 ? configuredDeposit :
    ["premium_wash","basic_detail"].includes(pkg.code)?5000:10000;
  return {ok:true,total_cents:total,deposit_cents:deposit,addon_codes:addons};
}
function equals(left,right){return norm(left)===norm(right);}
export function evaluateBookingRecovery626({
  booking, requestBody, catalog, nowMs=Date.now(),holdMinutes=30
}={}) {
  if(classifyBookingState626(booking,nowMs,holdMinutes).status!=="pending_hold")
    return {ok:false,code:"BOOKING_HOLD_EXPIRED_OR_UNVERIFIED"};
  const incoming=normalizedRecoverySlots626(requestBody?.start_slot,requestBody?.duration_slots);
  const existing=normalizedRecoverySlots626(booking?.start_slot,booking?.duration_slots);
  if(!incoming.length || !existing.length || incoming.join(",")!==existing.join(","))
    return {ok:false,code:"SLOT_CHANGED"};
  const fields=["customer_email","package_code","vehicle_size","service_area","address_line1","vehicle_make","vehicle_model"];
  if(fields.some(k=>!clean(booking?.[k]) || !clean(requestBody?.[k] ?? (
      k==="vehicle_make" ? requestBody?.vehicle?.make :
      k==="vehicle_model" ? requestBody?.vehicle?.model : "")) ||
      !equals(booking[k],requestBody[k] ?? (k==="vehicle_make" ? requestBody?.vehicle?.make :
        k==="vehicle_model" ? requestBody?.vehicle?.model : ""))))
    return {ok:false,code:"BOOKING_TERMS_CHANGED"};
  const year=Number(requestBody?.vehicle?.year ?? requestBody?.vehicle_year);
  if(!Number.isInteger(year) || year!==Number(booking?.vehicle_year))
    return {ok:false,code:"VEHICLE_DETAILS_CHANGED"};
  const incomingProvider=norm(requestBody?.payment_provider || "stripe");
  if(!["stripe","paypal"].includes(incomingProvider) || norm(booking?.payment_provider)!==incomingProvider)
    return {ok:false,code:"PAYMENT_PROVIDER_CHANGED"};
  const chosen=uniqueCodes(requestBody?.addon_codes);
  const recorded=uniqueCodes(booking?.addons);
  if(!chosen || !recorded || chosen.join(",")!==recorded.join(","))
    return {ok:false,code:"ADDON_SELECTION_CHANGED"};
  if(clean(requestBody?.promo_code) || clean(requestBody?.gift_code))
    return {ok:false,code:"DISCOUNT_REQUIRES_REVIEW"};
  const price=priceSnapshot626(catalog,{package_code:booking.package_code,vehicle_size:booking.vehicle_size,addon_codes:chosen});
  if(!price.ok)return {ok:false,code:price.code};
  if(price.total_cents!==booking?.price_total_cents || price.deposit_cents!==booking?.deposit_cents)
    return {ok:false,code:"CURRENT_PRICE_CHANGED"};
  return {ok:true,code:"EXACT_PENDING_PAYMENT_SESSION_MATCH",
    hold_state:"pending_hold",payment_provider:incomingProvider,
    price_total_cents:price.total_cents,deposit_cents:price.deposit_cents};
}
