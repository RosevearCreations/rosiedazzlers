(function () {
  async function review(button, result) {
    button.disabled = true;
    result.textContent = 'Checking gift delivery, failed-send and resend guidance…';
    try {
      const fetcher = window.AdminAuth?.fetchWithAuth
        ? (url) => window.AdminAuth.fetchWithAuth(url, { method: 'GET', cache: 'no-store' })
        : (url) => fetch(url, { method: 'GET', credentials: 'include', cache: 'no-store' });
      const response = await fetcher('/api/admin/gift_delivery_failure_resend_mobile_review');
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || `HTTP ${response.status}`);
      const intro = document.createElement('p');
      intro.textContent = data.status === 'gift_delivery_copy_aligned'
        ? 'Available gift delivery messages passed the configured checks.'
        : 'Owner review required: check inaccurate send/delivered claims, retry evidence, guidance gaps and unavailable sources.';
      const list = document.createElement('ul');
      const add = (message) => { const item = document.createElement('li'); item.textContent = message; list.append(item); };
      for (const source of [...(data.bundled_sources || []), ...(data.public_sources || []), ...(data.managed_sources || [])]) {
        add(`${source.source}: ${(source.findings || []).length} copy risk(s), ${(source.guidance_gaps || []).length} guidance gap(s)${source.updated_at ? ` · updated ${source.updated_at}` : ''}`);
        if (source.warning) add(source.warning);
        for (const finding of source.findings || []) add(`${finding.field} [${finding.code}]: ${finding.excerpt || 'Check wording'}`);
        for (const gap of source.guidance_gaps || []) add(`${gap.code}: ${gap.note}`);
      }
      for (const finding of data.runtime_findings || []) add(`${finding.code} (${finding.source}): ${finding.note}`);
      for (const state of data.status_guidance || []) add(`${state.state.toUpperCase()} — Customer: ${state.customer} Staff: ${state.owner}`);
      add(data.evidence_scope);
      add(data.privacy_hold);
      add(data.dispatch_hold);
      add(data.owner_action);
      result.replaceChildren(intro, list);
      result.dataset.state = data.status === 'gift_delivery_copy_aligned' ? 'ok' : '';
    } catch (err) {
      result.textContent = `Gift delivery audit unavailable: ${err.message}`;
      result.dataset.state = 'error';
    } finally { button.disabled = false; }
  }
  function init() {
    const button = document.getElementById('giftDeliveryFailureReviewBtn');
    const result = document.getElementById('giftDeliveryFailureReviewResult');
    if (button && result) button.addEventListener('click', () => review(button, result));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
