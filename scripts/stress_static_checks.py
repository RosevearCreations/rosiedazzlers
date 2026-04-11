#!/usr/bin/env python3
from __future__ import annotations
import json
import pathlib
import re
import subprocess
import sys
from html.parser import HTMLParser

ROOT = pathlib.Path(__file__).resolve().parents[1]
PUBLIC_PAGES = [
    'index.html','about.html','services.html','pricing.html','book.html','contact.html','privacy.html','terms.html','videos.html','gear.html','consumables.html','gifts.html','complete.html','waiver.html','progress.html','login.html','my-account.html'
]
CHECK_JS = [
    'assets/admin-auth.js',
    'assets/admin-shell.js',
    'assets/admin-page-init.js',
    'assets/admin-menu.js',
    'assets/admin-runtime.js',
    'functions/api/_lib/crew-assignments.js',
    'assets/site.js',
    'functions/api/admin/recovery_templates.js',
    'functions/api/admin/recovery_preview.js',
    'functions/api/recovery_audit_list.js',
]
CHECK_HTML = [
    'admin-progress.html',
    'admin-live.html',
    'admin-recovery.html',
    'admin-assign.html',
    'admin-blocks.html',
    'admin-staff.html',
    'admin-promos.html',
    'admin-jobsite.html',
    'detailer-jobs.html',
    'book.html',
    'services.html'
]

class ScriptParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_script = False
        self.current_attrs = {}
        self.scripts = []
        self.buffer = []

    def handle_starttag(self, tag, attrs):
        if tag.lower() == 'script':
            self.in_script = True
            self.current_attrs = dict(attrs)
            self.buffer = []

    def handle_endtag(self, tag):
        if tag.lower() == 'script' and self.in_script:
            self.scripts.append((self.current_attrs, ''.join(self.buffer)))
            self.in_script = False
            self.current_attrs = {}
            self.buffer = []

    def handle_data(self, data):
        if self.in_script:
            self.buffer.append(data)


def fail(msg: str):
    print(f"FAIL: {msg}")
    sys.exit(1)


def run_node_check(js_path: pathlib.Path):
    cmd = [
        'node',
        '--check',
        str(js_path)
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        fail(f"node --check failed for {js_path}: {result.stderr.strip() or result.stdout.strip()}")


def check_public_h1():
    for rel in PUBLIC_PAGES:
        path = ROOT / rel
        if not path.exists():
            continue
        text = path.read_text(encoding='utf-8', errors='ignore')
        count = len(re.findall(r'<h1\b', text, flags=re.IGNORECASE))
        if count > 1:
            fail(f"{rel} has {count} H1 tags")


def check_addon_coverage():
    data = json.loads((ROOT / 'data/rosie_services_pricing_and_packages.json').read_text())
    site_js = (ROOT / 'assets/site.js').read_text()
    addon_codes = [row.get('code') for row in data.get('addons', []) if row.get('code')]
    missing = [code for code in addon_codes if code not in site_js]
    if missing:
        fail(f"addon image mapping missing for: {', '.join(missing)}")



def check_temp_artifacts():
    leftovers = []
    for pattern in ('__check_*', '__tmp_*', '__stress_inline_*'):
        leftovers.extend(sorted(path.relative_to(ROOT).as_posix() for path in ROOT.glob(pattern)))
    if leftovers:
        fail('temporary check artifacts present: ' + ', '.join(leftovers))


def check_route_collisions():
    collisions = []
    for html_path in ROOT.rglob("*.html"):
        if html_path.name == 'index.html':
            continue
        sibling_dir = ROOT / html_path.relative_to(ROOT).with_suffix('')
        idx = sibling_dir / 'index.html'
        if idx.exists():
            collisions.append(f"{html_path.relative_to(ROOT)} <-> {idx.relative_to(ROOT)}")
    if collisions:
        fail("route collisions detected: " + "; ".join(collisions))

def check_public_analytics_hook():
    text = (ROOT / 'assets/chrome.js').read_text()
    if 'ensurePublicAnalytics' not in text or '/assets/public-analytics.js' not in text:
        fail('assets/chrome.js is missing public analytics bootstrap')

def check_admin_shell_pages():
    for rel in ['admin-progress.html','admin-live.html','admin-recovery.html','admin-blocks.html','admin-staff.html','admin-promos.html','admin-jobsite.html']:
        text = (ROOT / rel).read_text()
        for needle in ['/assets/admin-auth.js', '/assets/admin-shell.js', '/assets/admin-menu.js', '/assets/admin-page-init.js', 'data-admin-menu-mount']:
            if needle not in text:
                fail(f"{rel} missing required app-shell hook: {needle}")


def check_inline_scripts():
    for rel in CHECK_HTML:
        path = ROOT / rel
        parser = ScriptParser()
        parser.feed(path.read_text(encoding='utf-8', errors='ignore'))
        for idx, (attrs, code) in enumerate(parser.scripts, start=1):
            if attrs.get('src'):
                continue
            script_type = (attrs.get('type') or '').strip().lower()
            if script_type and script_type not in {'module', 'text/javascript', 'application/javascript'}:
                continue
            if not code.strip():
                continue
            suffix = '.mjs' if script_type == 'module' else '.js'
            tmp = ROOT / f'__stress_inline_{path.stem}_{idx}{suffix}'
            tmp.write_text(code)
            try:
                run_node_check(tmp)
            finally:
                tmp.unlink(missing_ok=True)


def main():
    for rel in CHECK_JS:
        path = ROOT / rel
        if path.exists():
            run_node_check(path)
    check_inline_scripts()
    check_public_h1()
    check_addon_coverage()
    check_temp_artifacts()
    check_route_collisions()
    check_public_analytics_hook()
    check_admin_shell_pages()
    print('PASS: static stress checks completed')

if __name__ == '__main__':
    main()
