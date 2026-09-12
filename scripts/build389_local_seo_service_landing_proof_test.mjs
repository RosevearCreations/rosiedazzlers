import assert from "node:assert/strict";
import { publicProofItems, resolveProofCriteria } from "../functions/api/local_proof_public.js";

const good = {
  title: "Headlight clarity recovery",
  town: "Tillsonburg",
  service: "Headlight restoration",
  before_url: "/proof/headlight-before.jpg",
  after_url: "/proof/headlight-after.jpg",
  consent_status: "customer_approved_public",
  media_privacy_status: "approved_public",
  publication_status: "published",
  proof_kind: "customer_work",
  vehicle_label: "Midsize SUV",
  condition_summary: "Moderate yellowing and failed outer UV layer",
  problem: "Reduced clarity from exterior oxidation",
  process: "Cleaned, corrected, polished and protected the exterior lens",
  result: "Improved clarity with remaining non-correctable defects disclosed",
};

const sample = { ...good, proof_kind: "sample", consent_status: "sample" };
const privateRow = { ...good, consent_status: "approved_private" };
const incomplete = { ...good, process: "" };
const woodstock = { ...good, town: "Woodstock" };
const odor = { ...good, service: "Odour removal" };

assert.equal(publicProofItems({ items: [sample] }).length, 0, "sample proof must fail closed");
assert.equal(publicProofItems({ items: [privateRow] }).length, 0, "private proof must fail closed");
assert.equal(publicProofItems({ items: [incomplete] }).length, 0, "context-incomplete proof must fail closed");
assert.equal(publicProofItems({ items: [good] }).length, 1, "complete public proof should pass");

const tillsonburg = resolveProofCriteria({ slug: "tillsonburg-auto-detailing" });
assert.equal(publicProofItems({ items: [good, woodstock] }, tillsonburg).length, 1, "town landing must receive only matching local proof");

const odorCriteria = resolveProofCriteria({ slug: "odor-removal" });
assert.equal(publicProofItems({ items: [odor] }, odorCriteria).length, 1, "odor/odour spelling must converge to the same service proof");

const headlight = resolveProofCriteria({ slug: "headlight-restoration" });
assert.equal(publicProofItems({ items: [good, odor] }, headlight).length, 1, "service landing must receive only matching service proof");

const sanitized = publicProofItems({ items: [{ ...good, customer_name: "Private Name", source_booking_id: "123" }] })[0];
assert.ok(sanitized, "approved proof should exist");
assert.equal(Object.hasOwn(sanitized, "customer_name"), false, "customer name must not be emitted by public proof feed");
assert.equal(Object.hasOwn(sanitized, "source_booking_id"), false, "booking id must not be emitted by public proof feed");

console.log("Build 389 public proof behavioral tests: PASS");
