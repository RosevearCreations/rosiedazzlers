// Rosie 913: isolated original retail financial connector. Service credentials never exposed to browser.
import {serviceHeaders} from './staff-auth.js';
export async function retailRpc913(env,name,body){
 if(!/^rosie_retail_[a-z_]+_v913$/.test(name)||
    !/^https:\/\//.test(String(env?.SUPABASE_URL||''))||!env?.SUPABASE_SERVICE_ROLE_KEY)
  throw Error('Original finance RPC unavailable');
 const res=await fetch(env.SUPABASE_URL.replace(/\/+$/,'')+'/rest/v1/rpc/'+name,{
  method:'POST',headers:{...serviceHeaders(env),'Content-Type':'application/json',Accept:'application/json'},
  body:JSON.stringify(body),redirect:'error',cache:'no-store'});
 if(!res.ok)throw Error('Original finance transaction rejected: '+res.status);
 const data=await res.json().catch(()=>null);
 if(!data||typeof data!=='object'||data.ok!==true)throw Error('Original transaction receipt not confirmed');
 return data;
}
export async function stripe913(env,path,{method='GET',data=null,idempotency=null}={}){
 if(!['checkout/sessions','refunds'].includes(path)&&
    !/^checkout\/sessions\/cs_[A-Za-z0-9_]+$/.test(path))throw Error('Unsupported provider endpoint');
 const headers={Authorization:'Bearer '+env.STRIPE_SECRET_KEY,Accept:'application/json'};
 if(data)headers['Content-Type']='application/x-www-form-urlencoded';
 if(idempotency)headers['Idempotency-Key']=idempotency;
 const response=await fetch('https://api.stripe.com/v1/'+path,{
   method,headers,body:data?new URLSearchParams(data).toString():undefined,
   redirect:'error',cache:'no-store'});
 const j=await response.json().catch(()=>null);
 if(!response.ok||!j||j.error)throw Error('Stripe provider unavailable: '+response.status);
 return j;
}
export function stripeCheckoutFields913(order,origin,customerEmail){
 if(!/^https:\/\/(?:www\.)?rosiedazzlers\.ca$/.test(origin))
  throw Error('Canonical production origin required for provider payment');
 const lines=order.lines;
 if(!Array.isArray(lines)||lines.length<1||lines.length>12)throw Error('Original immutable line snapshot missing');
 const total=lines.reduce((sum,line)=>{
  const p=line.unit_cents,q=line.quantity;
  if(!Number.isSafeInteger(p)||p<=0||!Number.isSafeInteger(q)||q<=0||q>10||
   p*q!==line.line_cents||String(line.title||'').length<4)throw Error('Original immutable line invalid');
  return sum+p*q;
 },0);
 if(total!==order.subtotal_cents||Math.round(total*0.13)!==order.estimated_hst_cents)
  throw Error('Original CAD/HST source total mismatch');
 const result={
  mode:'payment','payment_method_types[0]':'card',client_reference_id:order.id,
  customer_email:customerEmail,
  'metadata[rosie_retail_order_id]':order.id,'metadata[rosie_retail_build]':'913',
  success_url:origin+'/my-account.html?retail_payment=review',
  cancel_url:origin+'/retail.html?retail_payment=cancelled',
  expires_at:String(Math.floor(Date.now()/1000)+1800)
 };
 let index=0;
 for(const line of lines){
  const prefix='line_items['+index+++']';
  result[prefix+'[price_data][currency]']='cad';
  result[prefix+'[price_data][product_data][name]']=String(line.title).slice(0,140);
  result[prefix+'[price_data][unit_amount]']=String(line.unit_cents);
  result[prefix+'[quantity]']=String(line.quantity);
 }
 const prefix='line_items['+index+']';
 result[prefix+'[price_data][currency]']='cad';
 result[prefix+'[price_data][product_data][name]']='Ontario HST (13%)';
 result[prefix+'[price_data][unit_amount]']=String(order.estimated_hst_cents);
 result[prefix+'[quantity]']='1';
 return result;
}
