(function () {
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  async function review(button, result, input) {
    const giftId = input.value.trim();
    if (!uuid.test(giftId)) {
      result.textContent = 'Enter a valid gift certificate UUID from the authorized customer record.';
      result.dataset.state = 'error';
      input.focus();
      return;
    }
    button.disabled = true;
    result.textContent = 'Comparing the gift context and recipient/purchaser-copy notification evidence…';
    try {
      const url = `/api/admin/gift_delivery_retry_evidence_review?${new URLSearchParams({ gift_id: giftId })}`;
      const fetcher = window.AdminAuth?.fetchWithAuth
        ? (path) => window.AdminAuth.fetchWithAuth(path, { method: 'GET', cache: 'no-store' })
        : (path) => fetch(path, { method: 'GET', credentials: 'include', cache: 'no-store' });
      const response = await fetcher(url);
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || `HTTP ${response.status}`);
      const evidence = data.evidence || {};
      const intro = document.createElement('p');
      intro.textContent = evidence.owner_retry_candidate
        ? 'An existing failed event may be suitable for an authorized owner retry review. This is NOT approval to send.'
        : 'Hold: do not resend or create a second gift until the owner resolves the evidence or checks the provider.';
      const list = document.createElement('ul');
      const add = (message) => { const li = document.createElement('li'); li.textContent = message; list.append(li); };
      add(`Gift: ${data.gift_id} · recorded status: ${evidence.recorded_delivery_status || 'unknown'} · gift lifecycle: ${evidence.gift_status || 'unknown'}`);
      for (const item of [evidence.recipient, evidence.purchaser_copy]) {
        if (!item) continue;
        add(`${item.target}: ${item.status} · event ${item.event_id || 'none'} · attempts ${item.attempts ?? '—'}/${item.max_attempts ?? '—'} · ${item.review}`);
        if (item.next_attempt_at) add(`${item.target} next attempt eligibility: ${item.next_attempt_at} (verify scheduling before retry)`);
        if (item.provider_error_recorded) add(`${item.target}: provider error recorded; inspect privately in authorized notifications.`);
      }
      add(`Historical recipient events: ${evidence.recipient_event_count ?? 0}; purchaser-copy events: ${evidence.purchaser_copy_event_count ?? 0}.`);
      for (const flag of evidence.evidence_flags || []) add(`Reconciliation: ${flag}`);
      add(`Decision: ${evidence.decision || 'hold'}${evidence.candidate_target ? ` · target ${evidence.candidate_target}` : ''}. ${evidence.retry_instruction || ''}`);
      add(data.interpretation);
      add(data.privacy_hold);
      add(data.dispatch_hold);
      add(data.owner_action);
      result.replaceChildren(intro, list);
      result.dataset.state = evidence.owner_retry_candidate ? 'ok' : '';
    } catch (error) {
      result.textContent = `Delivery evidence unavailable: ${error.message}`;
      result.dataset.state = 'error';
    } finally { button.disabled = false; }
  }

  function init() {
    const button = document.getElementById('giftRetryEvidenceReviewBtn');
    const input = document.getElementById('giftRetryEvidenceId');
    const result = document.getElementById('giftRetryEvidenceReviewResult');
    if (button && input && result) button.addEventListener('click', () => review(button, result, input));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
