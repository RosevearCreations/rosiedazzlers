#!/usr/bin/env node
// Build 609: local-only, metadata-only reconciliation of manually exported reports.
import fs from 'node:fs/promises';
import path from 'node:path';

const MAX_REPORT_BYTES = 2_000_000;
const MAX_REPORTS = 250;
const safePath = value => typeof value === 'string' && /^\/[a-z0-9/_-]{0,180}$/i.test(value) && !value.includes('//');
const integer = value => Number.isSafeInteger(value) && value >= 0;

export function reconcile(reports) {
  if (!Array.isArray(reports) || reports.length > MAX_REPORTS) throw Error('Report limit exceeded');
  const rows = [];
  for (const report of reports) {
    if (report?.schema !== 'rosie.rendered-visual-audit.v1' || !safePath(report.page))
      throw Error('Invalid or unsafe visual audit report');
    if (!['public-or-other', 'protected-admin-screen'].includes(report.access) ||
      !report.browserViewport || !integer(report.browserViewport.width) ||
      !integer(report.browserViewport.height) || !Array.isArray(report.visuals) ||
      report.visuals.length > 3400) throw Error('Invalid report metadata');
    const flags = report.flags || {};
    for (const name of ['brokenImages','pendingImages','placeholders','imagesWithoutAlt','labelledSvgNeeded'])
      if (!integer(flags[name])) throw Error('Invalid report counts');
    // Explicitly whitelist values: never copy raw URLs, alt text, customer media or selectors.
    const staticBroken = [];
    const missingAlt = [];
    const svgLabels = [];
    for (const item of report.visuals) {
      if (item?.kind === 'image' && item.status === 'broken' &&
        item.source?.kind === 'public-static' &&
        /^\/assets\/[a-z0-9/_%.+-]+\.(?:png|jpe?g|webp|svg|gif|avif|ico)$/i.test(item.source.value || ''))
        staticBroken.push(item.source.value);
      if (item?.kind === 'image' && item.hasAlt === false) missingAlt.push('image');
      if (item?.kind === 'inline-svg' && item.decorative === false && item.accessibleNameProvided === false)
        svgLabels.push('svg');
    }
    rows.push({page:report.page, access:report.access,
      viewport:{width:report.browserViewport.width,height:report.browserViewport.height},
      truncated:report.truncated === true, flags:{...Object.fromEntries(
        ['brokenImages','pendingImages','placeholders','imagesWithoutAlt','labelledSvgNeeded'].map(k=>[k,flags[k]]))},
      brokenPublicStatic:[...new Set(staticBroken)].sort(),
      missingAltCount:missingAlt.length, unlabeledSvgCount:svgLabels.length});
  }
  rows.sort((a,b)=>a.page.localeCompare(b.page)||a.viewport.width-b.viewport.width||a.viewport.height-b.viewport.height);
  const unique = new Set(rows.map(r=>`${r.page}|${r.viewport.width}|${r.viewport.height}`));
  const publicScreens = new Set(rows.filter(r=>r.access==='public-or-other').map(r=>r.page));
  const adminScreens = new Set(rows.filter(r=>r.access==='protected-admin-screen').map(r=>r.page));
  return {schema:'rosie.rendered-visual-reconciliation.v1',reportCount:rows.length,
    uniqueViewportScreens:unique.size,publicScreens:publicScreens.size,adminScreens:adminScreens.size,
    duplicatedViewportScreens:rows.length-unique.size,
    incompleteReports:rows.filter(r=>r.truncated).length,
    brokenPublicStaticFiles:[...new Set(rows.flatMap(r=>r.brokenPublicStatic))].sort(),
    caveat:'Manual samples only. No live R2, consent, Cloudflare deployment or exhaustive route coverage verified.',
    reports:rows};
}

async function main(files) {
  if (!files.length || files.length > MAX_REPORTS) throw Error('Supply 1–250 local report JSON filenames');
  const reports = [];
  for (const file of files) {
    const stat = await fs.stat(file);
    if (!stat.isFile() || stat.size > MAX_REPORT_BYTES) throw Error('Oversized or non-file report: '+path.basename(file));
    reports.push(JSON.parse(await fs.readFile(file,'utf8')));
  }
  process.stdout.write(JSON.stringify(reconcile(reports),null,2)+'\n');
}
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname))
  main(process.argv.slice(2)).catch(e=>{console.error(e.message);process.exitCode=1});
