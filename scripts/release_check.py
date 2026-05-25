#!/usr/bin/env python3
"""Rosie Dazzlers release smoke checks.

Build 174 note:
- Adds quote/proposal draft guard for Admin Leads persistent draft workflow.

Build 173 note:
- Run Python checks in-process with runpy instead of spawning a new Python
  interpreter for every guard. This avoids intermittent sandbox/CI startup
  hangs while preserving each guard's existing SystemExit return code.
"""
from __future__ import annotations

import os
import runpy
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CHECKS = [
    "scripts/cloudflare_pages_functions_check.py",
    "scripts/social_dispatch_workflow_check.py",
    "scripts/competitor_roadmap_check.py",
    "scripts/conversion_path_check.py",
    "scripts/booking_condition_recommender_check.py",
    "scripts/booking_intake_admin_review_check.py",
    "scripts/booking_intake_review_actions_check.py",
    "scripts/booking_photo_estimate_links_check.py",
    "scripts/competetive_completion_check.py",
    "scripts/competetive_matrix_build167_check.py",
    "scripts/admin_leads_build168_check.py",
    "scripts/auth_analytics_build169_check.py",
    "scripts/client_dashboard_build170_check.py",
    "scripts/lead_quote_preview_build171_check.py",
    "scripts/public_faq_content_build172_check.py",
    "scripts/admin_content_build173_check.py",
    "scripts/quote_proposal_drafts_build174_check.py",
    "scripts/seo_h1_check.py",
]


def run_python_check(rel: str) -> int:
    path = ROOT / rel
    if not path.exists():
        print(f"Missing release check: {rel}", flush=True)
        return 1

    print(f"Running {sys.executable} {rel}", flush=True)
    previous_cwd = Path.cwd()
    try:
      os.chdir(ROOT)
      try:
          runpy.run_path(str(path), run_name="__main__")
      except SystemExit as exc:
          code = exc.code
          if code is None:
              return 0
          if isinstance(code, int):
              return code
          print(code, flush=True)
          return 1
    finally:
      os.chdir(previous_cwd)

    return 0


def main() -> int:
    for rel in CHECKS:
        code = run_python_check(rel)
        if code != 0:
            return code
    print("Release check passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
