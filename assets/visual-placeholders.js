// Build 216 — professional visual placeholders for missing/enrichment image slots and safe public-media recovery guidance.
(function attachRosieVisualPlaceholders(globalScope){
  const PALETTE = {
    service_card: ["#4d77ff", "#22c55e"], town_card: ["#f97316", "#facc15"], gallery_pair: ["#8b5cf6", "#ec4899"], seasonal_campaign: ["#14b8a6", "#f59e0b"], fleet: ["#38bdf8", "#1d4ed8"], incident_evidence: ["#64748b", "#334155"], review_proof: ["#facc15", "#f97316"], quote_pipeline: ["#22c55e", "#4d77ff"], booking_conversion: ["#4d77ff", "#14b8a6"], proof_of_work: ["#8b5cf6", "#38bdf8"], invoice_payment: ["#16a34a", "#facc15"], review_public_proof: ["#facc15", "#ec4899"], repeat_maintenance: ["#14b8a6", "#f59e0b"], live_customer_update: ["#22c55e", "#38bdf8"], private_staff_note: ["#64748b", "#1e293b"], video_update: ["#ec4899", "#8b5cf6"], production_test_centre: ["#4d77ff", "#14b8a6"], owner_attention: ["#f59e0b", "#ec4899"], customer_acknowledgement: ["#16a34a", "#38bdf8"], security_posture: ["#dc2626", "#0f766e"], media_recovery_alert: ["#f59e0b", "#dc2626"], secure_payment: ["#16a34a", "#2563eb"], daip_governance_gates: ["#0f766e", "#4d77ff"], customer_access_control: ["#2563eb", "#7c3aed"], daip_gate_c_technical_review: ["#0f766e", "#f59e0b"], social_analytics_connection_centre: ["#2563eb", "#0f766e"], daip_integration_boundary: ["#7c3aed", "#0f766e"], block_calendar: ["#16a34a", "#dc2626"], inventory_workbench: ["#2563eb", "#0f766e"], launch_readiness: ["#f59e0b", "#2563eb"], product_gallery: ["#8b5cf6", "#ec4899"], local_service_proof: ["#0f766e", "#2563eb"], inventory_merge: ["#7c3aed", "#0f766e"], inventory_audit: ["#0f766e", "#2563eb"], transactional_batch: ["#2563eb", "#16a34a"], seo_preflight: ["#f59e0b", "#2563eb"], default: ["#4d77ff", "#0f172a"]
  };

  const PHOTO_ASSETS = {
    service_card: '/assets/placeholders/service-photo.jpg',
    town_card: '/assets/placeholders/local-proof-photo.jpg',
    gallery_pair: '/assets/placeholders/product-gallery-photo.jpg',
    seasonal_campaign: '/assets/placeholders/service-photo.jpg',
    fleet: '/assets/placeholders/local-proof-photo.jpg',
    incident_evidence: '/assets/placeholders/workflow-photo.jpg',
    review_proof: '/assets/placeholders/local-proof-photo.jpg',
    quote_pipeline: '/assets/placeholders/workflow-photo.jpg',
    booking_conversion: '/assets/placeholders/service-photo.jpg',
    proof_of_work: '/assets/placeholders/service-photo.jpg',
    invoice_payment: '/assets/placeholders/launch-readiness-photo.jpg',
    review_public_proof: '/assets/placeholders/local-proof-photo.jpg',
    repeat_maintenance: '/assets/placeholders/service-photo.jpg',
    live_customer_update: '/assets/placeholders/workflow-photo.jpg',
    private_staff_note: '/assets/placeholders/workflow-photo.jpg',
    video_update: '/assets/placeholders/workflow-photo.jpg',
    production_test_centre: '/assets/placeholders/launch-readiness-photo.jpg',
    owner_attention: '/assets/placeholders/launch-readiness-photo.jpg',
    customer_acknowledgement: '/assets/placeholders/workflow-photo.jpg',
    security_posture: '/assets/placeholders/launch-readiness-photo.jpg',
    media_recovery_alert: '/assets/placeholders/workflow-photo.jpg',
    secure_payment: '/assets/placeholders/launch-readiness-photo.jpg',
    daip_governance_gates: '/assets/placeholders/workflow-photo.jpg',
    customer_access_control: '/assets/placeholders/workflow-photo.jpg',
    daip_gate_c_technical_review: '/assets/placeholders/workflow-photo.jpg',
    social_analytics_connection_centre: '/assets/placeholders/workflow-photo.jpg',
    daip_integration_boundary: '/assets/placeholders/workflow-photo.jpg',
    daip_intake_dry_run: '/assets/placeholders/workflow-photo.jpg',
    daip_phase1_readiness_review: '/assets/placeholders/workflow-photo.jpg',
    block_calendar: '/assets/placeholders/launch-readiness-photo.jpg',
    inventory_workbench: '/assets/placeholders/inventory-tools-photo.jpg',
    launch_readiness: '/assets/placeholders/launch-readiness-photo.jpg',
    product_gallery: '/assets/placeholders/product-gallery-photo.jpg',
    local_service_proof: '/assets/placeholders/local-proof-photo.jpg',
    inventory_merge: '/assets/placeholders/inventory-tools-photo.jpg',
    inventory_audit: '/assets/placeholders/inventory-tools-photo.jpg',
    transactional_batch: '/assets/placeholders/inventory-tools-photo.jpg',
    seo_preflight: '/assets/placeholders/launch-readiness-photo.jpg',
    default: '/assets/placeholders/service-photo.jpg'
  };
  function esc(v){ return String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
  function titleFor(type){
    return ({service_card:'Service photo coming soon',town_card:'Local proof image coming soon',gallery_pair:'Before/after image pending',seasonal_campaign:'Campaign graphic coming soon',fleet:'Fleet photo coming soon',incident_evidence:'Evidence photo private or pending',review_proof:'Review proof coming soon', quote_pipeline:'Quote pipeline graphic coming soon', booking_conversion:'Booking flow graphic coming soon', proof_of_work:'Proof-of-work visual coming soon', invoice_payment:'Invoice/payment graphic coming soon', review_public_proof:'Review proof visual coming soon', repeat_maintenance:'Maintenance visual coming soon', live_customer_update:'Live customer update coming soon', private_staff_note:'Private staff update', video_update:'Progress video coming soon', production_test_centre:'Guided production test visual', owner_attention:'Owner action visual', customer_acknowledgement:'Customer acknowledgement visual', security_posture:'Security posture visual', media_recovery_alert:'Public media recovery visual', secure_payment:'Secure payment status visual', daip_governance_gates:'DAIP governance gate visual', customer_access_control:'Customer account access visual', daip_gate_c_technical_review:'DAIP Gate C review visual', social_analytics_connection_centre:'Social and analytics connection visual', daip_integration_boundary:'DAIP connection boundary visual', block_calendar:'Availability calendar visual', inventory_workbench:'Inventory workbench visual', launch_readiness:'Launch readiness visual', product_gallery:'Product gallery visual', local_service_proof:'Local service proof visual', inventory_merge:'Reviewed inventory merge visual', inventory_audit:'Inventory audit history visual', transactional_batch:'Transactional batch update visual', seo_preflight:'Local SEO preflight visual', daip_intake_dry_run:'DAIP intake dry-run visual'}[type] || 'Image coming soon');
  }
  function detailFor(type){
    return ({service_card:'Replace with an approved Rosie-owned service image.',town_card:'Add a local, customer-approved Oxford/Norfolk proof photo.',gallery_pair:'Publish only after consent and image review.',seasonal_campaign:'Use a seasonal offer image or before/after card.',fleet:'Use an approved work vehicle or fleet service photo.',incident_evidence:'Only admin-approved customer-safe evidence is public.',review_proof:'Use an approved review screenshot or testimonial.', quote_pipeline:'Use a lead-to-booking funnel graphic or safe quote screenshot.', booking_conversion:'Use a booking calendar or mobile booking screenshot.', proof_of_work:'Use an approved start/finish photo set.', invoice_payment:'Use a clean invoice or receipt mockup.', review_public_proof:'Use an approved public review or before/after image.', repeat_maintenance:'Use a seasonal calendar or vehicle history screenshot.', live_customer_update:'Use an approved during-service image and customer-safe note.', private_staff_note:'Keep this evidence or discussion visible only to staff.', video_update:'Use a short approved progress video from protected storage.', production_test_centre:'Use a safe internal screenshot after acceptance testing; never include customer data or secrets.', owner_attention:'Use a safe owner action queue visual with customer names removed.', customer_acknowledgement:'Use a customer-safe confirmation or signed-summary visual with private details removed.', security_posture:'Use a safe security checklist visual. Never include data, tokens, keys, or customer information.', media_recovery_alert:'Use a safe image-repair visual. Verify the exact public R2 key before replacing a placeholder.', secure_payment:'Use a generic secure-payment or receipt graphic only. Never use a customer invoice, payment link, QR code, card details, or personal information.', daip_governance_gates:'Use a safe internal decision-and-gates diagram only. Never include customer records, media, bucket names, signed links, or credentials.', customer_access_control:'Use a safe account-support diagram that never shows customer names, emails, passwords, reset links, tokens, payments, or private media.', daip_gate_c_technical_review:'Use a safe technical-review and rollback diagram only. Never show customer data, media, external service details, credentials, paths, or URLs.', social_analytics_connection_centre:'Use a generic secure setup diagram only. Never show IDs, API keys, access tokens, browser diagnostics, customer data, or provider account screens.', daip_integration_boundary:'Use a safe governance boundary diagram only. Never show customer media, bucket names, paths, signed links, or credentials.', block_calendar:'Use a calendar illustration only; customer names and booking details must stay out of public placeholders.', inventory_workbench:'Use a generic inventory grid or tools-and-supplies image without supplier credentials or private purchase data.', launch_readiness:'Use a generic checklist or preflight illustration without environment values, secrets, or customer data.', product_gallery:'Replace with up to seven approved product images after alt text, consent, and quality review.', local_service_proof:'Replace with an approved Rosie-owned Oxford or Norfolk service photo with location-relevant alt text.', inventory_merge:'Use a generic survivor-and-duplicate diagram only. Do not include supplier receipts, private purchase details, customer data, or credentials.', inventory_audit:'Use a generic read-only history diagram. Never show credentials, private receipts, payment details, or customer information.', transactional_batch:'Use a generic all-or-nothing update diagram showing preview, validation, commit, audit, and rollback.', seo_preflight:'Use a generic local-search preflight illustration; never imply a guaranteed ranking or invent reviews, locations, or service claims.', daip_intake_dry_run:'Use a safe internal workflow photo-style placeholder showing metadata review only. Never enter real filenames, URLs, customer data, credentials, or real media details.'}[type] || 'Replace this placeholder with an approved image.');
  }
  function photoAsset(type){ return PHOTO_ASSETS[type] || PHOTO_ASSETS.default; }
  function svgData(type, label){
    const [a,b] = PALETTE[type] || PALETTE.default; const safe = esc(label || titleFor(type));
    const body = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="540" viewBox="0 0 900 540" role="img" aria-label="${safe}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient><filter id="s" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#020617" flood-opacity=".35"/></filter></defs><rect width="900" height="540" rx="42" fill="#07111f"/><rect x="28" y="28" width="844" height="484" rx="34" fill="url(#g)" opacity=".72"/><circle cx="716" cy="124" r="92" fill="#fff" opacity=".13"/><circle cx="190" cy="410" r="126" fill="#fff" opacity=".10"/><g filter="url(#s)"><rect x="94" y="104" width="712" height="332" rx="28" fill="#0f172a" opacity=".72" stroke="#fff" stroke-opacity=".22"/><path d="M170 340c84-94 139-128 199-80 47 38 86 28 137-21 81-78 139-48 220 105" fill="none" stroke="#eaf2ff" stroke-width="24" stroke-linecap="round" opacity=".88"/><circle cx="305" cy="202" r="42" fill="#eaf2ff" opacity=".92"/><text x="450" y="385" text-anchor="middle" fill="#f8fafc" font-family="Arial, sans-serif" font-size="34" font-weight="800">${safe}</text></g></svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(body);
  }
  function inferType(el){
    const explicit = el?.dataset?.visualPlaceholder || el?.dataset?.visualSlot || '';
    if (explicit) return explicit;
    const txt = (el?.textContent || el?.getAttribute?.('alt') || '').toLowerCase();
    if (/audit history|transaction history|merge history/.test(txt)) return 'inventory_audit';
    if (/duplicate merge|inventory merge|survivor row/.test(txt)) return 'inventory_merge';
    if (/transactional batch|all-or-nothing|bulk update/.test(txt)) return 'transactional_batch';
    if (/seo preflight|search console|local search/.test(txt)) return 'seo_preflight';
    if (/town|tillsonburg|woodstock|ingersoll|simcoe|delhi|port dover|norfolk|oxford/.test(txt)) return 'town_card';
    if (/before|after|gallery|proof/.test(txt)) return 'gallery_pair';
    if (/fleet|commercial|van|truck/.test(txt)) return 'fleet';
    if (/guided production|production test|acceptance test|test centre/.test(txt)) return 'production_test_centre';
    if (/customer management|client access|account recovery|forgot sign-in email/.test(txt)) return 'customer_access_control';
    if (/social.*analytics|analytics.*connection|pixel|tag setup/.test(txt)) return 'social_analytics_connection_centre';
    if (/daip.*integration|integration.*boundary|third.party.*daip/.test(txt)) return 'daip_integration_boundary';
    if (/gate c|technical review|rollback acceptance/.test(txt)) return 'daip_gate_c_technical_review';
    if (/daip governance|promotion gate|owner decision/.test(txt)) return 'daip_governance_gates';
    if (/security posture|row level security|rls|supabase security/.test(txt)) return 'security_posture';
    if (/media recovery|public media alert|asset health|missing image/.test(txt)) return 'media_recovery_alert';
    if (/today needs attention|owner action|snooze|assign me/.test(txt)) return 'owner_attention';
    if (/acknowledge|customer approval|price approval|signature/.test(txt)) return 'customer_acknowledgement';
    if (/private|staff only|admin review|internal/.test(txt)) return 'private_staff_note';
    if (/video|walkaround|clip/.test(txt)) return 'video_update';
    if (/live update|customer update|progress timeline/.test(txt)) return 'live_customer_update';
    if (/incident|damage|evidence|fault/.test(txt)) return 'incident_evidence';
    if (/review|testimonial|stars/.test(txt)) return 'review_proof';
    if (/quote|pipeline|lead|follow-up|followup/.test(txt)) return 'quote_pipeline';
    if (/booking|calendar|appointment|deposit/.test(txt)) return 'booking_conversion';
    if (/proof|checklist|sign-off|signoff|detailer/.test(txt)) return 'proof_of_work';
    if (/secure payment|final balance payment|payment assistance/.test(txt)) return 'secure_payment';
    if (/invoice|payment|receipt|balance|hst|gst/.test(txt)) return 'invoice_payment';
    if (/maintenance|repeat|vehicle history|seasonal reminder/.test(txt)) return 'repeat_maintenance';
    if (/season|spring|summer|winter|campaign|special/.test(txt)) return 'seasonal_campaign';
    return 'service_card';
  }
  function buildBlock(type, label){
    const block=document.createElement('div'); block.className='visual-placeholder-card'; block.dataset.visualPlaceholderBuilt='true';
    block.innerHTML = `<img src="${photoAsset(type)}" alt="${esc(label||titleFor(type))}" loading="lazy" decoding="async"><div class="visual-placeholder-copy"><strong>${esc(titleFor(type))}</strong><span>${esc(detailFor(type))}</span></div>`;
    const img = block.querySelector('img');
    img.addEventListener('error', ()=>{
      if (img.dataset.visualRasterFallbackApplied === 'true') return;
      img.dataset.visualRasterFallbackApplied='true';
      img.src=PHOTO_ASSETS.default;
      img.classList.add('visual-placeholder-img');
    }, { once:false });
    return block;
  }
  function attachImageFallbacks(root=document){
    root.querySelectorAll('img').forEach(img=>{
      if (img.dataset.visualFallbackAttached === 'true') return; img.dataset.visualFallbackAttached='true';
      const type = inferType(img); const label = img.getAttribute('alt') || titleFor(type);
      if (!img.getAttribute('src')) img.setAttribute('src', photoAsset(type));
      img.addEventListener('error', ()=>{
        // Build 215: allow the media resolver to try JPG/JPEG/WebP/PNG variants before a placeholder replaces the image.
        if (img.dataset.mediaResolverBound === 'true' && img.dataset.assetResolveStatus !== 'exhausted') return;
        if (img.dataset.visualPhotoFallbackApplied !== 'true') { img.dataset.visualPhotoFallbackApplied='true'; img.src=photoAsset(type); return; }
        if (img.dataset.visualRasterFallbackApplied !== 'true') { img.dataset.visualRasterFallbackApplied='true'; img.src=PHOTO_ASSETS.default; img.classList.add('visual-placeholder-img'); return; }
      }, { once:false });
    });
  }
  function installContextualCards(root=document){
    const page = (document.body && document.body.dataset && document.body.dataset.page) || '';
    const isAdmin = /^admin/.test(page) || location.pathname.startsWith('/admin');
    const selectors = isAdmin ? ['.card[data-build206]', '.card[data-build205]', '.panel[data-needs-visual]'] : ['.service-link-card', '.local-town-card', '.proof-card', '.card[data-needs-visual]', '.panel[data-needs-visual]'];
    selectors.forEach(sel=>root.querySelectorAll(sel).forEach(node=>{
      if (node.dataset.visualPlaceholderSkip === 'true') return;
      // Build 258: managed photo slots own their image lifecycle. Do not pre-insert a generic placeholder
      // that can remain beside a later Photo Studio/R2 image and create a duplicate-photo card.
      if (node.dataset.r2ImageKeywords || node.dataset.photoTarget || node.dataset.photoImageTarget) return;
      if (node.querySelector('img,.visual-placeholder-card')) return;
      const type = inferType(node); const title = (node.querySelector('h2,h3,strong')?.textContent || titleFor(type)).trim();
      node.insertBefore(buildBlock(type, title), node.firstChild);
    }));
  }
  function init(root=document){ attachImageFallbacks(root); installContextualCards(root); }
  globalScope.RosieVisualPlaceholders = { init, svgData, buildBlock, photoAsset };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',()=>init(document)); else init(document);
})(window);
