(function () {
  const SESSION_ID = /^cs_(?:test|live)_[a-zA-Z0-9_-]{8,220}$/;

  async function review(button, input, result) {
    const id = input.value.trim();
    if (!SESSION_ID.test(id)) {
      result.textContent = 'Enter the Stripe Checkout session ID from the authorized payment record.';
      result.dataset.state = 'error';
      return;
    }
    button.disabled = true;
    result.textContent = 'Checking the issuance receipt, paid webhook event evidence and certificate count…';
    try {
      const url = `/api/admin/gift_issuance_recovery_review?${new URLSearchParams({ session_id: id })}`;
      const fetcher = window.AdminAuth?.fetchWithAuth
        ? (path) => window.AdminAuth.fetchWithAuth(path, { method: 'GET', cache: 'no-store' })
        : (path) => fetch(path, { method: 'GET', credentials: 'include', cache: 'no-store' });
      const response = await fetcher(url);
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || `HTTP ${response.status}`);
      const receipt = data.receipt || {};
      const intro = document.createElement('p');
      intro.textContent = data.decision === 'issued_consistent_review_only'
        ? 'Issued certificate count and stored receipt agree. Owner/provider verification is still required.'
        : 'RECOVERY HOLD: a missing, incomplete or contradictory issuance record needs owner reconciliation.';
      const list = document.createElement('ul');
      const add = (text) => { const item = document.createElement('li'); item.textContent = text; list.append(item); };
      add(`Receipt: ${receipt.state || 'missing'} · expected ${receipt.expected_count ?? 'unknown'} · issued ${receipt.issued_count ?? 'unknown'} · observed ${data.observed_certificates}`);
      add(`Replay attempts: ${receipt.replay_count ?? 'unknown'} · first event ${receipt.first_event_id || 'unknown'} · latest event ${receipt.last_event_id || 'unknown'}`);
      if (receipt.hold_reason) add(`Hold reason: ${receipt.hold_reason}`);
      for (const event of data.events || []) add(`Webhook ${event.event_id} · ${event.event_type} · ${event.observed_state} · observed ${event.delivery_count} time(s)`);
      if (data.evidence_truncated) add('Evidence was truncated; consult managed records before any decision.');
      add(data.owner_action);
      add(data.no_mutation);
      result.replaceChildren(intro, list);
      result.dataset.state = data.decision === 'issued_consistent_review_only' ? 'ok' : 'error';
    } catch (error) {
      result.textContent = `Issuance evidence unavailable: ${error.message}. Hold all manual replacement or replay actions.`;
      result.dataset.state = 'error';
    } finally { button.disabled = false; }
  }

  function init() {
    const button = document.getElementById('giftIssuanceReviewBtn');
    const input = document.getElementById('giftIssuanceSessionId');
    const result = document.getElementById('giftIssuanceReviewResult');
    if (button && input && result) button.addEventListener('click', () => review(button, input, result));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
