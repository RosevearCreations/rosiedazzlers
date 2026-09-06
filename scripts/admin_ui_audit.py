#!/usr/bin/env python3
"""Build 349 protected-page UI/navigation/staff-authority source audit.

The goal is to stop discovering unformatted admin pages or broken Staff & Access
profiles manually. Current AdminShell pages must retain shared layout/auth
contracts, and Administrator / Owner profiles must remain full-authority while
optional profile dependencies fail independently.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
errors: list[str] = []
warnings: list[str] = []


def read(rel: str) -> str:
    path = ROOT / rel
    if not path.exists():
        errors.append(f"missing {rel}")
        return ""
    return path.read_text(encoding="utf-8", errors="ignore")


def load_json(rel: str) -> dict:
    try:
        return json.loads(read(rel))
    except Exception as exc:
        errors.append(f"invalid JSON {rel}: {exc}")
        return {}


# Shared CSS must be independent of optional contextual-help loading and cover
# legacy protected markup as soon as AdminShell marks the body.
shell = read("assets/admin-shell.js")
design = read("assets/admin-design-system.css")
for token in [
    'ensureStylesheet("/assets/admin-design-system.css?v=20260906build347"',
    'rosie-admin-design-system-css',
    'dataset.adminProtected = "true"',
    "markProtectedPage(pageKey)",
]:
    if token not in shell:
        errors.append(f"admin-shell.js missing shared design/normalization token: {token}")

for token in [
    'body[data-admin-protected="true"]',
    ".site-header",
    ".admin-module-menu",
    ".admin-return-bar",
    ".table-wrap",
    'input[type="checkbox"]',
    "@media(max-width:760px)",
]:
    if token not in design:
        errors.append(f"admin-design-system.css missing contract token: {token}")


# Inventory root admin pages. Redirect-only and login pages are not required to
# boot AdminShell. A current protected page may carry data-page in HTML or provide
# its canonical pageKey to AdminShell.boot; the shell normalizes the latter.
admin_pages = sorted(ROOT.glob("admin-*.html"))
protected_pages: list[tuple[Path, str, str]] = []
for path in admin_pages:
    body = path.read_text(encoding="utf-8", errors="ignore")
    if "AdminShell.boot" not in body:
        continue

    body_match = re.search(r'<body\b[^>]*\bdata-page=["\']([^"\']+)["\']', body, re.I)
    boot_match = re.search(r"AdminShell\.boot\s*\(\s*\{[^}]*?pageKey\s*:\s*['\"]([^'\"]+)", body, re.S)
    body_key = body_match.group(1).strip() if body_match else ""
    boot_key = boot_match.group(1).strip() if boot_match else ""
    page_key = body_key or boot_key
    protected_pages.append((path, body, page_key))

    # account is intentionally cross-module; all other root admin routes use admin-*.
    if not (page_key.startswith("admin-") or page_key == "account"):
        errors.append(f"{path.name}: AdminShell page has no resolvable protected page key")
    if body_key and boot_key and body_key != boot_key:
        errors.append(f"{path.name}: body data-page ({body_key}) disagrees with AdminShell pageKey ({boot_key})")
    if 'name="viewport"' not in body and "name='viewport'" not in body:
        errors.append(f"{path.name}: missing responsive viewport")
    if "/assets/admin-auth.js" not in body:
        errors.append(f"{path.name}: missing admin-auth.js")
    if "/assets/admin-shell.js" not in body:
        errors.append(f"{path.name}: missing admin-shell.js")
    if len(re.findall(r"<h1\b", body, re.I)) != 1:
        errors.append(f"{path.name}: current protected page must contain exactly one h1")

    static_markup = body.split("<script", 1)[0]
    ids = re.findall(r'\bid=["\']([^"\']+)["\']', static_markup, re.I)
    dupes = sorted({value for value in ids if ids.count(value) > 1})
    if dupes:
        warnings.append(f"{path.name}: duplicate static id(s): {', '.join(dupes[:5])}")

if not protected_pages:
    errors.append("no AdminShell protected pages discovered")


# Canonical module navigation must not point to missing admin HTML files. The
# catalog is JSON-shaped JavaScript, so support quoted or unquoted property names.
nav_js = read("assets/app-core/module-navigation.js")
nav_hrefs = sorted(set(re.findall(r"[\"']?href[\"']?\s*:\s*['\"](/admin-[^'\"?#]+\.html)", nav_js)))
for href in nav_hrefs:
    rel = href.lstrip("/")
    if not (ROOT / rel).exists():
        errors.append(f"module navigation points to missing page: {href}")

nav_page_keys = set(re.findall(r"[\"']?page_key[\"']?\s*:\s*['\"]([^'\"]+)", nav_js))
for path, _body, page_key in protected_pages:
    if page_key == "account":
        continue
    if page_key and page_key not in nav_page_keys:
        warnings.append(f"{path.name}: protected page is contextual/not listed in canonical module navigation ({page_key})")


# Admin remains the deliberate all-module business-owner role.
internal_nav = load_json("data/internal_navigation.json")
admin_role = internal_nav.get("roles", {}).get("admin", {})
expected_modules = ["detailer", "operations", "admin", "it", "finance", "daip", "socials"]
if admin_role.get("force_all") is not True:
    errors.append("admin role lost force_all authority")
if admin_role.get("modules") != expected_modules:
    errors.append(f"admin module ceiling mismatch: {admin_role.get('modules')!r}")


# Build 349 Staff & Access contract. A missing optional customer-tier or payroll
# field must not hide the staff profiles, admin rows must serialize with all
# modules/capabilities on, and password hashes must never be returned to the UI.
staff_list_api = read("functions/api/admin/staff_list.js")
staff_save_api = read("functions/api/staff_save.js")
staff_ui = read("assets/admin-staff-v309.js")
staff_html = read("admin-staff.html")

for token in [
    "CORE_STAFF_SELECT",
    "Customer tiers are temporarily unavailable. Staff profiles and module access remain available.",
    "admin_authority",
    "module_access_version: 349",
    "can_manage_staff: true",
]:
    if token not in staff_list_api:
        errors.append(f"staff_list.js missing Build 349 resilience/authority token: {token}")
if "password_hash" in staff_list_api:
    errors.append("staff_list.js must not expose password_hash to the Staff & Access client")

for token in [
    'const forceFullAdminAuthority = role_code === "admin"',
    "forceFullAdminAuthority ? true : toBooleanDefault(body.can_manage_staff, false)",
    "module_access_version:349",
]:
    if token not in staff_save_api:
        errors.append(f"staff_save.js missing Build 349 full-admin persistence token: {token}")

for token in [
    "renderAuthority()",
    "syncLegacyCapabilities()",
    "staffWarnings",
    "adminAuthority",
    "Administrator accounts always receive this capability.",
]:
    if token not in staff_ui:
        errors.append(f"admin-staff-v309.js missing Build 349 authority UI token: {token}")

for token in [
    'data-build349="staff-access-authority"',
    'id="authorityBox"',
    "/assets/admin-staff-v309.js?v=20260906build349",
]:
    if token not in staff_html:
        errors.append(f"admin-staff.html missing Build 349 profile/authority token: {token}")


if warnings:
    print("Build 349 admin UI audit warnings:")
    for warning in warnings:
        print(" -", warning)

if errors:
    print("Build 349 admin UI audit: FAIL")
    for error in errors:
        print(" -", error)
    raise SystemExit(1)

print("Build 349 admin UI audit: PASS")
print(f" - inventoried {len(admin_pages)} root admin-* HTML routes")
print(f" - validated {len(protected_pages)} current AdminShell protected routes")
print(f" - validated {len(nav_hrefs)} canonical admin navigation targets")
print(" - shared admin design system covers canonical and legacy AdminShell markup")
print(" - Staff & Access survives optional tier/payroll-profile drift without hiding staff profiles")
print(" - password hashes are excluded from the Staff & Access response")
print(" - admin retains full detailer/operations/admin/I.T./finance/DAIP/socials and management authority")
