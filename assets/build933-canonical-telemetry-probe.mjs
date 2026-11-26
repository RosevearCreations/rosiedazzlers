// The static admin document is public shell markup, not public evidence.
// Canonical extensionless path; exact content and denied APIs are separate.
const adminPath='/admin-sysop-918';
const marker='Build 918 — Seven-App Signed Telemetry';
const moduleMarker='/assets/build918-telemetry-admin.mjs';
const boundaryPaths=new Set(['/api/admin/sysop_918','/internal/rosevear/sysop/telemetry/v1']);
function safeFailure(e){
 const code=e?.cause?.code;
 if(['ETIMEDOUT','ECONNRESET','ECONNREFUSED','EAI_AGAIN','UND_ERR_CONNECT_TIMEOUT','UND_ERR_HEADERS_TIMEOUT'].includes(code))return code;
 return e?.name==='AbortError'?'REQUEST_TIMEOUT':'TRANSPORT_OR_REDIRECT_REJECTED';
}
async function observe(probe,path,validate,wait){
 for(let attempt=1;attempt<=2;attempt++){
  try{
   const r=await probe(path);
   const s=await validate(r);
   return {status:s.status,reason:s.reason,attempts:attempt};
  }catch(e){
   const reason=safeFailure(e);
   if(attempt===2)return {status:null,reason,attempts:attempt};
   await wait(350);
  }
 }
}
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
export function observeAdmin933(probe,wait=pause){
 return observe(probe,adminPath,async r=>{
  if(r.status!==200)return {status:r.status,reason:'HTTP_STATUS'};
  if(!/^text\/html(?:;|$)/i.test(r.headers.get('content-type')||''))return {status:null,reason:'ADMIN_CONTENT_TYPE_MISMATCH'};
  const len=Number(r.headers.get('content-length')||0);
  if(len>65536)return {status:null,reason:'ADMIN_BODY_UNBOUNDED'};
  const reader=r.body?.getReader();
  if(!reader)return {status:null,reason:'ADMIN_BODY_MISSING'};
  let size=0,body='',decoder=new TextDecoder();
  try{
   for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>65536){await reader.cancel();return {status:null,reason:'ADMIN_BODY_UNBOUNDED'}}body+=decoder.decode(value,{stream:true})}
   body+=decoder.decode();
  }finally{reader.releaseLock()}
  return body.includes(marker)&&body.includes(moduleMarker)?{status:200,reason:'EXACT_ADMIN_DOCUMENT'}:{status:null,reason:'ADMIN_DOCUMENT_MISMATCH'};
 },wait);
}
export function observeBoundary933(probe,path,wait=pause){
 if(!boundaryPaths.has(path))throw Error('UNAPPROVED_BOUNDARY_PATH');
 return observe(probe,path,async r=>{await r.body?.cancel();return {status:r.status,reason:'HTTP_STATUS'}},wait);
}
