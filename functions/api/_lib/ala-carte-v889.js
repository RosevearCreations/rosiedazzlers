// Rosie 889: canonical package-free basket priced by the *server* catalogue.
// Does not create bookings, override checkout capacity, authorize products,
// approve owner pricing or settle a payment. All unapproved cases fail closed.
export const ALA_CARTE_PACKAGE_CODE_889 = 'ala_carte';
const sizes = new Set(['small','mid','oversize']);
const refusal = (code, message) => ({ok:false,reason:code,error:message,
  booking_created:false,payment_attempted:false});

export function resolveAlaCarte889(catalog, body) {
  if (body?.booking_mode !== 'ala_carte')
    return refusal('BOOKING_MODE_INVALID','Choose an available booking method.');
  if (body.package_code || (Array.isArray(body.addon_codes) && body.addon_codes.length))
    return refusal('MIXED_PACKAGE_AND_ALA_CARTE','Choose either the guided package flow or individual standalone services, not both.');
  const policy = catalog?.booking_rules?.ala_carte_policy;
  if (policy?.enabled !== true || policy?.owner_approved !== true ||
      typeof policy?.version !== 'string' || !policy.version.trim())
    return refusal('STANDALONE_OWNER_CATALOG_APPROVAL_HOLD','Individual service checkout needs owner-approved service pricing before payment. Please contact Rosie Dazzlers.');
  const codes = body?.service_codes;
  if (!Array.isArray(codes) || codes.length < 1 || codes.length > 12 ||
      codes.some(x => typeof x !== 'string' || !/^[a-z0-9_-]{2,80}$/.test(x)) ||
      new Set(codes).size !== codes.length)
    return refusal('STANDALONE_SELECTION_INVALID','Choose one or more distinct available services.');
  if (!sizes.has(body.vehicle_size))
    return refusal('VEHICLE_SIZE_INVALID','Select the correct vehicle size.');
  let subtotalCents=0;
  const items=[];
  for (const code of codes) {
    const a=catalog?.addon_map?.[code];
    if (!a || a.standalone_allowed !== true || a.quote_required === true)
      return refusal('STANDALONE_ITEM_NOT_APPROVED','One selected service requires a custom quote or a full package. Review your choices.');
    const amount=a.prices_cad?.[body.vehicle_size];
    if (typeof amount!=='number' || !Number.isFinite(amount) || amount<=0 || !Number.isSafeInteger(Math.round(amount*100)))
      return refusal('STANDALONE_PRICE_MISSING','A selected service has no approved price for this vehicle size.');
    const cents=Math.round(amount*100);
    subtotalCents+=cents;
    if (!Number.isSafeInteger(subtotalCents))return refusal('STANDALONE_TOTAL_INVALID','Please contact Rosie Dazzlers for an individual quote.');
    items.push({code:a.code,label:a.name,cents,quote_required:false});
  }
  if (subtotalCents<=0)return refusal('STANDALONE_TOTAL_INVALID','There is no billable service selected.');
  const deposit=policy.deposit_cad;
  if (typeof deposit!=='number' || !Number.isFinite(deposit) || deposit<=0 ||
      Math.round(deposit*100)>subtotalCents)
    return refusal('STANDALONE_DEPOSIT_NOT_APPROVED','Individual-service deposit terms need owner review before checkout.');
  const depositCents=Math.round(deposit*100);
  if (!Number.isSafeInteger(depositCents))
    return refusal('STANDALONE_DEPOSIT_INVALID','Individual-service deposit terms are not valid.');
  // Package gift redemptions and promo discounts are not atomically compatible
  // with a package-free basket until an explicit approved ledger contract exists.
  if (String(body.gift_code||'').trim() || String(body.promo_code||'').trim())
    return refusal('STANDALONE_GIFT_PROMO_REVIEW_HOLD','Gift certificates or promotions for individual services need staff review. No payment was taken.');
  const duration=Number(body.duration_slots);
  const minSlots=Number(policy.minimum_duration_slots || 1);
  if (![1,2].includes(minSlots) || ![1,2].includes(duration) || duration<minSlots)
    return refusal('STANDALONE_DURATION_REVIEW_HOLD','Select the approved appointment length for these services.');
  return {ok:true,package_code:ALA_CARTE_PACKAGE_CODE_889,
    items,subtotal_cents:subtotalCents,deposit_cents:depositCents,
    policy_version:policy.version,minimum_duration_slots:minSlots,
    booking_created:false,payment_attempted:false};
}
