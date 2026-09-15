// Build 399 — permission-aware customer communication and self-service guidance.
// This layer provides navigation and observed analytics only. It never sends a
// message, changes a booking, or claims that a request has been accepted.
(function wireCustomerCommunicationSelfService() {
  "use strict";

  const account = document.querySelector("#bookingHistory")?.closest(".panel");
  if (!account || document.querySelector("[data-build399-self-service]")) return;

  const section = document.createElement("section");
  section.className = "customer-care";
  section.dataset.build399SelfService = "";
  section.setAttribute("aria-labelledby", "customerCareTitle");
  section.innerHTML = `
    <div class="customer-care__head">
      <div><p class="kicker">Customer communication & self-service</p><h2 id="customerCareTitle">Know what happens before, during, and after a detail</h2></div>
      <p class="muted">Your confirmed booking and messages from Rosie Dazzlers remain the scheduling authority. These links do not silently change or cancel an appointment.</p>
    </div>
    <div class="customer-care__grid">
      <article><strong>Prepare for the visit</strong><p>Remove personal valuables, provide safe driveway access, and tell us about access, water, power, pets, stains, damage, or fragile areas.</p><a href="/contact?topic=booking-preparation">Ask a preparation question</a></article>
      <article><strong>Check appointment status</strong><p>Use the booking activity below and any secure progress link we sent. A browser screen is not proof of a schedule change.</p><a href="#bookingHistory">View booking activity</a></article>
      <article><strong>Reschedule or cancel</strong><p>Contact us for review. Availability, notice, deposit, weather, and cancellation policies still apply; submitting a request does not approve it.</p><a href="/contact?topic=booking-change">Request a booking review</a></article>
      <article><strong>Aftercare and concerns</strong><p>Follow the service-specific care directions we provide. Contact us promptly if something needs review and include the booking date and vehicle.</p><a href="/contact?topic=aftercare">Ask about aftercare</a></article>
      <article><strong>Review completed work</strong><p>Use the review form below after a completed service. Public reuse remains subject to the permission choice and our approval.</p><a href="#reviewForm">Write a review</a></article>
      <article><strong>Book the next service</strong><p>Start a new booking with current prices, availability, vehicle condition, service scope, policies, and payment confirmed again.</p><a href="/book?rebook=1">Start a new booking</a></article>
    </div>`;

  const style = document.createElement("style");
  style.textContent = `.customer-care{margin-top:18px;padding-top:18px;border-top:1px solid rgba(255,255,255,.1)}.customer-care__head{display:grid;grid-template-columns:minmax(0,1fr) minmax(260px,.8fr);gap:18px;align-items:start}.customer-care__head h2{margin:4px 0}.customer-care__grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:14px}.customer-care__grid article{display:flex;flex-direction:column;min-width:0;padding:14px;border:1px solid rgba(255,255,255,.1);border-radius:16px;background:rgba(255,255,255,.03)}.customer-care__grid p{flex:1;margin:8px 0 12px}.customer-care__grid a{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:10px 12px;border-radius:10px;border:1px solid rgba(147,197,253,.35);overflow-wrap:anywhere}@media(max-width:900px){.customer-care__grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:640px){.customer-care__head,.customer-care__grid{grid-template-columns:1fr}.customer-care__grid a{width:100%}}`;
  document.head.appendChild(style);
  account.appendChild(section);

  section.addEventListener("click", (event) => {
    const link = event.target.closest("a");
    if (!link) return;
    try {
      window.dispatchEvent(new CustomEvent("rd:analytics", { detail: {
        event: "customer_self_service_path_selected",
        path: String(link.textContent || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 80)
      }}));
    } catch {}
  });
})();
