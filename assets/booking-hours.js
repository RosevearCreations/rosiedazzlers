// assets/booking-hours.js
// Build 191: lightweight business-hours/holiday status helper for booking-facing pages.
// Build 282: fail-open loader for high-intent use-case booking entry presets.
(function attachRosieBookingHours(globalScope){
  async function loadStatus(date){
    const qs = date ? `?date=${encodeURIComponent(date)}` : '';
    const res = await fetch(`/api/booking_hours_status${qs}`, { cache: 'no-store' });
    return res.json();
  }

  async function render(root=document){
    const mounts = root.querySelectorAll('[data-business-hours-status]');
    if (!mounts.length) return;
    const data = await loadStatus(new Date().toISOString().slice(0,10)).catch(()=>null);
    if (!data || data.ok === false) return;
    mounts.forEach((mount)=>{ mount.textContent = data.is_closed ? `Closed/limited today: ${data.hours_label}` : `Today: ${data.hours_label}. ${data.notes || ''}`; });
  }

  function loadBuild282UseCaseEntry(){
    const path = String(location.pathname || '/').replace(/\.html$/i,'').replace(/\/+$/,'') || '/';
    if (path !== '/book') return;
    const params = new URLSearchParams(location.search);
    if (!String(params.get('need') || '').trim()) return;
    if (["1","true","yes"].includes(String(params.get('embed') || '').toLowerCase())) return;
    if (document.querySelector('script[data-build282-usecase-entry]')) return;
    const script = document.createElement('script');
    script.src = '/assets/booking-usecase-entry-v282.js';
    script.defer = true;
    script.dataset.build282UsecaseEntry = 'true';
    script.onerror = () => console.warn('Optional Build 282 use-case booking preset could not be loaded. Standard booking remains available.');
    document.head.appendChild(script);
  }

  function boot(){
    render(document);
    loadBuild282UseCaseEntry();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',boot,{ once:true });
  else boot();

  globalScope.RosieBookingHours = { loadStatus, render };
})(window);
