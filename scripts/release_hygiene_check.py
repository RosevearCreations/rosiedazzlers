#!/usr/bin/env python3
"""Protect the current release path from generated debris and release-number archaeology."""
from __future__ import annotations

import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ACTIVE_WORKFLOW = ROOT / ".github/workflows/development-source-gate.yml"
LIVING_DOCS = [
    ROOT / "AI_PROJECT_HANDOFF.md",
    ROOT / "AUTONOMOUS_RELEASE_QUEUE.md",
    ROOT / "BRANCH_WORKFLOW_NOTE.md",
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

    workflow = ACTIVE_WORKFLOW.read_text(encoding="utf-8", errors="ignore") if ACTIVE_WORKFLOW.exists() else ""
    if not workflow:
        errors.append("current shared source workflow is missing")
    if re.search(r"(?i)build\s*[-_ ]?\d{3}", workflow):
        errors.append("current shared source workflow still names historical numbered Builds")
    if re.search(r"(?i)(build|test_build)\d{3}", workflow):
        errors.append("current shared source workflow still calls numbered guard files")

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

    if errors:
        print("Release hygiene check: FAIL")
        for error in errors:
            print(f" - {error}")
        return 1

    print("Release hygiene check: PASS")
    print(" - shared source gate is release-number independent")
    print(" - living authority documents are current-state focused")
    print(" - generated Python cache files are not tracked")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
