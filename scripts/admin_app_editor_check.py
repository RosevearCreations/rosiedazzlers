#!/usr/bin/env python3
from __future__ import annotations

import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]

def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")

def fail(message: str) -> None:
    print(f"FAIL: {message}")
    sys.exit(1)

def main() -> None:
    for path in ["admin-app.html", "admin-app/index.html"]:
        text = read(path)
        required = [
            "serviceAreaEditorSelect",
            "saveSelectedServiceAreaBtn",
            "duplicateSelectedServiceAreaBtn",
            "deleteSelectedServiceAreaBtn",
            "data-area-editor-field",
            "flashSavedButton",
            "btn.saved",
            "service-area-picker-card",
        ]
        for token in required:
            if token not in text:
                fail(f"{path} missing {token}")
        forbidden = [
            "data-area-index",
            "service-area-expanded",
            "data-delete-area",
        ]
        for token in forbidden:
            if token in text:
                fail(f"{path} still contains old expanding service-area table token {token}")
    print("PASS: Admin App compact service-area editor and save feedback checks passed")

if __name__ == "__main__":
    main()
