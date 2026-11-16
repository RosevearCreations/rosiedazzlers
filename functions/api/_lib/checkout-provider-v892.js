// Build 892: pure payment-provider safeguards usable in both Cloudflare bundler
// and Node regression tests. Never read credentials or invoke a provider here.
export function selectedProvider892(value) {
  if (value == null) return {ok:true,provider:"stripe"};
  if (typeof value !== "string") return {ok:false,reason:"unsupported_provider"};
  const provider=value.trim().toLowerCase();
  return ["stripe","paypal"].includes(provider)
    ? {ok:true,provider}
    : {ok:false,reason:"unsupported_provider"};
}
export function providerReady892({env={},provider="stripe",payableDepositCents=0}={}) {
  if (!Number.isSafeInteger(payableDepositCents)||payableDepositCents<0)
    return {ok:false,reason:"invalid_deposit"};
  if (payableDepositCents===0) return {ok:true,reason:"gift_only_no_provider_needed"};
  if (provider==="paypal")
    return env.PAYPAL_CLIENT_ID&&env.PAYPAL_CLIENT_SECRET
      ? {ok:true,reason:"configured"}
      : {ok:false,reason:"paypal_unavailable"};
  if(provider==="stripe")
    return env.STRIPE_SECRET_KEY
      ? {ok:true,reason:"configured"}
      : {ok:false,reason:"stripe_unavailable"};
  return {ok:false,reason:"unsupported_provider"};
}
