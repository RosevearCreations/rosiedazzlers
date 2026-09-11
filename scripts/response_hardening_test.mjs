import assert from "node:assert/strict";
import { hardenResponse, isPrivateResponsePath } from "../functions/_lib/response-hardening.js";

function request(path = "/") {
  return new Request(`https://rosiedazzlers.ca${path}`);
}

{
  const original = new Response("public", {
    status: 200,
    headers: { "cache-control": "public, max-age=600", "content-type": "text/html" }
  });
  const response = hardenResponse(request("/services"), original);
  assert.equal(response.headers.get("cache-control"), "public, max-age=600");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("referrer-policy"), "strict-origin-when-cross-origin");
  assert.equal(response.headers.get("permissions-policy"), "camera=(), microphone=()");
  assert.equal(response.headers.get("x-frame-options"), null);
}

{
  const response = hardenResponse(
    request("/api/admin/customer_retention_dashboard"),
    new Response("{}", { headers: { "cache-control": "public, max-age=3600" } })
  );
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("pragma"), "no-cache");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
}

{
  const response = hardenResponse(
    request("/api/session-create"),
    new Response("{}", { headers: { "set-cookie": "session=opaque; HttpOnly; Secure" } })
  );
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
}

{
  const response = hardenResponse(
    request("/faq"),
    new Response("public"),
    { forceNoCache: true }
  );
  assert.equal(response.headers.get("cache-control"), "no-cache");
}

assert.equal(isPrivateResponsePath("/admin"), true);
assert.equal(isPrivateResponsePath("/admin/"), true);
assert.equal(isPrivateResponsePath("/my-account.html"), true);
assert.equal(isPrivateResponsePath("/api/client/dashboard"), true);
assert.equal(isPrivateResponsePath("/services"), false);

console.log("Build 376 response hardening regression: GREEN");
