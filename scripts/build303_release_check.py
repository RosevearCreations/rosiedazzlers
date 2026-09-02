#!/usr/bin/env python3
from pathlib import Path
import subprocess, sys

ROOT = Path(__file__).resolve().parents[1]
BASELINE = "9ec950384124644d1176a01d381745a3d8f7cfb9"
PAGE = "admin-tax-support.html"
ASSET = "assets/admin-tax-support-v303.js"
TAG = '<script src="/assets/admin-tax-support-v303.js"></script>'
errors=[]

def read(rel):
    p=ROOT/rel
    if not p.exists(): errors.append(f"missing {rel}"); return ""
    return p.read_text(encoding="utf-8", errors="ignore")

def gitshow(rel):
    p=subprocess.run(["git","show",f"{BASELINE}:{rel}"],cwd=ROOT,capture_output=True,text=True)
    if p.returncode: errors.append(f"cannot read Build 302 baseline {rel}"); return ""
    return p.stdout

baseline=gitshow(PAGE)
marker="<script>\n(function(){"
start=baseline.rfind(marker)
if start<0:
    errors.append("Build 302 baseline tax-support inline controller not found")
else:
    body_start=start+len("<script>\n")
    end=baseline.find("</script>",body_start)
    expected_asset=baseline[body_start:end]
    if read(ASSET)!=expected_asset:
        errors.append("Build 303 asset is not byte-for-byte the Build 302 inline tax-support controller")
    expected_page=baseline[:start]+TAG+baseline[end+len("</script>"):]
    if read(PAGE).rstrip("\n")!=expected_page.rstrip("\n"):
        errors.append("tax-support page differs from Build 302 beyond exact controller extraction")

page=read(PAGE); asset=read(ASSET)
if TAG not in page: errors.append("tax-support page missing Build 303 versioned asset")
if "<script>\n(function(){" in page: errors.append("inline tax-support controller remains")
for token in ["/api/admin/accounting_tax_support", "/api/admin/accounting_accountant_package?year=", "save_profile", "save_mileage", "save_home_office", "save_capital_asset", "save_tax_year", "window.AdminShell.boot", "pageKey:'admin-tax-review'"]:
    if token not in asset: errors.append(f"tax-support asset lost retained Build 273 token {token}")
for rel in ["functions/api/admin/accounting_tax_support.js","functions/api/_lib/accounting-tax-support.js"]:
    diff=subprocess.run(["git","diff","--quiet",BASELINE,"HEAD","--",rel],cwd=ROOT)
    if diff.returncode: errors.append(f"Build 303 unexpectedly changes backend tax authority {rel}")
changed=subprocess.run(["git","diff","--name-only",f"{BASELINE}...HEAD"],cwd=ROOT,capture_output=True,text=True)
if changed.returncode: errors.append("could not inspect Build 303 changed files")
else:
    for name in changed.stdout.splitlines():
        low=name.lower()
        if "migration" in low or low.startswith("database") or low.endswith(".sql"):
            errors.append(f"Build 303 unexpectedly changes schema/migration file {name}")
syntax=subprocess.run(["node","--check",str(ROOT/ASSET)],capture_output=True,text=True)
if syntax.returncode: errors.append(f"node --check failed: {syntax.stderr.strip()}")
if errors:
    print("Build 303 Finance Tax-support maintainability extraction: FAIL")
    for e in errors: print("-",e)
    sys.exit(1)
print("Build 303 Finance Tax-support maintainability extraction: PASS")
print("- Build 273 tax-support controller is byte-for-byte preserved in the versioned asset")
print("- tax-support backend authority is unchanged")
print("- no schema/database or new tax judgment was introduced")
