#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
chrome = (ROOT / 'assets' / 'chrome.js').read_text(encoding='utf-8')
css = (ROOT / 'assets' / 'site.css').read_text(encoding='utf-8')
required_chrome = [
    'function initNavToggle()',
    'closeMenu()',
    'openMenu()',
    'Escape',
    'nav-links--compact-ready',
]
required_css = [
    'Build 147: compact expandable mobile navigation',
    '.nav-links.open',
    'grid-template-columns: repeat(2, minmax(0, 1fr))',
    'max-height: min(70vh, 520px)',
    '@media (max-width: 420px)',
]
missing = [item for item in required_chrome if item not in chrome]
missing += [item for item in required_css if item not in css]
if missing:
    print('FAIL: mobile nav check missing: ' + ', '.join(missing))
    sys.exit(1)
print('PASS: compact mobile navigation assets present')
