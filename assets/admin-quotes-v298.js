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
  let reconciliation707 = null;
  let reconciliationQuote707 = '';
  let handoff708 = null;
  let handoffQuote708 = '';
  let outcome709 = null;
  let outcomeQuote709 = '';
  let resolution710 = null;
  let resolutionQuote710 = '';
  let queue711 = null;
  let assignment711 = null;
  let assignmentQuote711 = '';
  let escalation712 = null;
  let escalationQuote712 = '';

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
    const ready707 = Boolean(reconciliation707?.notification_ready &&
      reconciliationQuote707 === selected?.id && !editorDirty &&
      reconciliation707.booking_id === selected?.booking_id && verified);
    const ready708 = Boolean(handoff708?.ready_to_copy && handoffQuote708 === selected?.id &&
      handoff708.booking_id === selected?.booking_id && !editorDirty);
    $('#qCopyConfirmation706').disabled = !preview.readyToCopy || !ready707 || !ready708;
    $('#qHandoffPrepare708').disabled = !handoff708?.ready_to_prepare || !ready707 ||
      handoffQuote708 !== selected?.id || editorDirty;
    $('#qHandoffFollowup708').disabled = !handoff708?.change_followup_needed ||
      handoffQuote708 !== selected?.id || editorDirty;
    const reportsContact709 = ['manual_attempt_failed','manual_attempt_reported_unverified',
      'customer_replied_staff_reported'].includes($('#qOutcomeType709').value);
    $('#qOutcomeRecord709').disabled = !outcome709?.can_record_followup ||
      (reportsContact709 && !outcome709?.can_record_contact_outcome) ||
      outcomeQuote709 !== selected?.id || outcome709?.booking_id !== selected?.booking_id || editorDirty;
    const reason710 = $('#qResolutionReason710').value;
    const closureAllowed710 = reason710 === 'no_contact_required' ? resolution710?.can_close_no_contact :
      reason710 === 'contact_not_permitted' ? resolution710?.can_close_opt_out : resolution710?.can_close_reply;
    const currentReview710 = resolution710 && resolutionQuote710 === selected?.id &&
      resolution710.booking_id === selected?.booking_id && !editorDirty;
    const note710 = $('#qResolutionNote710').value.trim();
    $('#qResolutionClose710').disabled = !currentReview710 || !closureAllowed710 ||
      note710.length < 12 || note710.length > 300;
    $('#qResolutionReopen710').disabled = !currentReview710 || !resolution710.can_reopen ||
      note710.length < 12 || note710.length > 300;
    const assignmentCurrent711 = assignment711 && assignmentQuote711 === selected?.id &&
      assignment711.booking_id === selected?.booking_id && !editorDirty;
    $('#qAssign711').disabled = !assignmentCurrent711 || !assignment711.can_assign || !$('#qAssignee711').value;
    $('#qUnassign711').disabled = !assignmentCurrent711 || !assignment711.can_unassign;
    $('#qConsentRecheck711').disabled = !assignmentCurrent711 || !assignment711.can_recheck;
    const currentEscalation712 = escalation712 && escalationQuote712 === selected?.id &&
      escalation712.booking_id === selected?.booking_id && !editorDirty;
    const note712 = $('#qEscalationNote712').value.trim();
    const noteReady712 = note712.length >= 12 && note712.length <= 300;
    $('#qEscalate712').disabled = !currentEscalation712 || !escalation712.can_escalate || !noteReady712;
    $('#qOwnerReview712').disabled = !currentEscalation712 || !escalation712.can_review_owner ||
      !escalation712.manager_review_allowed || !noteReady712;
    $('#qAuditClose712').disabled = !currentEscalation712 || !escalation712.can_close_audit ||
      !escalation712.manager_review_allowed || !noteReady712;
    $('#qAuditReopen712').disabled = !currentEscalation712 || !escalation712.can_reopen_audit ||
      !escalation712.manager_review_allowed || !noteReady712;
    $('#qReconcileRecord707').disabled = !reconciliation707?.ready_to_record || editorDirty ||
      reconciliationQuote707 !== selected?.id;
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
    renderAging711();
  }
  function renderAging711(){
    if(!queue711)return;
    const count=queue711.summary||{};
    $('#qAgingSummary711').textContent=`${count.total||0} open quotes · ${count.overdue||0} overdue (${count.critical||0} aged 3+ days) · ${count.unassigned||0} without a staff owner. `+
      'Queue overview is NOT a live consent verification.'+
      (queue711.historical_records_may_be_truncated?' Historical records are limited; inspect the selected case.':'');
    $('#qAgingQueue711').innerHTML=(queue711.items||[]).slice(0,30).map(item=>
      `<button class="quote-row ${selected?.id===item.quote_id?'selected':''}" type="button" data-quote-id="${esc(item.quote_id)}">
      <strong>${esc(item.quote_number)} · ${esc(item.bucket.replaceAll('_',' '))}</strong>
      <span>Age: ${item.age_days} day(s) · Due: ${esc(asReadable(item.due_at))}</span>
      <span>${esc(item.assigned_staff_name||'Unassigned')} · ${item.booking_id?'Select for live consent recheck':'No linked booking'}</span>
      </button>`).join('')||'<p class="muted">No open saved quotes in the current limited queue.</p>';
  }
  function fill(row = {}) {
    selected = row.id ? row : null;
    verifiedBooking706 = null;
    verifiedQuoteId706 = '';
    bookingVerificationMessage706 = 'Enter a real booking ID and select Verify existing booking.';
    reconciliation707 = null;
    reconciliationQuote707 = '';
    handoff708 = null;
    handoffQuote708 = '';
    outcome709 = null;
    outcomeQuote709 = '';
    resolution710 = null;
    resolutionQuote710 = '';
    assignment711 = null;
    assignmentQuote711 = '';
    escalation712 = null;
    escalationQuote712 = '';
    $('#qEscalationNote712').value = '';
    $('#qEscalationStatus712').textContent = 'Select a linked quote to inspect its overdue review and current audit.';
    $('#qEscalationHistory712').textContent = 'No live escalation audit checked yet.';
    $('#qAssignee711').value = '';
    $('#qAssignmentStatus711').textContent = 'Refresh this linked quote for current assignment and consent checks.';
    $('#qAssignmentHistory711').textContent = 'No assignment history checked yet.';
    $('#qOutcomeStatus709').textContent = 'Check the current consent, booking and staff outcome history.';
    $('#qOutcomeHistory709').textContent = 'No communication outcome checked yet.';
    $('#qResolutionStatus710').textContent = 'Select a saved quote and refresh the live follow-up review.';
    $('#qConsentAudit710').textContent = 'No audit readback yet.';
    $('#qResolutionHistory710').textContent = 'No closure history checked yet.';
    $('#qResolutionNote710').value = '';
    $('#qHandoffStatus708').textContent = 'Select and save a quote, then check the live customer permission.';
    $('#qHandoffHistory708').textContent = 'No handoff or change follow-up checked yet.';
    $('#qReconcileStatus707').textContent = 'Select a saved quote, then check the live booking link.';
    $('#qReconcileHistory707').textContent = 'No live confirmation history checked yet.';
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
    if(selected?.booking_id){void inspectAssignment711();void inspectEscalation712();}
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
    reconciliation707 = null;
    reconciliationQuote707 = '';
    handoff708 = null;
    handoffQuote708 = '';
    outcome709 = null;
    outcomeQuote709 = '';
    assignment711 = null;
    assignmentQuote711 = '';
    escalation712 = null;
    escalationQuote712 = '';
    $('#qEscalationStatus712').textContent = 'Unsaved quote changes; save and refresh the escalation audit.';
    $('#qAssignmentStatus711').textContent = 'Unsaved quote changes. Save and recheck the live staff assignment.';
    $('#qOutcomeStatus709').textContent = 'Quote edited; save and recheck current consent before reporting an outcome.';
    $('#qOutcomeHistory709').textContent = 'History must be refreshed after saving.';
    $('#qHandoffStatus708').textContent = 'Unsaved edits. Save, recheck confirmation and permission.';
    $('#qHandoffHistory708').textContent = 'History must be refreshed after saving.';
    $('#qReconcileStatus707').textContent = 'Unsaved quote changes. Save, then reconcile again.';
    $('#qReconcileHistory707').textContent = 'History must be refreshed after saving.';
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
      verifiedBooking706?.status !== 'confirmed' || !reconciliation707?.notification_ready ||
      reconciliationQuote707 !== selected?.id || !handoff708?.ready_to_copy ||
      handoffQuote708 !== selected?.id)
      return show('Verify the booking, current staff history and explicit customer permission first.',true);
    try {
      // Recheck consent and the actual saved source records at the moment staff copies.
      const params=new URLSearchParams({quote_id:selected.id,booking_id:selected.booking_id});
      const [handoffRes,reviewRes,bookingRes]=await Promise.all([
        fetch(`/api/admin/quote_customer_handoff?quote_id=${encodeURIComponent(selected.id)}`,{credentials:'include',cache:'no-store'}),
        fetch(`/api/admin/quote_booking_reconcile?quote_id=${encodeURIComponent(selected.id)}`,{credentials:'include',cache:'no-store'}),
        fetch(`/api/admin/quote_booking_verify?${params}`,{credentials:'include',cache:'no-store'})
      ]);
      const [handoffNow,reviewNow,bookingNow]=await Promise.all([
        handoffRes.json().catch(()=>({})),reviewRes.json().catch(()=>({})),bookingRes.json().catch(()=>({}))
      ]);
      if(!handoffRes.ok||!reviewRes.ok||!bookingRes.ok||!handoffNow.ready_to_copy||
          handoffNow.quote_updated_at!==selected.updated_at||!reviewNow.notification_ready||
          !bookingNow.verified||bookingNow.booking?.status!=='confirmed'||
          handoffNow.booking_id!==selected.booking_id||bookingNow.booking?.id!==selected.booking_id || editorDirty)
        throw new Error('Live consent or booking details changed. Refresh the quote, verify and prepare a new handoff before copying.');
      const fresh=customerConfirmationPreview706(selected,bookingNow.booking,{verified:true,linked:true});
      if(!fresh.readyToCopy)throw new Error('The customer draft no longer matches the confirmed booking.');
      await navigator.clipboard.writeText(fresh.text);
      show('Customer draft copied. Review privately before sending; no message was sent here.');
    } catch(error) { show(error.message||'Clipboard unavailable. Recheck permission before manually copying.',true); }
  });
  async function reconcile707() {
    if (!selected?.id || editorDirty) return show('Save the quote before checking its live booking history.',true);
    const expectedId=selected.id;
    reconciliation707=null;
    reconciliationQuote707='';
    handoff708=null;
    handoffQuote708='';
    outcome709=null;
    outcomeQuote709='';
    $('#qOutcomeStatus709').textContent='Staff confirmation changed. Refresh current communication review.';
    $('#qHandoffStatus708').textContent='Recheck customer permission after staff reconciliation.';
    $('#qReconcileStatus707').textContent='Checking saved quote, booking and staff events…';
    updateBookingReview();
    try {
      const response=await fetch(`/api/admin/quote_booking_reconcile?quote_id=${encodeURIComponent(expectedId)}`,{
        credentials:'include',cache:'no-store'});
      const data=await response.json().catch(()=>({}));
      if(!response.ok||!data.ok)throw new Error(data.error||'Live reconciliation failed.');
      if(selected?.id!==expectedId || editorDirty)return;
      reconciliation707=data;
      reconciliationQuote707=expectedId;
      $('#qReconcileStatus707').textContent=data.notification_ready ?
        'Staff confirmation is current. Verify the booking again above to unlock the customer draft.' :
        `Not ready for customer notification: ${(data.issues||[]).join(' ') || 'Staff review required.'}`;
      const history=Array.isArray(data.history)?data.history:[];
      $('#qReconcileHistory707').textContent=history.length ? history.map(event=>
        `${new Date(event.created_at).toLocaleString('en-CA')} · ${event.actor_name || 'Staff'}${event.current?' · CURRENT':' · historical'}`
      ).join('\n') : 'No staff confirmation events recorded for this quote and booking.';
      updateBookingReview();
    } catch(error) {
      $('#qReconcileStatus707').textContent=error.message||'Live reconciliation unavailable.';
      $('#qReconcileHistory707').textContent='No verified history available.';
      updateBookingReview();
      show('Reconciliation failed. No notification is ready.',true);
    }
  }
  $('#qReconcileCheck707').addEventListener('click',reconcile707);
  $('#qReconcileRecord707').addEventListener('click',async () => {
    if(!selected?.id||editorDirty||!reconciliation707?.ready_to_record||
       reconciliationQuote707!==selected.id||reconciliation707.booking_id!==selected.booking_id)
      return show('First reconcile the saved quote and confirmed booking.',true);
    if(!window.confirm('Have we actually reviewed this confirmed booking, accepted quote, date, vehicle, service, site and customer terms? This records a staff history event only. No customer notification will be sent.'))return;
    const quoteId=selected.id,bookingId=selected.booking_id;
    reconciliation707=null;
    updateBookingReview();
    try {
      const response=await fetch('/api/admin/quote_booking_reconcile',{
        method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({quote_id:quoteId,booking_id:bookingId,confirm_actual_review:true})
      });
      const data=await response.json().catch(()=>({}));
      if(!response.ok||!data.ok)throw new Error(data.error||'Staff history could not be recorded.');
      show('Staff confirmation recorded. No customer message was sent. Checking current readiness…');
      if(selected?.id===quoteId&&!editorDirty)await reconcile707();
    }catch(error){show(error.message||'Staff confirmation unavailable.',true);await reconcile707();}
  });
  async function inspectHandoff708(){
    if(!selected?.id||editorDirty)return show('Save the quote before checking current communication permission.',true);
    const expectedId=selected.id;
    handoff708=null;
    handoffQuote708='';
    $('#qHandoffStatus708').textContent='Checking linked customer profile, consent and handoff events…';
    updateBookingReview();
    try{
      const response=await fetch(`/api/admin/quote_customer_handoff?quote_id=${encodeURIComponent(expectedId)}`,{
        credentials:'include',cache:'no-store'});
      const data=await response.json().catch(()=>({}));
      if(!response.ok||!data.ok)throw new Error(data.error||'Customer permission review unavailable.');
      if(selected?.id!==expectedId||editorDirty)return;
      handoff708=data;
      handoffQuote708=expectedId;
      $('#qHandoffStatus708').textContent=data.ready_to_copy ?
        `Current ${data.channel} handoff prepared (staff-only); no customer message sent. Verify booking again to copy.` :
        `Handoff blocked or pending: ${(data.issues||[]).join(' ')||'Explicit staff preparation required.'}`;
      const handoffs=Array.isArray(data.handoff_history)?data.handoff_history:[];
      const changes=Array.isArray(data.followup_history)?data.followup_history:[];
      $('#qHandoffHistory708').textContent=[
        `Prepared handoffs: ${handoffs.length}`,
        ...handoffs.slice(0,8).map(e=>`${asReadable(e.created_at)} · ${e.actor_name||'Staff'} · prepared, not sent`),
        `Booking-change follow-ups: ${changes.length}`,
        ...changes.slice(0,8).map(e=>`${asReadable(e.created_at)} · ${e.actor_name||'Staff'} · review logged, not sent`)
      ].join('\n');
      updateBookingReview();
      await inspectOutcome709();
    }catch(error){
      $('#qHandoffStatus708').textContent=error.message||'Permission source unavailable; handoff blocked.';
      $('#qHandoffHistory708').textContent='No verified consent or handoff history available.';
      updateBookingReview();
      show('Could not verify current communication consent. No customer message was sent.',true);
    }
  }
  $('#qHandoffCheck708').addEventListener('click',inspectHandoff708);
  async function recordHandoff708(action){
    if(!selected?.id||editorDirty||handoffQuote708!==selected.id||
       handoff708?.booking_id!==selected.booking_id||
       (action==='prepare_handoff'&&!handoff708?.ready_to_prepare)||
       (action==='log_change_followup'&&!handoff708?.change_followup_needed))
      return show('Recheck the live quote, booking and permission before recording a staff action.',true);
    const message=action==='prepare_handoff' ?
      'Have we verified this customer’s current consent, channel and confirmed booking? This prepares a staff-only handoff record, not an email or SMS.' :
      'Have we reviewed the changed booking and identified a follow-up task? This records the internal follow-up only; no customer message is sent.';
    if(!window.confirm(message))return;
    const quoteId=selected.id,bookingId=selected.booking_id;
    handoff708=null;
    updateBookingReview();
    try{
      const response=await fetch('/api/admin/quote_customer_handoff',{
        method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({quote_id:quoteId,booking_id:bookingId,action,
          acknowledge_actual_staff_action:true})
      });
      const data=await response.json().catch(()=>({}));
      if(!response.ok||!data.ok)throw new Error(data.error||'Could not record staff handoff.');
      show('Staff record saved; customer not contacted. Rechecking current permission and history…');
      if(selected?.id===quoteId&&!editorDirty)await inspectHandoff708();
    }catch(error){show(error.message||'Staff record failed; nothing sent.',true);await inspectHandoff708();}
  }
  $('#qHandoffPrepare708').addEventListener('click',()=>recordHandoff708('prepare_handoff'));
  $('#qHandoffFollowup708').addEventListener('click',()=>recordHandoff708('log_change_followup'));
  $('#qOutcomeType709').addEventListener('change',updateBookingReview);
  async function inspectOutcome709(){
    if(!selected?.id||editorDirty)return show('Save the quote before refreshing staff communication outcomes.',true);
    const quoteId=selected.id;
    outcome709=null;
    outcomeQuote709='';
    $('#qOutcomeStatus709').textContent='Checking live customer consent and staff-reported outcome history…';
    updateBookingReview();
    try{
      const response=await fetch(`/api/admin/quote_communication_outcome?quote_id=${encodeURIComponent(quoteId)}`,{
        credentials:'include',cache:'no-store'});
      const data=await response.json().catch(()=>({}));
      if(!response.ok||!data.ok)throw new Error(data.error||'Cannot read communication audit.');
      if(selected?.id!==quoteId||editorDirty)return;
      outcome709=data;
      outcomeQuote709=quoteId;
      $('#qOutcomeStatus709').textContent=[
        data.consent_alerts?.length?'CONSENT / HANDOFF ALERT: '+data.consent_alerts.join(' '):'No detected consent drift from recorded handoff.',
        data.requires_followup?'Staff follow-up remains needed.':'No open follow-up detected from current staff records.',
        data.can_record_contact_outcome?'Current consent and prepared handoff permit a staff outcome report.':
          'New contact attempts cannot be recorded as eligible until consent and handoff are current.'
      ].join(' ');
      $('#qOutcomeHistory709').textContent=(data.history||[]).length?
        data.history.slice(0,12).map(e=>`${asReadable(e.created_at)} · ${e.actor_name||'Staff'} · ${e.status.replaceAll('_',' ')}${e.current?' · current':' · historical'} (staff report, delivery unverified)`).join('\n'):
        'No manual communication outcomes recorded. No customer was contacted by this panel.';
      updateBookingReview();
    }catch(error){
      $('#qOutcomeStatus709').textContent=error.message||'Live consent check failed. Actions blocked.';
      $('#qOutcomeHistory709').textContent='Outcome history unavailable. Do not infer delivery or consent.';
      updateBookingReview();
    }
  }
  $('#qOutcomeCheck709').addEventListener('click',inspectOutcome709);
  $('#qOutcomeRecord709').addEventListener('click',async()=>{
    if(!selected?.id||editorDirty||outcomeQuote709!==selected.id||
      outcome709?.booking_id!==selected.booking_id)return show('Refresh live communication state first.',true);
    const status=$('#qOutcomeType709').value;
    const reportsContact=['manual_attempt_failed','manual_attempt_reported_unverified',
      'customer_replied_staff_reported'].includes(status);
    if(!outcome709?.can_record_followup||(reportsContact&&!outcome709?.can_record_contact_outcome))
      return show('Current booking, consent or staff handoff blocks a contact report.',true);
    if(!window.confirm(`Are we recording an ACTUAL staff-observed outcome (${status.replaceAll('_',' ')})? `+
      'This is unverified staff history, NOT proof of provider delivery. No email or SMS will be sent.'))return;
    const quoteId=selected.id;
    const snapshot=outcome709;
    outcome709=null;
    resolution710=null;
    $('#qResolutionStatus710').textContent='Staff outcome may have changed closure eligibility. Refresh the Build 710 audit.';
    updateBookingReview();
    try{
      const response=await fetch('/api/admin/quote_communication_outcome',{
        method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({quote_id:quoteId,booking_id:snapshot.booking_id,status,
          expected_marker:snapshot.marker,expected_handoff_event_id:snapshot.handoff_event_id,
          acknowledge_staff_report:true})
      });
      const data=await response.json().catch(()=>({}));
      if(!response.ok||!data.ok)throw new Error(data.error||'Staff report could not be saved.');
      show('Staff-only outcome saved. No customer message was sent; delivery remains unverified.');
    }catch(error){show(error.message||'Staff record failed. No message sent.',true);}
    if(selected?.id===quoteId&&!editorDirty)await inspectOutcome709();
  });
  $('#qResolutionReason710').addEventListener('change',updateBookingReview);
  $('#qResolutionNote710').addEventListener('input',updateBookingReview);
  async function inspectResolution710(){
    if(!selected?.id||editorDirty)return show('Save the quote before checking current follow-up resolution.',true);
    const quoteId=selected.id;
    resolution710=null;
    resolutionQuote710='';
    $('#qResolutionStatus710').textContent='Rechecking saved booking, consent history and staff closure records…';
    updateBookingReview();
    try{
      const response=await fetch(`/api/admin/quote_followup_resolution?quote_id=${encodeURIComponent(quoteId)}`,{
        credentials:'include',cache:'no-store'});
      const data=await response.json().catch(()=>({}));
      if(!response.ok||!data.ok)throw new Error(data.error||'Could not read current follow-up audit.');
      if(selected?.id!==quoteId||editorDirty)return;
      resolution710=data;
      resolutionQuote710=quoteId;
      $('#qResolutionStatus710').textContent=[
        data.closure_current?'CLOSED by a current staff-only decision.':'OPEN: a current closure is not on record.',
        data.requires_followup?'Staff follow-up requires review.':'No unresolved follow-up on the current readback.',
        data.current_consent_allowed?'Live consent currently permits the prepared channel.':
          'Live permission blocks contact. Do not attempt customer contact.',
        ...(data.consent_alerts||[])
      ].join(' ');
      $('#qConsentAudit710').textContent=(data.consent_audit||[]).length?
        data.consent_audit.slice(0,20).map(e=>
          `${e.is_live?'LIVE NOW':asReadable(e.created_at)} · ${e.actor_name||'Staff'} · ${e.channel}\n  ${e.changes.join('; ')||'No snapshot-marker changes detected'}`
        ).join('\n'):
        'No retained staff snapshot. Only live consent is authoritative.';
      $('#qResolutionHistory710').textContent=(data.history||[]).length?
        data.history.slice(0,15).map(e=>`${asReadable(e.created_at)} · ${e.actor_name||'Staff'} · ${e.action}${e.reason?' ('+e.reason.replaceAll('_',' ')+')':''}${e.current?' · current':' · historical'}`).join('\n'):
        'No reviewed follow-up closure or reopening is on record.';
      updateBookingReview();
    }catch(error){
      $('#qResolutionStatus710').textContent=error.message||'Live follow-up source unavailable. Closure blocked.';
      $('#qConsentAudit710').textContent='Consent history unavailable. Do not infer permission.';
      $('#qResolutionHistory710').textContent='Closure history unavailable; no action should be assumed.';
      updateBookingReview();
    }
  }
  $('#qResolutionCheck710').addEventListener('click',inspectResolution710);
  async function recordResolution710(action){
    if(!selected?.id||editorDirty||resolutionQuote710!==selected.id||
      resolution710?.booking_id!==selected.booking_id)
      return show('Refresh the live follow-up audit before recording a staff decision.',true);
    const reason=action==='close'?$('#qResolutionReason710').value:'';
    const note=$('#qResolutionNote710').value.trim();
    const allowed=action==='reopen'?resolution710.can_reopen:
      reason==='no_contact_required'?resolution710.can_close_no_contact:
      reason==='contact_not_permitted'?resolution710.can_close_opt_out:resolution710.can_close_reply;
    if(!allowed||note.length<12||note.length>300)
      return show('A permitted decision and a 12–300 character review rationale are required.',true);
    if(!window.confirm(`Have we actually reviewed the ${action==='close'?'closure':'reopening'} reason? `+
      'This saves an internal event only. No email, SMS or booking update occurs, and delivery is NOT verified.'))return;
    const quoteId=selected.id,snapshot=resolution710;
    resolution710=null;
    updateBookingReview();
    try{
      const response=await fetch('/api/admin/quote_followup_resolution',{
        method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({quote_id:quoteId,booking_id:snapshot.booking_id,action,reason,note,
          expected_marker:snapshot.marker,
          expected_latest_outcome_event_id:snapshot.latest_outcome_event_id,
          expected_latest_resolution_event_id:snapshot.latest_resolution_event_id,
          acknowledge_staff_review:true})
      });
      const data=await response.json().catch(()=>({}));
      if(!response.ok||!data.ok)throw new Error(data.error||'Staff decision could not be saved.');
      show('Staff-only follow-up decision recorded. No message sent; provider delivery remains unverified.');
    }catch(error){show(error.message||'Follow-up review not saved. No message sent.',true);}
    if(selected?.id===quoteId&&!editorDirty)await inspectResolution710();
  }
  $('#qResolutionClose710').addEventListener('click',()=>recordResolution710('close'));
  $('#qResolutionReopen710').addEventListener('click',()=>recordResolution710('reopen'));
  async function inspectQueue711(){
    $('#qAgingSummary711').textContent='Loading current saved quote ages and staff assignment events…';
    try{
      const response=await fetch('/api/admin/quote_followup_queue',{credentials:'include',cache:'no-store'});
      const data=await response.json().catch(()=>({}));
      if(!response.ok||!data.ok)throw Error(data.error||'Could not load the staff follow-up queue.');
      queue711=data;
      renderAging711();
    }catch(error){
      queue711=null;
      $('#qAgingSummary711').textContent=error.message||'Queue unavailable. No consent status can be inferred.';
      $('#qAgingQueue711').textContent='Refresh failed; do not assume work was assigned or consent was checked.';
    }
  }
  $('#qAgingRefresh711').addEventListener('click',inspectQueue711);
  $('#qAgingQueue711').addEventListener('click',event=>{
    const button=event.target.closest('[data-quote-id]');
    if(!button||!beforeDiscard())return;
    const row=rows.find(r=>r.id===button.dataset.quoteId);
    if(row){fill(row);show('Selected saved quote for live follow-up review.');}
    else show('Quote is no longer in the current pipeline. Refresh before acting.',true);
  });
  async function inspectAssignment711(){
    if(!selected?.id||editorDirty)return;
    const quoteId=selected.id;
    assignment711=null;
    assignmentQuote711='';
    $('#qAssignmentStatus711').textContent='Checking current booking, customer permission and staff assignments…';
    updateBookingReview();
    try{
      const [detailResponse,staffResponse]=await Promise.all([
        fetch(`/api/admin/quote_followup_queue?quote_id=${encodeURIComponent(quoteId)}`,{
          credentials:'include',cache:'no-store'}),
        fetch('/api/admin/staff_assignable_list',{method:'POST',credentials:'include',
          headers:{'Content-Type':'application/json'},body:JSON.stringify({include_admins:true})})
      ]);
      const data=await detailResponse.json().catch(()=>({}));
      if(!detailResponse.ok||!data.ok)throw Error(data.error||'Could not verify live staff assignment.');
      const staff=await staffResponse.json().catch(()=>({}));
      if(selected?.id!==quoteId||editorDirty)return;
      assignment711=data;
      assignmentQuote711=quoteId;
      const select=$('#qAssignee711');
      const available=staffResponse.ok&&staff.ok?staff.staff_users.filter(p=>p.is_active&&
        (p.can_manage_bookings||p.role_code==='admin')):[];
      select.replaceChildren(new Option('Choose active booking-authorized staff',''));
      for(const person of available)select.add(new Option(`${person.full_name||'Staff'} · ${person.role_code}`,person.id));
      select.value=available.some(p=>p.id===data.assigned_staff_user_id)?data.assigned_staff_user_id:'';
      $('#qAssignmentStatus711').textContent=[
        data.closure_current?'Current follow-up is closed; assigning is blocked.':'Follow-up remains a staff-only task.',
        data.assigned_staff_name?'Owner: '+data.assigned_staff_name+'.':'No staff owner assigned.',
        data.assignment_current?'Assignment snapshot is current.':'Assignment requires a live recheck.',
        data.recheck_current?'A staff consent recheck is current.':'A new live consent recheck is needed.',
        data.current_consent_allowed?'Live opt-in currently permits the prepared channel.':
          'Current consent does not permit customer contact.',
        ...data.consent_alerts
      ].join(' ');
      $('#qAssignmentHistory711').textContent=(data.history||[]).length?
        data.history.slice(0,15).map(e=>`${asReadable(e.created_at)} · ${e.actor_name||'Staff'} · ${e.action.replaceAll('_',' ')}${e.assigned_staff_name?' · '+e.assigned_staff_name:''}`).join('\n'):
        'No assignment or consent recheck event exists yet.';
      if(!staffResponse.ok)$('#qAssignmentStatus711').textContent+=' Staff directory unavailable; reassignment disabled.';
      updateBookingReview();
    }catch(error){
      $('#qAssignmentStatus711').textContent=error.message||'Live assignment source unavailable. Actions blocked.';
      $('#qAssignmentHistory711').textContent='No source readback. Do not assume permission or assignment.';
      updateBookingReview();
    }
  }
  $('#qAssignee711').addEventListener('change',updateBookingReview);
  async function recordAssignment711(action){
    if(!selected?.id||editorDirty||assignmentQuote711!==selected.id||
      assignment711?.booking_id!==selected.booking_id)
      return show('Refresh the live staff assignment before recording an action.',true);
    const id=$('#qAssignee711').value;
    const allowed=action==='assign'?assignment711.can_assign&&id:
      action==='unassign'?assignment711.can_unassign:assignment711.can_recheck;
    if(!allowed)return show('The current linked booking or staff assignment does not permit this action.',true);
    if(!window.confirm(`Have we actually reviewed this ${action.replaceAll('_',' ')} action? `+
      'Only a staff event is recorded. No email, SMS, booking change or delivery proof occurs.'))return;
    const snapshot=assignment711,quoteId=selected.id;
    assignment711=null;
    updateBookingReview();
    try{
      const response=await fetch('/api/admin/quote_followup_queue',{
        method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({quote_id:quoteId,booking_id:snapshot.booking_id,action,
          assigned_staff_user_id:action==='assign'?id:null,
          expected_marker:snapshot.marker,
          expected_latest_outcome_event_id:snapshot.latest_outcome_event_id,
          expected_latest_resolution_event_id:snapshot.latest_resolution_event_id,
          expected_latest_assignment_event_id:snapshot.latest_assignment_event_id,
          acknowledge_staff_action:true})
      });
      const result=await response.json().catch(()=>({}));
      if(!response.ok||!result.ok)throw Error(result.error||'Staff action could not be saved.');
      show('Internal staff review saved. No customer contact was made.');
    }catch(error){show(error.message||'No staff action confirmed.',true);}
    if(selected?.id===quoteId&&!editorDirty){await inspectAssignment711();await inspectEscalation712();await inspectQueue711();}
  }
  $('#qAssign711').addEventListener('click',()=>recordAssignment711('assign'));
  $('#qUnassign711').addEventListener('click',()=>recordAssignment711('unassign'));
  $('#qConsentRecheck711').addEventListener('click',()=>recordAssignment711('recheck_consent'));
  async function inspectEscalation712(){
    if(!selected?.id||!selected.booking_id||editorDirty)return;
    const quoteId=selected.id;
    escalation712=null;
    escalationQuote712='';
    $('#qEscalationStatus712').textContent='Checking overdue date, assignment, consent and management review…';
    updateBookingReview();
    try{
      const res=await fetch(`/api/admin/quote_followup_escalation?quote_id=${encodeURIComponent(quoteId)}`,{
        credentials:'include',cache:'no-store'});
      const data=await res.json().catch(()=>({}));
      if(!res.ok||!data.ok)throw Error(data.error||'Could not load the live escalation audit.');
      if(selected?.id!==quoteId||editorDirty)return;
      escalation712=data;
      escalationQuote712=quoteId;
      $('#qEscalationStatus712').textContent=[
        data.overdue?`Overdue by ${data.overdue_days} day(s).`:'Not currently overdue.',
        data.assigned_staff_name?`Staff owner: ${data.assigned_staff_name}.`:'No assigned staff owner.',
        data.assignment_current?'Current assignment verified.':'Assignment is stale or missing.',
        data.recheck_current?'Current live consent recheck recorded.':'Record a fresh consent recheck before escalation.',
        data.escalation_active?'Escalation is active.':'No current active escalation.',
        data.owner_review_current?'Management ownership review recorded.':'Management review pending.',
        data.audit_closed?'Internal consent audit closed.':'Internal consent audit not closed.',
        data.consent_allowed?'Live contact permission currently exists.':'No live customer-contact permission.',
        data.manager_review_allowed?'Manager review controls are available for this account.':
          'Admin/senior detailer approval is required for manager actions.'
      ].join(' ');
      $('#qEscalationHistory712').textContent=(data.history||[]).length?
        data.history.map(e=>`${asReadable(e.created_at)} · ${e.actor_name||'Staff'} · ${e.action.replaceAll('_',' ')} · ${e.note||'No note'}`).join('\n'):
        'No escalation or internal audit event has been saved.';
      updateBookingReview();
    }catch(error){
      $('#qEscalationStatus712').textContent=error.message||'Live escalation audit unavailable; actions blocked.';
      $('#qEscalationHistory712').textContent='No live audit readback. Nothing can be assumed closed.';
      updateBookingReview();
    }
  }
  $('#qEscalationRefresh712').addEventListener('click',inspectEscalation712);
  $('#qEscalationNote712').addEventListener('input',updateBookingReview);
  async function recordEscalation712(action){
    if(!escalation712||escalationQuote712!==selected?.id||editorDirty||
      escalation712.booking_id!==selected?.booking_id)
      return show('Refresh the selected quote and current escalation audit first.',true);
    const note=$('#qEscalationNote712').value.trim();
    const allowed=action==='escalate'?escalation712.can_escalate:action==='review_owner'?escalation712.can_review_owner:
      action==='close_audit'?escalation712.can_close_audit:escalation712.can_reopen_audit;
    if(!allowed||note.length<12||note.length>300)return show('Current audit state and a 12–300 character review note are required.',true);
    if(!window.confirm('Record this actual internal staff decision? No email/SMS is sent, no customer is contacted, and consent is not granted.'))return;
    const snapshot=escalation712,quoteId=selected.id;
    escalation712=null;
    updateBookingReview();
    try{
      const res=await fetch('/api/admin/quote_followup_escalation',{method:'POST',credentials:'include',
        headers:{'Content-Type':'application/json'},body:JSON.stringify({quote_id:quoteId,
          booking_id:snapshot.booking_id,action,note,expected_marker:snapshot.marker,
          expected_latest_outcome_event_id:snapshot.latest_outcome_event_id,
          expected_latest_resolution_event_id:snapshot.latest_resolution_event_id,
          expected_latest_assignment_event_id:snapshot.latest_assignment_event_id,
          expected_latest_consent_recheck_event_id:snapshot.latest_consent_recheck_event_id,
          expected_latest_escalation_event_id:snapshot.latest_escalation_event_id,
          acknowledge_internal_review:true})});
      const data=await res.json().catch(()=>({}));
      if(!res.ok||!data.ok)throw Error(data.error||'Internal audit action could not be saved.');
      $('#qEscalationNote712').value='';
      show('Internal audit history recorded. No customer contact occurred.');
    }catch(error){show(error.message||'No audit action confirmed.',true);}
    if(selected?.id===quoteId&&!editorDirty)await inspectEscalation712();
  }
  $('#qEscalate712').addEventListener('click',()=>recordEscalation712('escalate'));
  $('#qOwnerReview712').addEventListener('click',()=>recordEscalation712('review_owner'));
  $('#qAuditClose712').addEventListener('click',()=>recordEscalation712('close_audit'));
  $('#qAuditReopen712').addEventListener('click',()=>recordEscalation712('reopen_audit'));
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
      await inspectQueue711();
      if (!selected) fill({status:'draft',probability:25});
    } catch (error) { show(error.message, true); }
  }});
})();
