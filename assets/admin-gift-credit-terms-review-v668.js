(function () {
  async function inspect(button, result) {
    button.disabled = true;
    result.textContent = 'Checking gift card, voucher, store credit and public Terms wording…';
    try {
      const fetcher = window.AdminAuth?.fetchWithAuth
        ? (url) => window.AdminAuth.fetchWithAuth(url, { method: 'GET', cache: 'no-store' })
        : (url) => fetch(url, { method: 'GET', credentials: 'include', cache: 'no-store' });
      const response = await fetcher('/api/admin/gift_voucher_credit_mobile_terms_review');
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || `HTTP ${response.status}`);
      const summary = document.createElement('p');
      summary.textContent = data.status === 'gift_credit_copy_sources_aligned'
        ? 'No recognized gift-card wording risks or scope mismatches were found in the checked sources.'
        : 'Owner/legal review required: gift wording, type-specific terms or unavailable sources need attention.';
      const list = document.createElement('ul');
      const add = (message) => { const item = document.createElement('li'); item.textContent = message; list.append(item); };
      for (const source of [...(data.bundled_sources || []), ...(data.public_sources || []), ...(data.managed_sources || [])]) {
        add(`${source.source}: ${(source.findings || []).length} finding(s)${source.updated_at ? ` · updated ${source.updated_at}` : ''}`);
        if (source.warning) add(source.warning);
        for (const finding of source.findings || []) add(`${finding.field} [${finding.code}]: ${finding.excerpt || 'Owner review required'}`);
      }
      for (const item of data.policy_alignment || []) add(`${item.code}: ${item.note}`);
      add('Audit only: no gift value, expiry, balance, redemption, refund, message or customer record is changed.');
      result.replaceChildren(summary, list);
      result.dataset.state = data.status === 'gift_credit_copy_sources_aligned' ? 'ok' : '';
    } catch (error) {
      result.textContent = `Gift credit terms review unavailable: ${error.message}`;
      result.dataset.state = 'error';
    } finally { button.disabled = false; }
  }
  function init() {
    const button = document.getElementById('giftCreditTermsReviewBtn');
    const result = document.getElementById('giftCreditTermsReviewResult');
    if (button && result) button.addEventListener('click', () => inspect(button, result));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
