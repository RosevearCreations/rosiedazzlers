// Build 341 — Universal, toggleable public-page editor for authenticated RosieDazzlers administrators.
// Progressive enhancement only: source HTML remains the reset authority and interactive forms are never replaced.

const state = {
  page: normalizePagePath(window.location.pathname),
  targets: new Map(),
  originals: new Map(),
  overrides: {},
  media: [],
  editable: false,
  selectedKey: null,
  panel: null,
  toggle: null,
  observer: null,
  refreshTimer: null
};

const TEXT_SELECTOR = 'h1,h2,h3,h4,h5,h6,p,li,figcaption,blockquote,small,span,strong,em,a';
const BLOCKED_ANCESTOR = 'form,button,input,select,textarea,option,[contenteditable="true"],[data-page-editor-ui],iframe,video,audio,canvas';

export async function initUniversalPageEditor(root = document) {
  if (!state.page || state.page.startsWith('/admin') || state.page.startsWith('/api')) return;
  const main = root.querySelector('main');
  if (!main) return;

  registerTargets(main);
  await loadPublicOverrides();
  applyOverrides();
  watchDynamicContent(main);
  void probeAdminEditor();
}

async function loadPublicOverrides() {
  try {
    const res = await fetch(`/api/public_page_editor?page=${encodeURIComponent(state.page)}`, {
      cache: 'no-store',
      credentials: 'same-origin'
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.ok && data.overrides && typeof data.overrides === 'object') {
      state.overrides = data.overrides;
    }
  } catch {}
}

async function probeAdminEditor() {
  try {
    const res = await fetch(`/api/admin/page_editor?page=${encodeURIComponent(state.page)}`, {
      cache: 'no-store',
      credentials: 'same-origin'
    });
    if (!res.ok) return;
    const data = await res.json().catch(() => null);
    if (!data?.ok || data.can_edit !== true) return;
    state.media = Array.isArray(data.media) ? data.media : [];
    if (data.overrides && typeof data.overrides === 'object') state.overrides = data.overrides;
    applyOverrides();
    installEditorUi();
  } catch {}
}

function registerTargets(main) {
  main.querySelectorAll('img').forEach((node) => registerTarget(node, 'image', main));
  main.querySelectorAll(TEXT_SELECTOR).forEach((node) => {
    if (node.tagName === 'A') registerTarget(node, 'link', main);
    else registerTarget(node, 'text', main);
  });
}

function registerTarget(node, kind, main) {
  if (!(node instanceof HTMLElement)) return;
  if (!isEligible(node, kind)) return;
  const key = makeContentKey(node, kind, main);
  if (!key) return;

  node.setAttribute('data-page-editor-key', key);
  node.setAttribute('data-page-editor-kind', kind);
  state.targets.set(key, node);
  if (!state.originals.has(key)) state.originals.set(key, snapshotNode(node, kind));
  if (state.editable) node.setAttribute('data-page-editor-editable', 'true');
}

function isEligible(node, kind) {
  if (node.closest(BLOCKED_ANCESTOR)) return false;
  if (node.hasAttribute('data-page-editor-ignore')) return false;
  if (node.closest('[data-page-editor-ignore]')) return false;
  if (kind === 'image') return !!String(node.getAttribute('src') || '').trim();
  if (node.children.length > 0) return false;
  const text = String(node.textContent || '').trim();
  return text.length > 0;
}

function makeContentKey(node, kind, main) {
  const explicit = cleanKeyPart(node.getAttribute('data-page-edit-key'));
  if (explicit) return `${kind}:explicit:${explicit}`;

  if (kind === 'image') {
    const photoTarget = cleanKeyPart(node.getAttribute('data-photo-image-target'));
    if (photoTarget) return `image:target:${photoTarget}`;
  }

  const id = cleanKeyPart(node.id);
  if (id) return `${kind}:#${id}`;

  const path = domPath(node, main);
  return path ? `${kind}:${path}` : '';
}

function domPath(node, main) {
  const parts = [];
  let current = node;
  while (current && current !== main && current.parentElement) {
    const tag = current.tagName.toLowerCase();
    const siblings = Array.from(current.parentElement.children).filter((child) => child.tagName === current.tagName);
    const index = Math.max(1, siblings.indexOf(current) + 1);
    parts.unshift(`${tag}:nth-of-type(${index})`);
    current = current.parentElement;
  }
  return current === main ? `main>${parts.join('>')}` : '';
}

function cleanKeyPart(value) {
  return String(value || '').trim().replace(/[^a-zA-Z0-9_.:-]+/g, '-').slice(0, 140);
}

function snapshotNode(node, kind) {
  if (kind === 'image') {
    return {
      kind,
      src: node.getAttribute('src') || '',
      alt: node.getAttribute('alt') || '',
      title: node.getAttribute('title') || ''
    };
  }
  if (kind === 'link') {
    return { kind, text: node.textContent || '', href: node.getAttribute('href') || '' };
  }
  return { kind, text: node.textContent || '' };
}

function applyOverrides() {
  for (const [key, override] of Object.entries(state.overrides || {})) {
    const node = state.targets.get(key);
    if (!node || !override || typeof override !== 'object') continue;
    applyOverrideToNode(node, override);
  }
}

function applyOverrideToNode(node, override) {
  if (override.kind === 'image' && node.tagName === 'IMG') {
    if (override.src) node.setAttribute('src', override.src);
    node.setAttribute('alt', String(override.alt || ''));
    if (override.title) node.setAttribute('title', String(override.title));
    else node.removeAttribute('title');
    return;
  }
  if (override.kind === 'link' && node.tagName === 'A') {
    node.textContent = String(override.text ?? '');
    if (override.href) node.setAttribute('href', String(override.href));
    return;
  }
  if (override.kind === 'text') node.textContent = String(override.text ?? '');
}

function watchDynamicContent(main) {
  if (state.observer) return;
  state.observer = new MutationObserver((mutations) => {
    if (!mutations.some((mutation) => mutation.addedNodes?.length)) return;
    clearTimeout(state.refreshTimer);
    state.refreshTimer = setTimeout(() => {
      registerTargets(main);
      applyOverrides();
    }, 80);
  });
  state.observer.observe(main, { childList: true, subtree: true });
}

function installEditorUi() {
  if (state.toggle) return;
  installStyles();

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'rosie-page-editor-toggle';
  toggle.setAttribute('data-page-editor-ui', 'true');
  toggle.textContent = 'Edit page';
  toggle.addEventListener('click', () => setEditMode(!state.editable));
  document.body.appendChild(toggle);
  state.toggle = toggle;

  document.addEventListener('click', interceptEditorClick, true);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && state.editable) {
      if (state.selectedKey) closePanel();
      else setEditMode(false);
    }
  });
}

