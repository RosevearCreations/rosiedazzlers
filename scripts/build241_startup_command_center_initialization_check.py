#!/usr/bin/env python3
from pathlib import Path
import re,sys
ROOT=Path(__file__).resolve().parents[1]
errors=[]
def read(rel):
 p=ROOT/rel
 if not p.exists(): errors.append(f"missing {rel}"); return ""
 return p.read_text(encoding="utf-8",errors="ignore")
js=read("assets/startup-command-center.js")
for token in ["const BUILD=241", "function getEvidenceRows()", "const rows=getEvidenceRows()", "Promise.allSettled", "Startup Command Center loaded with fallback protection"]:
 if token not in js: errors.append(f"startup JS missing {token}")
for bad in ["const evidenceRows=evidenceRows()", "function evidenceRows()"]:
 if bad in js: errors.append(f"startup JS retains TDZ pattern {bad}")
for rel in ["admin-startup-guide.html","admin-startup-guide/index.html"]:
 s=read(rel)
 if "/assets/startup-command-center.js?v=20260805build241" not in s: errors.append(f"{rel} missing Build 241 cache token")
 if len(re.findall(r"<h1\b",s,re.I))>1: errors.append(f"{rel} has more than one H1")
if read("admin-startup-guide.html").encode()!=read("admin-startup-guide/index.html").encode(): errors.append("startup clean-route copy drift")
sw=read("service-worker.js")
if "rosie-app-v20260805build241" not in sw or "startup-command-center.js?v=20260805build241" not in sw: errors.append("service worker missing Build 241 hotfix cache")
for rel in ["data/build241_startup_command_center_hotfix.json","sql/2026-08-05_build241_startup_command_center_initialization_hotfix_no_ddl.sql"]:
 if not (ROOT/rel).exists(): errors.append(f"missing {rel}")
marker="<!-- BUILD241_SYNC: 2026-08-05 | Startup Command Center initialization/cache hotfix | No DDL required -->"
for p in ROOT.rglob("*.md"):
 if marker not in p.read_text(encoding="utf-8",errors="ignore"): errors.append(f"Markdown not synchronized: {p.relative_to(ROOT)}")
if errors:
 print("Build 241 check failed:")
 for e in errors: print("-",e)
 sys.exit(1)
print("Build 241 Startup Command Center initialization, fallback, cache, route, H1, and Markdown checks passed.")
