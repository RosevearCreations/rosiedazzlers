// Build 660 — owner-triggered, read-only email/SMS/customer checklist audit.
(function installAppointmentPreparationReview() {
  async function inspect(button, result) {
    button.disabled = true;
    result.textContent = 'Reviewing bundled and managed confirmation/reminder copy…';
    try {
      const fetcher = window.AdminAuth?.fetchWithAuth
        ? (url) => window.AdminAuth.fetchWithAuth(url, { method: 'GET', cache: 'no-store' })
        : (url) => fetch(url, { method: 'GET', credentials: 'include', cache: 'no-store' });
      const response = await fetcher('/api/admin/appointment_preparation_mobile_setup_review');
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || `Review unavailable (HTTP ${response.status}).`);
      const summary = document.createElement('p');
      summary.textContent = data.status === 'appointment_preparation_sources_aligned'
        ? 'Checked appointment preparation sources align with Rosie-supplied standard water and power.'
        : 'Owner review required: some managed copy is inconsistent or could not be read.';
      const list = document.createElement('ul');
      const append = (message) => { const li = document.createElement('li'); li.textContent = message; list.append(li); };
      for (const source of [...(data.bundled_sources || []), ...(data.managed_sources || [])]) {
        append(`${source.source}: ${(source.findings || []).length} conflicting fields${source.updated_at ? ` · updated ${source.updated_at}` : ''}.`);
        if (source.warning) append(`Check warning: ${source.warning}`);
        for (const finding of source.findings || []) append(`${finding.field}: ${finding.excerpt}`);
      }
      append('SMS preview only; this review does not send messages or alter consent settings.');
      result.replaceChildren(summary, list);
      result.dataset.state = data.status === 'appointment_preparation_sources_aligned' ? 'ok' : '';
    } catch (error) {
      result.textContent = `Appointment preparation audit unavailable: ${error.message || 'Unknown error'}`;
      result.dataset.state = 'error';
    } finally { button.disabled = false; }
  }
  function init() {
    const button = document.getElementById('appointmentPreparationMobileSetupReviewBtn');
    const result = document.getElementById('appointmentPreparationMobileSetupReviewResult');
    if (button && result) button.addEventListener('click', () => inspect(button, result));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
