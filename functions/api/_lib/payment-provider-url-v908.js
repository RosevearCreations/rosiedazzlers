// Build 908: payment provider URLs must be genuine provider-host HTTPS origins.
export function approvedProviderUrl908(value,provider){
 try{const u=new URL(value);if(u.protocol!=="https:"||u.username||u.password)return false;
 const host=u.hostname.toLowerCase();return provider==="stripe"?(host==="stripe.com"||host.endsWith(".stripe.com")):
 provider==="paypal"?(host==="paypal.com"||host.endsWith(".paypal.com")):false;
 }catch{return false;}
}