function setEditMode(enabled) {
  state.editable = enabled === true;
  document.body.classList.toggle('rosie-page-edit-mode', state.editable);
  if (state.toggle) state.toggle.textContent = state.editable ? 'Finish editing' : 'Edit page';
  for (const node of state.targets.values()) {
    if (state.editable) node.setAttribute('data-page-editor-editable', 'true');
    else node.removeAttribute('data-page-editor-editable');
  }
  if (!state.editable) closePanel();
}

function interceptEditorClick(event) {
  if (!state.editable) return;
  if (event.target instanceof Element && event.target.closest('[data-page-editor-ui]')) return;
  const node = event.target instanceof Element ? event.target.closest('[data-page-editor-key]') : null;
  if (!node || !state.targets.has(node.getAttribute('data-page-editor-key'))) return;
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  openPanel(node.getAttribute('data-page-editor-key'));
}

function openPanel(key) {
  const node = state.targets.get(key);
  if (!node) return;
  closePanel();
  state.selectedKey = key;
  node.setAttribute('data-page-editor-selected', 'true');

  const panel = document.createElement('aside');
  panel.className = 'rosie-page-editor-panel';
  panel.setAttribute('data-page-editor-ui', 'true');
  panel.setAttribute('aria-label', 'Page editor');
  state.panel = panel;

  const header = document.createElement('div');
  header.className = 'rosie-page-editor-header';
  const titleWrap = document.createElement('div');
  const eyebrow = document.createElement('div');
  eyebrow.className = 'rosie-page-editor-eyebrow';
  eyebrow.textContent = 'Page editor';
  const title = document.createElement('strong');
  title.textContent = describeTarget(node);
  titleWrap.append(eyebrow, title);
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'rosie-page-editor-close';
  close.textContent = '×';
  close.setAttribute('aria-label', 'Close page editor');
  close.addEventListener('click', closePanel);
  header.append(titleWrap, close);
  panel.appendChild(header);

  const body = document.createElement('div');
  body.className = 'rosie-page-editor-body';
  const kind = node.getAttribute('data-page-editor-kind');
  const current = state.overrides[key] || snapshotNode(node, kind);
  if (kind === 'image') renderImageEditor(body, node, current);
  else if (kind === 'link') renderLinkEditor(body, node, current);
  else renderTextEditor(body, node, current);
  panel.appendChild(body);
  document.body.appendChild(panel);
}

