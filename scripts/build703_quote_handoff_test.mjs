import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildQuoteHandoffHref703,
  parseQuoteHandoff703,
  quoteHandoffNotes703,
  hydrateContactQuoteHandoff703
} from "../assets/booking-quote-handoff-v703.mjs";

const root = resolve(import.meta.dirname, "..");
const read = path => readFileSync(resolve(root, path), "utf8");

const href = buildQuoteHandoffHref703({
  size: "mid", service: "Complete Detail", addons: ["Pet hair", "Odour removal", "Pet hair"],
  inspection: true, customer_email: "never-pass@example.com", gift_code: "GIFT-NEVER", deposit: 50,
  service_date: "2026-10-29", private_notes: "Never into URL"
});
assert.ok(href.startsWith("/contact?"));
assert.ok(href.endsWith("#contactPrepHeading"));
assert.ok(!/never-pass|GIFT-NEVER|deposit|service_date|private_notes/.test(href));
const parsed = parseQuoteHandoff703(href.slice(href.indexOf("?"), href.indexOf("#")));
assert.deepEqual(parsed, {
  size: "mid", service: "Complete Detail", addons: ["Pet hair", "Odour removal"], inspection: true
});
assert.match(quoteHandoffNotes703(parsed), /This is an enquiry, not a reserved booking or approved price/);

const messy = parseQuoteHandoff703("?source=booking_quote&size=untrusted&service=Interior%0A%0DDetail&addon=Salt%0ADamage&addon=Salt%0ADamage");
assert.equal(messy.size, "unknown");
assert.equal(messy.service, "Interior Detail");
assert.deepEqual(messy.addons, ["Salt Damage"]);
assert.equal(parseQuoteHandoff703("?source=something_else&service=Wash"), null);
assert.equal(parseQuoteHandoff703(""), null);

const many = buildQuoteHandoffHref703({
  service: "x".repeat(400), addons: Array.from({length:20},(_,i)=>`Addon ${i}`)
});
const clipped = parseQuoteHandoff703(many.slice(many.indexOf("?"), many.indexOf("#")));
assert.equal(clipped.service.length, 96);
assert.equal(clipped.addons.length, 8);

const fields = new Map([
  ["contactPrepForm", { dispatchEvent: event => { assert.equal(event.type,"input"); calls += 1; } }],
  ["contactPrepTopic", { value:"general" }],
  ["contactPrepSize", { value:"unknown" }],
  ["contactPrepMessage", { value:"" }],
  ["quoteHandoffStatus703", { hidden:true, textContent:"" }]
]);
let calls = 0;
const doc = { getElementById: id => fields.get(id) ?? null };
assert.equal(hydrateContactQuoteHandoff703(doc, "?source=other"), false);
assert.equal(calls, 0);
assert.equal(hydrateContactQuoteHandoff703(doc, href.slice(href.indexOf("?"),href.indexOf("#"))), true);
assert.equal(fields.get("contactPrepTopic").value, "photo");
assert.equal(fields.get("contactPrepSize").value, "mid");
assert.match(fields.get("contactPrepMessage").value, /Pet hair, Odour removal/);
assert.equal(fields.get("quoteHandoffStatus703").hidden, false);
assert.equal(calls, 1);

assert.equal(read("book.html"),read("book/index.html"));
assert.equal(read("contact.html"),read("contact/index.html"));
assert.equal(read("admin-quotes.html"),read("admin-quotes/index.html"));
assert.match(read("book.html"), /id="requestQuoteBtn703"/);
assert.match(read("contact.html"), /hydrateContactQuoteHandoff703/);
assert.match(read("admin-quotes.html"), /id="newWebsiteQuoteBtn703"/);
assert.match(read("assets/admin-quotes-v298.js"), /status:'requested',probability:0,source_channel:'website_booking_quote_email'/);
assert.match(read("admin-gift-recovery-review.html"), /Gift testing paused/);
assert.match(read("scripts/current_booking_wizard_regression.sh"), /build703_quote_handoff_test\.mjs/);
assert.match(read(".github/workflows/development-source-gate.yml"), /current_booking_wizard_regression\.sh/);

console.log("Build 703 quote handoff PASS: safe selection-only URL, contact prefill, staff unsaved workflow, canonical routes, Gift pause");
