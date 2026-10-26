// Build 658 — operator-triggered, read-only service/add-on source review.
(function installServiceAddonMobileSetupReview() {
  function addLine(list, text) {
    const row = document.createElement('li');
    row.textContent = String(text || '');
    list.append(row);
  }

  async function check(button, result) {
    button.disabled = true;
    result.textContent = 'Checking bundled and managed service/add-on landing copy…';
    try {
      const fetcher = window.AdminAuth?.fetchWithAuth
        ? (url) => window.AdminAuth.fetchWithAuth(url, { method: 'GET', cache: 'no-store' })
        : (url) => fetch(url, { method: 'GET', credentials: 'include', cache: 'no-store' });
      const response = await fetcher('/api/admin/service_addon_mobile_setup_review');
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || `Review unavailable (HTTP ${response.status}).`);

      const list = document.createElement('ul');
      addLine(list, `Bundled service/add-on pages: ${data.bundled?.count || 0}; ${(data.bundled?.pages || []).filter((page) => page.findings?.length).length} need copy review.`);
      for (const source of data.managed_sources || []) {
        addLine(list, `${source.key}: ${source.source}; ${(source.pages || []).length} matched overrides${source.updated_at ? ` · updated ${source.updated_at}` : ''}.`);
        if (source.warning) addLine(list, `Check warning: ${source.warning}`);
      }
      for (const source of [{ key: 'bundled', pages: data.bundled?.pages || [] }, ...(data.managed_sources || [])]) {
        for (const page of source.pages || []) {
          for (const finding of page.findings || []) {
            addLine(list, `${source.key} · ${page.slug} · ${finding.path}: ${finding.excerpt}`);
          }
        }
      }
      const heading = document.createElement('p');
      heading.textContent = data.status === 'service_addon_sources_aligned'
        ? 'Checked landing data aligns. Municipal rules, static-page verification and contracts remain separately governed.'
        : 'Owner review required. The public API guards known contradictory managed copy; review sources before any edit.';
      result.replaceChildren(heading, list);
      result.dataset.state = data.status === 'service_addon_sources_aligned' ? 'ok' : '';
    } catch (error) {
      result.textContent = `Service/add-on source review could not be completed: ${error.message || 'Unknown error'}`;
      result.dataset.state = 'error';
    } finally {
      button.disabled = false;
    }
  }

  function init() {
    const button = document.getElementById('serviceAddonMobileSetupReviewBtn');
    const result = document.getElementById('serviceAddonMobileSetupReviewResult');
    if (!button || !result) return;
    button.addEventListener('click', () => check(button, result));
    document.getElementById('serviceAddonLandingEditorBtn')?.addEventListener('click', () => {
      const option = Array.from(document.querySelectorAll('#settingList [data-key]'))
        .find((item) => ['landing_pages_content', 'landing_pages'].includes(item.dataset.key));
      if (option) {
        option.click();
        option.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        result.textContent = 'Load the editable settings list before opening landing-page settings.';
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
