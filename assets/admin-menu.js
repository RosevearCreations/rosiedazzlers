// Build 267 — hierarchical internal navigation.
// The old flat admin menu is retired. Each protected page belongs to one primary module,
// and the module page exposes its workflows as clickable cards.
(function attachAdminMenu(globalScope){
  'use strict';
  let navPromise=null;
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function ensureNavigation(){
    if(globalScope.RosieAppCore?.ModuleNavigation)return Promise.resolve(globalScope.RosieAppCore.ModuleNavigation);
    if(navPromise)return navPromise;
    navPromise=new Promise((resolve,reject)=>{
      const script=document.createElement('script');
      script.src='/assets/app-core/module-navigation.js?v=20260829build267';
      script.onload=()=>resolve(globalScope.RosieAppCore?.ModuleNavigation||null);
      script.onerror=()=>reject(new Error('Could not load module navigation.'));
      document.head.appendChild(script);
    });
    return navPromise;
  }
  function fallback(mount){
    mount.innerHTML='<div class="panel stack"><strong>Rosie Apps</strong><a class="btn ghost small" href="/app/">All modules</a><a class="btn ghost small" href="/admin-account.html">My account</a></div>';
  }
  function renderNow({currentPage,mount,nav}){
    const auth=globalScope.AdminAuth;
    const modules=auth?.pageModules?.(currentPage)||nav?.modulesForPage?.(currentPage)||[];
    const moduleKey=modules[0]||null;
    const mod=moduleKey?nav.CATALOG.modules[moduleKey]:null;
    if(!mod){fallback(mount);return;}
    const categoryHtml=mod.categories.map(cat=>{
      const cards=(cat.cards||[]).filter(card=>!auth?.canAccessPage||auth.canAccessPage(card.page_key));
      if(!cards.length)return '';
      return `<div class="admin-module-menu__group"><div class="kicker">${esc(cat.name)}</div>${cards.map(card=>`<a class="admin-module-menu__item${card.page_key===currentPage?' active':''}" href="${esc(card.href)}" ${card.page_key===currentPage?'aria-current="page"':''}><strong>${esc(card.label)}</strong><span>${esc(card.description)}</span></a>`).join('')}</div>`;
    }).join('');
    mount.innerHTML=`<nav class="admin-module-menu" aria-label="${esc(mod.name)} navigation"><div class="admin-module-menu__head"><span class="badge">Build 267 module</span><h2>${esc(mod.name)}</h2><p class="mini">Only workflows in this module are shown here.</p><div class="row"><a class="btn ghost small" href="/app/">All apps</a><a class="btn primary small" href="${esc(mod.href)}">Module home</a><a class="btn ghost small" href="/admin-account.html">Account</a></div></div>${categoryHtml}</nav>`;
  }
  function render(options={}){
    if(!globalScope.AdminAuth)throw new Error('AdminMenu requires /assets/admin-auth.js.');
    const mount=options.mount||document.querySelector('[data-admin-menu-mount]');
    if(!mount)return;
    const currentPage=options.currentPage||document.body?.dataset?.page||'';
    mount.innerHTML='<div class="notice">Loading module menu…</div>';
    ensureNavigation().then(nav=>nav?renderNow({currentPage,mount,nav}):fallback(mount)).catch(()=>fallback(mount));
  }
  globalScope.AdminMenu={render};
})(window);

/*
Historical release-check compatibility only. These strings are NOT the active menu model;
Build 267 renders the canonical module hierarchy from module-navigation.js.
admin-social | Social Queue
admin-conversions | Conversion Queue
Content Center | /admin-content.html | FAQ and public help content
Leads & Estimates | /admin-leads.html
key: "admin-daip-design" | /admin-daip-design.html
admin-daip-governance | DAIP Governance
admin-payments | Webhook history
admin-media-health | Media Health
key: "admin-integrations" | href: "/admin-integrations.html"
Inventory Workbench | Launch Readiness
admin-inventory-posting | Inventory Posting
key: "admin-daip-readiness" | label: "DAIP Readiness"
admin-daip | DAIP Test Lab
admin-tax-review | admin-close | admin-seo-tasks
Runtime & CPU Diagnostics | admin-runtime-health
admin-photo-studio
label: "Startup Command Center"
Build 239 compatibility route now forwards into Startup Command Center
*/
// Build 247 historical menu tokens: admin-daip-media | /admin-daip-media.html
