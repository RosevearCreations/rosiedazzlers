#!/usr/bin/env node
// Build 611: deterministic owner-managed image authority. Never reads or changes private uploads.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {standardLandingFallback} from '../assets/standard-image-slots.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const imageExt=/\.(?:png|jpe?g|webp|avif|gif|ico|svg)$/i;
const excluded=new Set(['.git','node_modules','dist','coverage','.wrangler','vendor']);
const location=(s)=>s.split(path.sep).join('/');
const json=async file=>JSON.parse(await fs.readFile(path.join(root,file),'utf8'));
const exists=async file=>fs.access(path.join(root,file)).then(()=>true,()=>false);
const unique=(arr)=>[...new Set(arr)].sort();

async function files(dir){
  const output=[];
  for(const e of await fs.readdir(path.join(root,dir),{withFileTypes:true})){
    if(excluded.has(e.name))continue;
    const rel=location(path.join(dir,e.name));
    if(e.isDirectory())output.push(...await files(rel));
    else if(e.isFile())output.push(rel);
  }
  return output.sort();
}

function dimension(buffer,filename){
  const ext=path.extname(filename).toLowerCase();
  if(ext==='.png'&&buffer.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex')))
    return {width:buffer.readUInt32BE(16),height:buffer.readUInt32BE(20),basis:'measured-file'};
  if(ext==='.gif'&&/^GIF8[79]a$/.test(buffer.toString('ascii',0,6)))
    return {width:buffer.readUInt16LE(6),height:buffer.readUInt16LE(8),basis:'measured-file'};
  if(ext==='.ico'&&buffer.length>=6&&buffer.readUInt16LE(2)===1){
    const count=buffer.readUInt16LE(4),sizes=[];
    for(let i=0;i<Math.min(count,64)&&6+16*i+16<=buffer.length;i++){
      const w=buffer[6+16*i]||256,h=buffer[7+16*i]||256;
      sizes.push(`${w}×${h}`);
    }
    return {sizes:unique(sizes),basis:'measured-ico-directory'};
  }
  if(ext==='.webp'&&buffer.toString('ascii',0,4)==='RIFF'&&buffer.toString('ascii',8,12)==='WEBP'){
    const type=buffer.toString('ascii',12,16);
    if(type==='VP8X'&&buffer.length>=30)return {width:1+buffer.readUIntLE(24,3),height:1+buffer.readUIntLE(27,3),basis:'measured-file'};
    if(type==='VP8 '&&buffer.length>=30)return {width:buffer.readUInt16LE(26)&0x3fff,height:buffer.readUInt16LE(28)&0x3fff,basis:'measured-file'};
    if(type==='VP8L'&&buffer.length>=25){const b0=buffer[21],b1=buffer[22],b2=buffer[23],b3=buffer[24];return {width:1+(((b1&0x3f)<<8)|b0),height:1+(((b3&0xf)<<10)|(b2<<2)|(b1>>6)),basis:'measured-file'}}
  }
  if(['.jpg','.jpeg'].includes(ext)&&buffer.readUInt16BE(0)===0xffd8){
    let p=2;
    while(p+4<buffer.length){
      if(buffer[p]!==0xff){p++;continue}
      let m=buffer[p+1];p+=2;
      while(m===0xff&&p<buffer.length)m=buffer[p++];
      if(m===0xd8||m===0xd9||m===0x01||(m>=0xd0&&m<=0xd7))continue;
      if(p+2>buffer.length)break;
      const n=buffer.readUInt16BE(p);
      if(n<2||p+n>buffer.length)break;
      if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(m)&&n>=7)
        return {width:buffer.readUInt16BE(p+5),height:buffer.readUInt16BE(p+3),basis:'measured-file'};
      p+=n;
    }
  }
  if(ext==='.svg'){
    const tag=buffer.toString('utf8').match(/<svg\b[^>]*>/i)?.[0]||'';
    const attr=(name)=>tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`,'i'))?.[1];
    const view=attr('viewBox')?.trim().split(/[\s,]+/).map(Number);
    const w=attr('width'),h=attr('height');
    const px=v=>/^\d+(?:\.\d+)?(?:px)?$/i.test(v||'')?Number.parseFloat(v):null;
    const actualW=px(w),actualH=px(h);
    if(actualW&&actualH)return {width:actualW,height:actualH,viewBox:view?.length===4?view.join(' '):null,basis:'svg-explicit-canvas'};
    if(view?.length===4&&view.every(Number.isFinite)&&view[2]>0&&view[3]>0)
      return {width:view[2],height:view[3],viewBox:view.join(' '),basis:'svg-viewbox-scalable-not-pixels'};
  }
  return {width:null,height:null,basis:'unmeasured-file-requires-review'};
}

function routeFor(file){
  if(!/\.html$/i.test(file))return null;
  if(file==='index.html')return '/';
  if(file.endsWith('/index.html'))return '/'+file.slice(0,-11);
  return '/'+file.replace(/\.html$/i,'');
}
function proposedPages(slot){
  if(slot.route)return [slot.route];
  if(slot.slot.startsWith('town_'))return ['/'+slot.slot.slice(5).replace(/_/g,'-')+'-auto-detailing'];
  if(slot.slot.startsWith('addon_'))return ['/services'];
  if(slot.slot.startsWith('package_'))return ['/services','/pricing'];
  if(slot.slot==='hero_background'||slot.slot==='brand_banner')return ['/'];
  if(slot.slot==='brand_logo')return ['shared public/Admin header'];
  return ['placement unverified'];
}
function noteFor(slot){
  if(slot.slot==='brand_logo'||slot.slot==='brand_banner')return 'Standard theme is the bundled default; explicit Owner site-settings/R2 branding retains precedence';
  if(slot.slot.startsWith('town_'))return 'Town banner: permanent theme artwork, not town customer proof';
  return slot.notes||'Theme-designed static artwork; existing approved dynamic assignments retain precedence';
}
function isStaffProof(slot){return slot.slot.startsWith('proof_')||slot.slot==='reviews'||slot.visibility==='public_only_after_verified_consent'}

export async function buildCatalog(){
  const [manifest,studio,admin]=await Promise.all([
    json('data/standard_theme_image_slots.json'),json('data/build253_photo_targets.json'),json('data/standard_admin_visual_source_inventory.json')]);
  if(manifest.schema!=='rosie-standard-static-image-manifest.v2'||!Array.isArray(studio.targets)||!Array.isArray(admin.placeholderIllustrations))
    throw Error('Unrecognized image authority inputs');
  const theme=manifest.entries.filter(x=>!isStaffProof(x));
  const excludedProofs=manifest.entries.filter(isStaffProof);
  const planMap=new Map(theme.map(x=>[x.filename,x]));
  const landingSlugs=unique(studio.targets.filter(x=>x.target_type==='landing_hero').map(x=>x.page_path?.slice(1)).filter(Boolean));
  for(const slug of landingSlugs){
    const proposed=standardLandingFallback(slug);
    const filename=proposed?.split('/').pop();
    if(filename&&!planMap.has(filename))planMap.set(filename,{slot:'landing_fallback_'+slug.replace(/-/g,'_'),filename,
      recommendedWidth:1600,recommendedHeight:1067,route:'/'+slug,
      notes:'Registered runtime candidate (not necessarily loaded); verify geometry and owner artwork before enabling'});
  }
  const planned=[...planMap.values()].sort((a,b)=>a.slot.localeCompare(b.slot));
  // A theme file is already represented by its numbered planned slot. Do not
  // double-count owner uploads as new "shared" images on each batch.
  const physical=(await files('assets')).filter(x=>imageExt.test(x)&&!x.startsWith('assets/themes/'));
  if(await exists('favicon.ico'))physical.push('favicon.ico');
  const sourceFiles=(await files('.')).filter(x=>/\.(?:html|css|js|mjs)$/i.test(x)&&!x.startsWith('scripts/')&&!x.startsWith('tests/'));
  const source=[];
  for(const file of sourceFiles){
    const content=await fs.readFile(path.join(root,file),'utf8');
    source.push({file,route:routeFor(file),content});
  }
  const entries=[];
  for(const slot of planned){
    const expected=`assets/themes/standard/images/${slot.filename}`;
    entries.push({key:'theme:'+slot.slot,ownership:'theme-owner-only',theme:'standard',name:slot.slot.replace(/_/g,' '),
      path:expected,format:path.extname(expected).slice(1).toLowerCase(),size:{width:slot.recommendedWidth,height:slot.recommendedHeight,
        basis:'recommended-canvas-not-upload-minimum'},pages:proposedPages(slot),placement:'planned-or-fallback-not-live-verified',
      filePresent:await exists(expected),notes:noteFor(slot)});
  }
  for(const file of physical.sort()){
    const bytes=await fs.readFile(path.join(root,file));
    const hits=source.filter(x=>x.content.includes('/'+file)||x.content.includes(file));
    const htmlRoutes=unique(hits.map(x=>x.route).filter(Boolean));
    entries.push({key:'static:'+file,ownership:'application-owner-only',theme:'shared',name:path.basename(file),path:file,
      format:path.extname(file).slice(1).toLowerCase(),size:dimension(bytes,file),
      pages:htmlRoutes.length?htmlRoutes:['shared runtime / placement not verified'],placement:'checked-in local file; render usage not verified',
      filePresent:true,sourceFiles:unique(hits.map(x=>x.file)).slice(0,20),
      notes:file.startsWith('assets/placeholders/')?'Generic interface placeholder, never a substitute for actual customer evidence':
        file.startsWith('assets/app-icons/')||file==='favicon.ico'?'Browser/PWA icon; not a Photo Studio upload':
        'Application-controlled asset; any approved dynamic R2/Photo Studio image keeps precedence'});
  }
  for(const item of admin.placeholderIllustrations.slice().sort((a,b)=>a.key.localeCompare(b.key))){
    const size=(item.desiredGeometry||'').match(/(\d+)\s*x\s*(\d+)/i);
    const target=`assets/themes/standard/admin/${item.proposal}`;
    const present=await exists(target);
    entries.push({key:'admin-art:'+item.key,ownership:'application-owner-only',theme:'standard',name:item.key.replace(/_/g,' '),
      path:target,format:path.extname(item.proposal).slice(1).toLowerCase(),
      size:present?dimension(await fs.readFile(path.join(root,target)),target):{width:size?Number(size[1]):null,height:size?Number(size[2]):null,basis:'proposed-canvas-not-measured'},
      pages:[item.page],placement:present?'theme illustration in repository; render acceptance pending':'reserved admin artwork; not approved or installed',filePresent:present,
      notes:'Internal illustration only. Never depict private customer information or tokens.'});
  }
  const seen=new Set();
  entries.forEach((x,i)=>{if(seen.has(x.key))throw Error('Duplicate image authority '+x.key);seen.add(x.key);x.number=i+1;x.id=`IMG-${String(i+1).padStart(3,'0')}`;});
  return {schema:'rosie.application-nonemployee-image-catalog.v1',defaultTheme:'standard',
    authority:'Owner/developer maintained. Dynamic Photo Studio, R2 and customer evidence remain managed in their existing systems.',
    generatedFrom:['data/standard_theme_image_slots.json','data/build253_photo_targets.json',
      'data/standard_admin_visual_source_inventory.json','checked-in public assets and source references'],
    policy:{staffMayReplaceTheseFiles:false,themeArtRequiresOwnerReview:true,
      dynamicTargetsExcluded:studio.targets.length,reservedThemeProofExcluded:excludedProofs.length,
      dynamicProofTypes:unique(studio.targets.filter(x=>/before_after|proof|gallery/.test(x.target_type)).map(x=>x.target_type)),
      note:'Policy describes intended ownership, not a change to existing Admin permissions. Do not infer customer-media consent.'},
    entries};
}

export function asMarkdown(catalog){
  const q=s=>String(s??'').replace(/\|/g,'\\|').replace(/[\r\n]/g,' ');
  const rows=catalog.entries.map(e=>{
    const size=e.size.sizes?.join(', ')||(e.size.width&&e.size.height?`${e.size.width}×${e.size.height}`:'measure before use');
    return `| ${e.id} | ${q(e.name)} | ${q(e.format.toUpperCase())} | ${q(size)} | ${q(e.pages.join(', '))} | ${q(e.theme)} | ${q(e.filePresent?'In repo':'Not uploaded')} | \`${q(e.path)}\` |`;
  });
  const counts=(ownership)=>catalog.entries.filter(e=>e.ownership===ownership).length;
  return ['# Rosie Dazzlers — Owner-Managed Application Image Catalog','',
    '> **Single source of truth:** `data/application_static_image_catalog.json` is the numbered, machine-readable authority. This Markdown table is generated from it. Run `node scripts/build_application_static_image_catalog.mjs --write` to regenerate, or `--check` to confirm it is current.','',
    `- **${catalog.entries.length} listed images/proposals**: ${catalog.entries.filter(x=>x.theme==='standard'&&x.ownership==='theme-owner-only').length} Standard theme candidates, ${counts('application-owner-only')} shared/Admin application items.`,
    `- **${catalog.policy.dynamicTargetsExcluded} Photo Studio target records excluded** because their public/staff assignments are dynamic, not permanent design artwork; **${catalog.policy.reservedThemeProofExcluded} proof/review proposals excluded** as customer/review evidence. Counts are records, not missing files.`,
    '- **Town banners are static theme assets.** Town landing-page galleries, before/after comparisons, customer reviews, and job progress are separately managed media—even on those same pages.',
    '- **Dimensions are labelled:** recommended/proposed canvas for files not uploaded, actual decoded pixel dimensions for raster files, or scalable SVG viewBox/ICO variants as appropriate. Proposed sizes do not supersede R2 upload minimums.',
    '- **Status is honest:** an asset in the repository is not automatically confirmed visible on a rendered page. Site-settings/R2/Photo Studio take priority until an explicit approved theme policy is implemented.',
    '- **Owner-managed is a governance classification, not a new permission check.** Staff photo rights are unchanged; do not swap protected/customer media or private Admin images with static artwork.',
    '',
    '| # | Name | Format | Size / viewBox | Page or context | Theme | Availability | Exact repository path |',
    '|---|---|---|---|---|---|---|---|',...rows,'',
    '## Approval and update rules','',
    '1. Theme owner approves artwork and canvas size, then adds the exact file to a theme-specific directory; staff should never overwrite these image files through Photo Studio.',
    '2. Add future themes under their own theme namespace without overwriting the Standard theme. The catalog records which theme owns each asset.',
    '3. Employee-uploaded before/after, reviews, service evidence, job and vehicle photos, inventory photos, and progress screenshots stay in existing Photo Studio/R2/customer workflows subject to their normal consent and review.',
    '4. For entries marked `Not uploaded`, create/approve the art and validate it in a rendered browser before activating; this catalog does not fabricate missing art.',
    '5. Consult `docs/audits/ROSIE_MEDIA_SLOT_CATALOG_STANDARD.md` for the historic union of all registries and `data/media_requirements.json` for authoritative R2 upload minima.',''];
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const mode=process.argv[2];
  if(!['--write','--check'].includes(mode))throw Error('Use --write to generate or --check to verify');
  const catalog=await buildCatalog();
  const desired={
    'data/application_static_image_catalog.json':JSON.stringify(catalog,null,2)+'\n',
    'docs/audits/ROSIE_APPLICATION_STATIC_IMAGE_CATALOG.md':asMarkdown(catalog).join('\n')+'\n'
  };
  for(const [filename,value] of Object.entries(desired)){
    if(mode==='--write')await fs.writeFile(path.join(root,filename),value);
    else if(await fs.readFile(path.join(root,filename),'utf8')!==value)throw Error('Stale catalog: '+filename);
  }
  console.log(`${mode==='--write'?'Generated':'Verified'} ${catalog.entries.length} application-controlled image records`);
}
