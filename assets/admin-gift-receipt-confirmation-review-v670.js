(function () {
  async function inspect(button, result) {
    button.disabled = true;
    result.textContent = 'Checking gift receipts, printable certificates and confirmation messages…';
    try {
      const fetcher = window.AdminAuth?.fetchWithAuth
        ? (url) => window.AdminAuth.fetchWithAuth(url, { method: 'GET', cache: 'no-store' })
        : (url) => fetch(url, { method: 'GET', credentials: 'include', cache: 'no-store' });
      const response = await fetcher('/api/admin/gift_receipt_certificate_confirmation_mobile_review');
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || `HTTP ${response.status}`);
      const summary = document.createElement('p');
      summary.textContent = data.status === 'gift_receipt_confirmation_copy_aligned'
        ? 'Checked receipt, certificate and confirmation wording was consistent in the available sources.'
        : 'Owner review required: readability gaps, competing confirmation labels, copy risks or unavailable sources were found.';
      const list = document.createElement('ul');
      const add = (message) => { const item = document.createElement('li'); item.textContent = message; list.append(item); };
      for (const source of [...(data.bundled_sources || []), ...(data.public_sources || []), ...(data.managed_sources || [])]) {
        add(`${source.source}: ${(source.findings || []).length} copy risk(s), ${(source.guidance_gaps || []).length} guidance gap(s)${source.updated_at ? ` · updated ${source.updated_at}` : ''}`);
        if (source.warning) add(source.warning);
        for (const finding of source.findings || []) add(`${finding.field} [${finding.code}]: ${finding.excerpt || 'Owner review required'}`);
        for (const gap of source.guidance_gaps || []) add(`${gap.code}: ${gap.note}`);
      }
      for (const finding of data.display_findings || []) add(`${finding.code}: ${finding.note}`);
      add(data.privacy_hold);
      add(data.financial_hold);
      result.replaceChildren(summary, list);
      result.dataset.state = data.status === 'gift_receipt_confirmation_copy_aligned' ? 'ok' : '';
    } catch (error) {
      result.textContent = `Gift receipt review unavailable: ${error.message}`;
      result.dataset.state = 'error';
    } finally { button.disabled = false; }
  }
  function init() {
    const button = document.getElementById('giftReceiptConfirmationReviewBtn');
    const result = document.getElementById('giftReceiptConfirmationReviewResult');
    if (button && result) button.addEventListener('click', () => inspect(button, result));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
