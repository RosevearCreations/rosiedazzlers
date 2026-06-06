// assets/admin-option-libraries.js
// Build 194: shared DB-first option-library dropdown hydrator for Admin screens.
(function(){
  if (window.AdminOptionLibraries) return;
  const DEFAULTS = {
    communication_channels: ["email", "phone", "sms", "website", "facebook", "instagram", "in_person"],
    payment_methods: ["cash", "card", "stripe", "paypal", "etransfer", "cheque", "other"],
    booking_statuses: ["pending", "confirmed", "scheduled", "in_progress", "completed", "cancelled", "no_show"],
    job_statuses: ["not_started", "assigned", "on_the_way", "working", "quality_check", "complete", "blocked"],
    finance_entry_types: ["deposit", "payment", "refund", "fee", "discount", "adjustment", "write_off"],
    reason_codes: ["customer_adjustment", "weather", "holiday_closure", "inventory", "staffing", "payment_issue", "other"],
    media_privacy_statuses: ["pending_review", "approved_private", "approved_public", "needs_blur", "rejected"],
    stock_actions: ["adjust_up", "adjust_down", "finished", "defective", "write_off", "receive", "job_use"],
    purchase_order_statuses: ["requested", "ordered", "received", "cancelled"],
    lead_statuses: ["new", "reviewing", "contacted", "quoted", "converted", "closed", "spam"],
    quote_statuses: ["draft", "needs_review", "ready_to_send", "sent", "accepted", "declined", "archived"]
  };
  let cached = null;
  async function load(){
    if (cached) return cached;
    try {
      const res = await fetch('/api/site_settings_public?key=option_libraries', { credentials:'include', cache:'no-store' });
      const out = await res.json().catch(function(){ return null; });
      const value = out?.settings?.option_libraries?.value || out?.option_libraries || out?.value || null;
      cached = normalize(value || {});
    } catch (err) {
      console.warn('Using bundled option-library fallback:', err);
      cached = normalize({});
    }
    return cached;
  }
  function normalize(value){
    const out = Object.assign({}, DEFAULTS);
    const src = value && typeof value === 'object' ? value : {};
    Object.keys(src).forEach(function(key){
      const values = valuesFrom(src[key]);
      if (values.length) out[key] = unique(values.concat(out[key] || []));
    });
    return out;
  }
  function valuesFrom(input){
    if (!Array.isArray(input)) return [];
    return input.map(function(row){
      if (typeof row === 'string') return row;
      if (row && typeof row === 'object') return row.value || row.key || row.code || row.name || row.label || '';
      return '';
    }).map(function(value){ return String(value || '').trim(); }).filter(Boolean);
  }
  function unique(values){
    const seen = new Set();
    return values.filter(function(value){
      const key = String(value || '').trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  function labelize(value){ return String(value || '').replace(/_/g,' ').replace(/\b\w/g,function(c){ return c.toUpperCase(); }); }
  function esc(value){ return String(value ?? '').replace(/[&<>"']/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  async function hydrate(root){
    const libs = await load();
    (root || document).querySelectorAll('select[data-option-library]').forEach(function(select){
      const key = select.getAttribute('data-option-library');
      const current = select.value || select.getAttribute('data-default-value') || '';
      const fallback = Array.from(select.options || []).map(function(option){ return option.value || option.textContent || ''; });
      const values = unique((libs[key] || []).concat(fallback));
      if (!values.length) return;
      select.innerHTML = values.map(function(value){ return '<option value="' + esc(value) + '">' + esc(labelize(value)) + '</option>'; }).join('');
      if (current && Array.from(select.options).some(function(option){ return option.value === current; })) select.value = current;
    });
  }
  window.AdminOptionLibraries = { load, hydrate, values: function(key){ return (cached || DEFAULTS)[key] || []; } };
  document.addEventListener('DOMContentLoaded', function(){ hydrate().catch(function(err){ console.warn('Could not hydrate option-library dropdowns:', err); }); });
})();
