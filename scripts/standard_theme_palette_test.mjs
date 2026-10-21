import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync('assets/themes/standard.css', 'utf8');
const site = fs.readFileSync('assets/site.css', 'utf8');
const registry = JSON.parse(fs.readFileSync('data/theme_registry.json', 'utf8'));

// The default and explicitly selected Standard theme must use the same palette.
assert.match(css, /:root:not\(\[data-rosie-theme\]\)/);
assert.match(css, /:root\[data-rosie-theme="standard"\]/);
for (const [token, value] of Object.entries({
  bg: '#0b0e11', text: '#f5f6f7', accent: '#dec06d',
  accent2: '#aeb7be', 'gold-bright': '#f0d58c', 'gold-deep': '#b58c38',
})) {
  assert.ok(css.includes(`--${token}: ${value};`), `Missing Standard ${token}`);
}
assert.match(css, /\.btn\.primary/);
assert.match(css, /\.date-pill\.is-selected/);
assert.match(css, /:focus-visible/);
assert.match(css, /--ok: #5dd6a1/);
assert.match(css, /--danger: #f07578/);
assert.match(site, /themes\/standard\.css\?v=standard-v2-gold/);
assert.equal(registry.defaultTheme, 'standard');
assert.equal(registry.themes.standard.stylesheet, '/assets/themes/standard.css');
assert.equal(css.includes('hero-background.webp'), false,
  'Do not activate unapproved or absent theme imagery through the palette');
console.log('Rosie Standard charcoal/gold theme CSS contract PASS');