function renderTextEditor(container, node, current) {
  const textarea = labeledTextarea(container, 'Text', String(current.text ?? node.textContent ?? ''));
  addActionRow(container, async () => {
    await saveOverride('text', { text: textarea.value });
  });
}

function renderLinkEditor(container, node, current) {
  const textarea = labeledTextarea(container, 'Link text', String(current.text ?? node.textContent ?? ''));
  const href = labeledInput(container, 'Link destination', String(current.href ?? node.getAttribute('href') ?? ''));
  const help = document.createElement('p');
  help.className = 'rosie-page-editor-help';
  help.textContent = 'Use a local /page path, https URL, mailto: or tel: destination.';
  container.appendChild(help);
  addActionRow(container, async () => {
    await saveOverride('link', { text: textarea.value, href: href.value });
  });
}

function renderImageEditor(container, node, current) {
  let selectedSrc = String(current.src || node.getAttribute('src') || '');
  const preview = document.createElement('img');
  preview.className = 'rosie-page-editor-preview';
  preview.src = selectedSrc;
  preview.alt = '';
  container.appendChild(preview);

  const alt = labeledInput(container, 'Alt text', String(current.alt ?? node.getAttribute('alt') ?? ''));
  const title = labeledInput(container, 'Image title (optional)', String(current.title ?? node.getAttribute('title') ?? ''));
  const search = labeledInput(container, 'Find an approved image', '');
  search.placeholder = 'Search photo name, group or caption';

  const grid = document.createElement('div');
  grid.className = 'rosie-page-editor-media-grid';
  container.appendChild(grid);

  const renderMedia = () => {
    grid.replaceChildren();
    const query = search.value.trim().toLowerCase();
    const rows = state.media.filter((row) => {
      if (!query) return true;
      return [row.label, row.alt_text, row.caption, row.group_key, row.media_key]
        .some((value) => String(value || '').toLowerCase().includes(query));
    }).slice(0, 80);

    if (!rows.length) {
      const empty = document.createElement('p');
      empty.className = 'rosie-page-editor-help';
      empty.textContent = 'No approved images match that search.';
      grid.appendChild(empty);
      return;
    }

    rows.forEach((row) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'rosie-page-editor-media-option';
      button.classList.toggle('is-selected', row.media_url === selectedSrc);
      const image = document.createElement('img');
      image.src = row.media_url;
      image.alt = row.alt_text || row.label || '';
      image.loading = 'lazy';
      const label = document.createElement('span');
      label.textContent = row.label || row.media_key || 'Approved image';
      button.append(image, label);
      button.addEventListener('click', () => {
        selectedSrc = row.media_url;
        preview.src = selectedSrc;
        if (!alt.value.trim()) alt.value = row.alt_text || row.label || '';
        Array.from(grid.querySelectorAll('.rosie-page-editor-media-option')).forEach((item) => item.classList.remove('is-selected'));
        button.classList.add('is-selected');
      });
      grid.appendChild(button);
    });
  };

  search.addEventListener('input', renderMedia);
  renderMedia();

  addActionRow(container, async () => {
    await saveOverride('image', { src: selectedSrc, alt: alt.value, title: title.value });
  });
}

