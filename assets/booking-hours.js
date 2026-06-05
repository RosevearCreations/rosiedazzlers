// assets/booking-hours.js
// Build 191: lightweight business-hours/holiday status helper for booking-facing pages.
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
  document.addEventListener('DOMContentLoaded',()=>render(document));
  globalScope.RosieBookingHours = { loadStatus, render };
})(window);
