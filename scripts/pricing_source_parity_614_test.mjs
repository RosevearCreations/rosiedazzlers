import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildPricingSourceParity614 } from "../functions/api/_lib/pricing-source-parity-614.js";
import { onRequestGet, onRequestPost, onRequestPut, onRequestPatch, onRequestDelete } from "../functions/api/admin/pricing_source_parity_614.js";

const catalog = JSON.parse(readFileSync(new URL("../data/rosie_services_pricing_and_packages.json", import.meta.url)));
const backup = JSON.parse(JSON.stringify(catalog));
backup.addons.find((row) => row.code === "engine_cleaning").quote_required = false;
const report = buildPricingSourceParity614({ bundled: catalog, appManagement: backup, dbAvailable: true, updatedAt: "2026-03-25T22:18:30Z" });
assert.equal(report.ok, true);
assert.equal(report.read_only, true);
assert.equal(report.source_status, "app_management_settings");
assert.equal(report.summary.owner_decision_required, true);
assert.equal(report.db_verified, true);
assert.equal(report.updated_at, "2026-03-25T22:18:30Z");
for (const [size, bundledPrice, publicPrice] of [["small", 115, 229], ["mid", 135, 269], ["oversize", 170, 309]]) {
  const field = report.findings.find((row) => row.group === "packages" && row.code === "basic_detail" && row.field === `prices_cad.${size}`);
  assert.ok(field, `Basic Detail ${size} must be surfaced`);
  assert.equal(field.bundled, bundledPrice);
  assert.equal(field.app_management, bundledPrice);
  assert.equal(field.checkout, bundledPrice);
  assert.equal(field.public_api, publicPrice);
  assert.ok(field.differences.includes("public_vs_checkout"));
}
assert.ok(report.findings.some((row) => row.group === "addons" && row.code === "engine_cleaning" && row.field === "quote_required" && row.checkout === false && row.public_api === true));
assert.equal(catalog.addons.find((row) => row.code === "engine_cleaning").quote_required, true, "parity cannot change the bundled catalog");

const unavailable = buildPricingSourceParity614({ bundled: catalog, warning: "Database inaccessible" });
assert.equal(unavailable.db_verified, false);
assert.equal(unavailable.summary.owner_decision_required, true);
assert.equal(unavailable.updated_at, null);
assert.equal(unavailable.warning, "Database inaccessible");

const custom = JSON.parse(JSON.stringify(catalog));
custom.packages.find((row) => row.code === "premium_wash").prices_cad.small = 99;
const changed = buildPricingSourceParity614({ bundled: catalog, appManagement: custom, dbAvailable: true });
assert.ok(changed.findings.some((row) => row.code === "premium_wash" && row.field === "prices_cad.small" && row.differences.includes("app_management_vs_bundled")));
assert.deepEqual(custom.packages.find((row) => row.code === "premium_wash").prices_cad, { small: 99, mid: 105, oversize: 125 });

const response = new Response(JSON.stringify([{ key: "pricing_catalog", value: catalog, updated_at: "2026-03-25T22:18:30Z" }]), { status: 200 });
const originalFetch = globalThis.fetch;
let calls = 0;
globalThis.fetch = async (input, options) => {
  calls++;
  assert.match(String(input), /\/rest\/v1\/app_management_settings\?/);
  assert.equal(options.method, "GET");
  return response.clone();
};
const env = { SUPABASE_URL: "https://fixture.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "fixture", ADMIN_PASSWORD: "fixture", ALLOW_LEGACY_ADMIN_FALLBACK: "true" };
try {
  const unauthorized = await onRequestGet({ request: new Request("https://test.example/api/admin/pricing_source_parity_614"), env });
  assert.equal(unauthorized.status, 401);
  assert.equal(calls, 0, "unauthenticated report cannot fetch database pricing");
  const authorized = await onRequestGet({ request: new Request("https://test.example/api/admin/pricing_source_parity_614", { headers: { "x-admin-password": "fixture" } }), env });
  assert.equal(authorized.status, 200);
  assert.equal((await authorized.json()).summary.public_checkout_differences > 0, true);
  assert.equal(authorized.headers.get("Cache-Control"), "no-store");
  assert.equal(calls, 1);
  for (const fn of [onRequestPost, onRequestPut, onRequestPatch, onRequestDelete]) {
    assert.equal((await fn()).status, 405);
  }
  assert.equal(calls, 1, "mutating methods must never query or change the catalog");
} finally {
  globalThis.fetch = originalFetch;
}

const rootHtml = readFileSync(new URL("../admin.html", import.meta.url), "utf8");
const routeHtml = readFileSync(new URL("../admin/index.html", import.meta.url), "utf8");
assert.equal(rootHtml, routeHtml, "admin route mirrors must remain identical");
assert.match(rootHtml, /pricingSourceParity614/);
assert.match(rootHtml, /loadPricingSourceParity614/);
assert.match(rootHtml, /OWNER PRICE REVIEW REQUIRED/);
assert.match(rootHtml, /guardedLoad\('Pricing parity owner review'/);
console.log("Build 614 read-only pricing source, public/checkout mismatch and owner hold: PASS");
