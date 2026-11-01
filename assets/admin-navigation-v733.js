/* Build 733 — local-only Admin navigation, saved views, shortcuts and contextual help.
   All navigation candidates are rechecked against AdminAuth.canAccessPage. */
(function (root) {
  'use strict';

  const CARD_IDS = Object.freeze(['bookings', 'operations', 'finance', 'staff', 'marketing', 'it']);
  const LIMIT = 8;
  const MAX_FAVORITES = 80;
  const DEFAULT = Object.freeze({ category: 'all', cardFilter: 'all', density: 'comfortable', favoritesOnly: false, favorites: [], order: CARD_IDS });
  const HELP = Object.freeze({
    bookings: 'Owner queue totals come from Today Needs Attention; they are not booking counts. Open the queue to act on individual records.',
    operations: 'Quote follow-ups come from the existing workflow report. Fallback coverage is marked partial; use Workflow for the full detail.',
    finance: 'The payment warning count uses the bounded recent webhook summary. Do not interpret an unavailable table as zero.',
    staff: 'The dashboard does not read the staff roster. Open the Staff workspace to review current staff and permissions.',
    marketing: 'Unique visitors come from the last 14 days of the analytics report; this is not a count of leads or conversions.',
    it: 'Reported reliability items sum five categories, and do not replace the exact-SHA Production release gate.'
  });

  function unique(list, allow, maximum) {
    const seen = new Set();
    return (Array.isArray(list) ? list : []).filter(value => {
      if (typeof value !== 'string' || seen.has(value) || !allow(value) || seen.size >= maximum) return false;
      seen.add(value);
      return true;
    });
  }

  function safeHref(value) {
    if (typeof value !== 'string' || value.length > 160 || !/^\/[a-z0-9/_-]+(?:\.html)?(?:#[a-z0-9_-]+)?$/i.test(value)) return null;
    return value;
  }

  function routeKey(href) {
    const route = safeHref(href)?.split('#')[0].replace(/\/$/, '');
    if (!route) return null;
    if (/^\/app\/(detailer|operations|admin|it|finance|daip|socials)\/?$/.test(route)) return 'app-' + route.split('/')[2];
    if (route === '/admin' || route === '/admin.html') return 'admin';
    const match = /^\/(admin-[a-z0-9-]+)(?:\.html)?$/.exec(route);
    return match?.[1] || null;
  }

  function routeAllowed(href, auth) {
    const key = routeKey(href);
    return Boolean(key && auth && typeof auth.canAccessPage === 'function' && auth.canAccessPage(key) === true);
  }

  function cleanLayout(value) {
    const object = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    const category = ['all', 'customers', 'operations', 'finance', 'media', 'systems'].includes(object.category) ? object.category : 'all';
    const cardFilter = ['all', 'attention', 'unverified'].includes(object.cardFilter) ? object.cardFilter : 'all';
    const density = object.density === 'compact' ? 'compact' : 'comfortable';
    const favorites = unique(object.favorites, href => Boolean(safeHref(href)), MAX_FAVORITES);
    const order = unique(object.order, id => CARD_IDS.includes(id), CARD_IDS.length);
    return { category, cardFilter, density, favoritesOnly: object.favoritesOnly === true, favorites, order: [...order, ...CARD_IDS.filter(id => !order.includes(id))] };
  }

  function cleanStored(raw) {
    const object = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    const profiles = [];
    const seen = new Set();
    for (const row of Array.isArray(object.profiles) ? object.profiles.slice(0, LIMIT * 2) : []) {
      const name = typeof row?.name === 'string' ? row.name.trim().slice(0, 36) : '';
      if (!name || seen.has(name.toLowerCase()) || profiles.length >= LIMIT) continue;
      seen.add(name.toLowerCase());
      profiles.push({ name, layout: cleanLayout(row.layout) });
    }
    return { profiles, current: cleanLayout(object.current), selected: profiles.some(row => row.name === object.selected) ? object.selected : '' };
  }

  function scope(actor) {
    if (!actor) return null;
    const id = String(actor.id || actor.staff_id || actor.user_id || actor.email || '').trim().toLowerCase();
    if (!id || id.length > 180) return null;
    // Namespace only; this hash is not an authentication or secrecy boundary.
    let hash = 2166136261;
    for (const letter of id) { hash ^= letter.charCodeAt(0); hash = Math.imul(hash, 16777619); }
    return 'rosie_admin_views_v733_' + (hash >>> 0).toString(16) + '_' + String(actor.role_code || 'staff').slice(0, 32);
  }

  function element(tag, className, label) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (label !== undefined) node.textContent = label;
    return node;
  }

  function mount({ actor, auth } = {}) {
    if (typeof document === 'undefined' || !actor || !auth || !auth.canAccessPage?.('admin')) return;
    const host = document.getElementById('adminNavigation733');
    const toolCards = [...document.querySelectorAll('#adminWorkspaceCards > article.card')];
    const commandCards = [...document.querySelectorAll('#adminCommandCards732 > article.ac732-card')];
    const toolSearch = document.getElementById('adminToolSearch');
    const category = document.getElementById('adminToolCategory');
    const cardFilter = document.getElementById('adminCommandFilter732');
    if (!host || !toolCards.length || !commandCards.length || !category || !cardFilter) return;
    if (host._navCleanup733) host._navCleanup733();

    const profileName = document.getElementById('adminProfileName733');
    const profileSelect = document.getElementById('adminProfileSelect733');
    const densitySelect = document.getElementById('adminDensity733');
    const favoritesOnlyButton = document.getElementById('adminFavoritesOnly733');
    const status = document.getElementById('adminNavigationStatus733');
    const palette = document.getElementById('adminPalette733');
    const paletteInput = document.getElementById('adminPaletteSearch733');
    const paletteResults = document.getElementById('adminPaletteResults733');
    const helpDialog = document.getElementById('adminHelp733');
    const storageKey = scope(actor);
    let storageAvailable = Boolean(storageKey);
    let saved = cleanStored(null);
    try { if (storageKey) saved = cleanStored(JSON.parse(root.localStorage.getItem(storageKey) || 'null')); }
    catch { storageAvailable = false; }
    let layout = cleanLayout(saved.current);
    let favorites = new Set(layout.favorites.filter(href => routeAllowed(href, auth)));
    let paletteEntries = [];
    let activeIndex = 0;
    let favoriteOnly = layout.favoritesOnly;
    const cleanups = [];

    function notice(message) { if (status) status.textContent = message; }
    function saveLocal() {
      layout.favorites = [...favorites];
      saved.current = cleanLayout(layout);
      if (!storageAvailable || !storageKey) { notice('Local saving unavailable; changes remain in this tab only.'); return false; }
      try { root.localStorage.setItem(storageKey, JSON.stringify(saved)); return true; }
      catch { storageAvailable = false; notice('Local saving is blocked in this browser.'); return false; }
    }
    function isFavorite(href) { return favorites.has(href); }
    function toolHref(card) {
      const links = [...card.querySelectorAll('a[href]')];
      return links.map(a => a.getAttribute('href')).find(href => routeAllowed(href, auth)) || null;
    }
    const toolHrefs = new Map(toolCards.map(card => [card, toolHref(card)]));
    const domainHrefs = new Map(commandCards.map(card => [card, card.querySelector('.ac732-link')?.getAttribute('href') || null]));

    function synchronize() {
      favoritesOnlyButton?.setAttribute('aria-pressed', String(favoriteOnly));
      if (favoritesOnlyButton) favoritesOnlyButton.textContent = favoriteOnly ? '★ Favorites only' : '☆ All tools';
      document.getElementById('adminCommandCards732')?.classList.toggle('ac733-compact', layout.density === 'compact');
      document.getElementById('adminWorkspaceCards')?.classList.toggle('ac733-compact', layout.density === 'compact');
      if (densitySelect) densitySelect.value = layout.density;
      for (const card of [...toolCards, ...commandCards]) {
        const href = toolHrefs.get(card) || domainHrefs.get(card);
        const btn = card.querySelector('.ac733-favorite');
        if (btn) {
          const selected = Boolean(href && isFavorite(href));
          btn.setAttribute('aria-pressed', String(selected));
          btn.setAttribute('aria-label', (selected ? 'Remove from favorites: ' : 'Add to favorites: ') + (card.querySelector('h3')?.textContent || 'Workspace'));
          btn.textContent = selected ? '★' : '☆';
        }
      }
      for (const card of commandCards) card.dataset.favoriteHidden733 = String(Boolean(favoriteOnly && !isFavorite(domainHrefs.get(card))));
      root.dispatchEvent(new Event('rosie:admin-filter-733'));
      cardFilter.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function restoreOrder() {
      const grid = document.getElementById('adminCommandCards732');
      if (!grid) return;
      for (const id of layout.order) {
        const card = commandCards.find(card => card.dataset.card === id);
        if (card) grid.appendChild(card);
      }
    }

    function apply(next) {
      layout = cleanLayout(next);
      favorites = new Set(layout.favorites.filter(href => routeAllowed(href, auth)));
      favoriteOnly = layout.favoritesOnly;
      category.value = layout.category;
      cardFilter.value = layout.cardFilter;
      if (toolSearch) toolSearch.value = ''; // Never persist a potentially private free-text search.
      category.dispatchEvent(new Event('change', { bubbles: true }));
      restoreOrder();
      synchronize();
    }

    function options() {
      if (!profileSelect) return;
      profileSelect.replaceChildren(new Option('Choose a saved view', ''));
      for (const row of saved.profiles) profileSelect.add(new Option(row.name, row.name));
      profileSelect.value = saved.selected || '';
    }

    function starFor(card, href) {
      if (!href) return;
      const star = element('button', 'ac733-favorite');
      star.type = 'button';
      star.title = 'Favorite this workspace';
      star.addEventListener('click', () => {
        if (favorites.has(href)) favorites.delete(href);
        else if (favorites.size < MAX_FAVORITES) favorites.add(href);
        else { notice('Favorites limit reached. Remove one before adding another.'); return; }
        layout.favoritesOnly = favoriteOnly;
        saveLocal(); synchronize();
      });
      const h3 = card.querySelector('h3');
      if (h3) h3.after(star);
      else card.prepend(star);
    }

    function helpFor(card, description, key) {
      const button = element('button', 'ac733-help-trigger', 'ⓘ');
      button.type = 'button';
      button.setAttribute('aria-label', 'Help: ' + (card.querySelector('h3')?.textContent || 'Workspace'));
      button.setAttribute('aria-expanded', 'false');
      const descriptionId = 'ac733-help-' + key;
      const body = element('p', 'ac733-help-body', description);
      body.id = descriptionId;
      body.hidden = true;
      button.setAttribute('aria-controls', descriptionId);
      button.addEventListener('click', () => {
        body.hidden = !body.hidden;
        button.setAttribute('aria-expanded', String(!body.hidden));
      });
      card.append(button, body);
    }

    for (const [index, card] of commandCards.entries()) {
      const id = card.dataset.card;
      starFor(card, domainHrefs.get(card));
      helpFor(card, HELP[id] || 'Open the existing role-authorized workspace for complete records.', 'command-' + index);
      const tools = element('div', 'ac733-order-actions');
      for (const [direction, label] of [[-1, 'Move up'], [1, 'Move down']]) {
        const button = element('button', '', direction === -1 ? '↑' : '↓');
        button.type = 'button'; button.title = label;
        button.setAttribute('aria-label', label + ': ' + card.querySelector('h3')?.textContent);
        button.addEventListener('click', () => {
          const current = layout.order.indexOf(id), target = current + direction;
          if (current < 0 || target < 0 || target >= layout.order.length) return;
          [layout.order[current], layout.order[target]] = [layout.order[target], layout.order[current]];
          restoreOrder(); saveLocal(); notice('Card order updated locally. Save a named view to keep this arrangement as a preset.');
        });
        tools.append(button);
      }
      card.append(tools);
    }
    for (const [index, card] of toolCards.entries()) {
      starFor(card, toolHrefs.get(card));
      const description = card.querySelector('p')?.textContent?.trim() || 'Open this existing workspace for details.';
      helpFor(card, description + ' This link follows normal staff permissions; this help control does not change data.', 'tool-' + index);
    }

    const navigation = [];
    const seenRoutes = new Set();
    const allCandidates = [
      ...document.querySelectorAll('#navLinks a[href], .admin-quick-actions a[href], #adminWorkspaceCards a[href], #adminCommandCards732 a[href], .rd-command-rail a[href]')
    ];
    for (const link of allCandidates) {
      const href = link.getAttribute('href')?.split('?')[0];
      if (!href || !routeAllowed(href, auth) || seenRoutes.has(href)) continue;
      seenRoutes.add(href);
      navigation.push({ href, label: link.closest('article')?.querySelector('h3')?.textContent?.trim() || link.textContent.trim() || routeKey(href) });
    }

    function drawResults() {
      if (!paletteResults || !paletteInput) return;
      const query = paletteInput.value.trim().toLowerCase();
      paletteEntries = navigation.filter(item => !query || (item.label + ' ' + item.href).toLowerCase().includes(query))
        .sort((a, b) => Number(isFavorite(b.href)) - Number(isFavorite(a.href))).slice(0, 30);
      activeIndex = Math.min(activeIndex, Math.max(0, paletteEntries.length - 1));
      paletteResults.replaceChildren();
      if (!paletteEntries.length) { paletteResults.append(element('p', 'ac733-empty', 'No authorized routes match your search.')); return; }
      paletteEntries.forEach((item, index) => {
        const result = element('a', 'ac733-result', item.label);
        result.href = item.href;
        result.id = 'adminPaletteOption733-' + index;
        result.setAttribute('role', 'option');
        result.setAttribute('aria-selected', String(index === activeIndex));
        result.append(element('small', '', item.href + (isFavorite(item.href) ? ' · ★ Favorite' : '')));
        result.addEventListener('mousemove', () => { activeIndex = index; selectActive(); });
        paletteResults.append(result);
      });
      selectActive();
    }
    function selectActive() {
      const options = [...paletteResults.querySelectorAll('a[role="option"]')];
      options.forEach((option, i) => option.setAttribute('aria-selected', String(i === activeIndex)));
      if (paletteInput) paletteInput.setAttribute('aria-activedescendant', options[activeIndex]?.id || '');
    }
    function openPalette() {
      if (!palette?.showModal || palette.open) return;
      palette.showModal();
      activeIndex = 0; paletteInput.value = ''; drawResults(); paletteInput.focus();
    }
    function keydown(event) {
      const editing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName) || document.activeElement?.isContentEditable;
      if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === 'k') {
        event.preventDefault(); openPalette(); return;
      }
      if (event.key === '?' && !editing && !event.ctrlKey && !event.altKey && !event.metaKey && !palette?.open) {
        event.preventDefault(); helpDialog?.showModal?.(); return;
      }
      if (event.altKey && event.shiftKey && event.key.toLowerCase() === 'f') {
        event.preventDefault(); favoriteOnly = layout.favoritesOnly = !favoriteOnly; saveLocal(); synchronize();
      }
    }
    const onPaletteKeys = event => {
      if (event.key === 'Escape') {
        palette?.close?.(); document.getElementById('adminOpenPalette733')?.focus();
      } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault(); activeIndex = (activeIndex + (event.key === 'ArrowDown' ? 1 : -1) + paletteEntries.length) % (paletteEntries.length || 1); selectActive();
      } else if (event.key === 'Enter' && paletteEntries[activeIndex]) {
        event.preventDefault(); root.location.assign(paletteEntries[activeIndex].href);
      }
    };
    root.addEventListener('keydown', keydown);
    cleanups.push(() => root.removeEventListener('keydown', keydown));
    paletteInput?.addEventListener('input', () => { activeIndex = 0; drawResults(); });
    paletteInput?.addEventListener('keydown', onPaletteKeys);
    document.getElementById('adminOpenPalette733')?.addEventListener('click', openPalette);
    document.getElementById('adminOpenHelp733')?.addEventListener('click', () => helpDialog?.showModal?.());
    document.querySelectorAll('[data-close-dialog733]').forEach(button => button.addEventListener('click', () => button.closest('dialog')?.close()));
    favoritesOnlyButton?.addEventListener('click', () => { favoriteOnly = layout.favoritesOnly = !favoriteOnly; saveLocal(); synchronize(); });
    densitySelect?.addEventListener('change', () => { layout.density = densitySelect.value; saveLocal(); synchronize(); });
    category.addEventListener('change', () => { layout.category = category.value; saveLocal(); });
    cardFilter.addEventListener('change', () => { layout.cardFilter = cardFilter.value; saveLocal(); });

    document.getElementById('adminSaveProfile733')?.addEventListener('click', () => {
      if (!storageAvailable) { notice('Local saved views are unavailable on this browser or staff session.'); return; }
      const name = profileName?.value?.trim()?.slice(0, 36) || '';
      if (!name) { notice('Enter a short name for this view. Do not include customer information.'); profileName?.focus(); return; }
      const existing = saved.profiles.findIndex(row => row.name.toLowerCase() === name.toLowerCase());
      if (existing === -1 && saved.profiles.length >= LIMIT) { notice('Eight saved views maximum; delete one before adding another.'); return; }
      layout.category = category.value; layout.cardFilter = cardFilter.value; layout.favoritesOnly = favoriteOnly;
      const row = { name, layout: cleanLayout({ ...layout, favorites: [...favorites] }) };
      if (existing >= 0) saved.profiles[existing] = row;
      else saved.profiles.push(row);
      saved.selected = name;
      saveLocal(); options(); notice('Saved “' + name + '” on this browser, for this staff account only.');
    });
    profileSelect?.addEventListener('change', () => {
      const row = saved.profiles.find(item => item.name === profileSelect.value);
      if (!row) return;
      saved.selected = row.name; profileName.value = row.name; apply(row.layout); saveLocal(); notice('Restored “' + row.name + '”.');
    });
    document.getElementById('adminDeleteProfile733')?.addEventListener('click', () => {
      if (!saved.selected) { notice('Select a saved view to delete.'); return; }
      const removed = saved.selected;
      saved.profiles = saved.profiles.filter(row => row.name !== removed);
      saved.selected = ''; saveLocal(); options(); notice('Deleted local saved view “' + removed + '”. Other views remain.');
    });
    document.getElementById('adminResetView733')?.addEventListener('click', () => {
      saved.selected = ''; if (profileName) profileName.value = '';
      apply(DEFAULT); saveLocal(); options(); notice('View reset. Named saved views remain available.');
    });
    document.getElementById('adminExportViews733')?.addEventListener('click', () => {
      // Export allowlisted, route-only layout data. Never export user/session/source content.
      const data = JSON.stringify({ schema: 'rosie-admin-views-733', version: 1, profiles: saved.profiles }, null, 2);
      const anchor = element('a');
      anchor.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(data);
      anchor.download = 'rosie-admin-views-733.json';
      document.body.append(anchor); anchor.click(); anchor.remove(); notice('Exported saved layout profiles only; no customer data.');
    });

    root.RosieAdminNavigation733 = Object.freeze({ mount, cleanLayout, cleanStored, routeAllowed, routeKey, isFavorite: href => favorites.has(href), get favoritesOnly() { return favoriteOnly; } });
    options(); apply(layout);
    if (saved.selected) { const row = saved.profiles.find(item => item.name === saved.selected); if (row) { apply(row.layout); profileName.value = row.name; } }
    host._navCleanup733 = () => cleanups.forEach(fn => fn());
    notice(storageAvailable ? 'Personal layouts remain on this browser only. Search text and source data are never saved.' : 'Layout saving unavailable; navigation and shortcuts remain active.');
  }

  const api = Object.freeze({ mount, cleanLayout, cleanStored, routeAllowed, routeKey, scope });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root && typeof root === 'object') root.RosieAdminNavigation733 = api;
})(typeof window !== 'undefined' ? window : globalThis);
