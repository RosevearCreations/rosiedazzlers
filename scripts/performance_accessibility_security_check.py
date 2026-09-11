#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MIDDLEWARE = (ROOT / "functions/_middleware.js").read_text(encoding="utf-8")
HARDENING = (ROOT / "functions/_lib/response-hardening.js").read_text(encoding="utf-8")
A11Y = (ROOT / "assets/build376-accessibility.css").read_text(encoding="utf-8")
TEST = (ROOT / "scripts/response_hardening_test.mjs").read_text(encoding="utf-8")

required_middleware = [
    'import { hardenResponse } from "./_lib/response-hardening.js";',
    '/assets/build376-accessibility.css?v=376',
    'data-build376="accessibility-baseline"',
    'return hardenResponse(request, await context.next());',
    'return hardenResponse(request, rewritten);',
    'if (applyLegacyClarity || applyPageEditor) headers.set("cache-control", "no-cache")',
    'Static assets, APIs and non-editor routes keep their',
]
for token in required_middleware:
    assert token in MIDDLEWARE, f"missing middleware contract: {token}"

# Build 376 must not trade editor correctness for anonymous HTML cache reuse.
# `no-cache` remains storable but forces freshness validation for HTML that is
# transformed to carry the admin editor/bootstrap. Unrelated routes and assets
# retain their own Pages/origin caching policy.
assert 'headers.set("cache-control", "no-store")' not in MIDDLEWARE.split('const rewritten = new Response', 1)[0], (
    "public transformed HTML must revalidate, not become globally no-store"
)

required_headers = [
    'x-content-type-options',
    'referrer-policy',
    'permissions-policy',
    'x-permitted-cross-domain-policies',
    'cache-control',
    'no-store',
    'x-frame-options',
]
for token in required_headers:
    assert token in HARDENING, f"missing response hardening token: {token}"

for prefix in [
    '"/admin"', '"/client"', '"/detailer"', '"/api/admin"', '"/api/client"', '"/api/detailer"', '"/api/auth"'
]:
    assert prefix in HARDENING, f"missing private boundary: {prefix}"

assert 'headers.has("set-cookie")' in HARDENING, "cookie-bearing responses must fail closed to no-store"
assert 'headers.set("content-security-policy"' not in HARDENING.lower(), (
    "Build 376 must not introduce an unproven CSP header"
)

for token in [":focus-visible", "prefers-reduced-motion", "forced-colors"]:
    assert token in A11Y, f"missing accessibility contract: {token}"

for token in ["public, max-age=600", "/api/admin/customer_retention_dashboard", "set-cookie", "no-store"]:
    assert token in TEST, f"missing regression coverage: {token}"

print("Build 376 performance/accessibility/security source authority: GREEN")