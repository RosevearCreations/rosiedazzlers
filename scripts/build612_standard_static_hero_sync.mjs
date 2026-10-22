/**
 * Keep the checked-in, pre-hydration landing-page snapshots aligned with the
 * Standard theme. These HTML pages render before the landing-page JS loads;
 * without a sync their first paint still exposes old R2 package advertising.
 *
 * Usage: node scripts/build612_standard_static_hero_sync.mjs --write
 *        node scripts/build612_standard_static_hero_sync.mjs --check
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { standardLandingFallback } from '../assets/standard-image-slots.js';

const write = process.argv.includes('--write');
const check = process.argv.includes('--check');
if (!write && !check) {
  console.error('Use --write to synchronize static snapshots or --check to verify them.');
  process.exitCode = 2;
} else {
  const outOfSync = [];
  let registered = 0;
  for (const dir of readdirSync('.', { withFileTypes: true }).filter((entry) => entry.isDirectory())) {
    const path = `${dir.name}/index.html`;
    if (!existsSync(path)) continue;
    const html = readFileSync(path, 'utf8');
    const slug = html.match(/<body\b[^>]*data-landing-slug="([^"]+)"/)?.[1] || '';
    const image = standardLandingFallback(slug);
    if (!image) continue;
    registered++;
    const next = html.replace(/<aside class="panel hero-sidecard"[\s\S]*?<\/aside>/, (hero) => {
      return hero.replace(/(<img\b[^>]*\bsrc=")[^"]+("[^>]*>)/, (_match, first, rest) => {
        return first + image + rest;
      });
    });
    // Town routes and a few older landing pages intentionally render a text
    // placeholder before JS loads. They have no static hero to synchronize.
    if (next !== html) {
      outOfSync.push(path);
      if (write) writeFileSync(path, next);
    }
  }
  console.log(`Standard static landing pages: ${registered} registered, ${outOfSync.length} ${write ? 'updated' : 'out of sync'}`);
  if (check && outOfSync.length) {
    console.error(outOfSync.join('\n'));
    process.exitCode = 1;
  }
}
