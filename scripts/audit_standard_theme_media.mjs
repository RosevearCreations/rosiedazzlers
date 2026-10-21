#!/usr/bin/env node
// Full-checkout Rosie visual reference inventory. Does not modify site/R2/DB.
import fs from "node:fs/promises";
import path from "node:path";
const root=process.cwd(),rows=[],svgs=[];
const skips=new Set([".git","node_modules","dist","coverage",".wrangler","vendor"]);
const ln=(text,pos)=>1+(text.slice(0,pos).match(/\n/g)||[]).length;
const rel=p=>path.relative(root,p).split(path.sep).join("/");
const attr=(s,key)=>{const x=s.match(new RegExp("(?:^|\\s)"+key+"\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)'|([^\\s>]+))","i"));return x?(x[1]??x[2]??x[3]):""};
function record(file,text,pos,source,slot){
 if(!source||source.length>800)return;
 rows.push({file,line:ln(text,pos),source,slot,privateContext:/admin|customer|progress|payment/i.test(file)});
}
async function scan(dir){
 const nodes=await fs.readdir(dir,{withFileTypes:true});
 for(const e of nodes){
  if(skips.has(e.name))continue;
  const abs=path.join(dir,e.name),file=rel(abs);
  if(e.isDirectory()){await scan(abs);continue}
  if(!e.isFile()||!/\.(html?|css|js|mjs|json|svg)$/i.test(file))continue;
  if(/generated_media_reference_inventory\.json|GENERATED_MEDIA_REFERENCES\.md/i.test(file))continue;
  const text=await fs.readFile(abs,"utf8");
  if(/\.svg$/i.test(file)){
   const tag=text.match(/<svg\b[^>]*>/i)?.[0];
   if(tag)svgs.push({file,width:attr(tag,"width"),height:attr(tag,"height"),viewBox:attr(tag,"viewBox")});
  }
  if(/\.html?$/i.test(file)){
   for(const match of text.matchAll(/<(?:img|source|video|meta|link)\b[^>]*>/gi)){
    const tag=match[0];
    for(const key of ["src","srcset","poster","data-media-fallback","data-media-source","data-theme-fallback"]){
     let value=attr(tag,key);if(!value)continue;
     if(key==="srcset")value=value.split(",").map(x=>x.trim().split(/\s+/)[0]).join(",");
     for(const v of (key==="srcset"?value.split(","):[value]))record(file,text,match.index,v,"html:"+key);
    }
    if(/og:image|twitter:image/i.test(tag))record(file,text,match.index,attr(tag,"content"),"meta:image");
    if(/rel=["'](?:icon|apple-touch-icon)/i.test(tag))record(file,text,match.index,attr(tag,"href"),"link:icon");
   }
  }
  if(/\.(html?|css)$/i.test(file)){
   for(const m of text.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/gi))if(!m[1].startsWith("data:"))record(file,text,m.index,m[1],"css:url");
  }
  if(/\.(js|mjs|json)$/i.test(file)){
   for(const m of text.matchAll(/(['"])((?:https?:\/\/|\/|assets\/)[^'"\r\n]+\.(?:png|jpe?g|webp|svg|gif|avif))(?:[?#][^'"\r\n]*)?\1/gi))record(file,text,m.index,m[2],"js:literal");
   for(const m of text.matchAll(/\b(?:image_url|thumbnail_url|hero_image_url|banner_url|logo_url|r2_key)\s*[:=]/gi))record(file,text,m.index,m[0],"dynamic-field");
  }
 }
}
const esc=x=>String(x??"").replace(/\|/g,"\\|").replace(/[\r\n]/g," ");
await scan(root);rows.sort((a,b)=>a.file.localeCompare(b.file)||a.line-b.line);
const data={schema:"rosie-media-source-audit.v1",generatedAt:new Date().toISOString(),count:rows.length,
 warning:"Static source scan only, not deployment/R2/consent proof",svgAssets:svgs,references:rows};
await fs.mkdir(path.join(root,"docs/audits"),{recursive:true});
const content=["# Rosie Dazzlers generated source visual inventory","","Static HTML, JS, CSS and SVG references. Run on full checkout; media approvals and runtime DOM remain separate.","",
"## SVG file geometry","","| File | Width | Height | ViewBox |","|---|---|---|---|",
...svgs.map(x=>"| "+esc(x.file)+" | "+esc(x.width)+" | "+esc(x.height)+" | "+esc(x.viewBox)+" |"),
"","## All source references","","| File | Line | Image reference | Kind | Restricted review |","|---|---:|---|---|---|",
...rows.map(x=>"| "+esc(x.file)+" | "+x.line+" | "+esc(x.source)+" | "+x.slot+" | "+(x.privateContext?"Yes":"Check approval")+" |"),
"","No image assignment, public consent, R2 asset, or live production setting is changed by this scanner."].join("\n");
await fs.writeFile(path.join(root,"docs/audits/GENERATED_MEDIA_REFERENCES.md"),content+"\n");
await fs.writeFile(path.join(root,"data/generated_media_reference_inventory.json"),JSON.stringify(data,null,2)+"\n");
console.log("references",rows.length,"svg",svgs.length);
