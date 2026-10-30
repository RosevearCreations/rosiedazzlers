import {
  quoteAttention704, summarizeQuoteInbox704, filterQuoteInbox704,
  bookingReview704, localFollowUp704, isUuid704,
  BOOKING_CONVERSION_CHECKS705, bookingConversionReadiness705
} from './quote-followup-v704.mjs';
import {
  FOLLOW_UP_COMPLETED_STAGE706, completedFollowUps706, quoteBookingEligibility706,
  customerConfirmationPreview706
} from './quote-booking-v706.mjs';

(() => {
  const $ = selector => document.querySelector(selector);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
  const money = cents => new Intl.NumberFormat('en-CA', {style:'currency',currency:'CAD'})
    .format((Number(cents) || 0) / 100);
  let rows = [];
  let selected = null;
  let editorDirty = false;
  let requestedQuoteId = new URLSearchParams(location.search).get('quote_id') || '';
  let verifiedBooking706 = null;
  let verifiedQuoteId706 = '';
  let bookingVerificationMessage706 = 'Enter a real booking ID and select Verify existing booking.';

  function verificationMatches706() {
    return Boolean(selected?.id && verifiedQuoteId706 === selected.id &&
      verifiedBooking706?.id === $('#qBooking').value.trim() &&
      $('#qCustomer').value.trim() === String(selected.customer_name || '').trim() &&
      $('#qStatus').value === selected.status &&
      Math.round(Number($('#qAccepted').value) * 100) === Number(selected.accepted_amount_cents));
  }

  function show(message, bad = false) {
    const box = $('#quoteStatus');
    box.style.display = message ? 'block' : 'none';
    box.className = 'notice ' + (bad ? 'bad' : 'ok');
    box.textContent = message || '';
  }
  function asLocal(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  }
  function asReadable(value) {
    const date = new Date(value);
    return value && Number.isFinite(date.getTime()) ? date.toLocaleString('en-CA', {
      dateStyle: 'medium', timeStyle: 'short'
    }) : 'not scheduled';
  }
  function beforeDiscard() {
    return !editorDirty || window.confirm('This quote has unsaved changes. Discard those changes?');
  }
  function updateBookingReview() {
    const review = editorDirty
      ? {ready:false,message:'Save the quote changes before reviewing booking conversion.'}
      : bookingReview704(selected);
    $('#bookingReview704').textContent = review.message;
    const checked = Object.fromEntries(BOOKING_CONVERSION_CHECKS705.map(key => [
      key, $('#qBookingCheck705_' + key).checked
    ]));
    const checklist = bookingConversionReadiness705(selected, checked);
    $('#bookingConversionStatus705').textContent = editorDirty
      ? 'Save the quote edits before checking booking readiness.'
      : checklist.reason;
    const link = $('#bookingLink');
    link.hidden = !checklist.ready && !selected?.booking_id;
    link.textContent = selected?.booking_id ? 'Review linked booking' : 'Open booking dashboard';
    const verified = verificationMatches706();
    const linked = verified && !editorDirty && selected?.booking_id === verifiedBooking706?.id;
    const preview = customerConfirmationPreview706(selected,verified ? verifiedBooking706 : null,{verified,linked});
    $('#qCustomerPreview706').value = preview.text;
    $('#qCopyConfirmation706').disabled = !preview.readyToCopy;
    $('#qBookingVerifyStatus706').textContent = verified ?
      `${bookingVerificationMessage706} ${linked ? 'The saved link matches.' : 'Save the quote link, then verify again for the customer draft.'}` :
      bookingVerificationMessage706;
  }
  function render() {
    const filter = $('#quoteFilter704').value;
    const search = $('#quoteSearch704').value;
    const visible = filterQuoteInbox704(rows, {filter, search});
    const counts = summarizeQuoteInbox704(rows);
    $('#quoteCount').textContent = `Showing ${visible.length} of ${rows.length} quote(s)`;
    $('#quoteSummary704').textContent =
      `Due: ${counts.due} · Scope review: ${counts.review} · Accepted/unlinked: ${counts.ready_to_book} · Scheduled: ${counts.scheduled} · Linked: ${counts.linked} · Follow-ups completed: ${completedFollowUps706(rows)}`;
    $('#quoteList').innerHTML = visible.length ? visible.map(row => {
      const bucket = quoteAttention704(row);
      return `<button class="quote-row ${selected?.id === row.id ? 'selected' : ''}" type="button" data-id="${esc(row.id)}">
        <strong>${esc(row.quote_number || row.customer_name || 'Quote')}</strong>
        <span>${esc(row.customer_name || 'No customer')} · ${esc(row.service_label || 'No service')}</span>
        <span class="muted">${esc(row.status || 'draft')} · ${money(row.quoted_amount_cents)} · ${Number(row.probability || 0)}%</span>
        <span class="muted">Next: ${esc(asReadable(row.next_follow_up_at))} · ${esc(bucket.replaceAll('_', ' '))}</span>
      </button>`;
    }).join('') : '<div class="notice">No quotes match this search and follow-up filter.</div>';
    $('#quoteSnapshot').innerHTML = filterQuoteInbox704(rows).slice(0, 8)
      .map(row => `<div class="summary-item"><strong>${esc(row.customer_name || row.quote_number || 'Quote')}</strong>
        <div class="muted">${esc(row.status)} · ${money(row.quoted_amount_cents)} · ${esc(row.follow_up_stage || 'No follow-up stage')}</div>
      </div>`).join('') || '<div class="summary-item muted">No pipeline rows.</div>';
  }
  function fill(row = {}) {
    selected = row.id ? row : null;
    verifiedBooking706 = null;
    verifiedQuoteId706 = '';
    bookingVerificationMessage706 = 'Enter a real booking ID and select Verify existing booking.';
    $('#qId').value = row.id || '';
    $('#qNumber').value = row.quote_number || '';
    $('#qStatus').value = row.status || 'draft';
    $('#qCustomer').value = row.customer_name || '';
    $('#qTown').value = row.town || '';
    $('#qService').value = row.service_label || '';
    $('#qQuoted').value = ((Number(row.quoted_amount_cents) || 0) / 100).toFixed(2);
    $('#qAccepted').value = ((Number(row.accepted_amount_cents) || 0) / 100).toFixed(2);
    $('#qProbability').value = Number(row.probability || 0);
    $('#qSource').value = row.source_channel || '';
    $('#qFollowStage').value = row.follow_up_stage || '';
    $('#qNextFollow').value = asLocal(row.next_follow_up_at);
    $('#qLead').value = row.lead_id || '';
    $('#qCustomerId').value = row.customer_id || '';
    $('#qBooking').value = row.booking_id || '';
    $('#editorTitle').textContent = row.id
      ? `Editing ${row.quote_number || row.customer_name || 'quote'}` : 'New quote';
    editorDirty = false;
    for (const key of BOOKING_CONVERSION_CHECKS705) $('#qBookingCheck705_' + key).checked = false;
    updateBookingReview();
    render();
  }
  async function load() {
    const response = await fetch('/api/admin/quote_pipeline_list', {credentials:'include',cache:'no-store'});
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) throw new Error(data.error || 'Could not load quote pipeline.');
    rows = Array.isArray(data.rows) ? data.rows : [];
    if (requestedQuoteId) {
      const requested = rows.find(row => row.id === requestedQuoteId);
      requestedQuoteId = '';
      if (requested) { fill(requested); return; }
      show('The linked quote could not be found in the current pipeline.', true);
    }
    if (selected?.id) selected = rows.find(row => row.id === selected.id) || null;
    if (selected) fill(selected);
    else render();
  }
  $('#quoteFilter704').add(new Option('Follow-up completed', 'completed_follow_up'));
  $('#quoteSearch704').addEventListener('input', render);
  $('#quoteFilter704').addEventListener('change', render);
  for (const key of BOOKING_CONVERSION_CHECKS705) {
    $('#qBookingCheck705_' + key).addEventListener('change', updateBookingReview);
  }
  $('#quoteList').addEventListener('click', event => {
    const button = event.target.closest('[data-id]');
    if (!button) return;
    const row = rows.find(item => item.id === button.dataset.id);
    if (row && beforeDiscard()) {
      fill(row);
      show('');
    }
  });
  $('#quoteForm').addEventListener('input', () => {
    editorDirty = true;
    // Any changed booking/customer/amount/status field makes a prior readback stale.
    if (!verificationMatches706()) {
      verifiedBooking706 = null;
      verifiedQuoteId706 = '';
      bookingVerificationMessage706 = 'Quote details changed. Verify the saved quote and booking again.';
    }
    updateBookingReview();
  });
  $('#newQuoteBtn').addEventListener('click', () => {
    if (!beforeDiscard()) return;
    fill({status:'draft',probability:25});
    show('');
  });
  $('#newWebsiteQuoteBtn703')?.addEventListener('click', () => {
    if (!beforeDiscard()) return;
    fill({status:'requested',probability:0,source_channel:'website_booking_quote_email',
      follow_up_stage:'awaiting_scope_review'});
    show('Unsaved website enquiry prepared. Copy the actual customer and service details from their received email, then save explicitly.');
    $('#qCustomer').focus();
  });
  $('#followUpTomorrow704').addEventListener('click', () => {
    $('#qNextFollow').value = localFollowUp704();
    $('#qFollowStage').value = 'staff_follow_up_due';
    editorDirty = true;
    updateBookingReview();
    show('Tomorrow at 9:00 AM is entered but not saved. Review and choose Save quote.');
  });
  $('#qFollowComplete706').addEventListener('click', () => {
    if (!selected?.id) return show('Save the quote before completing a follow-up.',true);
    if (!window.confirm('Has this customer follow-up actually been completed? This only prepares an unsaved staff status change.')) return;
    $('#qFollowStage').value = FOLLOW_UP_COMPLETED_STAGE706;
    $('#qNextFollow').value = '';
    editorDirty = true;
    updateBookingReview();
    show('Follow-up completion prepared (unsaved). Select Save quote to record it; no customer message was sent.');
  });
  $('#qBookingVerify706').addEventListener('click', async () => {
    const id = $('#qBooking').value.trim();
    const eligibility = quoteBookingEligibility706(selected);
    if (!eligibility.ready) return show(eligibility.reason,true);
    if (!isUuid704(id)) return show('Enter a valid existing booking UUID before verification.',true);
    if ($('#qCustomer').value.trim() !== String(selected.customer_name||'').trim() ||
        $('#qStatus').value !== selected.status ||
        Math.round(Number($('#qAccepted').value)*100) !== Number(selected.accepted_amount_cents))
      return show('Save customer name, quote status and accepted amount before booking verification.',true);
    verifiedBooking706 = null;
    verifiedQuoteId706 = '';
    bookingVerificationMessage706 = 'Checking the live booking and quote records…';
    updateBookingReview();
    try {
      const params = new URLSearchParams({quote_id:selected.id,booking_id:id});
      const response = await fetch(`/api/admin/quote_booking_verify?${params}`,{credentials:'include',cache:'no-store'});
      const data = await response.json().catch(()=>({}));
      if (!response.ok || !data.ok || !data.verified || data.booking?.id !== id)
        throw new Error(data.error || 'The booking could not be verified.');
      // Reject a response to an old selection if staff switched quotes during the request.
      if (selected?.id !== data.quote_id || $('#qBooking').value.trim() !== id) return;
      verifiedBooking706 = data.booking;
      verifiedQuoteId706 = data.quote_id;
      bookingVerificationMessage706 = `Verified existing booking ${id}.`;
      updateBookingReview();
      show('Read-only booking verification passed. A new link is not saved until Save quote.');
    } catch(error) {
      bookingVerificationMessage706 = error.message || 'Booking verification failed.';
      updateBookingReview();
      show(bookingVerificationMessage706,true);
    }
  });
  $('#qCopyConfirmation706').addEventListener('click', async () => {
    if (!verificationMatches706() || editorDirty || selected?.booking_id !== verifiedBooking706?.id ||
      verifiedBooking706?.status !== 'confirmed') return show('Verify a saved, confirmed booking first.',true);
    try {
      await navigator.clipboard.writeText($('#qCustomerPreview706').value);
      show('Customer draft copied. Review privately before sending; no message was sent here.');
    } catch { show('Clipboard unavailable. Copy the read-only preview manually.',true); }
  });
  $('#refreshQuotes').addEventListener('click', () => {
    if (!beforeDiscard()) return;
    load().then(() => show('Quotes refreshed.')).catch(error => show(error.message, true));
  });
  $('#quoteForm').addEventListener('submit', async event => {
    event.preventDefault();
    const rawBookingId = $('#qBooking').value.trim();
    if (rawBookingId && !isUuid704(rawBookingId)) {
      show('The booking ID must be a valid UUID from an existing booking. No changes were saved.', true);
      $('#qBooking').focus();
      return;
    }
    if (rawBookingId && rawBookingId !== String(selected?.booking_id || '') && !verificationMatches706()) {
      show('Verify this real booking against the saved accepted quote before linking it. No changes were saved.',true);
      $('#qBooking').focus();
      return;
    }
    const body = {
      id: $('#qId').value || null, quote_number: $('#qNumber').value,
      status: $('#qStatus').value, customer_name: $('#qCustomer').value,
      town: $('#qTown').value, service_label: $('#qService').value,
      quoted_amount_cents: Math.round((Number($('#qQuoted').value) || 0) * 100),
      accepted_amount_cents: Math.round((Number($('#qAccepted').value) || 0) * 100),
      probability: Number($('#qProbability').value) || 0,
      source_channel: $('#qSource').value, follow_up_stage: $('#qFollowStage').value,
      next_follow_up_at: $('#qNextFollow').value ? new Date($('#qNextFollow').value).toISOString() : null,
      lead_id: $('#qLead').value || null, customer_id: $('#qCustomerId').value || null,
      booking_id: rawBookingId || null
    };
    try {
      show('Saving…');
      const response = await fetch('/api/admin/quote_pipeline_save', {
        method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},
        body:JSON.stringify(body)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok || !data.row?.id) throw new Error(data.error || data.details || 'Could not save quote.');
      selected = data.row;
      editorDirty = false;
      await load();
      show('Quote saved. Follow-up and booking review are staff-controlled.');
    } catch (error) {
      show(error.message || 'Could not save quote.', true);
    }
  });
  window.AdminShell.boot({pageKey:'admin-quotes',onReady:async () => {
    try {
      await load();
      if (!selected) fill({status:'draft',probability:25});
    } catch (error) { show(error.message, true); }
  }});
})();
