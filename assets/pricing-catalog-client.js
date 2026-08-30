// Build 274 compatibility wrapper.
// The original pricing catalogue implementation is retained verbatim in pricing-catalog-client-legacy.js.
// Re-export its public API, then load the booking-only mobile presentation enhancement as a non-authoritative side effect.
export * from "./pricing-catalog-client-legacy.js";

const normalizedPath = String(globalThis.location?.pathname || "/").replace(/\.html$/i, "").replace(/\/+$/, "") || "/";
if (normalizedPath === "/book") {
  import("./booking-quick-start-v274.js").catch((error) => {
    console.warn("Optional Build 274 Quick Book presentation could not be loaded; legacy booking remains available.", error);
  });
}
