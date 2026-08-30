// Build 274 — shared contextual help runtime for authenticated Rosie screens.
(function attachRosieContextHelp(globalScope) {
  if (globalScope.RosieContextHelp) return;

  const EDITABLE_SELECTOR = [
    'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="image"])',
    'select',
    'textarea',
    '[contenteditable="true"]'
  ].join(',');
  let observer = null;
  let lastTrigger = null;

  function catalogue() {
    return globalScope.RosieHelpCatalog || { pages: {}, fields: {}, aliases: {}, defaultPage: {} };
  }

  function pageKey(explicit) {
    if (explicit) return String(explicit).trim();
    const body = document.body;
    const declared = body?.dataset?.helpPage || body?.dataset?.page || document.documentElement?.dataset?.helpPage;
    if (declared) return String(declared).trim();
    const leaf = String(location.pathname || '').split('/').filter(Boolean).pop() || 'workspace';
    return leaf.replace(/\.html$/i, '');
  }

  function pageEntry(key) {
    const c = catalogue();
    return c.pages?.[key] || { ...(c.defaultPage || {}), title: document.querySelector('h1')?.textContent?.trim() || document.title || key };
  }

  function normalizedKey(value) {
    return String(value || '').trim().replace(/^#/, '').replace(/[\s.-]+/g, '_').toLowerCase();
  }

  function fieldKey(field) {
    return normalizedKey(field.dataset.helpKey || field.name || field.id || field.getAttribute('aria-label') || 'field');
  }

  function fieldLabel(field) {
    const explicit = field.dataset.helpLabel || field.getAttribute('aria-label');
    if (explicit) return String(explicit).trim();
    if (field.id) {
      const label = document.querySelector(`label[for="${cssEscape(field.id)}"]`);
      if (label) return cleanLabel(label.textContent);
    }
    const wrappingLabel = field.closest('label');
    if (wrappingLabel) return cleanLabel(wrappingLabel.textContent);
    if (field.placeholder) return String(field.placeholder).trim();
    return humanize(field.name || field.id || field.getAttribute('data-help-key') || 'field');
  }

  function cssEscape(value) {
    if (globalScope.CSS?.escape) return globalScope.CSS.escape(value);
    return String(value).replace(/([ #;?%&,.+*~\':"!^$[\]()=>|/@])/g, '\\$1');
  }

  function cleanLabel(value) {
    return String(value || '').replace(/ⓘ/g, '').replace(/\s+/g, ' ').trim().replace(/[:*]+$/, '').trim();
  }

  function humanize(value) {
    const text = String(value || 'Field').replace(/[_-]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
    return text || 'Field';
  }

  function inferGenericKey(key, label) {
    const c = catalogue();
    const aliases = c.aliases || {};
    if (aliases[key]) return aliases[key];
    const combined = `${key} ${String(label || '').toLowerCase()}`;
    const rules = [
      ['email', /email/], ['phone', /(phone|mobile|sms)/], ['price', /(price|amount|rate|fee|charge)/],
      ['cost', /\bcost\b/], ['quantity', /(quantity|\bqty\b|on hand|stock count)/], ['status', /status|state/],
      ['description', /(description|summary|details|copy)/], ['notes', /notes?|comment/], ['title', /title|heading/], ['name', /name/]
    ];
    return rules.find(([, pattern]) => pattern.test(combined))?.[0] || null;
  }

  function fieldEntry(field, key) {
    const c = catalogue();
    const page = pageEntry(key);
    const fKey = fieldKey(field);
    const label = fieldLabel(field);
    const direct = page.fields?.[fKey] || c.fields?.[fKey];
    if (direct) return { ...direct, title: direct.title || label };
    const genericKey = inferGenericKey(fKey, label);
    if (genericKey && c.fields?.[genericKey]) return { ...c.fields[genericKey], title: label || c.fields[genericKey].title };
    return fallbackField(field, page, label);
  }

  function fallbackField(field, page, label) {
    const lower = String(label || 'this value').toLowerCase();
    const formatBits = [];
    const type = field.getAttribute('type');
    if (type && type !== 'text') formatBits.push(`Input type: ${type}.`);
    if (field.hasAttribute('required')) formatBits.push('This field is required by the current form.');
    if (field.getAttribute('min') !== null) formatBits.push(`Minimum: ${field.getAttribute('min')}.`);
    if (field.getAttribute('max') !== null) formatBits.push(`Maximum: ${field.getAttribute('max')}.`);
    if (field.getAttribute('maxlength') !== null) formatBits.push(`Maximum length: ${field.getAttribute('maxlength')} characters.`);
    return {
      title: label || 'Field help',
      what: `${label || 'This field'} is an editable value on ${page.title || 'this Rosie workspace'}.`,
      changes: `Changing it changes the saved ${lower} used by this screen when its normal save/apply action completes.`,
      why: `Rosie needs this value as part of the ${page.title || 'current'} workflow so the associated record is complete and understandable.`,
      source: "Use the authoritative source for the record being edited (for example the customer, booking, approved business rule, supplier record or provider console). If this is an integration credential, do not paste it into routine settings; use I.T. Connections for the correct storage instructions.",
      format: formatBits.join(' ') || null,
      security: /password|secret|token|credential|api.?key/i.test(`${field.name || ''} ${field.id || ''} ${label || ''}`) ? "Treat this as sensitive. Verify the I.T. catalogue before entering anything; routine browser forms should not collect server secrets." : null
    };
  }

  function ensureDialog() {
    let dialog = document.getElementById('rosieContextHelpDialog');
    if (dialog) return dialog;
    dialog = document.createElement('div');
    dialog.id = 'rosieContextHelpDialog';
    dialog.className = 'rosie-help-dialog';
    dialog.hidden = true;
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'rosieContextHelpTitle');
    dialog.innerHTML = `
      <div class="rosie-help-dialog__panel" role="document">
        <div class="rosie-help-dialog__header">
          <div><div class="kicker">Context help</div><h2 id="rosieContextHelpTitle">Help</h2></div>
          <button type="button" class="rosie-help-dialog__close" data-help-close aria-label="Close help">Close</button>
        </div>
        <div data-help-content></div>
      </div>`;
    document.body.appendChild(dialog);
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog || event.target.closest('[data-help-close]')) closeDialog();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !dialog.hidden) closeDialog();
    });
    return dialog;
  }

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, (m) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[m]));
  }

  function section(title, value) {
    if (!value) return '';
    if (Array.isArray(value)) {
      if (!value.length) return '';
      return `<section class="rosie-help-dialog__section"><h3>${esc(title)}</h3><ul>${value.map((item) => `<li>${esc(item)}</li>`).join('')}</ul></section>`;
    }
    return `<section class="rosie-help-dialog__section"><h3>${esc(title)}</h3><p>${esc(value)}</p></section>`;
  }

  function openDialog(entry, trigger) {
    const dialog = ensureDialog();
    lastTrigger = trigger || document.activeElement;
    dialog.querySelector('#rosieContextHelpTitle').textContent = entry.title || 'Help';
    dialog.querySelector('[data-help-content]').innerHTML = [
      section('What this is', entry.what),
      section('What it changes', entry.changes),
      section('Why Rosie needs it', entry.why),
      section('Where the value comes from', entry.source),
      section('Expected format', entry.format),
      section('Operational / accounting implications', entry.implications),
      section('Security', entry.security),
      section('Related records / systems', entry.related),
      entry.integration === false ? '' : '<a class="rosie-help-dialog__it-link" href="/admin-integrations.html">Open I.T. Connections →</a>'
    ].join('');
    dialog.hidden = false;
    document.body.classList.add('rosie-help-dialog-open');
    dialog.querySelector('[data-help-close]')?.focus();
  }

  function closeDialog() {
    const dialog = document.getElementById('rosieContextHelpDialog');
    if (!dialog || dialog.hidden) return;
    dialog.hidden = true;
    document.body.classList.remove('rosie-help-dialog-open');
    if (lastTrigger && typeof lastTrigger.focus === 'function') lastTrigger.focus();
  }

  function attachPageHelp(key) {
    if (document.querySelector('[data-rosie-page-help]')) return;
    const heading = document.querySelector('main h1, h1');
    if (!heading) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'rosie-help-page-button';
    button.dataset.rosiePageHelp = 'true';
    button.setAttribute('aria-label', `Help for ${heading.textContent.trim() || 'this page'}`);
    button.textContent = 'ⓘ Page help';
    button.addEventListener('click', () => openDialog(pageEntry(key), button));
    heading.insertAdjacentElement('afterend', button);
  }

  function shouldIgnore(field) {
    if (!field || field.dataset.helpIgnore === 'true' || field.closest('[data-help-ignore="true"]')) return true;
    if (field.disabled || field.getAttribute('aria-hidden') === 'true') return true;
    return false;
  }

  function attachFieldHelp(field, key) {
    if (shouldIgnore(field) || field.dataset.rosieHelpBound === 'true') return;
    field.dataset.rosieHelpBound = 'true';
    const label = fieldLabel(field);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'rosie-help-field-button';
    button.dataset.helpFor = fieldKey(field);
    button.setAttribute('aria-label', `Help for ${label || 'this field'}`);
    button.title = `Help: ${label || 'field'}`;
    button.textContent = 'ⓘ';
    button.addEventListener('click', () => openDialog(fieldEntry(field, key), button));
    const type = String(field.getAttribute('type') || '').toLowerCase();
    const target = (type === 'checkbox' || type === 'radio') && field.closest('label') ? field.closest('label') : field;
    target.insertAdjacentElement('afterend', button);
  }

  function refresh(options = {}) {
    const key = pageKey(options.pageKey);
    document.documentElement.dataset.helpPage = key;
    attachPageHelp(key);
    document.querySelectorAll(EDITABLE_SELECTOR).forEach((field) => attachFieldHelp(field, key));
  }

  function init(options = {}) {
    refresh(options);
    if (!observer && document.body) {
      observer = new MutationObserver(() => refresh(options));
      observer.observe(document.body, { childList: true, subtree: true });
    }
    return { ok: true, pageKey: pageKey(options.pageKey), catalogueVersion: catalogue().version || null };
  }

  globalScope.RosieContextHelp = { init, refresh, open: openDialog, close: closeDialog };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => init(), { once: true });
  else init();
})(window);
