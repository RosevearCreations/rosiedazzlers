#!/usr/bin/env python3
"""Build 389 — Local SEO, service landing and proof source authority."""
from __future__ import annotations

import json
import re
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    p = ROOT / path
    assert p.exists(), f"missing required Build 389 source: {path}"
    return p.read_text(encoding="utf-8")


def page_path(slug: str) -> Path:
    candidates = [ROOT / slug / "index.html", ROOT / f"{slug}.html"]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    raise AssertionError(f"missing target landing page for {slug}")


def one(pattern: str, text: str, label: str) -> str:
    matches = re.findall(pattern, text, flags=re.I | re.S)
    assert len(matches) == 1, f"{label}: expected exactly one match, got {len(matches)}"
    return matches[0].strip()


def normalized_path(url: str) -> str:
    return urlparse(url).path.rstrip("/") or "/"


def main() -> None:
    local = json.loads(read("data/local_seo_targets.json"))
    assert local.get("primary_region") == "Oxford County and Norfolk County, Ontario"
    assert set(local.get("service_area_coverage", {}).get("counties", [])) == {"Oxford County", "Norfolk County"}

    town_slugs = [row["slug"] for row in local.get("town_pages", [])]
    service_slugs = ["ceramic-coating", "pet-hair-removal", "odor-removal", "headlight-restoration", "paint-correction"]
    target_slugs = town_slugs + service_slugs
    assert len(town_slugs) >= 8, "Build 389 expects the established Oxford/Norfolk town-page set"

    titles: dict[str, str] = {}
    descriptions: dict[str, str] = {}
    canonicals: dict[str, str] = {}
    for slug in target_slugs:
        path = page_path(slug)
        html = path.read_text(encoding="utf-8")
        assert "noindex" not in html.lower(), f"{path}: Build 389 target unexpectedly noindex"
        assert len(re.findall(r"<h1\b", html, flags=re.I)) == 1, f"{path}: indexable page must contain one meaningful H1"
        title = one(r"<title>(.*?)</title>", html, f"{path} title")
        description = one(r'<meta\s+name="description"\s+content="([^"]+)"', html, f"{path} description")
        canonical = one(r'<link\s+rel="canonical"\s+href="([^"]+)"', html, f"{path} canonical")
        assert re.search(r'<script[^>]+type="application/ld\+json"', html, flags=re.I), f"{path}: missing structured data"
        assert "/assets/landing-page.js" in html, f"{path}: target must use shared landing authority"
        assert normalized_path(canonical) == f"/{slug}", f"{path}: canonical does not match route"
        titles[slug] = title
        descriptions[slug] = description
        canonicals[slug] = canonical

    assert len(set(titles.values())) == len(titles), "Build 389 target titles must be unique"
    assert len(set(descriptions.values())) == len(descriptions), "Build 389 target descriptions must be unique"
    assert len(set(canonicals.values())) == len(canonicals), "Build 389 target canonicals must be unique"

    wrapper = read("assets/landing-page.js")
    retained = read("assets/landing-page-build388.js")
    convergence = read("assets/build389-local-seo-proof.js")
    endpoint = read("functions/api/local_proof_public.js")

    assert "landing-page-build388.js" in wrapper and "startBuild389LandingConvergence" in wrapper
    assert "/api/pricing_catalog_public" in retained, "retained renderer must preserve current public pricing authority"
    assert "/api/local_proof_public" in convergence, "landing convergence must use fail-closed proof feed"
    assert "/book#booking" in convergence and "/book#services" in convergence, "retired pricing/services links must converge to unified booking"
    assert "data-photo-managed-before-after" in convergence and "data-visual-placeholder-section" in convergence
    assert "section:has([data-recent-work-mount])" in convergence, "legacy sample recent-work mount must be hidden before runtime convergence"

    assert "galleryProofEligibility" in endpoint, "public proof must reuse gallery proof authority"
    assert "fallback_used: false" in endpoint, "landing proof must explicitly fail closed"
    assert "loadStaticGallery" not in endpoint and "DEFAULT_GALLERY" not in endpoint, "landing proof must never fall back to bundled samples"
    assert "onRequestPost" not in endpoint and "onRequestPatch" not in endpoint and "onRequestDelete" not in endpoint, "Build 389 proof endpoint must remain read-only"
    sanitize = re.search(r"function sanitizeProofItem\(item\).*?\n}\n", endpoint, flags=re.S)
    assert sanitize, "could not resolve public proof sanitizer"
    assert "customer_name" not in sanitize.group(0), "public proof response must not emit customer names"
    assert "source_booking_id" not in sanitize.group(0), "public proof response must not emit booking identifiers"

    gallery = json.loads(read("data/before_after_gallery.json"))
    assert any(str(row.get("proof_kind", "")).lower() == "sample" for row in gallery.get("items", [])), "fixture should continue to prove sample exclusion"
    assert "sample_reviews.json" not in convergence and "sample_reviews.json" not in endpoint

    queue = read("AUTONOMOUS_RELEASE_QUEUE.md")
    handoff = read("AI_PROJECT_HANDOFF.md")
    assert "Build 389 — Local SEO, Service Landing & Proof Convergence" in queue
    assert "Build 390 — Booking, Quote & Condition-Based Estimate Hardening" in queue
    assert "Build 389 — Local SEO, Service Landing & Proof Convergence" in handoff
    assert "Build 390 — Booking, Quote & Condition-Based Estimate Hardening" in handoff

    print(f"Build 389 source authority: PASS ({len(target_slugs)} indexable town/service targets checked)")


if __name__ == "__main__":
    main()
