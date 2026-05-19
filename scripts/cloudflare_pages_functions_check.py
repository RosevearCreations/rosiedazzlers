#!/usr/bin/env python3
"""Cloudflare Pages Functions deploy-safety checks.

Node's parser can accept a literal newline inside a regex character class, but the
Cloudflare Pages Functions bundler/esbuild rejects it as an unterminated regular
expression. This check catches that deploy-only failure class before upload.
"""
from __future__ import annotations

import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
JS_GLOBS = ["functions/**/*.js", "*.js", "assets/**/*.js", "scripts/**/*.js"]


def iter_js_files() -> list[pathlib.Path]:
    files: set[pathlib.Path] = set()
    for pattern in JS_GLOBS:
        for path in ROOT.glob(pattern):
            if path.is_file() and "node_modules" not in path.parts:
                files.add(path)
    return sorted(files)


def run_node_checks(files: list[pathlib.Path]) -> None:
    failures: list[str] = []
    for path in files:
        result = subprocess.run(
            ["node", "--check", str(path.relative_to(ROOT))],
            cwd=ROOT,
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        if result.returncode:
            failures.append(f"{path.relative_to(ROOT)}\n{result.stderr.strip()}")
    if failures:
        print("FAIL: JavaScript syntax check failed", file=sys.stderr)
        print("\n\n".join(failures[:20]), file=sys.stderr)
        raise SystemExit(1)


def check_relative_import_resolution(files: list[pathlib.Path]) -> None:
    failures: list[str] = []
    import_pattern = re.compile(r"(?:from\s+|import\(|require\()(?P<q>[\'\"])(?P<spec>\.\.?/[^\'\"]+)(?P=q)")
    for path in files:
        text = path.read_text(encoding="utf-8", errors="ignore")
        for match in import_pattern.finditer(text):
            spec = match.group("spec")
            if not spec.endswith(".js"):
                continue
            target = (path.parent / spec).resolve()
            try:
                target.relative_to(ROOT.resolve())
            except ValueError:
                failures.append(f"{path.relative_to(ROOT)} imports outside repo: {spec}")
                continue
            if not target.exists():
                line = text.count("\n", 0, match.start()) + 1
                failures.append(f"{path.relative_to(ROOT)}:{line} could not resolve {spec}")
    if failures:
        print("FAIL: unresolved relative imports found", file=sys.stderr)
        print("\n".join(failures[:80]), file=sys.stderr)
        raise SystemExit(1)


def check_esbuild_sensitive_regex(files: list[pathlib.Path]) -> None:
    offenders: list[str] = []
    # Catches regex character classes split by a literal line break, such as:
    #   split(/[,\n]/) accidentally emitted as split(/[,<newline>]/)
    pattern = re.compile(r"/\[[^\]]*\n[^\]]*\]/")
    for path in files:
        text = path.read_text(encoding="utf-8", errors="ignore")
        for match in pattern.finditer(text):
            line = text.count("\n", 0, match.start()) + 1
            offenders.append(f"{path.relative_to(ROOT)}:{line}")
    if offenders:
        print("FAIL: literal newline inside regex character class; Cloudflare/esbuild may reject this.", file=sys.stderr)
        print("\n".join(offenders), file=sys.stderr)
        raise SystemExit(1)


def check_landing_page_duplicate_keys() -> None:
    path = ROOT / "functions/api/landing_pages_public.js"
    if not path.exists():
        return
    text = path.read_text(encoding="utf-8", errors="ignore")
    match = re.search(r"function normalizePage\(page\) \{.*?return \{(?P<body>.*?)\n  \};\n\}", text, re.S)
    if not match:
        return
    keys: dict[str, int] = {}
    duplicates: list[str] = []
    for key_match in re.finditer(r"^\s*([A-Za-z_$][\w$]*)\s*:", match.group("body"), re.M):
        key = key_match.group(1)
        line = text.count("\n", 0, match.start("body") + key_match.start()) + 1
        if key in keys:
            duplicates.append(f"{path.relative_to(ROOT)}:{line} duplicate key {key!r} first seen near line {keys[key]}")
        else:
            keys[key] = line
    if duplicates:
        print("FAIL: duplicate normalizePage object keys found", file=sys.stderr)
        print("\n".join(duplicates), file=sys.stderr)
        raise SystemExit(1)


def main() -> None:
    files = iter_js_files()
    run_node_checks(files)
    check_esbuild_sensitive_regex(files)
    check_relative_import_resolution(files)
    check_landing_page_duplicate_keys()
    print(f"PASS: Cloudflare Pages Functions syntax/deploy check passed ({len(files)} JS files)")


if __name__ == "__main__":
    main()
