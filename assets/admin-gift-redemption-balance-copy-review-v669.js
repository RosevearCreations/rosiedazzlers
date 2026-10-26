(function () {
  async function inspect(button, result) {
    button.disabled = true;
    result.textContent = 'Checking gift redemption steps, account balance instructions and mobile checkout explanations…';
    try {
      const fetcher = window.AdminAuth?.fetchWithAuth
        ? (url) => window.AdminAuth.fetchWithAuth(url, { method: 'GET', cache: 'no-store' })
        : (url) => fetch(url, { method: 'GET', credentials: 'include', cache: 'no-store' });
      const response = await fetcher('/api/admin/gift_redemption_balance_mobile_copy_review');
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || `HTTP ${response.status}`);
      const summary = document.createElement('p');
      summary.textContent = data.status === 'gift_redemption_guidance_aligned'
        ? 'Checked redemption and remaining-balance guidance is consistent in the available sources.'
        : 'Owner review required: checkout scope, missing guidance, copy risks or unavailable sources need attention.';
      const list = document.createElement('ul');
      const add = (message) => { const item = document.createElement('li'); item.textContent = message; list.append(item); };
      for (const source of [...(data.bundled_sources || []), ...(data.public_sources || []), ...(data.managed_sources || [])]) {
        add(`${source.source}: ${(source.findings || []).length} copy risk(s), ${(source.guidance_gaps || []).length} guidance gap(s)${source.updated_at ? ` · updated ${source.updated_at}` : ''}`);
        if (source.warning) add(source.warning);
        for (const finding of source.findings || []) add(`${finding.field} [${finding.code}]: ${finding.excerpt || 'Owner review required'}`);
        for (const gap of source.guidance_gaps || []) add(`${gap.code}: ${gap.note}`);
      }
      for (const item of data.contract_alignment || []) add(`${item.code}: ${item.note}`);
      add(data.balance_hold);
      add(data.transaction_hold);
      result.replaceChildren(summary, list);
      result.dataset.state = data.status === 'gift_redemption_guidance_aligned' ? 'ok' : '';
    } catch (error) {
      result.textContent = `Gift redemption review unavailable: ${error.message}`;
      result.dataset.state = 'error';
    } finally { button.disabled = false; }
  }
  function init() {
    const button = document.getElementById('giftRedemptionBalanceReviewBtn');
    const result = document.getElementById('giftRedemptionBalanceReviewResult');
    if (button && result) button.addEventListener('click', () => inspect(button, result));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
