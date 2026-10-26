(function () {
  async function inspect(button, result) {
    button.disabled = true;
    result.textContent = 'Checking cancellation, rescheduling, refund and deposit wording…';
    try {
      const fetcher = window.AdminAuth?.fetchWithAuth
        ? (url) => window.AdminAuth.fetchWithAuth(url, { method: 'GET', cache: 'no-store' })
        : (url) => fetch(url, { method: 'GET', credentials: 'include', cache: 'no-store' });
      const response = await fetcher('/api/admin/cancellation_reschedule_refund_mobile_copy_review');
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || `HTTP ${response.status}`);
      const summary = document.createElement('p');
      summary.textContent = data.status === 'cancellation_refund_copy_sources_aligned'
        ? 'No recognized wording risks or policy mismatches were found in the checked sources.'
        : 'Owner/policy review required: flagged wording, policy mismatch or unavailable sources need attention.';
      const list = document.createElement('ul');
      const add = (message) => { const item = document.createElement('li'); item.textContent = message; list.append(item); };
      for (const source of [...(data.bundled_sources || []), ...(data.managed_sources || []), data.terms_source].filter(Boolean)) {
        add(`${source.source}: ${(source.findings || []).length} finding(s)${source.updated_at ? ` · updated ${source.updated_at}` : ''}`);
        if (source.warning) add(source.warning);
        for (const finding of source.findings || []) add(`${finding.field} [${finding.code}]: ${finding.excerpt || 'Owner review required'}`);
      }
      for (const mismatch of data.policy_alignment || []) add(`${mismatch.code}: ${mismatch.note}`);
      add('Review only. No cancellation, new booking time, fee waiver, payment, refund, or customer message is authorized.');
      result.replaceChildren(summary, list);
      result.dataset.state = data.status === 'cancellation_refund_copy_sources_aligned' ? 'ok' : '';
    } catch (error) {
      result.textContent = `Cancellation/refund copy review unavailable: ${error.message}`;
      result.dataset.state = 'error';
    } finally { button.disabled = false; }
  }
  function init() {
    const button = document.getElementById('cancellationRefundCopyReviewBtn');
    const result = document.getElementById('cancellationRefundCopyReviewResult');
    if (button && result) button.addEventListener('click', () => inspect(button, result));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
