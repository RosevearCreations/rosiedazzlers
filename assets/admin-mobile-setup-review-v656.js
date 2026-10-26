// Build 656 — explicit owner/staff review of managed water/power copy.
// No background polling, automatic policy writes, or legal-text edits.
(function installMobileSetupReview() {
  function makeLine(label, value) {
    const li = document.createElement('li');
    const strong = document.createElement('strong');
    strong.textContent = `${label}: `;
    li.append(strong, document.createTextNode(String(value || 'Unknown')));
    return li;
  }

  async function runReview(button, box) {
    button.disabled = true;
    box.textContent = 'Reading current managed policy and FAQ sources…';
    try {
      const fetcher = window.AdminAuth?.fetchWithAuth
        ? (url) => window.AdminAuth.fetchWithAuth(url, { method: 'GET', cache: 'no-store' })
        : (url) => fetch(url, { method: 'GET', credentials: 'include', cache: 'no-store' });
      const res = await fetcher('/api/admin/mobile_setup_policy_review');
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || !payload.ok) throw new Error(payload.error || `Review unavailable (HTTP ${res.status}).`);
      const list = document.createElement('ul');
      list.append(
        makeLine('Stored site policy', `${payload.site_policy?.status || 'unknown'} · ${payload.site_policy?.source || 'unknown'}${payload.site_policy?.updated_at ? ` · updated ${payload.site_policy.updated_at}` : ''}`),
        makeLine('Public footer display', payload.site_policy?.public_display),
        makeLine('FAQ database', `${payload.active_faq?.status || 'unknown'} · ${payload.active_faq?.matches?.length || 0} related active entries`),
        makeLine('Terms and Waiver', 'Owner approval required before contractual corrections')
      );
      for (const row of payload.active_faq?.matches || []) {
        if (row.status === 'conflict') list.append(makeLine('FAQ conflict', row.question));
      }
      const warning = [payload.site_policy?.warning, payload.active_faq?.warning].filter(Boolean).join(' ');
      if (warning) list.append(makeLine('Check warning', warning));
      const summary = document.createElement('p');
      summary.textContent = payload.status === 'public_sources_aligned'
        ? 'Managed public sources currently align. Contractual copy still requires independent owner review.'
        : 'Owner review remains necessary; use the policy editor and Content Center links above.';
      box.replaceChildren(summary, list);
      box.dataset.state = payload.status === 'public_sources_aligned' ? 'ok' : '';
    } catch (error) {
      box.textContent = `Review could not be completed: ${error.message || 'Unknown error'}`;
      box.dataset.state = 'error';
    } finally { button.disabled = false; }
  }

  function init() {
    const button = document.getElementById('mobileSetupReviewBtn');
    const box = document.getElementById('mobileSetupReviewResult');
    if (!button || !box) return;
    button.addEventListener('click', () => runReview(button, box));
    document.getElementById('mobileSetupPolicyEditorBtn')?.addEventListener('click', () => {
      const key = Array.from(document.querySelectorAll('#settingList [data-key]'))
        .find((item) => item.dataset.key === 'site_policies');
      if (key) {
        key.click();
        key.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        box.textContent = 'Load the editable settings list before opening the site policy editor.';
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
