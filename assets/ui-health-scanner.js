(function attachUiHealth(globalScope){
'use strict';
const BUILD=260;
const $=(s)=>document.querySelector(s);
const esc=(v)=>String(v??'').replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let routes=[],results=[],assetCache=new Map();
function note(message,type='soft'){const box=$('#scanStatus');box.className='notice '+type;box.textContent=message;}
async function fetchText(path){const response=await fetch(path,{cache:'no-store',credentials:'include'});const text=await response.text();return {response,text};}
function sameOriginPath(value){try{const u=new URL(value,location.origin);return u.origin===location.origin?u.pathname+u.search:null;}catch{return null;}}
async function assetExists(path){if(!path)return true;if(assetCache.has(path))return assetCache.get(path);const p=(async()=>{try{const res=await fetch(path,{cache:'no-store',credentials:'include'});return res.ok;}catch{return false;}})();assetCache.set(path,p);return p;}
function meta(doc,name){return doc.querySelector(`meta[name="${name}"]`)?.getAttribute('content')?.trim()||'';}
function titleText(doc){return doc.querySelector('title')?.textContent?.trim()||'';}
function canonical(doc){return doc.querySelector('link[rel="canonical"]')?.getAttribute('href')?.trim()||'';}
function deprecatedSvgPhoto(ref){return /rosie-reviews-fallback\.svg|generic_addon\.svg|de_ionizing_treatment\.svg|de_badging\.svg|engine_cleaning\.svg|external_ceramic_coating\.svg|external_graphene_fine_finish\.svg|external_wax\.svg|vinyl_wrapping\.svg|window_tinting\.svg/i.test(ref);}
async function scanRoute(route){
  const started=performance.now();const errors=[],warnings=[],details={};
  try{
    const {response,text}=await fetchText(route.path);details.status=response.status;details.content_type=response.headers.get('content-type')||'';
    if(!response.ok)errors.push(`HTTP ${response.status}`);
    const doc=new DOMParser().parseFromString(text,'text/html');
    const h1s=[...doc.querySelectorAll('h1')];details.h1_count=h1s.length;details.h1=h1s.map((n)=>n.textContent.trim());
    if(h1s.length!==1)errors.push(`Expected 1 H1, found ${h1s.length}`);
    details.title=titleText(doc);details.title_length=details.title.length;
    if(!details.title)errors.push('Missing title');else if(route.kind==='public'&&details.title.length>65)warnings.push(`Title is ${details.title.length} characters`);
    details.description=meta(doc,'description');details.description_length=details.description.length;
    if(route.kind==='public'&&!details.description)errors.push('Missing meta description');else if(route.kind==='public'&&details.description.length>165)warnings.push(`Description is ${details.description.length} characters`);
    details.canonical=canonical(doc);
    if(route.kind==='public'&&!details.canonical)warnings.push('Missing canonical link');
    const robots=meta(doc,'robots').toLowerCase();details.robots=robots;
    if(route.kind==='admin'&&!robots.includes('noindex'))errors.push('Admin page is missing noindex');
    const refs=[];
    doc.querySelectorAll('link[rel="stylesheet"][href],script[src],img[src]').forEach((node)=>refs.push({tag:node.tagName.toLowerCase(),raw:node.getAttribute(node.tagName==='LINK'?'href':'src')}));
    const local=[...new Set(refs.map((r)=>sameOriginPath(r.raw)).filter(Boolean))];details.local_asset_count=local.length;
    const missing=[];for(const ref of local){if(!(await assetExists(ref)))missing.push(ref);}details.missing_assets=missing;if(missing.length)errors.push(`${missing.length} local asset(s) missing`);
    const svgRefs=refs.map((r)=>r.raw||'').filter(deprecatedSvgPhoto);details.deprecated_svg_photo_refs=svgRefs;if(svgRefs.length)errors.push(`${svgRefs.length} deprecated SVG photo placeholder reference(s)`);
    const cleanPath=route.path.endsWith('.html')?route.path.replace(/\.html$/,'/'):null;
    if(cleanPath){try{const clean=await fetchText(cleanPath);details.clean_route_status=clean.response.status;if(!clean.response.ok)warnings.push(`Clean route returned ${clean.response.status}`);else{const cleanDoc=new DOMParser().parseFromString(clean.text,'text/html');if(titleText(cleanDoc)!==details.title)warnings.push('Clean route title differs');if((cleanDoc.querySelector('h1')?.textContent||'').trim()!==(details.h1[0]||''))warnings.push('Clean route H1 differs');}}catch{warnings.push('Clean route check failed');}}
  }catch(error){errors.push(error.message||'Route scan failed');}
  return {...route,ok:errors.length===0,errors,warnings,details,duration_ms:Math.round(performance.now()-started)};
}
function render(){
  const pass=results.filter((r)=>r.ok).length,warn=results.filter((r)=>r.warnings.length).length,fail=results.length-pass;
  $('#scanSummary').innerHTML=[['Routes scanned',results.length],['Passed',pass],['Failed',fail],['Warnings',warn]].map(([k,v])=>`<article class="panel metric"><span class="mini">${esc(k)}</span><strong>${esc(v)}</strong></article>`).join('');
  $('#scanResults').innerHTML=results.map((r)=>`<article class="panel result ${r.ok?'ok':'bad'}"><div class="result-head"><div><span class="badge">${esc(r.kind)}</span><h3>${esc(r.label)}</h3><code>${esc(r.path)}</code></div><span class="status-pill ${r.ok?'ok':'failed'}">${r.ok?'Pass':'Needs attention'}</span></div><div class="result-grid"><div><strong>H1</strong><span>${esc(r.details.h1_count??'—')} · ${esc((r.details.h1||[]).join(' | ')||'none')}</span></div><div><strong>Title</strong><span>${esc(r.details.title_length??'—')} chars</span></div><div><strong>Description</strong><span>${esc(r.details.description_length??'—')} chars</span></div><div><strong>Local assets</strong><span>${esc(r.details.local_asset_count??'—')}</span></div></div>${r.errors.length?`<div class="notice bad"><strong>Errors</strong><ul>${r.errors.map((e)=>`<li>${esc(e)}</li>`).join('')}</ul>${(r.details.missing_assets||[]).map((a)=>`<code>${esc(a)}</code>`).join('<br>')}</div>`:''}${r.warnings.length?`<div class="notice warn"><strong>Warnings</strong><ul>${r.warnings.map((e)=>`<li>${esc(e)}</li>`).join('')}</ul></div>`:''}<details><summary>Technical details</summary><pre>${esc(JSON.stringify(r.details,null,2))}</pre></details></article>`).join('')||'<div class="empty">Run the scanner to create results.</div>';
  note(`Build ${BUILD} scan complete: ${pass} passed, ${fail} failed, ${warn} with warnings.`,fail?'warn':'ok');
}
async function run(){const btn=$('#runScan');btn.disabled=true;btn.textContent='Scanning…';results=[];assetCache=new Map();note('Scanning critical public/admin routes and their local assets…');try{const data=await fetch('/data/build260_ui_health_routes.json',{cache:'no-store'}).then((r)=>r.json());routes=Array.isArray(data.routes)?data.routes:[];for(let i=0;i<routes.length;i++){note(`Scanning ${i+1}/${routes.length}: ${routes[i].label}`);results.push(await scanRoute(routes[i]));render();}}catch(error){note(error.message||'Could not run the UI health scan.','bad');}finally{btn.disabled=false;btn.textContent='Run full UI & SEO scan';}}
function exportJson(){const blob=new Blob([JSON.stringify({build:BUILD,generated_at:new Date().toISOString(),host:location.host,results},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`rosie-ui-health-build${BUILD}.json`;a.click();URL.revokeObjectURL(a.href);}
function boot(){if(!globalScope.AdminShell||!globalScope.AdminMenu){note('Admin dependencies did not load.','bad');return;}$('#runScan').addEventListener('click',run);$('#exportScan').addEventListener('click',exportJson);globalScope.AdminShell.boot({pageKey:'admin-ui-health',onReady:()=>{globalScope.AdminMenu.render({currentPage:'admin-ui-health'});run();}});}
boot();
})(window);
