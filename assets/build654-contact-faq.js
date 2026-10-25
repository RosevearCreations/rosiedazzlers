/* Build 654: local-only email-draft preparation and accessible FAQ filtering.
 * No website endpoint receives contact-form fields; a draft opens only when
 * the visitor explicitly activates the mailto link in their email client.
 */
(function () {
  'use strict';

  function initContactDraft() {
    const form = document.getElementById('contactPrepForm');
    if (!form || form.dataset.build654Ready === '1') return;
    form.dataset.build654Ready = '1';

    const topic = document.getElementById('contactPrepTopic');
    const size = document.getElementById('contactPrepSize');
    const town = document.getElementById('contactPrepTown');
    const notes = document.getElementById('contactPrepMessage');
    const link = document.getElementById('contactPrepDraft');
    const summary = document.getElementById('contactPrepSummary');
    const count = document.getElementById('contactPrepCount');
    const topics = {
      general: 'General question', booking: 'Booking or availability',
      photo: 'Photo estimate', addons: 'Packages or add-ons',
      maintenance: 'Maintenance or fleet service'
    };
    const sizes = {
      unknown: 'Vehicle size unknown', small: 'Small vehicle',
      mid: 'Mid-size vehicle', oversize: 'Oversize vehicle'
    };

    function updateDraft() {
      const selectedTopic = topics[topic.value] || topics.general;
      const selectedSize = sizes[size.value] || sizes.unknown;
      const selectedTown = town.value.trim().replace(/\s+/g, ' ').slice(0, 70);
      const selectedNotes = notes.value.trim().slice(0, 800);
      const body = [
        'Hello Rosie Dazzlers,', '',
        'Enquiry: ' + selectedTopic,
        'Vehicle: ' + selectedSize,
        'Town/area: ' + (selectedTown || 'Not provided'),
        '', 'Question or concerns:', selectedNotes || '(Please add details here)',
        '', 'I understand this email is a request, not a confirmed booking or quote.'
      ].join('\n');
      link.href = 'mailto:info@rosiedazzlers.ca?subject=' +
        encodeURIComponent('Rosie Dazzlers — ' + selectedTopic) +
        '&body=' + encodeURIComponent(body);
      summary.textContent = selectedTopic + ' · ' + selectedSize;
      count.textContent = notes.value.length + ' of 800 characters';
    }

    form.addEventListener('input', updateDraft);
    form.addEventListener('change', updateDraft);
    form.addEventListener('submit', function (event) { event.preventDefault(); });
    form.addEventListener('reset', function () { window.setTimeout(updateDraft, 0); });
    updateDraft();
  }

  function initFaqSearch() {
    const input = document.getElementById('faqSearch');
    if (!input || input.dataset.build654Ready === '1') return;
    input.dataset.build654Ready = '1';

    const cards = Array.from(document.querySelectorAll('[data-faq-card]'));
    const sections = Array.from(document.querySelectorAll('[data-faq-section]'));
    const status = document.getElementById('faqResultsStatus');
    const clear = document.getElementById('faqClearSearch');
    const empty = document.getElementById('faqEmptyState');
    const resetEmpty = document.getElementById('faqResetEmpty');

    cards.forEach(function (card) {
      const button = card.querySelector('.faq-question');
      const answer = card.querySelector('.faq-answer');
      if (!button || !answer) return;
      button.addEventListener('click', function () {
        const isOpen = button.getAttribute('aria-expanded') === 'true';
        button.setAttribute('aria-expanded', String(!isOpen));
        answer.hidden = isOpen;
        const symbol = button.querySelector('span[aria-hidden="true"]');
        if (symbol) symbol.textContent = isOpen ? '+' : '−';
      });
    });

    function filter() {
      const query = input.value.trim().toLocaleLowerCase();
      let matches = 0;
      cards.forEach(function (card) {
        const found = !query || card.textContent.toLocaleLowerCase().includes(query);
        card.hidden = !found;
        if (found) matches += 1;
      });
      sections.forEach(function (section) {
        section.hidden = !Array.from(section.querySelectorAll('[data-faq-card]')).some(function (card) {
          return !card.hidden;
        });
      });
      status.textContent = query
        ? matches + ' of ' + cards.length + ' questions match your search'
        : 'Showing all ' + cards.length + ' questions';
      clear.hidden = !query;
      empty.hidden = matches !== 0;
    }

    function reset() {
      input.value = '';
      filter();
      input.focus();
    }
    input.form?.addEventListener('submit', function (event) { event.preventDefault(); });
    input.addEventListener('input', filter);
    clear.addEventListener('click', reset);
    resetEmpty.addEventListener('click', reset);
    filter();

    /* The visible, SEO-readable answers stay authoritative if API hydration fails. */
    fetch('/api/public_faqs', { cache: 'no-store' }).then(function (res) {
      return res.ok ? res.json() : null;
    }).then(function (data) {
      if (data?.ok && Array.isArray(data.items) && data.items.length) {
        document.documentElement.dataset.faqSource = data.source || 'api';
      }
    }).catch(function () {});
  }

  function init() {
    initContactDraft();
    initFaqSearch();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