function labeledTextarea(container, labelText, value) {
  const label = document.createElement('label');
  label.className = 'rosie-page-editor-field';
  const caption = document.createElement('span');
  caption.textContent = labelText;
  const control = document.createElement('textarea');
  control.rows = 8;
  control.value = value;
  label.append(caption, control);
  container.appendChild(label);
  return control;
}

function labeledInput(container, labelText, value) {
  const label = document.createElement('label');
  label.className = 'rosie-page-editor-field';
  const caption = document.createElement('span');
  caption.textContent = labelText;
  const control = document.createElement('input');
  control.type = 'text';
  control.value = value;
  label.append(caption, control);
  container.appendChild(label);
  return control;
}

function addActionRow(container, onSave) {
  const status = document.createElement('div');
  status.className = 'rosie-page-editor-status';
  const row = document.createElement('div');
  row.className = 'rosie-page-editor-actions';
  const reset = document.createElement('button');
  reset.type = 'button';
  reset.className = 'rosie-page-editor-secondary';
  reset.textContent = 'Reset to source';
  reset.addEventListener('click', async () => {
    setStatus(status, 'Resetting…');
    try {
      await resetOverride();
      setStatus(status, 'Reset complete.');
    } catch (error) { setStatus(status, error?.message || 'Reset failed.', true); }
  });
  const save = document.createElement('button');
  save.type = 'button';
  save.className = 'rosie-page-editor-primary';
  save.textContent = 'Save change';
  save.addEventListener('click', async () => {
    save.disabled = true;
    setStatus(status, 'Saving…');
    try {
      await onSave();
      setStatus(status, 'Saved.');
    } catch (error) { setStatus(status, error?.message || 'Save failed.', true); }
    finally { save.disabled = false; }
  });
  row.append(reset, save);
  container.append(status, row);
}

async function saveOverride(kind, value) {
  const key = state.selectedKey;
  if (!key) throw new Error('No editable item is selected.');
  const res = await fetch('/api/admin/page_editor', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ page_path: state.page, content_key: key, kind, value })
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) throw new Error(data?.error || `Save failed (${res.status}).`);
  state.overrides[key] = data.override;
  const node = state.targets.get(key);
  if (node) applyOverrideToNode(node, data.override);
}

