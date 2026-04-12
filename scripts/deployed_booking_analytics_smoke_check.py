#!/usr/bin/env python3
from __future__ import annotations
import argparse, urllib.request, urllib.parse
from html.parser import HTMLParser

class TextParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.text = []
        self.has_analytics_script = False
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag.lower() == 'script' and 'public-analytics.js' in (attrs.get('src') or ''):
            self.has_analytics_script = True
    def handle_data(self, data):
        self.text.append(data)

def fetch(url: str, timeout: int = 20) -> str:
    req = urllib.request.Request(url, headers={'User-Agent':'RosieBookingAnalyticsSmoke/1.0'})
    with urllib.request.urlopen(req, timeout=timeout) as res:
        return res.read().decode('utf-8', 'ignore')

def main() -> int:
    parser = argparse.ArgumentParser(description='Smoke-check deployed booking and analytics surfaces.')
    parser.add_argument('--base-url', default='https://rosiedazzlers.ca')
    parser.add_argument('--timeout', type=int, default=20)
    args = parser.parse_args()
    book_url = urllib.parse.urljoin(args.base_url.rstrip('/') + '/', 'book')
    try:
        html = fetch(book_url, args.timeout)
    except Exception as err:
        print(f"FAIL: could not fetch {book_url}: {err}")
        return 1
    p = TextParser(); p.feed(html)
    text = ' '.join(p.text)
    required = ['Book mobile detailing', 'Preferred date', 'Service area', 'Booking calendar snapshot', 'Next 21 days']
    missing = [needle for needle in required if needle not in text]
    if missing:
        print('FAIL: booking page missing expected text -> ' + ', '.join(missing))
        return 1
    if not p.has_analytics_script and 'public-analytics.js' not in html:
        print('FAIL: booking page missing analytics bootstrap script')
        return 1
    print('OK: booking page includes booking wizard text, paged availability controls, and analytics bootstrap.')
    print('NOTE: signed-in admin analytics verification still requires manual login/session testing after deployment.')
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
