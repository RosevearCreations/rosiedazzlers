// Build 657 — explicit owner-triggered, read-only town source reconciliation.
(function installTownMobileSetupReview() {
  function addLine(list, text) {
    const li = document.createElement('li');
    li.textContent = String(text || '');
    list.append(li);
  }

  async function check(button, result) {
    button.disabled = true;
    result.textContent = 'Checking bundled and managed town-page copy…';
    try {
      const fetcher = window.AdminAuth?.fetchWithAuth
        ? (url) => window.AdminAuth.fetchWithAuth(url, { method: 'GET', cache: 'no-store' })
        : (url) => fetch(url, { method: 'GET', credentials: 'include', cache: 'no-store' });
      const response = await fetcher('/api/admin/town_mobile_setup_review');
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || `Review unavailable (HTTP ${response.status}).`);

      const report = document.createElement('ul');
      const bundled = data.bundled || {};
      addLine(report, `Bundled pages: ${bundled.count || 0} checked; ${(bundled.pages || []).filter((page) => page.findings?.length).length} with conflicting copy.`);
      for (const source of data.managed_sources || []) {
        addLine(report, `${source.key}: ${source.source}; ${(source.pages || []).length} town overrides${source.updated_at ? ` · updated ${source.updated_at}` : ''}.`);
        if (source.warning) addLine(report, `Check warning: ${source.warning}`);
      }
      for (const source of [{ key: 'bundled', pages: bundled.pages || [] }, ...(data.managed_sources || [])]) {
        for (const page of source.pages || []) {
          for (const finding of page.findings || []) {
            addLine(report, `${source.key} · ${page.slug} · ${finding.path}: ${finding.excerpt}`);
          }
        }
      }
      const heading = document.createElement('p');
      heading.textContent = data.status === 'public_town_sources_aligned'
        ? 'Checked town marketing sources align. Municipal water-use rules and contractual wording remain separately governed.'
        : 'Owner review required. The public landing API guards known legacy claims; update managed copy only after reviewing the source and local restrictions.';
      result.replaceChildren(heading, report);
      result.dataset.state = data.status === 'public_town_sources_aligned' ? 'ok' : '';
    } catch (error) {
      result.textContent = `Town source review could not be completed: ${error.message || 'Unknown error'}`;
      result.dataset.state = 'error';
    } finally {
      button.disabled = false;
    }
  }

  function init() {
    const button = document.getElementById('townMobileSetupReviewBtn');
    const result = document.getElementById('townMobileSetupReviewResult');
    if (!button || !result) return;
    button.addEventListener('click', () => check(button, result));
    document.getElementById('townLandingEditorBtn')?.addEventListener('click', () => {
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
