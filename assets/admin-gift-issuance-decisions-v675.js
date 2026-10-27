(function () {
  const SESSION_ID = /^cs_(?:test|live)_[a-zA-Z0-9_-]{8,220}$/;
  const byId = (id) => document.getElementById(id);
  const send = (path, options) => window.AdminAuth?.fetchWithAuth
    ? window.AdminAuth.fetchWithAuth(path, options)
    : fetch(path, { ...options, credentials: 'include' });

  function message(result, lines, state = 'error') {
    const list = document.createElement('ul');
    for (const line of lines) { const li = document.createElement('li'); li.textContent = line; list.append(li); }
    result.replaceChildren(list);
    result.dataset.state = state;
  }

  async function examine() {
    const input = byId('giftIssuanceSessionId');
    const button = byId('giftDecisionCheckBtn');
    const result = byId('giftDecisionResult');
    const id = input.value.trim();
    if (!SESSION_ID.test(id)) return message(result, ['Enter the Stripe Checkout session ID above.']);
    button.disabled = true;
    result.textContent = 'Reading the live Stripe session and saved owner decisions…';
    try {
      const res = await send(`/api/admin/gift_issuance_recovery_decisions?${new URLSearchParams({ session_id: id })}`, { method: 'GET', cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || `HTTP ${res.status}`);
      const p = data.provider || {};
      const lines = [
        `Stripe: ${p.check || 'unknown'} · payment ${p.payment_status || 'unknown'} · session ${p.session_status || 'unknown'} · cart/line count ${p.expected_count ?? 'unknown'} · line items match: ${p.line_count_matched ? 'yes' : 'no'}`,
        `Owner decision entries: ${(data.decisions || []).length}. Saving a decision ALWAYS runs another Stripe check and an atomic database check.`,
        data.caution
      ];
      for (const entry of data.decisions || []) lines.push(`${entry.created_at} · ${entry.action} · ${entry.reason_code} · provider ${entry.provider_check} · observed ${entry.observed_certificates} · held events ${entry.held_events} · delivery reviews ${entry.review_required_certificates}`);
      message(result, lines, p.check === 'paid_verified' ? 'ok' : 'error');
    } catch (err) { message(result, [err.message, 'Owner recovery hold remains; no certificate changes are authorized.']); }
    finally { button.disabled = false; }
  }

  async function record() {
    const input = byId('giftIssuanceSessionId');
    const actionEl = byId('giftDecisionAction');
    const reasonEl = byId('giftDecisionReason');
    const confirmEl = byId('giftDecisionConfirm');
    const button = byId('giftDecisionSaveBtn');
    const result = byId('giftDecisionResult');
    const sessionId = input.value.trim();
    if (!SESSION_ID.test(sessionId)) return message(result, ['Enter a valid Stripe Checkout session ID first.']);
    const action = actionEl.value;
    if (action === 'close_verified_no_action' && (!confirmEl.checked || reasonEl.value !== 'verified_no_duplicate')) {
      return message(result, ['Verified closeout requires the verified-no-duplicate reason and the separate confirmation checkbox.']);
    }
    button.disabled = true;
    result.textContent = 'Rechecking paid Stripe evidence and saving one append-only owner decision…';
    // A stable UUID allows an owner to investigate an uncertain HTTP response
    // before generating a new ledger decision. No automatic retry occurs.
    const decisionId = crypto.randomUUID();
    try {
      const res = await send('/api/admin/gift_issuance_recovery_decisions', {
        method: 'POST', cache: 'no-store', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, decision_id: decisionId,
          action, reason_code: reasonEl.value, confirm_no_customer_action: confirmEl.checked })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || `HTTP ${res.status}`);
      message(result, [
        `Recorded decision ${data.decision?.id || decisionId} · ${data.decision?.action || action}.`,
        data.next_step,
        'No gift issuance, balance adjustment, refund or email was performed.'
      ], 'ok');
      confirmEl.checked = false;
    } catch (err) {
      message(result, [err.message, `If the save result is uncertain, use the provider and ledger review before submitting another entry. Decision reference: ${decisionId}`]);
    } finally { button.disabled = false; }
  }

  function init() {
    byId('giftDecisionCheckBtn')?.addEventListener('click', examine);
    byId('giftDecisionSaveBtn')?.addEventListener('click', record);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
