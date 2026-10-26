// Build 661 — owner-triggered, read-only review of quote/deposit follow-up copy.
(function installQuoteDepositCopyReview() {
  async function inspect(button, result) {
    button.disabled = true;
    result.textContent = 'Checking bundled and managed quote/deposit messages…';
    try {
      const fetcher = window.AdminAuth?.fetchWithAuth
        ? (url) => window.AdminAuth.fetchWithAuth(url, { method: 'GET', cache: 'no-store' })
        : (url) => fetch(url, { method: 'GET', credentials: 'include', cache: 'no-store' });
      const response = await fetcher('/api/admin/quote_deposit_mobile_copy_review');
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || `Audit unavailable (HTTP ${response.status}).`);
      const summary = document.createElement('p');
      summary.textContent = data.status === 'quote_deposit_copy_sources_aligned'
        ? 'Checked quote and deposit follow-up templates have no recognized setup or premature-booking claims.'
        : 'Owner review required: some template wording conflicts or managed sources could not be read.';
      const list = document.createElement('ul');
      const add = (message) => { const item = document.createElement('li'); item.textContent = message; list.append(item); };
      for (const source of [...(data.bundled_sources || []), ...(data.managed_sources || [])]) {
        add(`${source.source}: ${(source.findings || []).length} finding(s)${source.updated_at ? ` · updated ${source.updated_at}` : ''}.`);
        if (source.warning) add(`Source warning: ${source.warning}`);
        for (const finding of source.findings || []) add(`${finding.field} [${finding.code}]: ${finding.excerpt || 'Built-in copy needs review'}`);
      }
      add('Quote SMS preview is draft-only. No reminder schedules, recipient selections, payment statuses or consent settings are changed.');
      result.replaceChildren(summary, list);
      result.dataset.state = data.status === 'quote_deposit_copy_sources_aligned' ? 'ok' : '';
    } catch (error) {
      result.textContent = `Quote/deposit copy review unavailable: ${error.message || 'Unknown error'}`;
      result.dataset.state = 'error';
    } finally {
      button.disabled = false;
    }
  }
  function init() {
    const button = document.getElementById('quoteDepositMobileCopyReviewBtn');
    const result = document.getElementById('quoteDepositMobileCopyReviewResult');
    if (button && result) button.addEventListener('click', () => inspect(button, result));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
