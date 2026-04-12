#!/usr/bin/env python3
from __future__ import annotations

import argparse
import urllib.parse
import urllib.request
from html.parser import HTMLParser


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.text_parts: list[str] = []
        self.has_public_analytics_script = False
        self.has_chrome_bootstrap_script = False

    def handle_starttag(self, tag: str, attrs) -> None:
        attrs_dict = dict(attrs)
        if tag.lower() != "script":
            return
        src = (attrs_dict.get("src") or "").strip()
        if "public-analytics.js" in src:
            self.has_public_analytics_script = True
        if "chrome.js" in src:
            self.has_chrome_bootstrap_script = True

    def handle_data(self, data: str) -> None:
        if data:
            self.text_parts.append(data)


def fetch(url: str, timeout: int = 20) -> str:
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "RosieBookingAnalyticsSmoke/1.1"},
    )
    with urllib.request.urlopen(req, timeout=timeout) as res:
        return res.read().decode("utf-8", "ignore")


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Smoke-check deployed booking and analytics surfaces."
    )
    parser.add_argument("--base-url", default="https://rosiedazzlers.ca")
    parser.add_argument("--timeout", type=int, default=20)
    args = parser.parse_args()

    book_url = urllib.parse.urljoin(args.base_url.rstrip("/") + "/", "book")

    try:
        html = fetch(book_url, args.timeout)
    except Exception as err:
        print(f"FAIL: could not fetch {book_url}: {err}")
        return 1

    page = PageParser()
    page.feed(html)

    text = " ".join(page.text_parts)
    required = [
        "Book mobile detailing",
        "Preferred date",
        "Service area",
        "Booking calendar snapshot",
        "Next 21 days",
    ]
    missing = [needle for needle in required if needle not in text]
    if missing:
        print("FAIL: booking page missing expected text -> " + ", ".join(missing))
        return 1

    has_analytics_bootstrap = (
        page.has_public_analytics_script
        or page.has_chrome_bootstrap_script
        or "public-analytics.js" in html
        or "chrome.js" in html
        or "RosieAnalytics" in html
    )

    if not has_analytics_bootstrap:
        print("FAIL: booking page missing analytics bootstrap script")
        return 1

    print(
        "OK: booking page includes booking wizard text, paged availability controls, "
        "and analytics bootstrap."
    )
    print(
        "NOTE: signed-in admin analytics verification still requires manual "
        "login/session testing after deployment."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
