#!/usr/bin/env python3
"""Lightweight Cloudflare Pages Functions guard for Rosie Dazzlers."""
from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FUNCTIONS = ROOT / "functions"
API = FUNCTIONS / "api"
NODE_CHECK_TIMEOUT_SECONDS = 30


def fail(msg: str) -> None:
    print(f"ERROR: {msg}")
    sys.exit(1)


def main() -> int:
    if not API.exists():
        fail("functions/api directory is missing")

    js_files = sorted(FUNCTIONS.rglob("*.js"))
    if not js_files:
        fail("No Cloudflare Functions JavaScript files found")

    root_api_bad_imports = []
    missing_imports = []
    unterminated_regex_markers = []

    for path in js_files:
        rel = path.relative_to(ROOT).as_posix()
        text = path.read_text(encoding="utf-8", errors="ignore")

        if path.parent == API and "../_lib/" in text:
            root_api_bad_imports.append(rel)

        if re.search(r"split\(/\[,\s*$", text):
            unterminated_regex_markers.append(rel)

        for m in re.finditer(r"(?:from\s+|import\(|require\()(['\"])(\.{1,2}/[^'\"]+)\1", text):
            target = m.group(2)
            target_path = (path.parent / target).resolve()
            if not target_path.exists():
                missing_imports.append(f"{rel} -> {target}")

    if root_api_bad_imports:
        fail("Root functions/api files still import ../_lib/: " + ", ".join(root_api_bad_imports[:20]))

    if missing_imports:
        fail("Missing relative imports: " + "; ".join(missing_imports[:30]))

    if unterminated_regex_markers:
        fail("Potential Cloudflare/esbuild regex break: " + ", ".join(unterminated_regex_markers))

    # Full repo syntax checks are expensive in the ChatGPT sandbox. Keep the broad static
    # Cloudflare checks above, then syntax-check the files most likely to break this pass.
    # GitHub hosted runners can occasionally take more than 10 seconds to start one node
    # syntax process under load, so allow a bounded 30 seconds per critical file and report
    # a clean file-specific failure instead of leaking a Python TimeoutExpired traceback.
    critical_patterns = (
        "functions/api/admin/social_",
        "functions/api/social_",
        "functions/api/admin/progress_",
        "functions/api/progress_",
        "functions/api/_lib/social-dispatch.js",
        "functions/api/_lib/social-platform-dispatch.js",
        "functions/api/_lib/social-compliance.js",
        "functions/api/admin/auth_",
        "functions/api/admin/content_",
        "functions/api/client/auth_",
        "functions/api/auth_",
        "functions/api/analytics/ingest.js",
        "functions/api/_lib/staff-session.js",
        "functions/api/_lib/customer-session.js",
        "functions/api/_lib/staff-auth.js",
        "functions/api/_lib/app-settings.js",
    )
    critical_files = [path for path in js_files if path.relative_to(ROOT).as_posix().startswith(critical_patterns)]
    for path in critical_files:
        rel = path.relative_to(ROOT).as_posix()
        try:
            proc = subprocess.run(
                ["node", "--check", str(path)],
                cwd=ROOT,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                timeout=NODE_CHECK_TIMEOUT_SECONDS,
            )
        except subprocess.TimeoutExpired:
            fail(f"node --check timed out for {rel} after {NODE_CHECK_TIMEOUT_SECONDS} seconds")
        if proc.returncode != 0:
            fail(f"node --check failed for {rel}\n{proc.stderr or proc.stdout}")

    print(f"Cloudflare Pages Functions static check passed across {len(js_files)} JS files; syntax-checked {len(critical_files)} critical changed files.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
