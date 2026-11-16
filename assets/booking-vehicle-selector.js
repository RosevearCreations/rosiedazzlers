// Booking-only bridge between the existing garage picker and trusted checkout verification.
// The cookie is an untrusted selector only. Checkout must verify ownership from the HttpOnly customer session.

const COOKIE_NAME = "rd_booking_vehicle_selector";
const BOOK_PATHS = new Set(["/book", "/book/"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// A garage selector is only a UI hint, never an ownership assertion.
// Accept exactly a signed-in dashboard row and a non-empty decimal index.
// The checkout endpoint must independently verify the customer's session and vehicle owner.
export function garageSelection893(vehicles, rawIndex) {
  if (typeof rawIndex !== "string" || !/^(0|[1-9][0-9]*)$/.test(rawIndex)) return null;
  const index = Number(rawIndex);
  if (!Number.isSafeInteger(index) || !Array.isArray(vehicles) || index >= vehicles.length) return null;
  const id = vehicles[index]?.id;
  return typeof id === "string" && UUID.test(id) ? id : null;
}

export function wireBookingVehicleSelector(root = document) {
  if (!BOOK_PATHS.has(window.location.pathname)) return;

  clearSelectorCookie();
  let vehiclesPromise = loadGarageVehicles();

  root.addEventListener("click", async (event) => {
    const button = event.target?.closest?.("[data-garage-index]");
    if (!button) return;
    const rawIndex = button.getAttribute("data-garage-index");
    // Clear the previous selection before asynchronous lookup; on any error,
    // a stale selection must never be submitted by the next checkout.
    clearSelectorCookie();
    const vehicles = await vehiclesPromise;
    const vehicleId = garageSelection893(vehicles, rawIndex);
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
