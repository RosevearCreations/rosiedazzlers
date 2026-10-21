#!/usr/bin/env node
// Build 610: offline advisory reconciliation; no protected media or automatic approvals.
import fs from 'node:fs/promises';
import path from 'node:path';
import {reconcile} from './reconcile_rendered_visual_audits.mjs';

const SIZE_LIMIT=2_000_000;
const exactNumber=v=>Number.isSafeInteger(v)&&v>=0;
const safeStatic=/^\/assets\/themes\/standard\/images\/[a-z0-9][a-z0-9._-]*\.(?:webp|png|svg|jpe?g|avif)$/i;
const safePath=v=>typeof v==='string'&&/^\/[a-z0-9/_-]{0,180}$/i.test(v)&&!v.includes('//');

export function triage(reports,slots,adminInventory,requirements){
  // Reuse 609's strict schema and privacy validation, without its raw report export.
  const baseline=reconcile(reports);
  if(slots?.schema!=='rosie-standard-static-image-manifest.v2'||!Array.isArray(slots.entries)||
     adminInventory?.schema!=='rosie.admin-public-visual-source-inventory.v1'||
     !Array.isArray(adminInventory.pages)||!Array.isArray(adminInventory.placeholderIllustrations)||
     !Array.isArray(requirements?.required_assets))throw Error('Invalid source authorities');
  const slotMap=new Map();
  for(const entry of slots.entries){
    if(typeof entry.filename!=='string'||!/^[a-z0-9][a-z0-9._-]*\.(?:webp|png|svg|jpe?g|avif)$/i.test(entry.filename)||
      !exactNumber(entry.recommendedWidth)||!exactNumber(entry.recommendedHeight)||
      !entry.recommendedWidth||!entry.recommendedHeight||slotMap.has(entry.filename))throw Error('Invalid Standard slot authority');
    slotMap.set(entry.filename,entry);
  }
  const observed=[];
  for(const report of reports){
    for(const visual of report.visuals){
      if(visual?.kind!=='image'||visual.status!=='loaded'||visual.source?.kind!=='public-static'||
         !safeStatic.test(visual.source.value||''))continue;
      const filename=visual.source.value.split('/').pop();
      const slot=slotMap.get(filename);
      if(!slot)continue;
      const w=visual.naturalWidth,h=visual.naturalHeight;
      if(!exactNumber(w)||!exactNumber(h)||!w||!h)continue;
      const expected=slot.recommendedWidth/slot.recommendedHeight;
      const aspectDelta=Math.abs(w/h/expected-1);
      const belowRecommendation=w<slot.recommendedWidth||h<slot.recommendedHeight;
      observed.push({page:report.page,viewportWidth:report.browserViewport.width,
        slot:slot.slot,filename,observed:{width:w,height:h},
        recommendation:{width:slot.recommendedWidth,height:slot.recommendedHeight},
        belowRecommendation,aspectReview:aspectDelta>0.03,
        disposition:belowRecommendation||aspectDelta>0.03?'manual-artwork-review':'measured-candidate-not-approved'});
    }
  }
  observed.sort((a,b)=>a.page.localeCompare(b.page)||a.filename.localeCompare(b.filename)||a.viewportWidth-b.viewportWidth);
  const adminScreens=[];
  for(const page of adminInventory.pages){
    if(!safePath(page.route))throw Error('Unsafe Admin inventory route');
    const matching=baseline.reports.filter(r=>r.page===page.route&&r.access==='protected-admin-screen');
    const issues=matching.flatMap(r=>[...(r.flags.brokenImages?['broken-image-review']:[]),
      ...(r.flags.imagesWithoutAlt?['image-alt-review']:[]),
      ...(r.flags.labelledSvgNeeded?['svg-label-review']:[]),
      ...(r.truncated?['truncated-capture']:[])]);
    adminScreens.push({route:page.route,sourceTemplate:page.sourceFile,
      capturedViewports:matching.length,status:!matching.length?'needs-authorized-rendered-capture':
      issues.length?'manual-exception-review':'sample-measured-no-flag',issues:[...new Set(issues)].sort()});
  }
  adminScreens.sort((a,b)=>a.route.localeCompare(b.route));
  const artworkRequests=adminInventory.placeholderIllustrations.map(x=>({
    key:x.key,filename:x.proposal,disposition:'reserved-internal-artwork-not-approved-or-uploaded'
  }));
  return {schema:'rosie.image-slot-admin-triage.v1',sourceReports:reports.length,
    authoredStandardSlots:slots.entries.length,observedStandardImages:observed.length,
    unmatchedOrUnseenStandardSlots:slots.entries.length-new Set(observed.map(x=>x.filename)).size,
    requiredR2ThresholdRecords:requirements.required_assets.length,
    requiredR2Status:'not-verified: redacted rendered reports cannot prove R2 key, consent or thresholds',
    observed,adminScreens,artworkRequests,
    caveat:'Advisory only: recommended dimensions are not hard minimums; thresholds, approval, consent, missing lazy images, R2 and site-wide coverage require separate human review.'};
}

async function run(files){
  if(!files.length||files.length>250)throw Error('Supply 1–250 operator-reviewed local JSON reports');
  const reports=[];
  for(const file of files){const stat=await fs.stat(file);if(!stat.isFile()||stat.size>SIZE_LIMIT)throw Error('Invalid report size');reports.push(JSON.parse(await fs.readFile(file,'utf8')))}
  const [slots,admin,requirements]=await Promise.all([
    'data/standard_theme_image_slots.json','data/standard_admin_visual_source_inventory.json','data/media_requirements.json'
  ].map(async f=>JSON.parse(await fs.readFile(path.join(process.cwd(),f),'utf8'))));
  process.stdout.write(JSON.stringify(triage(reports,slots,admin,requirements),null,2)+'\n');
}
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(new URL(import.meta.url).pathname))
  run(process.argv.slice(2)).catch(e=>{console.error(e.message);process.exitCode=1});
