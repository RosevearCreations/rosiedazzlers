// Build 264 — small no-retry API client for modular Rosie shells.
(function attachRosieApiClient(globalScope){
  'use strict';
  async function requestJson(url,options={}){
    const method=String(options.method || (options.body===undefined?'GET':'POST')).toUpperCase();
    const controller=typeof AbortController!=='undefined'?new AbortController():null;
    const timeoutMs=Math.max(2000,Number(options.timeoutMs||options.timeout_ms||20000));
    const timer=controller?setTimeout(()=>controller.abort(),timeoutMs):null;
    const headers=new Headers(options.headers||{});
    if(options.body!==undefined && !(options.body instanceof FormData) && !headers.has('Content-Type')) headers.set('Content-Type','application/json');
    let response;
    try{
      response=await fetch(url,{...options,method,credentials:'include',cache:'no-store',headers,signal:controller?.signal});
    }catch(error){
      if(timer)clearTimeout(timer);
      const timedOut=error?.name==='AbortError';
      const err=new Error(timedOut?`Request timed out after ${timeoutMs}ms.`:(error?.message||'Network request failed.'));
      err.status=0;err.method=method;err.url=url;throw err;
    }
    if(timer)clearTimeout(timer);
    const type=String(response.headers.get('content-type')||'');
    let data=null;
    if(type.includes('json')) data=await response.json().catch(()=>null);
    else { const text=await response.text().catch(()=>''); try{data=text?JSON.parse(text):null;}catch{data={error:text.slice(0,300)};} }
    if(!response.ok || data?.ok===false){
      const ambiguous=method!=='GET' && [502,503,504].includes(response.status);
      const err=new Error(data?.error || (ambiguous?`Request returned ${response.status}. State may be uncertain; inspect before repeating this write.`:`Request failed (${response.status}).`));
      err.status=response.status;err.data=data;err.ambiguousMutation=ambiguous;err.method=method;err.url=url;throw err;
    }
    return data||{};
  }
  globalScope.RosieAppCore=globalScope.RosieAppCore||{};
  globalScope.RosieAppCore.ApiClient={requestJson};
})(window);
