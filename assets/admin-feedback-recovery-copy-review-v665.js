(function () {
  async function inspect(button, result) {
    button.disabled = true;
    result.textContent = 'Checking feedback and service-recovery message sources…';
    try {
      const fetcher = window.AdminAuth?.fetchWithAuth
        ? (url) => window.AdminAuth.fetchWithAuth(url, { method: 'GET', cache: 'no-store' })
        : (url) => fetch(url, { method: 'GET', credentials: 'include', cache: 'no-store' });
      const response = await fetcher('/api/admin/feedback_recovery_mobile_copy_review');
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || `HTTP ${response.status}`);
      const p = document.createElement('p');
      p.textContent = data.status === 'feedback_recovery_copy_sources_aligned' ? 'Checked feedback and recovery sources have no recognized conflicts.' : 'Owner review required: wording conflicts or unavailable sources.';
      const ul = document.createElement('ul');
      const add = (text) => { const li = document.createElement('li'); li.textContent = text; ul.append(li); };
      for (const source of [...data.bundled_sources, ...data.managed_sources]) {
        add(`${source.source}: ${(source.findings || []).length} finding(s)${source.updated_at ? ` · updated ${source.updated_at}` : ''}`);
        if (source.warning) add(source.warning);
        for (const finding of source.findings || []) add(`${finding.field} [${finding.code}]: ${finding.excerpt || 'Review required'}`);
      }
      add('No outreach, refund, complaint resolution, opt-out or review publication action occurs.');
      result.replaceChildren(p, ul);
      result.dataset.state = data.status === 'feedback_recovery_copy_sources_aligned' ? 'ok' : '';
    } catch (error) { result.textContent = `Feedback/recovery audit unavailable: ${error.message}`; result.dataset.state = 'error'; }
    finally { button.disabled = false; }
  }
  function init() { const button = document.getElementById('feedbackRecoveryCopyReviewBtn'); const result = document.getElementById('feedbackRecoveryCopyReviewResult'); if (button && result) button.addEventListener('click', () => inspect(button, result)); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
