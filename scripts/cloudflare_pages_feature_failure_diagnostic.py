#!/usr/bin/env python3
"""Sanitized Cloudflare Pages feature-preview failure classifier.

Reads exact deployment/log evidence through the existing GitHub Actions Cloudflare
token and prints only stage state, a coarse failure category and safe source-path
hints. Raw Cloudflare logs and secret/environment values are never printed.
"""
from __future__ import annotations
import json
import os
import re
import sys
import urllib.request
import urllib.error

TOKEN=os.environ.get("CLOUDFLARE_API_TOKEN","")
ACCOUNT=os.environ.get("CONFIGURED_ACCOUNT_ID","") or os.environ.get("CLOUDFLARE_ACCOUNT_ID","")
PROJECT=os.environ.get("CF_PROJECT_NAME","rosiedazzlers")
SHA=os.environ.get("TARGET_SHA","")
BRANCH=os.environ.get("CF_FEATURE_BRANCH","")
API="https://api.cloudflare.com/client/v4"

def fail(msg, code=1):
    print(f"CLOUDFLARE FEATURE FAILURE DIAGNOSTIC: {msg}")
    raise SystemExit(code)

if not all([TOKEN,ACCOUNT,PROJECT,SHA,BRANCH]):
    fail("required diagnostic environment is unavailable",2)

def get(path):
    req=urllib.request.Request(API+path,headers={
        "Authorization":f"Bearer {TOKEN}",
        "Content-Type":"application/json",
        "User-Agent":"rosiedazzlers-sanitized-feature-diagnostic"
    })
    try:
        with urllib.request.urlopen(req,timeout=30) as resp:
            data=json.load(resp)
    except urllib.error.HTTPError as exc:
        fail(f"Cloudflare API returned HTTP {exc.code}",3)
    except Exception as exc:
        fail(f"Cloudflare API request failed ({type(exc).__name__})",4)
    if not data.get("success"):
        fail("Cloudflare API reported unsuccessful response",5)
    return data.get("result")

deployments=get(f"/accounts/{ACCOUNT}/pages/projects/{PROJECT}/deployments?per_page=25") or []
exact=[
    d for d in deployments
    if (d.get("deployment_trigger",{}).get("metadata",{}).get("commit_hash") or "")==SHA
    and (d.get("deployment_trigger",{}).get("metadata",{}).get("branch") or "")==BRANCH
]
if not exact:
    fail("exact SHA/branch deployment was not found",6)
exact.sort(key=lambda d:d.get("created_on") or "",reverse=True)
deployment=exact[0]
deployment_id=deployment.get("id")
detail=get(f"/accounts/{ACCOUNT}/pages/projects/{PROJECT}/deployments/{deployment_id}") or deployment
stages=detail.get("stages") or []
stage_summary=" > ".join(f"{s.get('name','unknown')}={s.get('status','unknown')}" for s in stages)
print(f"CLOUDFLARE FEATURE FAILURE STAGES: {stage_summary or 'unavailable'}")
print(f"CLOUDFLARE FEATURE FAILURE LATEST_STAGE: {detail.get('latest_stage',{}).get('name','unknown')}={detail.get('latest_stage',{}).get('status','unknown')}")

logs=get(f"/accounts/{ACCOUNT}/pages/projects/{PROJECT}/deployments/{deployment_id}/history/logs") or {}
lines=[str(item.get("line","")) for item in (logs.get("data") or [])]
joined="\n".join(lines).lower()

categories=[
    ("syntax_or_parse",["syntaxerror","syntax error","parse error","unexpected token","unterminated"]),
    ("module_resolution",["could not resolve","cannot find module","module not found","failed to resolve","no such file or directory"]),
    ("pages_functions_bundle",["pages functions","failed to build functions","functions build","_worker.js","worker bundle","failed to bundle"]),
    ("platform_limit",["script too large","size limit","exceeded maximum","too many files","maximum number","routes limit","limit exceeded"]),
    ("dependency_install",["npm err","npm error","pnpm","yarn error","install dependencies","dependency installation"]),
    ("build_command",["build command failed","command exited with","exit code","build script failed"]),
    ("provider_internal",["internal error","service unavailable","temporarily unavailable","try again later","unexpected internal"])
]
category="unclassified_build_failure"
matched_terms=[]
for name,terms in categories:
    found=[term for term in terms if term in joined]
    if found:
        category=name
        matched_terms=found[:4]
        break
print(f"CLOUDFLARE FEATURE FAILURE CATEGORY: {category}")
if matched_terms:
    print("CLOUDFLARE FEATURE FAILURE SIGNALS: "+", ".join(matched_terms))

path_re=re.compile(r"(?<![A-Za-z0-9_.-])(?:[A-Za-z0-9_.-]+/)*[A-Za-z0-9_.-]+\.(?:js|mjs|cjs|json|html|css|py|yml|yaml)(?![A-Za-z0-9_.-])",re.I)
paths=[]
for line in lines:
    low=line.lower()
    if any(term in low for _,terms in categories for term in terms) or "error" in low or "fail" in low:
        for path in path_re.findall(line):
            if path not in paths:
                paths.append(path)
for path in paths[:8]:
    print(f"CLOUDFLARE FEATURE FAILURE PATH_HINT: {path}")

print(f"CLOUDFLARE FEATURE FAILURE LOG_LINES_ANALYZED: {len(lines)}")
print("CLOUDFLARE FEATURE FAILURE RAW_LOGS_EXPOSED: false")
