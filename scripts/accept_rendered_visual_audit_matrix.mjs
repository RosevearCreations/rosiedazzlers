#!/usr/bin/env node
// Build 611: independently reviewed, redacted visual sample acceptance (not media/publication approval).
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {triage} from './triage_visual_image_slots.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const validInt=n=>Number.isSafeInteger(n)&&n>0;
const allowed=new Set(['accept-rendered-sample','hold','remediation-requested']);
const validRoute=v=>typeof v==='string'&&/^\/[a-z0-9/_-]{0,180}$/i.test(v)&&!v.includes('//');
const sampleId=(page,w,h)=>`${page}|${w}x${h}`;

export function reviewMatrix(reports,review,slots,admin,requirements,catalog){
  if(review?.schema!=='rosie.operator-visual-review.v1'||!Array.isArray(review.decisions)||review.decisions.length>500)
    throw Error('Expected bounded operator review decisions');
  if(catalog?.schema!=='rosie.application-nonemployee-image-catalog.v1'||!Array.isArray(catalog.entries))
    throw Error('Missing owner-controlled image authority');
  const baseline=triage(reports,slots,admin,requirements);
  const snapshots=new Map();
  for(const report of reports){
    const id=sampleId(report.page,report.browserViewport.width,report.browserViewport.height);
    if(snapshots.has(id))throw Error('Duplicate page/viewport capture requires manual reconciliation');
    const geometry=baseline.observed.filter(x=>x.page===report.page&&x.viewportWidth===report.browserViewport.width&&
      (x.belowRecommendation||x.aspectReview));
    const counts=report.flags;
    const flagNames=['brokenImages','pendingImages','placeholders','imagesWithoutAlt','labelledSvgNeeded'];
    const issues=[...flagNames.filter(k=>counts[k]>0),
      ...(report.truncated?['truncated-report']:[]),...(geometry.length?['measured-size-or-aspect-review']:[])].sort();
    snapshots.set(id,{page:report.page,viewport:{width:report.browserViewport.width,height:report.browserViewport.height},
      access:report.access,issues,observedStandardImages:baseline.observed.filter(x=>x.page===report.page&&x.viewportWidth===report.browserViewport.width).length});
  }
  const decisions=new Map();
  for(const row of review.decisions){
    if(!validRoute(row?.page)||!validInt(row.viewportWidth)||!validInt(row.viewportHeight)||!allowed.has(row.decision)||
      row.operatorRole!=='owner'&&row.operatorRole!=='authorized-admin'||
      row.reasonCode&&!['visual-approved','pending-evidence','image-remediation','accessibility-remediation','geometry-exception','private-media-review'].includes(row.reasonCode)||
      Object.keys(row).some(key=>!['page','viewportWidth','viewportHeight','decision','operatorRole','reasonCode'].includes(key)))
      throw Error('Unsafe or incomplete operator decision');
    const id=sampleId(row.page,row.viewportWidth,row.viewportHeight);
    const capture=snapshots.get(id);
    if(!capture)throw Error('Review cannot accept an unobserved page/viewport');
    if(decisions.has(id))throw Error('Conflicting operator decisions for one sample');
    if(row.decision==='accept-rendered-sample'&&(capture.issues.length||row.reasonCode!=='visual-approved'))
      throw Error('Cannot accept incomplete or flagged visual evidence');
    decisions.set(id,{decision:row.decision,operatorRole:row.operatorRole,reasonCode:row.reasonCode||'pending-evidence'});
  }
  const samples=[...snapshots.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([id,s])=>{
    const decision=decisions.get(id);
    const status=decision?.decision==='accept-rendered-sample'?'operator-accepted-rendered-sample':
      decision?.decision==='remediation-requested'?'visual-remediation-requested':
      decision?.decision==='hold'?'operator-hold':s.issues.length?'visual-exception-needs-review':'awaiting-operator-review';
    return {...s,status,reviewedByRole:decision?.operatorRole||null,reasonCode:decision?.reasonCode||null};
  });
  const captured=new Set(samples.filter(x=>x.access==='protected-admin-screen').map(x=>x.page));
  const missingAdmin=admin.pages.map(x=>x.route).filter(x=>!captured.has(x)).sort();
  return {schema:'rosie.rendered-visual-acceptance-matrix.v1',catalogEntries:catalog.entries.length,
    reportCount:reports.length,reviewedCount:decisions.size,
    acceptedSamples:samples.filter(x=>x.status==='operator-accepted-rendered-sample').length,
    missingProtectedAdminCaptures:missingAdmin,unapprovedArtCount:catalog.entries.filter(x=>!x.filePresent).length,
    samples,
    warning:'Acceptance applies only to redacted, exact-viewport rendered samples. It does NOT approve private images, consent, Photo Studio targets, theme activation, or Cloudflare Production.'};
}

async function readSmall(file,max){const stat=await fs.stat(file);if(!stat.isFile()||stat.size>max)throw Error('Input file limit exceeded');return JSON.parse(await fs.readFile(file,'utf8'))}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const args=process.argv.slice(2);
  if(args[0]!=='--reviews'||args.length<3||args.length>252)throw Error('Usage: --reviews reviewed-decisions.json captured-report1.json [captured-report2.json...]');
  try{
    const [review,...reports]=await Promise.all([readSmall(args[1],200_000),...args.slice(2).map(f=>readSmall(f,2_000_000))]);
    const [slots,admin,requirements,catalog]=await Promise.all([
      'data/standard_theme_image_slots.json','data/standard_admin_visual_source_inventory.json',
      'data/media_requirements.json','data/application_static_image_catalog.json'
    ].map(f=>readSmall(path.join(root,f),2_000_000)));
    process.stdout.write(JSON.stringify(reviewMatrix(reports,review,slots,admin,requirements,catalog),null,2)+'\n');
  }catch(e){console.error(e.message);process.exitCode=1}
}
