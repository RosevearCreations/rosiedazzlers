(function () {
  async function inspect(button, result) {
    button.disabled = true;
    result.textContent = 'Checking post-service message sources…';
    try {
      const fetcher = window.AdminAuth?.fetchWithAuth
        ? (url) => window.AdminAuth.fetchWithAuth(url, { method: 'GET', cache: 'no-store' })
        : (url) => fetch(url, { method: 'GET', credentials: 'include', cache: 'no-store' });
      const response = await fetcher('/api/admin/post_service_mobile_copy_review');
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || `HTTP ${response.status}`);
      const summary = document.createElement('p');
      summary.textContent = data.status === 'post_service_copy_sources_aligned' ? 'No recognized issues in checked post-service sources.' : 'Owner review required: findings or unavailable sources need attention.';
      const list = document.createElement('ul');
      const add = (text) => { const li = document.createElement('li'); li.textContent = text; list.append(li); };
      for (const source of [...data.bundled_sources, ...data.managed_sources]) {
        add(`${source.source}: ${(source.findings || []).length} finding(s)${source.updated_at ? ` · updated ${source.updated_at}` : ''}`);
        if (source.warning) add(source.warning);
        for (const finding of source.findings || []) add(`${finding.field} [${finding.code}]: ${finding.excerpt || 'Review required'}`);
      }
      add('No messages sent; existing review eligibility, consent and STOP/HELP remain authoritative.');
      result.replaceChildren(summary, list);
      result.dataset.state = data.status === 'post_service_copy_sources_aligned' ? 'ok' : '';
    } catch (error) { result.textContent = `Post-service review unavailable: ${error.message}`; result.dataset.state = 'error'; }
    finally { button.disabled = false; }
  }
  function init() {
    const button = document.getElementById('postServiceMobileCopyReviewBtn');
    const result = document.getElementById('postServiceMobileCopyReviewResult');
    if (button && result) button.addEventListener('click', () => inspect(button, result));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
