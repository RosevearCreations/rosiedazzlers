(function () {
  async function inspect(button, result) {
    button.disabled = true;
    result.textContent = 'Checking completion, care and FAQ sources…';
    try {
      const fetcher = window.AdminAuth?.fetchWithAuth
        ? (url) => window.AdminAuth.fetchWithAuth(url, { method: 'GET', cache: 'no-store' })
        : (url) => fetch(url, { method: 'GET', credentials: 'include', cache: 'no-store' });
      const response = await fetcher('/api/admin/service_completion_faq_copy_review');
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || `HTTP ${response.status}`);
      const p = document.createElement('p');
      p.textContent = data.status === 'completion_faq_copy_sources_aligned' ? 'No recognized conflicts in checked completion and care FAQ sources.' : 'Owner review required: conflicting wording or unavailable source.';
      const ul = document.createElement('ul');
      const add = (text) => { const li = document.createElement('li'); li.textContent = text; ul.append(li); };
      for (const source of [...data.bundled_sources, ...data.managed_sources]) {
        add(`${source.source}: ${(source.findings || []).length} finding(s)${source.updated_at ? ` · updated ${source.updated_at}` : ''}`);
        if (source.warning) add(source.warning);
        for (const finding of source.findings || []) add(`${finding.field} [${finding.code}]: ${finding.excerpt || 'Review required'}`);
      }
      add('No customer message, payment, job-completion event, legal term or source template is changed.');
      result.replaceChildren(p, ul);
      result.dataset.state = data.status === 'completion_faq_copy_sources_aligned' ? 'ok' : '';
    } catch (error) { result.textContent = `Completion FAQ review unavailable: ${error.message}`; result.dataset.state = 'error'; }
    finally { button.disabled = false; }
  }
  function init() { const button = document.getElementById('serviceCompletionFaqReviewBtn'); const result = document.getElementById('serviceCompletionFaqReviewResult'); if (button && result) button.addEventListener('click', () => inspect(button, result)); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
