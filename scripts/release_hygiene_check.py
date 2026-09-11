#!/usr/bin/env python3
"""Protect the current release path from generated debris and release-number archaeology."""
from __future__ import annotations

import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKFLOW_DIR = ROOT / ".github/workflows"
ACTIVE_WORKFLOWS = [
    WORKFLOW_DIR / "development-source-gate.yml",
    WORKFLOW_DIR / "cloudflare-development-acceptance.yml",
    WORKFLOW_DIR / "cloudflare-pages-recovery.yml",
    WORKFLOW_DIR / "production-business-acceptance-authority.yml",
]
NO_NUMBERED_HELPER_WORKFLOWS = [
    WORKFLOW_DIR / "development-source-gate.yml",
    WORKFLOW_DIR / "cloudflare-development-acceptance.yml",
    WORKFLOW_DIR / "cloudflare-pages-recovery.yml",
]
ACTIVE_HELPERS = [
    ROOT / "scripts/cloudflare_pages_development.sh",
    ROOT / "scripts/development_http_smoke.sh",
    ROOT / "scripts/contextual_proof_http_smoke.sh",
    ROOT / "scripts/cloudflare_pages_production_acceptance.sh",
]
LIVING_DOCS = [
    ROOT / "AI_PROJECT_HANDOFF.md",
    ROOT / "AUTONOMOUS_RELEASE_QUEUE.md",
    ROOT / "BRANCH_WORKFLOW_NOTE.md",
    ROOT / "README.md",
]


def tracked_files() -> list[str]:
    proc = subprocess.run(
        ["git", "ls-files", "-z"],
        cwd=ROOT,
        capture_output=True,
        check=True,
    )
    return [item.decode("utf-8", errors="replace") for item in proc.stdout.split(b"\0") if item]


def main() -> int:
    errors: list[str] = []
    tracked = tracked_files()
    generated = [path for path in tracked if "/__pycache__/" in f"/{path}" or path.endswith((".pyc", ".pyo"))]
    if generated:
        errors.append("tracked Python cache artifacts remain: " + ", ".join(generated[:20]))

    if not WORKFLOW_DIR.exists():
        errors.append("workflow directory is missing")
    else:
        numbered_workflows = sorted(path.name for path in WORKFLOW_DIR.iterdir() if path.is_file() and re.match(r"(?i)^build\d", path.name))
        if numbered_workflows:
            errors.append("numbered workflow launchers remain: " + ", ".join(numbered_workflows[:20]))

    for path in ACTIVE_WORKFLOWS:
        if not path.exists():
            errors.append(f"active workflow missing: {path.name}")
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        if re.search(r"(?i)build\s*[-_ ]?\d{3}", text):
            errors.append(f"{path.name} still names a historical numbered Build")
        if path in NO_NUMBERED_HELPER_WORKFLOWS and re.search(r"(?i)scripts/(?:build|test_build)\d{3}", text):
            errors.append(f"{path.name} still calls a numbered guard/helper")

    for path in ACTIVE_HELPERS:
        if not path.exists():
            errors.append(f"active helper missing: {path.name}")
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        if re.search(r"(?i)scripts/(?:build|test_build)\d{3}", text):
            errors.append(f"{path.name} still calls a numbered guard/helper")

    gitignore = (ROOT / ".gitignore").read_text(encoding="utf-8", errors="ignore")
    for token in ("__pycache__/", "*.py[cod]"):
        if token not in gitignore:
            errors.append(f".gitignore is missing cache rule {token}")

    for path in LIVING_DOCS:
        if not path.exists():
            errors.append(f"living authority missing: {path.name}")
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        numbered_mentions = re.findall(r"(?i)\bbuild\s+\d{3}\b", text)
        if len(numbered_mentions) > 3:
            errors.append(f"{path.name} contains release archaeology ({len(numbered_mentions)} numbered Build mentions)")
        stale_shas = re.findall(r"(?i)\b[0-9a-f]{12,40}\b", text)
        if stale_shas:
            errors.append(f"{path.name} embeds commit-like identity instead of live Git/workflow authority")

    readme = ROOT / "README.md"
    if readme.exists() and len(readme.read_text(encoding="utf-8", errors="ignore")) > 18000:
        errors.append("README.md exceeds the living-document size boundary")

    if errors:
        print("Release hygiene check: FAIL")
        for error in errors:
            print(f" - {error}")
        return 1

    print("Release hygiene check: PASS")
    print(" - active workflows and helpers are release-number independent")
    print(" - durable Production authority may call retained canonical acceptance guards without adopting their release identity")
    print(" - numbered workflow launchers are absent")
    print(" - living authority documents are current-state focused and do not pin stale commit SHAs")
    print(" - generated Python cache files are not tracked")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
