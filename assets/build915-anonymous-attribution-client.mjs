// Rosie Build 915 — opt-in anonymous first-party supplier-video engagement.
// A campaign link may use ?rosie_publication=<verified-publication-UUID>.
// Nothing sent before opt-in; no cookie, localStorage, IP, customer, URL or cart metadata.
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const publication=new URL(location.href).searchParams.get('rosie_publication');
const optin=document.getElementById('interestOptIn');
if(UUID.test(publication||'')&&optin){
 const send=async event_kind=>{
  if(!optin.checked)return;
  try{await fetch('/api/public/supplier_attribution_v915',{method:'POST',
   headers:{'Content-Type':'application/json'},
   body:JSON.stringify({publication_id:publication,event_uuid:crypto.randomUUID(),event_kind}),
   credentials:'same-origin',cache:'no-store',keepalive:true});}catch{ /* optional counts must not affect booking */ }
 };
 optin.addEventListener('change',()=>{if(optin.checked)void send('landing')});
 document.getElementById('products')?.addEventListener('click',e=>{
  if(e.target.closest('button,a,[role="button"]'))void send('product_interest');
 });
 document.querySelector('a[href="/roadside-quote.html"]')?.addEventListener('click',()=>void send('quote_started'));
}
