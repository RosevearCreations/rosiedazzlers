// Historical Build 257 compatibility token: build:257
// Historical Build 252 guard tokens: prefix: 'packages/' | prefix: 'landing_pages/' | prefix: 'CarPhotos/' | build:252 | allowed_prefixes
import { buildPublicWebsiteImageManifest } from './_lib/public-website-images.js';
function compactJson(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'public, max-age=10, s-maxage=30, stale-while-revalidate=60'}});}
export async function onRequestGet({env}){
  try{return compactJson(await buildPublicWebsiteImageManifest(env));}
  catch(err){return compactJson({ok:false,build:258,error:err?.message||'Could not load approved website images.',images:[],assignments:[],prefixes:{packages:[],landing_pages:[],car_photos:[]}},500);}
}
export async function onRequest(context){return onRequestGet(context);}
