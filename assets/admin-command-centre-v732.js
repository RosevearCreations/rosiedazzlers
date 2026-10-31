/* Build 732 — source-backed, fail-closed Admin command cards; no extra startup requests. */
(function (root) {
  'use strict';

  const CARDS = Object.freeze([
    { id: 'bookings', module: 'operations', title: 'Bookings & attention', eyebrow: 'Customer work', description: 'Prioritized owner work; open the queue for booking-specific actions.', source: 'today', sourceLabel: 'Today Needs Attention', metric: 'Owner queue items', href: '/admin-today.html', action: 'Open today’s queue' },
    { id: 'operations', module: 'operations', title: 'Operations', eyebrow: 'Work in motion', description: 'Quote follow-ups that need an operator review.', source: 'workflow', sourceLabel: 'Workflow Command Center', metric: 'Quote follow-ups due', href: '/admin-workflow.html', action: 'Open workflow' },
    { id: 'finance', module: 'finance', title: 'Finance', eyebrow: 'Payments', description: 'Failed or unverified payment webhooks for review.', source: 'payments', sourceLabel: 'Webhook warnings', metric: 'Webhook warnings', href: '/admin-payments.html', action: 'Review payments' },
    { id: 'staff', module: 'admin', title: 'Staff', eyebrow: 'Team & access', description: 'Roster and staff permissions remain in the Staff workspace.', source: null, sourceLabel: 'Roster not fetched here', metric: 'Verified staff count', href: '/admin-staff.html', action: 'Open staff roster' },
    { id: 'marketing', module: 'socials', title: 'Marketing', eyebrow: 'Audience', description: 'Unique visitors over the last 14 days; not leads or bookings.', source: 'analytics', sourceLabel: 'Analytics overview · 14 days', metric: 'Unique visitors · 14 days', href: '/admin-marketing.html', action: 'Open marketing' },
    { id: 'it', module: 'it', title: 'I.T. & reliability', eyebrow: 'Site health', description: 'Sum of five reported reliability issue categories; not a deployment health gate.', source: 'reliability', sourceLabel: 'Production reliability report', metric: 'Reported review items', href: '/admin-production.html', action: 'Open production checks' }
  ]);
  const CEILINGS = Object.freeze({
    admin: ['operations', 'finance', 'admin', 'socials', 'it'],
    senior_detailer: ['operations'], operations_manager: ['operations'],
    detailer: [], accountant: ['finance'], promoter: ['socials'], it_specialist: ['it']
  });
  const EXPECTED_SOURCES = Object.freeze(['today', 'workflow', 'payments', 'analytics', 'reliability']);

  function cardAllowed(card, actor, hasModuleAccess) {
    if (!card || !actor) return false;
    const role = actor.is_admin === true ? 'admin' : String(actor.role_code || '').toLowerCase();
    if (!(CEILINGS[role] || []).includes(card.module)) return false;
    if (typeof hasModuleAccess !== 'function') return false; // Authoritative client module policy required.
    return hasModuleAccess(card.module, actor) === true;
  }

  function count(value) {
    if (typeof value !== 'number' && (typeof value !== 'string' || value.trim() === '')) return null;
    const n = Number(value);
    return Number.isSafeInteger(n) && n >= 0 ? n : null;
  }

  function sourceState(kind, payload, receivedAt) {
    const checked = typeof receivedAt === 'string' && Number.isFinite(Date.parse(receivedAt)) ? receivedAt : null;
    const unavailable = (reason) => ({ status: 'unverified', value: null, reason, checked, sourceAt: null });
    if (!EXPECTED_SOURCES.includes(kind) || !payload || payload.ok === false) return unavailable('Source unavailable; no number inferred.');
    let value = null;
    let warning = false;
    if (kind === 'today') {
      value = count(payload.counts?.total);
      warning = Array.isArray(payload.warnings) && payload.warnings.length > 0;
    } else if (kind === 'workflow') {
      value = count(payload.metrics?.quote_followups_due);
      warning = payload.fallback_active !== false;
    } else if (kind === 'payments') {
      if (payload.table_ready !== true) return unavailable('Webhook table not verified; reported zero is not a clean result.');
      value = count(payload.warning_count);
    } else if (kind === 'analytics') {
      value = count(payload.summary?.unique_visitors);
    } else if (kind === 'reliability') {
      const fields = ['notification_failed', 'payment_links_missing', 'upload_sessions_needing_review', 'retention_due', 'unresolved_incidents'];
      const values = fields.map(key => count(payload.counts?.[key]));
      if (values.every(n => n !== null)) value = values.reduce((sum, n) => sum + n, 0);
      warning = Array.isArray(payload.warnings) && payload.warnings.length > 0;
    }
    if (value === null || !Number.isSafeInteger(value)) return unavailable('Valid source count not supplied.');
    if (warning) return { status: 'partial', value, reason: 'Source has fallback or coverage warnings; count may be incomplete.', checked, sourceAt: payload.generated_at || null };
    return { status: value > 0 ? 'attention' : 'clear', value, reason: null, checked, sourceAt: payload.generated_at || null };
  }

  function make(tag, className, label) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (label !== undefined) node.textContent = label;
    return node;
  }

  function formatChecked(result) {
    if (!result || !result.checked) return 'Not checked';
    const iso = result.sourceAt && Number.isFinite(Date.parse(result.sourceAt)) ? result.sourceAt : null;
    const date = new Date(iso || result.checked);
    const time = date.toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC', hour12: false });
    return (iso ? 'Source generated ' : 'Checked ') + time + ' UTC' + (iso ? '' : ' · source age unknown');
  }

  function mount({ actor, auth } = {}) {
    if (typeof document === 'undefined') return;
    const host = document.getElementById('adminCommandCards732');
    if (!host) return;
    const policy = auth && typeof auth.hasModuleAccess === 'function' ? auth.hasModuleAccess.bind(auth) : null;
    const cards = CARDS.filter(card => cardAllowed(card, actor, policy));
    const filter = document.getElementById('adminCommandFilter732');
    const status = document.getElementById('adminCommandStatus732');
    const refresh = document.getElementById('adminCommandRefresh732');
    const states = new Map();
    const rendered = new Map();
    host.replaceChildren();

    cards.forEach(card => {
      const article = make('article', 'ac732-card');
      article.dataset.card = card.id;
      const eyebrow = make('span', 'ac732-eyebrow', card.eyebrow);
      const title = make('h3', '', card.title);
      const description = make('p', 'ac732-description', card.description);
      const metric = make('div', 'ac732-metric');
      const value = make('strong', 'ac732-value', '—');
      const metricLabel = make('span', 'ac732-metric-label', card.metric);
      metric.append(value, metricLabel);
      const notice = make('p', 'ac732-notice', card.source ? 'Awaiting a verified report…' : 'No roster source read on this page. Open Staff for current records.');
      const foot = make('div', 'ac732-foot');
      const source = make('span', 'ac732-source', card.sourceLabel + ' · Not checked');
      const link = make('a', 'ac732-link', card.action);
      link.href = card.href;
      foot.append(source, link);
      article.append(eyebrow, title, description, metric, notice, foot);
      article.dataset.status = 'unverified';
      host.append(article);
      rendered.set(card.id, { article, value, notice, source });
    });

    function updateVisible() {
      let visible = 0;
      cards.forEach(card => {
        const state = states.get(card.source);
        const selected = filter ? filter.value : 'all';
        const show = selected === 'all' || (selected === 'attention' && (state?.status === 'attention' || state?.status === 'partial')) || (selected === 'unverified' && (!state || state.status === 'unverified' || state.status === 'partial'));
        rendered.get(card.id).article.hidden = !show;
        if (show) visible++;
      });
      if (status) status.textContent = visible === 0 ? 'No cards match this view.' : `${visible} of ${cards.length} role-available workspaces shown.`;
    }

    function receive(event) {
      const detail = event && event.detail;
      if (!detail || !EXPECTED_SOURCES.includes(detail.kind)) return;
      const next = sourceState(detail.kind, detail.payload, detail.receivedAt);
      states.set(detail.kind, next);
      cards.filter(card => card.source === detail.kind).forEach(card => {
        const item = rendered.get(card.id);
        item.value.textContent = next.value === null ? '—' : new Intl.NumberFormat('en-CA').format(next.value);
        item.article.dataset.status = next.status;
        item.notice.textContent = next.reason || (next.value === 0 ? 'No items reported in this source.' : 'Open the workspace to review current records.');
        item.source.textContent = card.sourceLabel + ' · ' + formatChecked(next);
      });
      updateVisible();
    }

    if (host._commandCleanup732) host._commandCleanup732();
    root.addEventListener('rosie:dashboard-source-732', receive);
    host._commandCleanup732 = () => root.removeEventListener('rosie:dashboard-source-732', receive);
    if (filter) filter.onchange = updateVisible;
    if (refresh) refresh.onclick = () => {
      if (refresh.disabled) return;
      refresh.disabled = true;
      refresh.textContent = 'Refreshing…';
      root.dispatchEvent(new CustomEvent('rosie:command-refresh-732', { detail: { done: () => {
        refresh.disabled = false;
        refresh.textContent = 'Refresh reports';
      } } }));
    };
    updateVisible();
  }

  const api = Object.freeze({ CARDS, cardAllowed, sourceState, mount });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root && typeof root === 'object') root.RosieAdminCommand732 = api;
})(typeof window !== 'undefined' ? window : globalThis);
