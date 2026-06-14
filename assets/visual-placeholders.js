// Build 207 — professional visual placeholders for missing/enrichment image slots.
(function attachRosieVisualPlaceholders(globalScope){
  const PALETTE = {
    service_card: ["#4d77ff", "#22c55e"], town_card: ["#f97316", "#facc15"], gallery_pair: ["#8b5cf6", "#ec4899"], seasonal_campaign: ["#14b8a6", "#f59e0b"], fleet: ["#38bdf8", "#1d4ed8"], incident_evidence: ["#64748b", "#334155"], review_proof: ["#facc15", "#f97316"], default: ["#4d77ff", "#0f172a"]
  };
  function esc(v){ return String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
  function titleFor(type){
    return ({service_card:'Service photo coming soon',town_card:'Local proof image coming soon',gallery_pair:'Before/after image pending',seasonal_campaign:'Campaign graphic coming soon',fleet:'Fleet photo coming soon',incident_evidence:'Evidence photo private or pending',review_proof:'Review proof coming soon'}[type] || 'Image coming soon');
  }
  function detailFor(type){
    return ({service_card:'Replace with an approved Rosie-owned service image.',town_card:'Add a local, customer-approved Oxford/Norfolk proof photo.',gallery_pair:'Publish only after consent and image review.',seasonal_campaign:'Use a seasonal offer image or before/after card.',fleet:'Use an approved work vehicle or fleet service photo.',incident_evidence:'Only admin-approved customer-safe evidence is public.',review_proof:'Use an approved review screenshot or testimonial.'}[type] || 'Replace this placeholder with an approved image.');
  }
  function svgData(type, label){
    const [a,b] = PALETTE[type] || PALETTE.default; const safe = esc(label || titleFor(type));
    const body = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="540" viewBox="0 0 900 540" role="img" aria-label="${safe}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient><filter id="s" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#020617" flood-opacity=".35"/></filter></defs><rect width="900" height="540" rx="42" fill="#07111f"/><rect x="28" y="28" width="844" height="484" rx="34" fill="url(#g)" opacity=".72"/><circle cx="716" cy="124" r="92" fill="#fff" opacity=".13"/><circle cx="190" cy="410" r="126" fill="#fff" opacity=".10"/><g filter="url(#s)"><rect x="94" y="104" width="712" height="332" rx="28" fill="#0f172a" opacity=".72" stroke="#fff" stroke-opacity=".22"/><path d="M170 340c84-94 139-128 199-80 47 38 86 28 137-21 81-78 139-48 220 105" fill="none" stroke="#eaf2ff" stroke-width="24" stroke-linecap="round" opacity=".88"/><circle cx="305" cy="202" r="42" fill="#eaf2ff" opacity=".92"/><text x="450" y="385" text-anchor="middle" fill="#f8fafc" font-family="Arial, sans-serif" font-size="34" font-weight="800">${safe}</text></g></svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(body);
  }
  function inferType(el){
    const explicit = el?.dataset?.visualPlaceholder || el?.dataset?.visualSlot || '';
    if (explicit) return explicit;
    const txt = (el?.textContent || el?.getAttribute?.('alt') || '').toLowerCase();
    if (/town|tillsonburg|woodstock|ingersoll|simcoe|delhi|port dover|norfolk|oxford/.test(txt)) return 'town_card';
    if (/before|after|gallery|proof/.test(txt)) return 'gallery_pair';
    if (/fleet|commercial|van|truck/.test(txt)) return 'fleet';
    if (/incident|damage|evidence|fault/.test(txt)) return 'incident_evidence';
    if (/review|testimonial|stars/.test(txt)) return 'review_proof';
    if (/season|spring|summer|winter|campaign|special/.test(txt)) return 'seasonal_campaign';
    return 'service_card';
  }
  function buildBlock(type, label){
    const block=document.createElement('div'); block.className='visual-placeholder-card'; block.dataset.visualPlaceholderBuilt='true';
    block.innerHTML = `<img src="${svgData(type,label)}" alt="${esc(label||titleFor(type))}" loading="lazy" decoding="async"><div class="visual-placeholder-copy"><strong>${esc(titleFor(type))}</strong><span>${esc(detailFor(type))}</span></div>`;
    return block;
  }
  function attachImageFallbacks(root=document){
    root.querySelectorAll('img').forEach(img=>{
      if (img.dataset.visualFallbackAttached === 'true') return; img.dataset.visualFallbackAttached='true';
      const type = inferType(img); const label = img.getAttribute('alt') || titleFor(type);
      if (!img.getAttribute('src')) img.setAttribute('src', svgData(type, label));
      img.addEventListener('error', ()=>{ if(img.dataset.visualFallbackApplied==='true') return; img.dataset.visualFallbackApplied='true'; img.src=svgData(type,label); img.classList.add('visual-placeholder-img'); }, { once:false });
    });
  }
  function installContextualCards(root=document){
    const page = (document.body && document.body.dataset && document.body.dataset.page) || '';
    const isAdmin = /^admin/.test(page) || location.pathname.startsWith('/admin');
    const selectors = isAdmin ? ['.card[data-build206]', '.card[data-build205]', '.panel[data-needs-visual]'] : ['.service-link-card', '.local-town-card', '.proof-card', '.card[data-needs-visual]', '.panel[data-needs-visual]'];
    selectors.forEach(sel=>root.querySelectorAll(sel).forEach(node=>{
      if (node.dataset.visualPlaceholderSkip === 'true') return;
      if (node.querySelector('img,.visual-placeholder-card')) return;
      const type = inferType(node); const title = (node.querySelector('h2,h3,strong')?.textContent || titleFor(type)).trim();
      node.insertBefore(buildBlock(type, title), node.firstChild);
    }));
  }
  function init(root=document){ attachImageFallbacks(root); installContextualCards(root); }
  globalScope.RosieVisualPlaceholders = { init, svgData, buildBlock };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',()=>init(document)); else init(document);
})(window);
