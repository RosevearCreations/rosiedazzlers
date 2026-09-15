// Build 404 — Error Recovery, Weak-Connection UX & Reliability Hardening.
// Convenience only: server state remains authoritative. Mutations are never queued or replayed automatically.
(function attachReliabilityRecovery(globalScope) {
  'use strict';

  const SAFE_READ_METHODS = new Set(['GET', 'HEAD']);
  const SENSITIVE_NAME = /(password|passcode|card|cvc|cvv|payment|secret|token|authorization|cookie|stripe|paypal)/i;
  const DEFAULT_DRAFT_MAX_AGE_MS = 6 * 60 * 60 * 1000;

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function connectionSnapshot() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
    const effectiveType = String(connection?.effectiveType || '').toLowerCase();
    const weak = navigator.onLine !== false && (connection?.saveData === true || ['slow-2g', '2g'].includes(effectiveType));
    return {
      online: navigator.onLine !== false,
      weak,
      effectiveType: effectiveType || null,
      saveData: connection?.saveData === true
    };
  }

  function ensureNetworkNotice() {
    let node = document.querySelector('[data-rd-network-status]');
    if (node) return node;
    node = document.createElement('div');
    node.setAttribute('data-rd-network-status', 'true');
    node.setAttribute('role', 'status');
    node.setAttribute('aria-live', 'polite');
    node.className = 'notice warn';
    node.style.cssText = 'display:none;position:sticky;top:0;z-index:1000;margin:0;padding:10px 14px;text-align:center';
    const host = document.body || document.documentElement;
    host.prepend(node);
    return node;
  }

  function renderNetworkState() {
    const node = ensureNetworkNotice();
    const state = connectionSnapshot();
    if (!state.online) {
      node.textContent = 'You appear to be offline. Your locally safe in-progress details may remain in this tab, but nothing is accepted until the server confirms it.';
      node.style.display = 'block';
      node.className = 'notice warn';
    } else if (state.weak) {
      node.textContent = 'Your connection appears limited. Reads may take longer; do not assume a booking, payment, upload, or other business action succeeded until the server confirms it.';
      node.style.display = 'block';
      node.className = 'notice warn';
    } else {
      node.style.display = 'none';
      node.textContent = '';
    }
    globalScope.dispatchEvent(new CustomEvent('rd:connection-state', { detail: state }));
    return state;
  }

  function installConnectionUX() {
    if (globalScope.__rdReliability404ConnectionInstalled) return;
    globalScope.__rdReliability404ConnectionInstalled = true;
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
    globalScope.addEventListener('online', renderNetworkState);
    globalScope.addEventListener('offline', renderNetworkState);
    connection?.addEventListener?.('change', renderNetworkState);
    renderNetworkState();
  }

  async function safeRead(input, init = {}, options = {}) {
    const method = String(init?.method || (typeof input !== 'string' ? input?.method : 'GET') || 'GET').toUpperCase();
    if (!SAFE_READ_METHODS.has(method)) {
      throw new TypeError('Build 404 safeRead only permits GET/HEAD. Mutations must use their canonical server-authoritative path.');
    }
    const attempts = Math.max(1, Math.min(3, Number(options.attempts || 2)));
    const timeoutMs = Math.max(1000, Math.min(20000, Number(options.timeoutMs || 8000)));
    let lastError = null;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort('read-timeout'), timeoutMs);
      try {
        const response = await fetch(input, { ...init, method, signal: controller.signal });
        if (response.ok || response.status < 500 || attempt === attempts) return response;
        lastError = new Error(`Read failed with HTTP ${response.status}`);
      } catch (error) {
        lastError = error;
        if (attempt === attempts || navigator.onLine === false) throw error;
      } finally {
        clearTimeout(timer);
      }
      await sleep(Math.min(1200, 250 * (2 ** (attempt - 1))));
    }
    throw lastError || new Error('Read failed');
  }

  function safeSessionGet(key) {
    try { return sessionStorage.getItem(key); } catch { return null; }
  }

  function safeSessionSet(key, value) {
    try { sessionStorage.setItem(key, value); return true; } catch { return false; }
  }

  function safeSessionRemove(key) {
    try { sessionStorage.removeItem(key); } catch {}
  }

  function createProtectedDraft({ key, root = document, fieldNames = [], maxAgeMs = DEFAULT_DRAFT_MAX_AGE_MS } = {}) {
    const storageKey = String(key || '').trim();
    if (!storageKey) throw new TypeError('A draft key is required.');
    const allowedNames = [...new Set(fieldNames.map((value) => String(value || '').trim()).filter(Boolean))]
      .filter((name) => !SENSITIVE_NAME.test(name));

    function capture() {
      const values = {};
      allowedNames.forEach((name) => {
        const node = root.querySelector(`[name="${CSS.escape(name)}"],#${CSS.escape(name)}`);
        if (!node || SENSITIVE_NAME.test(String(node.type || '')) || node.type === 'file') return;
        if (node.type === 'checkbox' || node.type === 'radio') values[name] = Boolean(node.checked);
        else values[name] = String(node.value ?? '');
      });
      return { version: 404, saved_at: Date.now(), values, accepted: false };
    }

    function save() {
      return safeSessionSet(storageKey, JSON.stringify(capture()));
    }

    function restore() {
      let draft = null;
      try { draft = JSON.parse(safeSessionGet(storageKey) || 'null'); } catch {}
      if (!draft || !Number.isFinite(Number(draft.saved_at)) || Date.now() - Number(draft.saved_at) > maxAgeMs) {
        safeSessionRemove(storageKey);
        return { restored: false, stale_review_required: false };
      }
      Object.entries(draft.values || {}).forEach(([name, value]) => {
        if (!allowedNames.includes(name) || SENSITIVE_NAME.test(name)) return;
        const node = root.querySelector(`[name="${CSS.escape(name)}"],#${CSS.escape(name)}`);
        if (!node || node.type === 'file') return;
        if (node.type === 'checkbox' || node.type === 'radio') node.checked = Boolean(value);
        else node.value = String(value ?? '');
        node.dispatchEvent(new Event('change', { bubbles: true }));
      });
      return { restored: true, stale_review_required: true, saved_at: Number(draft.saved_at) };
    }

    return { save, restore, clear: () => safeSessionRemove(storageKey), capture, fieldNames: allowedNames.slice() };
  }

  async function withSubmitLock(control, operation) {
    if (!control || typeof operation !== 'function') throw new TypeError('Submit control and operation are required.');
    if (control.dataset.rdSubmitLocked === '1') return { ignored_duplicate_submit: true };
    control.dataset.rdSubmitLocked = '1';
    const priorDisabled = Boolean(control.disabled);
    control.disabled = true;
    try {
      return await operation();
    } finally {
      delete control.dataset.rdSubmitLocked;
      control.disabled = priorDisabled;
    }
  }

  function createUploadState({ host, retry } = {}) {
    if (!host) throw new TypeError('Upload state host is required.');
    let retryButton = null;
    function paint(state, message) {
      host.dataset.uploadState = state;
      host.setAttribute('role', 'status');
      host.textContent = message;
      if (state === 'failed' && typeof retry === 'function') {
        retryButton = document.createElement('button');
        retryButton.type = 'button';
        retryButton.className = 'btn ghost small';
        retryButton.textContent = 'Retry upload';
        retryButton.addEventListener('click', () => retry());
        host.append(' ', retryButton);
      }
    }
    return {
      progress(percent) { paint('uploading', `Uploading… ${Math.max(0, Math.min(100, Math.round(Number(percent) || 0)))}%`); },
      failed(message = 'Upload failed. Nothing has been accepted yet.') { paint('failed', message); },
      complete(message = 'Upload confirmed by the server.') { paint('complete', message); }
    };
  }

  function labelPartialResults(host, { partial = false, reason = '' } = {}) {
    if (!host) return;
    host.dataset.partialResults = partial ? 'true' : 'false';
    if (!partial) return;
    const note = document.createElement('p');
    note.className = 'mini notice warn';
    note.setAttribute('data-rd-partial-results-note', 'true');
    note.textContent = `Partial results only${reason ? ` — ${reason}` : ''}. Complete evidence was not available, so this view must not be treated as complete.`;
    host.prepend(note);
  }

  const api = {
    connectionSnapshot,
    installConnectionUX,
    safeRead,
    createProtectedDraft,
    withSubmitLock,
    createUploadState,
    labelPartialResults
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installConnectionUX, { once: true });
  else installConnectionUX();

  globalScope.RDReliability404 = api;
})(window);
