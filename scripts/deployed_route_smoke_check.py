#!/usr/bin/env python3
from __future__ import annotations
import argparse
import pathlib
import sys
import urllib.error
import urllib.parse
import urllib.request
from html.parser import HTMLParser

ROOT = pathlib.Path(__file__).resolve().parents[1]
DEFAULT_ROUTES = [
    '/', '/services', '/pricing', '/about', '/contact', '/book', '/gear', '/consumables', '/gifts', '/videos', '/privacy', '/terms', '/waiver', '/login', '/my-account', '/progress',
    '/admin-login', '/admin', '/admin-booking', '/admin-blocks', '/admin-jobsite', '/admin-staff', '/admin-progress', '/admin-live', '/admin-recovery', '/admin-accounting', '/admin-assign',
    '/ceramic-coating', '/pet-hair-removal', '/odor-removal', '/headlight-restoration', '/paint-correction', '/tillsonburg-auto-detailing', '/woodstock-ingersoll-auto-detailing', '/simcoe-delhi-auto-detailing', '/port-dover-auto-detailing'
]

class H1Parser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.h1_count = 0
        self.title = ''
        self._in_title = False
    def handle_starttag(self, tag, attrs):
        t = tag.lower()
        if t == 'h1':
            self.h1_count += 1
        elif t == 'title':
            self._in_title = True
    def handle_endtag(self, tag):
        if tag.lower() == 'title':
            self._in_title = False
    def handle_data(self, data):
        if self._in_title:
            self.title += data


def fetch(url: str, timeout: int):
    req = urllib.request.Request(url, headers={'User-Agent': 'RosieDazzlersRouteSmoke/1.0'})
    with urllib.request.urlopen(req, timeout=timeout) as res:
        return res.getcode(), res.geturl(), res.read().decode('utf-8', 'ignore')


def check_route(base_url: str, route: str, timeout: int):
    url = urllib.parse.urljoin(base_url.rstrip('/') + '/', route.lstrip('/'))
    if route == '/':
        url = base_url.rstrip('/') + '/'
    try:
        status, final_url, html = fetch(url, timeout)
        parser = H1Parser()
        parser.feed(html)
        return {'route': route, 'ok': True, 'status': status, 'final_url': final_url, 'h1_count': parser.h1_count, 'title': parser.title.strip()}
    except urllib.error.HTTPError as err:
        return {'route': route, 'ok': False, 'status': err.code, 'final_url': url, 'error': f'HTTP {err.code}'}
    except Exception as err:
        return {'route': route, 'ok': False, 'status': 0, 'final_url': url, 'error': str(err)}


def main():
    parser = argparse.ArgumentParser(description='Smoke-check deployed Rosie Dazzlers routes.')
    parser.add_argument('--base-url', default='https://rosiedazzlers.ca')
    parser.add_argument('--timeout', type=int, default=20)
    parser.add_argument('--route', action='append', dest='routes')
    args = parser.parse_args()

    routes = args.routes or DEFAULT_ROUTES
    failures = 0
    for route in routes:
        result = check_route(args.base_url, route, args.timeout)
        if result['ok']:
            flag = 'OK'
            extra = f"status={result['status']} h1={result['h1_count']} title={result['title'][:90]}"
            if route.startswith('/admin') and route != '/admin-login' and result['status'] not in (200, 302, 303):
                failures += 1
                flag = 'FAIL'
                extra += ' unexpected admin status'
            if not route.startswith('/admin') and result['h1_count'] > 1:
                failures += 1
                flag = 'FAIL'
                extra += ' too-many-h1'
            print(f"{flag}: {route} -> {result['final_url']} | {extra}")
        else:
            failures += 1
            print(f"FAIL: {route} -> {result['final_url']} | {result['error']}")
    return 1 if failures else 0

if __name__ == '__main__':
    raise SystemExit(main())
