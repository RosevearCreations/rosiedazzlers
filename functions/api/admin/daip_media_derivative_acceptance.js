import {requireStaffAccess,json} from '../_lib/staff-auth.js';
import {bucketFor,serviceReady,rest,clean} from '../_lib/daip-media.js';
import {privateDerivativeKey,verifyPrivateDerivative} from '../../../assets/daip-rendered-derivative-559.js';
const UUID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
export async function onRequest(c){
 if(c.request.method==='OPTIONS')return new Response('',{status:204});
 if(c.request.method!=='GET')return json({ok:false,error:'Method not allowed.'},405);
 const auth=await requireStaffAccess({request:c.request,env:c.env,capability:'manage_staff',allowLegacyAdminFallback:true});
 if(!auth.ok)return auth.response;
 if(!serviceReady(c.env))return json({ok:false,error:'DAIP metadata unavailable.'},503);
 const q=new URL(c.request.url).searchParams;
 const p=clean(q.get('project_id'),80),a=clean(q.get('asset_id'),80),d=clean(q.get('derivative_id'),80),f=clean(q.get('format'),12).toLowerCase();
 const key=privateDerivativeKey(p,a,d,f);
 if(!key)return json({ok:false,error:'Valid scoped derivative identity required.'},400);
 try{
  const [projects,assets]=await Promise.all([
   rest(c.env,`creative_projects?select=id&id=eq.${encodeURIComponent(p)}&limit=1`),
   rest(c.env,`daip_project_media_assets?select=id,project_id,object_key,upload_status,file_size_bytes,r2_etag&id=eq.${encodeURIComponent(a)}&project_id=eq.${encodeURIComponent(p)}&limit=1`)
  ]);
  const asset=assets?.[0];
  if(!projects?.[0]||!asset||asset.project_id!==p)return json({ok:false,error:'Project asset not found.'},404);
  const {bucket}=bucketFor(c.env);
  if(!bucket||typeof bucket.head!=='function')return json({ok:false,error:'Private R2 unavailable.'},503);
  const validRawKey=asset.object_key?.startsWith(`projects/${p}/raw/`);
  const raw=validRawKey&&asset.upload_status==='uploaded'?await bucket.head(asset.object_key):null;
  const rawSize=Number(raw?.size),recordedSize=Number(asset.file_size_bytes);
  const storedEtag=String(asset.r2_etag||'').replaceAll('"',''),actualEtag=String(raw?.httpEtag||raw?.etag||'').replaceAll('"','');
  const rawVerified=!!raw&&Number.isSafeInteger(rawSize)&&rawSize>0&&rawSize===recordedSize&&(!storedEtag||!!actualEtag&&storedEtag===actualEtag);
  // Existence alone is not provenance: callers must never interpret HEAD as completed visual inspection.
  const derivative=rawVerified?await bucket.head(key):null;
  const review=verifyPrivateDerivative({projectId:p,assetId:a,derivativeId:d,format:f,rawVerified,head:derivative});
  return new Response(JSON.stringify({ok:true,project_id:p,asset_id:a,derivative_id:d,...review}),{
   headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}
  });
 }catch{return json({ok:false,error:'Private derivative evidence unavailable.'},502)}
}
