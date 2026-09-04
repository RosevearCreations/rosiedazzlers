// Booking-only bridge between the existing garage picker and trusted checkout verification.
// The cookie is an untrusted selector only. Checkout must verify ownership from the HttpOnly customer session.

const COOKIE_NAME = "rd_booking_vehicle_selector";
const BOOK_PATHS = new Set(["/book", "/book/"]);

export function wireBookingVehicleSelector(root = document) {
  if (!BOOK_PATHS.has(window.location.pathname)) return;

  clearSelectorCookie();
  let vehiclesPromise = loadGarageVehicles();

  root.addEventListener("click", async (event) => {
    const button = event.target?.closest?.("[data-garage-index]");
    if (!button) return;
    const index = Number(button.getAttribute("data-garage-index"));
    if (!Number.isInteger(index) || index < 0) {
      clearSelectorCookie();
      return;
    }

    const vehicles = await vehiclesPromise;
    const vehicle = Array.isArray(vehicles) ? vehicles[index] || null : null;
    const vehicleId = String(vehicle?.id || "").trim();
    if (!vehicleId) {
      clearSelectorCookie();
      return;
    }
    setSelectorCookie(vehicleId);
  });

  ["#veh_year", "#veh_make", "#veh_model", "#vehicle_size"].forEach((selector) => {
    const field = root.querySelector(selector);
    if (!field) return;
    field.addEventListener("input", clearSelectorCookie);
    field.addEventListener("change", clearSelectorCookie);
  });

  window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      clearSelectorCookie();
      vehiclesPromise = loadGarageVehicles();
    }
  });
}

async function loadGarageVehicles() {
  try {
    const res = await fetch("/api/client/dashboard", {
      credentials: "include",
      cache: "no-store"
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || data?.ok !== true) return [];
    return Array.isArray(data.vehicles) ? data.vehicles : [];
  } catch {
    return [];
  }
}

function setSelectorCookie(vehicleId) {
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(vehicleId)}; Path=/; SameSite=Lax; Secure; Max-Age=3600`;
}

function clearSelectorCookie() {
  document.cookie = `${COOKIE_NAME}=; Path=/; SameSite=Lax; Secure; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}
