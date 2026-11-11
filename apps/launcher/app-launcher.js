// Build 842: signed-in staff launcher with distinct per-module illustrations.
// Only the existing module flag endpoint is read; no workflow data is loaded.
(function(globalScope){
  'use strict';
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function card(m){
    const slug=('launcher-'+m.name).normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,84).replace(/-$/,'');
    const image='/assets/card-art-842/'+slug+'.svg';
    return `<article class="panel app-card"><img class="module-link-card__photo" src="${esc(image)}" alt="Illustrative image for ${esc(m.name)}" loading="lazy" decoding="async"><span class="badge">${esc(m.status==='runtime'?'Active runtime':m.status==='control'?'Control plane':'Lazy module')}</span><h2>${esc(m.name)}</h2><p class="mini">${esc(m.description||'Loads only when selected.')}</p><a class="btn primary" href="${esc(m.href)}" data-module="${esc(m.key)}">Open ${esc(m.name)}</a></article>`;
  }
  async function boot(){
    await globalScope.AdminShell.boot({pageKey:'app-launcher',onReady:async({actor})=>{
      const resolver=globalScope.RosieAppCore.ModuleResolver;
      const flagState=await resolver.loadRuntimeFlags();
      const modules=resolver.allowed(actor);
      if(modules.length===1&&String(actor.role_code||'').toLowerCase()==='detailer'){
        resolver.remember(modules[0].key);location.replace(modules[0].href);return;
      }
      $('launcherStatus').className=modules.length?'notice ok':'notice warn';
      $('launcherStatus').textContent=modules.length?`Signed in as ${actor.full_name||actor.email||'staff'}. ${modules.length} authorized module${modules.length===1?'':'s'} available · switches from ${flagState.source}.`:'No internal module is both granted and globally enabled for this staff account.';
      $('moduleCards').innerHTML=modules.map(card).join('');
      $('moduleCards').querySelectorAll('[data-module]').forEach(a=>a.addEventListener('click',()=>resolver.remember(a.dataset.module)));
    }});
  }
  boot().catch(e=>{$('launcherStatus').className='notice bad';$('launcherStatus').textContent=e.message||'Could not start app launcher.';});
})(window);
