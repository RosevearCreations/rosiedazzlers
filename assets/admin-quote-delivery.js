// Build 362 — explicit quote-expiry bridge for Admin Leads delivery.
// No default validity period is invented: staff must choose a future date/time before delivery.
(function attachAdminQuoteDelivery(globalScope) {
  if (globalScope.RosieAdminQuoteDelivery) return;

  let pendingExpiryIso = null;
  const nativeFetch = globalScope.fetch.bind(globalScope);

  function setPageStatus(message, state) {
    const node = document.querySelector('[data-page-status]');
    if (!node) return;
    node.hidden = !message;
    node.textContent = message || '';
    node.dataset.state = state || '';
  }

  function enhance(root = document) {
    root.querySelectorAll?.('[data-draft-id]').forEach((draft) => {
      if (draft.dataset.quoteExpiryEnhanced === 'true') return;
      const button = draft.querySelector('[data-deliver-draft]');
      if (!button) return;
      draft.dataset.quoteExpiryEnhanced = 'true';
      const label = document.createElement('label');
      label.dataset.quoteExpiryLabel = 'true';
      label.textContent = 'Quote expires';
      const input = document.createElement('input');
      input.type = 'datetime-local';
      input.setAttribute('data-delivery-expiry', '');
      input.setAttribute('aria-label', 'Quote expiry date and time');
      input.required = true;
      label.appendChild(input);
      button.before(label);
    });
  }

  document.addEventListener('click', (event) => {
    const button = event.target?.closest?.('[data-deliver-draft]');
    if (!button) return;
    const draft = button.closest('[data-draft-id]');
    const input = draft?.querySelector('[data-delivery-expiry]');
    const raw = String(input?.value || '').trim();
    const parsed = raw ? Date.parse(raw) : NaN;
    if (!Number.isFinite(parsed) || parsed <= Date.now()) {
      pendingExpiryIso = null;
      event.preventDefault();
      event.stopImmediatePropagation();
      input?.focus();
      setPageStatus('Choose a future quote expiry date and time before preparing or sending the quote.', 'error');
      return;
    }
    pendingExpiryIso = new Date(parsed).toISOString();
  }, true);

  globalScope.fetch = function quoteExpiryAwareFetch(input, init = {}) {
    const url = typeof input === 'string' ? input : String(input?.url || '');
    if (!url.includes('/api/admin/quote_proposal_deliver') || !pendingExpiryIso || !init?.body) {
      return nativeFetch(input, init);
    }
    try {
      const body = JSON.parse(String(init.body));
      if (!body.expires_at && !body.terms_expires_at) body.expires_at = pendingExpiryIso;
      pendingExpiryIso = null;
      return nativeFetch(input, { ...init, body: JSON.stringify(body) });
    } catch {
      pendingExpiryIso = null;
      return nativeFetch(input, init);
    }
  };

  const observer = new MutationObserver(() => enhance(document));
  function start() {
    enhance(document);
    observer.observe(document.body, { childList: true, subtree: true });
  }
  if (document.body) start();
  else document.addEventListener('DOMContentLoaded', start, { once: true });

  globalScope.RosieAdminQuoteDelivery = { enhance };
})(window);
