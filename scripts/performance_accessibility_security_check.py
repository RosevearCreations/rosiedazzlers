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
    'Preserve the origin/Pages cache policy.',
]
for token in required_middleware:
    assert token in MIDDLEWARE, f"missing middleware contract: {token}"

assert 'if (applyLegacyClarity || applyPageEditor) headers.set("cache-control", "no-cache")' not in MIDDLEWARE, (
    "legacy editor-wide no-cache policy must remain removed"
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
assert 'Content-Security-Policy' not in HARDENING, "Build 376 must not introduce an unproven CSP"

for token in [":focus-visible", "prefers-reduced-motion", "forced-colors"]:
    assert token in A11Y, f"missing accessibility contract: {token}"

for token in ["public, max-age=600", "/api/admin/customer_retention_dashboard", "set-cookie", "no-store"]:
    assert token in TEST, f"missing regression coverage: {token}"

print("Build 376 performance/accessibility/security source authority: GREEN")
