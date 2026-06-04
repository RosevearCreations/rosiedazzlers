// Build 178 — render DB-managed public content blocks on customer-facing pages.
(function(){
  function esc(value){return String(value == null ? '' : value).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];});}
  function normalize(value){return String(value||'').trim().toLowerCase().replace(/[^a-z0-9_ -]+/g,'').replace(/\s+/g,'_');}
  function blockCard(item){
    const cta = item.cta_href ? `<a class="btn ghost small" href="${esc(item.cta_href)}">${esc(item.cta_label || 'Learn more')}</a>` : '';
    const img = item.image_url ? `<img class="img" loading="lazy" src="${esc(item.image_url)}" alt="${esc(item.title || 'Rosie Dazzlers content block')}" onerror="this.style.display='none'">` : '';
    return `<article class="card content-block-card" data-content-block-card><div class="kicker">${esc(item.content_type || 'Update')}</div>${img}<h3>${esc(item.title || 'Rosie Dazzlers update')}</h3>${item.summary ? `<p class="muted">${esc(item.summary)}</p>` : ''}${item.body ? `<p>${esc(item.body)}</p>` : ''}${cta}</article>`;
  }
  async function renderMount(mount){
    const placement = normalize(mount.dataset.contentPlacement || mount.dataset.placement || 'all');
    const type = normalize(mount.dataset.contentType || mount.dataset.type || 'all');
    const limit = Math.max(1, Math.min(12, Number(mount.dataset.limit || 6) || 6));
    mount.innerHTML = mount.dataset.loadingText ? `<div class="notice">${esc(mount.dataset.loadingText)}</div>` : '';
    try{
      const params = new URLSearchParams({ placement, content_type:type });
      const res = await fetch(`/api/public_content_blocks?${params.toString()}`, { cache:'no-store' });
      const data = await res.json().catch(function(){return null;});
      const items = Array.isArray(data && data.items) ? data.items.slice(0, limit) : [];
      if(!items.length){ mount.hidden = true; return; }
      const heading = mount.dataset.heading ? `<h2>${esc(mount.dataset.heading)}</h2>` : '';
      const intro = mount.dataset.intro ? `<p class="muted">${esc(mount.dataset.intro)}</p>` : '';
      mount.hidden = false;
      mount.innerHTML = `${heading}${intro}<div class="grid cards" style="margin-top:12px">${items.map(blockCard).join('')}</div>`;
    }catch(err){ mount.hidden = true; }
  }
  function boot(){ document.querySelectorAll('[data-content-blocks]').forEach(renderMount); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