async function resetOverride() {
  const key = state.selectedKey;
  if (!key) throw new Error('No editable item is selected.');
  const res = await fetch(`/api/admin/page_editor?page=${encodeURIComponent(state.page)}&content_key=${encodeURIComponent(key)}`, {
    method: 'DELETE',
    credentials: 'same-origin'
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) throw new Error(data?.error || `Reset failed (${res.status}).`);
  delete state.overrides[key];
  restoreOriginal(key);
  const currentKey = key;
  closePanel();
  const node = state.targets.get(currentKey);
  if (node) openPanel(currentKey);
}

function restoreOriginal(key) {
  const node = state.targets.get(key);
  const original = state.originals.get(key);
  if (!node || !original) return;
  applyOverrideToNode(node, original);
}

function closePanel() {
  if (state.selectedKey) state.targets.get(state.selectedKey)?.removeAttribute('data-page-editor-selected');
  state.panel?.remove();
  state.panel = null;
  state.selectedKey = null;
}

function setStatus(node, message, error = false) {
  node.textContent = message;
  node.classList.toggle('is-error', error === true);
}

function describeTarget(node) {
  const kind = node.getAttribute('data-page-editor-kind') || 'content';
  const label = kind === 'image' ? (node.getAttribute('alt') || 'Image') : String(node.textContent || '').trim();
  return `${kind.charAt(0).toUpperCase()}${kind.slice(1)} · ${label.slice(0, 70) || 'Selected item'}`;
}

function installStyles() {
  if (document.getElementById('rosie-page-editor-styles')) return;
  const style = document.createElement('style');
  style.id = 'rosie-page-editor-styles';
  style.setAttribute('data-page-editor-ui', 'true');
  style.textContent = `
    .rosie-page-editor-toggle{position:fixed;right:18px;bottom:18px;z-index:2147483000;border:0;border-radius:999px;padding:12px 18px;background:#151515;color:#fff;font:700 14px/1.2 system-ui,sans-serif;box-shadow:0 8px 28px rgba(0,0,0,.28);cursor:pointer}
    .rosie-page-edit-mode [data-page-editor-editable="true"]{outline:2px dashed rgba(15,118,110,.72)!important;outline-offset:3px;cursor:pointer!important}
    .rosie-page-edit-mode [data-page-editor-editable="true"]:hover,.rosie-page-edit-mode [data-page-editor-selected="true"]{outline:3px solid #0f766e!important;outline-offset:4px}
    .rosie-page-editor-panel{position:fixed;right:0;top:0;bottom:0;width:min(430px,94vw);z-index:2147483100;background:#fff;color:#171717;box-shadow:-12px 0 36px rgba(0,0,0,.24);font:14px/1.45 system-ui,sans-serif;display:flex;flex-direction:column}
    .rosie-page-editor-header{display:flex;gap:16px;align-items:flex-start;justify-content:space-between;padding:18px 20px;border-bottom:1px solid #ddd;background:#f7f7f7}
    .rosie-page-editor-eyebrow{text-transform:uppercase;letter-spacing:.09em;font-size:11px;font-weight:800;color:#0f766e;margin-bottom:4px}.rosie-page-editor-close{border:0;background:transparent;font-size:30px;line-height:1;cursor:pointer;padding:0 4px}.rosie-page-editor-body{padding:18px 20px 28px;overflow:auto;flex:1}.rosie-page-editor-field{display:grid;gap:6px;margin-bottom:15px;font-weight:700}.rosie-page-editor-field textarea,.rosie-page-editor-field input{width:100%;box-sizing:border-box;border:1px solid #bbb;border-radius:9px;padding:10px 11px;font:400 14px/1.45 system-ui,sans-serif;color:#111;background:#fff}.rosie-page-editor-field textarea:focus,.rosie-page-editor-field input:focus{outline:3px solid rgba(15,118,110,.2);border-color:#0f766e}.rosie-page-editor-preview{width:100%;max-height:230px;object-fit:cover;border-radius:12px;margin-bottom:15px;background:#eee}.rosie-page-editor-media-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;max-height:330px;overflow:auto;margin:10px 0 16px}.rosie-page-editor-media-option{display:grid;gap:5px;border:2px solid transparent;border-radius:9px;padding:5px;background:#f5f5f5;color:#111;text-align:left;cursor:pointer}.rosie-page-editor-media-option.is-selected{border-color:#0f766e}.rosie-page-editor-media-option img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:6px}.rosie-page-editor-media-option span{font-size:11px;line-height:1.25}.rosie-page-editor-actions{display:flex;gap:9px;justify-content:flex-end;margin-top:14px}.rosie-page-editor-actions button{border-radius:9px;padding:10px 13px;font-weight:800;cursor:pointer}.rosie-page-editor-secondary{border:1px solid #999;background:#fff;color:#222}.rosie-page-editor-primary{border:1px solid #0f766e;background:#0f766e;color:#fff}.rosie-page-editor-help{font-size:12px;color:#555;margin:-8px 0 12px}.rosie-page-editor-status{min-height:20px;font-size:12px;color:#0f766e}.rosie-page-editor-status.is-error{color:#b42318}
    @media(max-width:640px){.rosie-page-editor-toggle{right:12px;bottom:12px}.rosie-page-editor-panel{width:100vw}.rosie-page-editor-media-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
  `;
  document.head.appendChild(style);
}

function normalizePagePath(value) {
  let page = String(value || '/').split('?')[0].split('#')[0].replace(/\/{2,}/g, '/');
  if (!page.startsWith('/')) page = `/${page}`;
  if (page.length > 1) page = page.replace(/\/+$/, '');
  return page || '/';
}
