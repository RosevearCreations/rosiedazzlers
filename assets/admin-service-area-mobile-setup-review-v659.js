// Build 659 — manual read-only source provenance for service-area setup rules.
(function installServiceAreaMobileSetupReview() {
  async function check(button, result) {
    button.disabled = true;
    result.textContent = 'Checking bundled, table and managed service-area access rules…';
    try {
      const fetcher = window.AdminAuth?.fetchWithAuth
        ? (url) => window.AdminAuth.fetchWithAuth(url, { method: 'GET', cache: 'no-store' })
        : (url) => fetch(url, { method: 'GET', credentials: 'include', cache: 'no-store' });
      const response = await fetcher('/api/admin/service_area_mobile_setup_review');
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || `Review unavailable (HTTP ${response.status}).`);

      const list = document.createElement('ul');
      const append = (text) => {
        const li = document.createElement('li');
        li.textContent = text;
        list.append(li);
      };
      for (const source of [...(data.bundled_sources || []), ...(data.managed_sources || [])]) {
        append(`${source.source}: ${source.count || 0} rows; ${(source.findings || []).length} conflicting access rules${source.updated_at ? ` · updated ${source.updated_at}` : ''}.`);
        if (source.warning) append(`Check warning: ${source.warning}`);
        for (const finding of source.findings || []) {
          append(`${source.source} · ${finding.key} · ${finding.field}: ${finding.excerpt}`);
        }
      }
      const heading = document.createElement('p');
      heading.textContent = data.status === 'service_area_access_sources_aligned'
        ? 'Checked access-rule sources align. Municipal water restrictions and contractual language are separately governed.'
        : 'Owner review required. Known conflicting access-rule text is guarded in the public API but stored records need explicit reconciliation.';
      result.replaceChildren(heading, list);
      result.dataset.state = data.status === 'service_area_access_sources_aligned' ? 'ok' : '';
    } catch (error) {
      result.textContent = `Service-area access review unavailable: ${error.message || 'Unknown error'}`;
      result.dataset.state = 'error';
    } finally {
      button.disabled = false;
    }
  }

  function init() {
    const button = document.getElementById('serviceAreaMobileSetupReviewBtn');
    const result = document.getElementById('serviceAreaMobileSetupReviewResult');
    if (!button || !result) return;
    button.addEventListener('click', () => check(button, result));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
