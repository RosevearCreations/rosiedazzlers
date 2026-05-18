#!/usr/bin/env python3
from __future__ import annotations

import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]

ADMIN_MARKERS = [
    'id="bulkRepairImagesBtn"',
    'id="scanImageHealthBtn"',
    'function fetchMediaLibraryRows',
    'function repairSelectedImages',
    'function scanVisibleImages',
    'function duplicateImageGroups',
    '/api/admin/media_library_list?usage_context=inventory_item',
    'mediaLibraryRows.length'
]

ENDPOINT_MARKERS = [
    'app_media_library',
    'app_management_settings',
    'usage_context',
    'normalizeMediaRow',
    'source_status=neq.archived'
]


def fail(message: str) -> None:
    print(f"FAIL: {message}")
    sys.exit(1)


def check_contains(path: pathlib.Path, markers: list[str]) -> None:
    text = path.read_text(encoding="utf-8")
    for marker in markers:
        if marker not in text:
            fail(f"{path.relative_to(ROOT)} missing marker: {marker}")


def main() -> None:
    check_contains(ROOT / "admin-catalog.html", ADMIN_MARKERS)
    check_contains(ROOT / "admin-catalog" / "index.html", ADMIN_MARKERS)
    endpoint = ROOT / "functions" / "api" / "admin" / "media_library_list.js"
    if not endpoint.exists():
        fail("functions/api/admin/media_library_list.js is missing")
    check_contains(endpoint, ENDPOINT_MARKERS)

    seed_path = ROOT / "data" / "media_library_seed.json"
    seed = json.loads(seed_path.read_text(encoding="utf-8"))
    groups = seed.get("media_groups") if isinstance(seed, dict) else None
    if not isinstance(groups, list) or not groups:
        fail("data/media_library_seed.json has no media_groups")
    if not any("product" in str(group.get("key", "")).lower() for group in groups if isinstance(group, dict)):
        fail("data/media_library_seed.json must include a products media group for inventory picker fallback")

    print("PASS: media-library picker, bulk image repair, duplicate diagnostics, and image health scan markers checked")


if __name__ == "__main__":
    main()
