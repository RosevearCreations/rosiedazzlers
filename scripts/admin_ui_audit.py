#!/usr/bin/env python3
"""Build 351 protected-page UI/navigation/staff-authority source audit.

The goal is to stop discovering unformatted admin pages or broken Staff & Access
profiles manually. Current AdminShell pages must retain shared layout/auth
contracts, Administrator / Owner profiles must remain full-authority while
optional profile dependencies fail independently, every Staff list route must
delegate to one canonical profile authority, and the Staff Access Matrix must use
the shared runtime module resolver instead of inventing a second permission model.
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


# Staff list behavior is owned by one canonical handler. Both /api/staff_list and
# /api/admin/staff_list remain thin delegates. This prevents legacy-route drift
# from reintroducing sensitive authentication fields or making optional profile
# dependencies fatal.
staff_handler = read("functions/api/_lib/staff-list-handler.js")
staff_root_api = read("functions/api/staff_list.js")
staff_admin_api = read("functions/api/admin/staff_list.js")
staff_save_api = read("functions/api/staff_save.js")
staff_ui = read("assets/admin-staff-v309.js")
staff_html = read("admin-staff.html")
module_resolver = read("assets/app-core/module-resolver.js")
module_flags_api = read("functions/api/admin/module_flags.js")

for token in [
    "Build 350",
    "CORE_STAFF_SELECT",
    "Customer tiers are temporarily unavailable. Staff profiles and module access remain available.",
    "admin_authority",
    "module_access_version: 349",
    "can_manage_staff: true",
]:
    if token not in staff_handler:
        errors.append(f"staff-list-handler.js missing Staff resilience/authority token: {token}")

sensitive_field = "password_hash"
for rel, body in [
    ("functions/api/_lib/staff-list-handler.js", staff_handler),
    ("functions/api/staff_list.js", staff_root_api),
    ("functions/api/admin/staff_list.js", staff_admin_api),
]:
    if sensitive_field in body:
        errors.append(f"{rel} must not select or expose {sensitive_field}")

for rel, body, import_token in [
    ("functions/api/staff_list.js", staff_root_api, 'from "./_lib/staff-list-handler.js"'),
    ("functions/api/admin/staff_list.js", staff_admin_api, 'from "../_lib/staff-list-handler.js"'),
]:
    if "handleStaffListRequest(context)" not in body or import_token not in body:
        errors.append(f"{rel} is not delegated to the canonical Staff list handler")
    if "SUPABASE_URL" in body or "select=" in body:
        errors.append(f"{rel} regained direct Staff data-query authority")

for token in [
    'const forceFullAdminAuthority = role_code === "admin"',
    "forceFullAdminAuthority ? true : toBooleanDefault(body.can_manage_staff, false)",
    "module_access_version:349",
]:
    if token not in staff_save_api:
        errors.append(f"staff_save.js missing full-admin persistence token: {token}")

for token in [
    "renderAuthority()",
    "syncLegacyCapabilities()",
    "staffWarnings",
    "adminAuthority",
    "Administrator accounts always receive this capability.",
]:
    if token not in staff_ui:
        errors.append(f"admin-staff-v309.js missing Staff authority UI token: {token}")


# Build 351 Staff Access Matrix must consume the same resolver used by the app
# launcher/runtime. It is a read-only view: staff editing remains in Staff & Access
# and global availability remains in I.T. The matrix may refresh explicitly but
# must not poll.
for token in [
    "Build 351",
    "renderAccessMatrix()",
    "loadAccessSnapshot({ force = true }",
    "moduleResolver.withinRoleCeiling",
    "moduleResolver.profileAllows",
    "moduleResolver.canAccess",
    "moduleResolver.isEnabled",
    "moduleResolver.loadRuntimeFlags({ force })",
    "No polling is running.",
]:
    if token not in staff_ui:
        errors.append(f"admin-staff-v309.js missing Build 351 matrix token: {token}")

if "const ROLE_MODULES" in staff_ui:
    errors.append("admin-staff-v309.js must not duplicate the canonical role/module ceiling map")
if "setInterval(" in staff_ui or "setTimeout(" in staff_ui:
    errors.append("Staff Access Matrix must not introduce background polling/timers")

for token in [
    "ROLE_CEILINGS",
    "withinRoleCeiling",
    "profileAllows",
    "canAccess",
    "loadRuntimeFlags",
    "getRuntimeFlags",
]:
    if token not in module_resolver:
        errors.append(f"module-resolver.js missing matrix authority token: {token}")

for token in [
    'const KEY="module_runtime_flags"',
    "flags.it=true",
    "allowLegacyAdminFallback:false",
    'source:"app_management_settings"',
]:
    if token not in module_flags_api:
        errors.append(f"module_flags.js missing global runtime-switch authority token: {token}")

for token in [
    'data-build349="staff-access-authority"',
    'data-build351="staff-access-matrix"',
    'id="authorityBox"',
    'id="accessMatrixWrap"',
    'id="accessMatrixStatus"',
    'id="globalSwitchSummary"',
    'id="refreshAccessMatrixBtn"',
    "/assets/app-core/module-resolver.js?v=20260907build351",
    "/assets/admin-staff-v309.js?v=20260907build351",
]:
    if token not in staff_html:
        errors.append(f"admin-staff.html missing Build 351 profile/matrix token: {token}")

# The matrix's own new runtime dependency is only the existing lightweight module
# flag authority. It must not start reaching into unrelated business domains.
for forbidden in [
    "/api/admin/bookings",
    "/api/admin/inventory",
    "/api/admin/finance",
    "/api/admin/daip",
    "/api/admin/analytics",
]:
    if forbidden in staff_ui:
        errors.append(f"Staff Access Matrix introduced unrelated business-data dependency: {forbidden}")


if warnings:
    print("Build 351 admin UI audit warnings:")
    for warning in warnings:
        print(" -", warning)

if errors:
    print("Build 351 admin UI audit: FAIL")
    for error in errors:
        print(" -", error)
    raise SystemExit(1)

print("Build 351 admin UI audit: PASS")
print(f" - inventoried {len(admin_pages)} root admin-* HTML routes")
print(f" - validated {len(protected_pages)} current AdminShell protected routes")
print(f" - validated {len(nav_hrefs)} canonical admin navigation targets")
print(" - shared admin design system covers canonical and legacy AdminShell markup")
print(" - Staff & Access survives optional tier/payroll-profile drift without hiding staff profiles")
print(" - root and /admin Staff list routes share one canonical profile authority")
print(" - sensitive authentication hashes are excluded from both Staff list response paths")
print(" - Staff Access Matrix uses the shared role/profile/runtime resolver with no polling")
print(" - matrix adds no unrelated business-data dependency")
print(" - admin retains full detailer/operations/admin/I.T./finance/DAIP/socials and management authority")
