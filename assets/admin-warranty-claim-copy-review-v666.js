(function () {
  async function inspect(button, result) {
    button.disabled = true;
    result.textContent = 'Checking warranty, guarantee and claim copy sources…';
    try {
      const fetcher = window.AdminAuth?.fetchWithAuth
        ? (url) => window.AdminAuth.fetchWithAuth(url, { method: 'GET', cache: 'no-store' })
        : (url) => fetch(url, { method: 'GET', credentials: 'include', cache: 'no-store' });
      const response = await fetcher('/api/admin/warranty_claim_mobile_copy_review');
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || `HTTP ${response.status}`);
      const summary = document.createElement('p');
      summary.textContent = data.status === 'warranty_claim_copy_sources_aligned'
        ? 'No recognized warranty/claim wording risks were found in checked sources.'
        : 'Owner/legal review required: potential claims or unavailable sources need attention.';
      const list = document.createElement('ul');
      const add = (message) => { const item = document.createElement('li'); item.textContent = message; list.append(item); };
      for (const source of [...data.bundled_sources, ...data.managed_sources]) {
        add(`${source.source}: ${(source.findings || []).length} finding(s)${source.updated_at ? ` · updated ${source.updated_at}` : ''}`);
        if (source.warning) add(source.warning);
        for (const finding of source.findings || []) add(`${finding.field} [${finding.code}]: ${finding.excerpt || 'Review required'}`);
      }
      add('Audit only: no claim decisions, refunds, legal terms, customer messages, or managed templates are changed.');
      result.replaceChildren(summary, list);
      result.dataset.state = data.status === 'warranty_claim_copy_sources_aligned' ? 'ok' : '';
    } catch (error) { result.textContent = `Warranty/claim review unavailable: ${error.message}`; result.dataset.state = 'error'; }
    finally { button.disabled = false; }
  }
  function init() {
    const button = document.getElementById('warrantyClaimCopyReviewBtn');
    const result = document.getElementById('warrantyClaimCopyReviewResult');
    if (button && result) button.addEventListener('click', () => inspect(button, result));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
