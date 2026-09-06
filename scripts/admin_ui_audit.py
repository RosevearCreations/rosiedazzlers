#!/usr/bin/env python3
"""Build 347 protected-page UI/navigation/permission source audit.

The goal is to stop discovering unformatted admin pages manually. This check only
hard-fails current AdminShell pages on durable structural contracts; legacy/alias
pages are inventoried without forcing unrelated migrations in the same release.
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


# Shared CSS must be independent of optional contextual-help loading.
shell = read("assets/admin-shell.js")
design = read("assets/admin-design-system.css")
for token in [
    'ensureStylesheet("/assets/admin-design-system.css?v=20260906build347"',
    'rosie-admin-design-system-css',
]:
    if token not in shell:
        errors.append(f"admin-shell.js missing shared design loader token: {token}")

for token in [
    'body[data-page^="admin-"]',
    ".site-header",
    ".admin-module-menu",
    ".admin-return-bar",
    ".table-wrap",
    'input[type="checkbox"]',
    "@media(max-width:760px)",
]:
    if token not in design:
        errors.append(f"admin-design-system.css missing contract token: {token}")


# Inventory root admin pages. Redirect-only and login pages are not required to boot
# AdminShell, but every page that does boot it must have a consistent protected shell.
admin_pages = sorted(ROOT.glob("admin-*.html"))
protected_pages: list[tuple[Path, str, str]] = []
for path in admin_pages:
    body = path.read_text(encoding="utf-8", errors="ignore")
    if "AdminShell.boot" not in body:
        continue
    match = re.search(r'<body\b[^>]*\bdata-page=["\']([^"\']+)["\']', body, re.I)
    page_key = match.group(1).strip() if match else ""
    protected_pages.append((path, body, page_key))

    if not page_key.startswith("admin-"):
        errors.append(f"{path.name}: AdminShell page missing admin-* data-page")
    if 'name="viewport"' not in body and "name='viewport'" not in body:
        errors.append(f"{path.name}: missing responsive viewport")
    if "/assets/admin-auth.js" not in body:
        errors.append(f"{path.name}: missing admin-auth.js")
    if "/assets/admin-shell.js" not in body:
        errors.append(f"{path.name}: missing admin-shell.js")
    if len(re.findall(r"<h1\b", body, re.I)) != 1:
        errors.append(f"{path.name}: current protected page must contain exactly one h1")

    ids = re.findall(r'\bid=["\']([^"\']+)["\']', body, re.I)
    dupes = sorted({value for value in ids if ids.count(value) > 1})
    if dupes:
        warnings.append(f"{path.name}: duplicate id(s): {', '.join(dupes[:5])}")

if not protected_pages:
    errors.append("no AdminShell protected pages discovered")


# Canonical module navigation must not point to missing admin HTML files.
nav_js = read("assets/app-core/module-navigation.js")
nav_hrefs = sorted(set(re.findall(r"href\s*:\s*['\"](/admin-[^'\"?#]+\.html)", nav_js)))
for href in nav_hrefs:
    rel = href.lstrip("/")
    if not (ROOT / rel).exists():
        errors.append(f"module navigation points to missing page: {href}")

nav_page_keys = set(re.findall(r"page_key\s*:\s*['\"]([^'\"]+)", nav_js))
for path, _body, page_key in protected_pages:
    if page_key and page_key not in nav_page_keys:
        warnings.append(f"{path.name}: protected page is contextual/not listed in canonical module navigation ({page_key})")


# Admin remains the deliberate all-module break-glass/business-owner role.
internal_nav = load_json("data/internal_navigation.json")
admin_role = internal_nav.get("roles", {}).get("admin", {})
expected_modules = ["detailer", "operations", "admin", "it", "finance", "daip", "socials"]
if admin_role.get("force_all") is not True:
    errors.append("admin role lost force_all authority")
if admin_role.get("modules") != expected_modules:
    errors.append(f"admin module ceiling mismatch: {admin_role.get('modules')!r}")


if warnings:
    print("Build 347 admin UI audit warnings:")
    for warning in warnings:
        print(" -", warning)

if errors:
    print("Build 347 admin UI audit: FAIL")
    for error in errors:
        print(" -", error)
    raise SystemExit(1)

print("Build 347 admin UI audit: PASS")
print(f" - inventoried {len(admin_pages)} root admin-* HTML routes")
print(f" - validated {len(protected_pages)} current AdminShell protected routes")
print(f" - validated {len(nav_hrefs)} canonical admin navigation targets")
print(" - shared admin design system is loaded independently of contextual help")
print(" - admin retains full detailer/operations/admin/I.T./finance/DAIP/socials authority")
