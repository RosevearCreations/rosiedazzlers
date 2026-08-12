// Historical Build 252 guard tokens: prefix: 'packages/' | prefix: 'landing_pages/' | prefix: 'CarPhotos/' | build:252 | allowed_prefixes
import { buildPublicWebsiteImageManifest } from './_lib/public-website-images.js';
import { json } from './_lib/staff-auth.js';
export async function onRequestGet({env}){
  try{return json(await buildPublicWebsiteImageManifest(env));}
  catch(err){return json({ok:false,build:253,error:err?.message||'Could not load approved website images.',images:[],assignments:[]},500);}
}
export async function onRequest(context){return onRequestGet(context);}
