// Build 384 — Finance Cockpit & Month-End UX.
// Read-only convergence over existing Build 374–375 financial authorities.
// No automatic posting, close, booking mutation, customer charge, or provider mutation is permitted here.
(function (globalScope) {
  'use strict';

  const endpoint = '/api/admin/accounting_month_end_closure';
  const money = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' });

  function byId(id) { return document.getElementById(id); }
  function text(el, value) { if (el) el.textContent = value == null ? '—' : String(value); }
  function cad(value) { return money.format(Number(value || 0)); }

  function setState(message, state) {
    const el = byId('financeCockpitStatus');
    if (!el) return;
    el.hidden = !message;
    el.className = `notice${state ? ` ${state}` : ''}`;
    el.textContent = message || '';
  }

  function make(tag, className, value) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (value != null) el.textContent = String(value);
    return el;
  }

  function renderBlockers(closure) {
    const mount = byId('financeBlockers');
    if (!mount) return;
    mount.replaceChildren();
    const blockers = Array.isArray(closure?.blockers) ? closure.blockers : [];
    if (!blockers.length) {
      const ok = make('div', 'finance-empty', 'No computed blockers. This is a close-ready candidate only; operator approval is still required.');
      mount.appendChild(ok);
      return;
    }
    const list = make('ul', 'finance-blocker-list');
    blockers.forEach((item) => list.appendChild(make('li', '', item)));
    mount.appendChild(list);
  }

  function addEvidence(mount, label, primary, secondary, state) {
    const card = make('article', `finance-evidence-card ${state || 'review'}`);
    card.appendChild(make('span', 'mini', label));
    card.appendChild(make('strong', '', primary));
    card.appendChild(make('span', 'mini', secondary));
    mount.appendChild(card);
  }

  function renderEvidence(closure) {
    const mount = byId('financeEvidence');
    if (!mount) return;
    mount.replaceChildren();
    const e = closure?.evidence || {};
    const booking = e.booking_finance || {};
    const provider = e.provider_payments || {};
    const bank = e.bank_reconciliation || {};
    const hst = e.hst_support || {};
    const receivables = e.receivables || {};
    const payables = e.payables || {};

    addEvidence(
      mount,
      'Booking finance evidence',
      booking.available ? `${booking.event_count || 0} events` : 'Unavailable',
      booking.available ? `Net service collections ${cad(booking.net_service_collections_cad)}` : 'Evidence must be available before close readiness can pass.',
      booking.available ? 'ok' : 'blocked'
    );
    addEvidence(
      mount,
      'Provider payments',
      provider.available ? `${provider.paid_request_count || 0} paid requests` : 'Unavailable',
      provider.available ? `${cad(provider.paid_amount_cad)} • settlement review ${provider.settlement_review_ready ? 'ready' : 'required'}` : 'Provider evidence unavailable.',
      provider.available && provider.settlement_review_ready ? 'ok' : 'review'
    );
    addEvidence(
      mount,
      'Bank reconciliation',
      bank.available ? (bank.ready ? 'Reconciled' : 'Review required') : 'Unavailable',
      bank.available ? `Difference ${cad(bank.difference_cad)} • book balance ${cad(bank.ending_book_balance_cad)}` : 'Cash-account reconciliation evidence unavailable.',
      bank.available && bank.ready ? 'ok' : 'blocked'
    );
    addEvidence(
      mount,
      'HST support',
      hst.available ? (hst.remittance_reviewed ? 'Reviewed' : 'Review required') : 'Unavailable',
      'Uses the retained accounting tax report; this cockpit does not post a remittance.',
      hst.available && hst.remittance_reviewed ? 'ok' : 'review'
    );
    addEvidence(
      mount,
      'Receivables',
      receivables.available ? (receivables.reviewed ? 'Reviewed' : 'Review required') : 'Unavailable',
      'Aging remains owned by the accounting authority.',
      receivables.available && receivables.reviewed ? 'ok' : 'review'
    );
    addEvidence(
      mount,
      'Payables',
      payables.available ? `${payables.open_count || 0} open` : 'Unavailable',
      payables.available ? `${cad(payables.open_balance_cad)} open balance • ${payables.reviewed ? 'reviewed' : 'review required'}` : 'Payables evidence unavailable.',
      payables.available && payables.reviewed ? 'ok' : 'review'
    );
  }

  function renderContract(closure) {
    const mount = byId('financeContract');
    if (!mount) return;
    mount.replaceChildren();
    const contract = closure?.contract || {};
    const rules = [
      ['Read-only snapshot', contract.read_only === true],
      ['Automatic close blocked', contract.automatic_close === false],
      ['Accounting posting blocked', contract.accounting_posting === false],
      ['Booking mutation blocked', contract.booking_mutation === false],
      ['Customer charge blocked', contract.customer_charge === false],
      ['Provider mutation blocked', contract.payment_provider_mutation === false],
      ['Operator approval required', contract.operator_approval_required === true]
    ];
    rules.forEach(([label, passed]) => {
      const chip = make('span', `finance-contract-chip ${passed ? 'ok' : 'blocked'}`, `${passed ? '✓' : '!' } ${label}`);
      mount.appendChild(chip);
    });
  }

  function renderClosure(closure) {
    const ready = closure?.close_ready_candidate === true;
    const status = byId('financeReadinessState');
    if (status) {
      status.className = `finance-readiness ${ready ? 'ok' : 'review'}`;
      status.textContent = ready ? 'CLOSE-READY CANDIDATE' : 'REVIEW REQUIRED';
    }
    text(byId('financeReadinessPeriod'), `${String(closure?.year || '').padStart(4, '0')}-${String(closure?.month || '').padStart(2, '0')}`);
    text(byId('financeReadinessGenerated'), closure?.generated_at ? `Snapshot ${new Date(closure.generated_at).toLocaleString()}` : 'Snapshot time unavailable');
    renderBlockers(closure);
    renderEvidence(closure);
    renderContract(closure);
    byId('financeReadinessPanel').hidden = false;
  }

  async function loadReadiness() {
    const month = Number(byId('financeMonth')?.value || 0);
    const year = Number(byId('financeYear')?.value || 0);
    if (!month || !year) {
      setState('Choose a valid month and year.', 'bad');
      return;
    }
    const button = byId('financeLoadReadiness');
    if (button) button.disabled = true;
    setState('Loading the retained Build 375 month-end closure snapshot…');
    try {
      const response = await fetch(`${endpoint}?month=${encodeURIComponent(month)}&year=${encodeURIComponent(year)}`, {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
        cache: 'no-store'
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok || !data?.closure) {
        throw new Error(data?.error || `Month-end readiness request failed (${response.status}).`);
      }
      renderClosure(data.closure);
      setState('Finance readiness loaded. No accounting, close, booking, customer-charge, or provider mutation was performed.', 'ok');
    } catch (error) {
      byId('financeReadinessPanel').hidden = true;
      setState(error?.message || 'Finance readiness is unavailable. Treat the month as not ready until evidence can be loaded.', 'bad');
    } finally {
      if (button) button.disabled = false;
    }
  }

  function seedPeriod() {
    const now = new Date();
    const month = byId('financeMonth');
    const year = byId('financeYear');
    if (month) month.value = String(now.getMonth() + 1);
    if (year) year.value = String(now.getFullYear());
  }

  async function boot() {
    await globalScope.AdminShell.boot({
      pageKey: 'app-finance',
      onReady: async ({ actor }) => {
        const resolver = globalScope.RosieAppCore.ModuleResolver;
        const flagState = await resolver.loadRuntimeFlags();
        if (!resolver.canAccess('finance', actor)) {
          location.replace('/app/');
          return;
        }
        resolver.remember('finance');
        globalScope.RosieAppCore.ModuleNavigation?.renderHome?.('finance');
        seedPeriod();
        const runtime = byId('moduleRuntimeStatus');
        if (runtime) {
          runtime.className = 'notice ok';
          runtime.textContent = `Finance is available. Build 384 loads no finance dataset until you choose “Load month-end readiness”. Module flags: ${flagState.source}.`;
        }
        byId('financeLoadReadiness')?.addEventListener('click', loadReadiness);
      }
    });
  }

  boot().catch((error) => setState(error?.message || 'Could not start the Finance cockpit.', 'bad'));
})(window);
