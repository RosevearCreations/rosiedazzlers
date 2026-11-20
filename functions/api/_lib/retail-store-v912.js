// Build 912: private server-to-original-Supabase REST transport.
import {serviceHeaders} from './staff-auth.js';
export const retailResponse912=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{
 'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store',
 'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Vary':'Cookie'}});
export const retailSameOrigin912=request=>{
 const origin=request.headers.get('origin'),site=request.headers.get('sec-fetch-site');
 try{return !!origin&&new URL(origin).origin===new URL(request.url).origin&&(!site||['same-origin','none'].includes(site));}
 catch{return false;}
};
export async function retailRead912(env,path,options={}){
 if(!/^https:\/\//.test(String(env?.SUPABASE_URL||''))||!env?.SUPABASE_SERVICE_ROLE_KEY)throw Error('Original source not configured');
 const url=String(env.SUPABASE_URL).replace(/\/+$/,'')+'/rest/v1/'+path;
 const res=await fetch(url,{...options,headers:{...serviceHeaders(env),Accept:'application/json',
  'Content-Type':'application/json',...options.headers},cache:'no-store',redirect:'error'});
 if(!res.ok)throw Error('Original source request failed: '+res.status);
 const result=await res.json().catch(()=>null);
 if(!Array.isArray(result))throw Error('Invalid original source readback');
 return result;
}
export async function retailRequestBody912(request,limit=6000){
 if(!(request.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))throw Error('JSON body required');
 const body=await request.text();
 if(body.length>limit)throw Error('Request body too large');
 return JSON.parse(body);
}
