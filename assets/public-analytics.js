// Build 262 — CPU-safe browser analytics.
// Events are batched so ordinary browsing does not create one Worker invocation per click/scroll event.
(function attachRosieAnalytics(globalScope) {
  'use strict';
  const API = '/api/analytics/ingest';
  const STORAGE = {
    visitor: 'rosie_analytics_visitor_id',
    session: 'rosie_analytics_session_id',
    cart: 'rosie_analytics_last_cart',
    maxScroll: 'rosie_analytics_max_scroll'
  };
  const FAILURE_UNTIL_KEY = 'rosie_analytics_disabled_until';
  const FAILURE_BACKOFF_MS = 10 * 60 * 1000;
  const FLUSH_DELAY_MS = 20000;
  const MAX_QUEUE = 8;
  const MAX_BATCH = 12;
  const state = { pageStartedAt: Date.now(), started: false, lastTrackedScroll: 0, queue: [], flushTimer: null, flushing: false, failureCount: 0 };

  function uuid() {
    if (globalScope.crypto?.randomUUID) return globalScope.crypto.randomUUID();
    if (globalScope.crypto?.getRandomValues) {
      const bytes = new Uint8Array(16);
      globalScope.crypto.getRandomValues(bytes);
      return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
    }
    return `${Date.now().toString(36)}-analytics`;
  }
  function safeLocal(key) { try { return localStorage.getItem(key); } catch { return null; } }
  function setLocal(key, value) { try { localStorage.setItem(key, value); } catch {} }
  function getOrCreate(key, rotateHours) {
    try {
      const existing = localStorage.getItem(key);
      const startedAt = Number(localStorage.getItem(`${key}:at`) || 0);
      if (existing && (!rotateHours || (Date.now() - startedAt) < rotateHours * 3600000)) return existing;
      const value = uuid();
      localStorage.setItem(key, value);
      localStorage.setItem(`${key}:at`, String(Date.now()));
      return value;
    } catch { return uuid(); }
  }
  function analyticsTemporarilyDisabled() { return Number(safeLocal(FAILURE_UNTIL_KEY) || 0) > Date.now(); }
  function tripCircuit() {
    state.failureCount += 1;
    const multiplier = Math.min(6, Math.max(1, state.failureCount));
    setLocal(FAILURE_UNTIL_KEY, String(Date.now() + FAILURE_BACKOFF_MS * multiplier));
  }
  function clearCircuit() { state.failureCount = 0; setLocal(FAILURE_UNTIL_KEY, '0'); }
  function registryMeta(eventType) {
    const events = globalScope.RosiePublicSiteSettings?.analytics_event_registry?.events;
    if (!Array.isArray(events)) return {};
    const item = events.find((event) => String(event?.key || '').trim() === eventType && event?.is_active !== false);
    return item ? { event_label: item.label || eventType, event_category: item.category || '' } : {};
  }
  function getViewport() { return `${globalScope.innerWidth || 0}x${globalScope.innerHeight || 0}`; }
  function basicPayload(payload = {}) {
    return { viewport: getViewport(), path: location.pathname, search: location.search, ...payload };
  }
  function buildEvent(eventType, payload = {}, extra = {}) {
    return {
      visitor_id: getOrCreate(STORAGE.visitor, 24 * 365 * 5),
      session_id: getOrCreate(STORAGE.session, 12),
      event_type: String(eventType || 'page_view').slice(0, 80),
      page_path: location.pathname + location.search,
      page_title: document.title || '',
      referrer: document.referrer || '',
      locale: navigator.language || '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
      screen: `${globalScope.screen?.width || 0}x${globalScope.screen?.height || 0}`,
      source: new URLSearchParams(location.search).get('utm_source') || '',
      campaign: new URLSearchParams(location.search).get('utm_campaign') || '',
      payload: basicPayload({ ...registryMeta(eventType), ...payload }),
      created_at: new Date().toISOString(),
      ...extra
    };
  }
  function scheduleFlush(delay = FLUSH_DELAY_MS) {
    if (state.flushTimer || state.flushing || analyticsTemporarilyDisabled()) return;
    state.flushTimer = setTimeout(() => { state.flushTimer = null; flush().catch(() => {}); }, delay);
  }
  async function flush({ keepalive = false } = {}) {
    if (state.flushing || !state.queue.length || analyticsTemporarilyDisabled()) return;
    state.flushing = true;
    const batch = state.queue.splice(0, MAX_BATCH);
    try {
      const response = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: batch }),
        keepalive,
        cache: 'no-store'
      });
      if (response.status === 429 || response.status >= 500) {
        // Telemetry is expendable; do not retry the same batch during an incident.
        tripCircuit();
      } else if (response.ok) {
        clearCircuit();
      }
    } catch {
      tripCircuit();
    } finally {
      state.flushing = false;
      if (state.queue.length && !analyticsTemporarilyDisabled()) scheduleFlush(5000);
    }
  }
  function queue(eventType, payload = {}, extra = {}, { immediate = false } = {}) {
    if (analyticsTemporarilyDisabled()) return Promise.resolve();
    state.queue.push(buildEvent(eventType, payload, extra));
    if (state.queue.length > MAX_BATCH * 2) state.queue.splice(0, state.queue.length - MAX_BATCH * 2);
    if (immediate || state.queue.length >= MAX_QUEUE) return flush({ keepalive: immediate });
    scheduleFlush();
    return Promise.resolve();
  }
  function getCartSnapshot() {
    for (const key of ['rosie_cart', 'rosie_gift_cart', 'gift_cart', 'cart']) {
      const raw = safeLocal(key);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) return { key, item_count: parsed.length };
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length) return { key, item_count: Array.isArray(parsed.items) ? parsed.items.length : Object.keys(parsed).length };
      } catch { return { key, item_count: 1 }; }
    }
    return null;
  }
  function maybeTrackCart() {
    const snapshot = getCartSnapshot();
    const now = JSON.stringify(snapshot || null);
    if (now === safeLocal(STORAGE.cart)) return;
    setLocal(STORAGE.cart, now);
    if (snapshot) queue('cart_snapshot', snapshot);
  }
  function classifyScroll() {
    const doc = document.documentElement;
    const maxScrollable = Math.max(1, (doc.scrollHeight || 0) - (globalScope.innerHeight || 0));
    return Math.min(100, Math.max(0, Math.round(((globalScope.scrollY || doc.scrollTop || 0) / maxScrollable) * 100)));
  }
  function maybeTrackScroll() {
    const pct = classifyScroll();
    const bucket = pct >= 100 ? 100 : pct >= 75 ? 75 : pct >= 50 ? 50 : pct >= 25 ? 25 : 0;
    if (!bucket || bucket <= state.lastTrackedScroll) return;
    state.lastTrackedScroll = bucket;
    setLocal(STORAGE.maxScroll, String(bucket));
    queue('scroll_depth', { percent: bucket });
  }
  function attachInteractions() {
    document.addEventListener('click', (event) => {
      const target = event.target?.closest?.('a,button,[data-analytics-label]');
      if (!target) return;
      const text = (target.getAttribute('data-analytics-label') || target.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 120);
      const href = target.getAttribute?.('href') || '';
      queue('ui_click', { target_tag: target.tagName || '', target_text: text, href: href || null, id: target.id || null });
    }, { passive: true });
    document.addEventListener('submit', (event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      queue('form_submit', { form_id: form.id || null, form_action: form.getAttribute('action') || null, form_method: (form.getAttribute('method') || 'get').toLowerCase() }, {}, { immediate: true });
    }, true);
  }
  function start() {
    if (state.started) return;
    state.started = true;
    queue('page_view', { path: location.pathname, search: location.search });
    maybeTrackCart();
    attachInteractions();
    globalScope.addEventListener('scroll', maybeTrackScroll, { passive: true });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        queue('page_exit', { duration_ms: Date.now() - state.pageStartedAt, max_scroll_percent: state.lastTrackedScroll || Number(safeLocal(STORAGE.maxScroll) || 0) || 0 }, {}, { immediate: true });
      } else {
        state.pageStartedAt = Date.now();
      }
    });
    globalScope.addEventListener('pagehide', () => {
      queue('page_exit', { duration_ms: Date.now() - state.pageStartedAt, max_scroll_percent: state.lastTrackedScroll || 0 }, {}, { immediate: true });
    });
    // Build 262 deliberately removes the old analytics heartbeat interval.
    // Page exits and explicit conversion events provide engagement evidence without background Worker traffic.
  }

  globalScope.RosieAnalytics = {
    start,
    flush,
    track(eventType, payload = {}, extra = {}) { return queue(eventType, payload, extra); },
    trackCheckout(stateName, payload = {}) { return queue('checkout_progress', payload, { checkout_state: stateName || '' }, { immediate: true }); },
    trackCart(payload = {}) { return queue('cart_snapshot', payload); }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})(window);

// Historical Build 261 release token: 120000 heartbeat interval removed by Build 262.
