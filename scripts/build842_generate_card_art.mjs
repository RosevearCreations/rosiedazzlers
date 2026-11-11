// Build 842 — reproducible, individually illustrated SVG artwork for every
// workflow, launcher and customer card. No external images or remote fonts.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';

const ROOT=resolve(new URL('..',import.meta.url).pathname);
const OUT=resolve(ROOT,'assets/card-art-842');
const checkOnly=process.argv.includes('--check');
export function slug(scope,label){
  return (scope+'-'+label).normalize('NFKD').toLowerCase()
    .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,84).replace(/-$/,'');
}
export function filename(scope,label){return '/assets/card-art-842/'+slug(scope,label)+'.svg';}
function hash(value){let h=2166136261;for(const char of value){h=Math.imul(h^char.charCodeAt(0),16777619)>>>0;}return h;}
const ICON={
  car:'<path d="M20 74 31 48q4-10 16-10h72q12 0 16 10l11 26M23 75h121l8 14v15H16V89z"/><path d="M37 74h94M30 104v11h23v-11m64 0v11h23v-11"/><circle cx="43" cy="88" r="7"/><circle cx="125" cy="88" r="7"/>',
  calendar:'<rect x="28" y="31" width="112" height="104" rx="15"/><path d="M28 59h112M56 23v20m55-20v20M50 81h15m23 0h15m-53 25h15m23 0h15"/>',
  clock:'<circle cx="84" cy="82" r="52"/><path d="M84 49v37l31 18"/>',
  clipboard:'<rect x="32" y="28" width="104" height="116" rx="12"/><rect x="61" y="19" width="46" height="23" rx="7"/><path d="M54 75h57m-57 24h57m-57 24h33"/>',
  tools:'<path d="M48 27a32 32 0 0 0 35 42l49 49a14 14 0 0 1-20 20L63 89a32 32 0 0 1-42-35l20 20 26-26z"/><path d="m100 34 32-18 18 18-18 32-15-15-22 22"/>',
  camera:'<rect x="18" y="47" width="132" height="86" rx="16"/><circle cx="84" cy="88" r="27"/><path d="M49 47 60 29h49l11 18M129 67h5"/>',
  document:'<path d="M46 20h62l26 26v98H46z"/><path d="M108 21v26h26M64 73h49M64 96h49M64 119h33"/>',
  shield:'<path d="m84 18 55 18v40c0 34-21 53-55 73-34-20-55-39-55-73V36z"/><path d="m59 83 18 18 36-42"/>',
  chart:'<path d="M25 129V37m0 92h126"/><path d="m41 106 30-25 24 11 37-48"/><path d="M132 44v26M106 44h26"/>',
  people:'<circle cx="66" cy="51" r="22"/><path d="M28 133v-16c0-23 17-38 38-38s38 15 38 38v16z"/><circle cx="118" cy="54" r="16"/><path d="M112 87c19 0 34 13 34 31v15h-26"/>',
  monitor:'<rect x="20" y="29" width="128" height="91" rx="12"/><path d="M20 96h128M84 120v20m-30 0h60"/><path d="m49 75 16-18 18 14 32-25"/>',
  coins:'<ellipse cx="84" cy="47" rx="47" ry="18"/><path d="M37 47v55c0 25 94 25 94 0V47M37 75c0 25 94 25 94 0"/><path d="M84 34v28m-12-23c8-6 25-4 25 4s-22 4-25 13 20 15 25 4"/>',
  image:'<rect x="20" y="27" width="128" height="113" rx="14"/><circle cx="111" cy="58" r="13"/><path d="m30 122 37-39 27 23 19-18 25 28"/>',
  upload:'<path d="M30 113v15h108v-15M84 105V27m-24 23 24-24 24 24"/><path d="M40 87c-21-37 20-68 45-44 25-24 66 7 45 44"/>',
  bell:'<path d="M38 118c12-11 15-28 15-51 0-44 62-44 62 0 0 23 3 40 15 51zM70 130c0 18 28 18 28 0"/>',
  map:'<path d="m22 40 45-18 39 17 42-17v104l-42 18-39-17-45 18zM67 22v105m39-88v105"/><circle cx="88" cy="75" r="12"/>',
  gear:'<circle cx="84" cy="83" r="23"/><path d="M75 19h18l5 20 15 6 17-11 13 13-11 17 6 15 20 5v18l-20 5-6 15 11 17-13 13-17-11-15 6-5 20H75l-5-20-15-6-17 11-13-13 11-17-6-15-20-5V84l20-5 6-15-11-17 13-13 17 11 15-6z"/>',
  spark:'<path d="m84 18 14 47 47 14-47 14-14 47-14-47-47-14 47-14zM138 18l5 17 17 5-17 5-5 17-5-17-17-5 17-5z"/>',
  mail:'<rect x="20" y="37" width="128" height="96" rx="14"/><path d="m20 48 64 45 64-45M21 124l41-40m86 40-41-40"/>',
  wifi:'<path d="M21 60c35-37 91-37 126 0M39 81c25-27 65-27 90 0M60 102c14-15 34-15 48 0"/><circle cx="84" cy="124" r="8"/>',
  store:'<path d="M27 58h114v83H27zM19 58l20-35h90l20 35-9 20-16-12-16 12-17-12-17 12-16-12-16 12z"/><path d="M62 140V99h43v41"/>'
};
const GROUPS=[
 [/schedule|calendar|bookings|days|time|shift|today|month-end/i,'calendar'],
 [/detailer|jobsite|fleet|vehicle|car|wax|maintenance/i,'car'],
 [/payment|accounting|payroll|tax|economics|finance|commercial/i,'coins'],
 [/creative|media|photo|gallery|image|upload|intake/i,'camera'],
 [/security|privacy|access|governance|gate|consent/i,'shield'],
 [/statistics|analytics|learning|growth|report|forecast|trend/i,'chart'],
 [/staff|customer|assignment|crew|people/i,'people'],
 [/social|marketing|promotion|content|publish/i,'image'],
 [/support|notification|incident|alert|exception/i,'bell'],
 [/connection|integration|network|runtime|live/i,'wifi'],
 [/backup|recovery|settings|bootstrap|system|sanity/i,'gear'],
 [/document|docs|quote|review|approval|workflow|readiness/i,'document'],
 [/inventory|catalog|tool|material|supplies/i,'tools'],
 [/mobile|app|dashboard|test|monitor|command/i,'monitor'],
 [/local|location|water|route/i,'map'],
 [/message|email/i,'mail']
];
const BASE={detailer:31,operations:36,admin:43,it:204,finance:42,daip:262,socials:291,launcher:192,customer:35};
function hslHex(h,s,l){
  const light=l/100,a=(s/100)*Math.min(light,1-light);
  const channel=n=>{const k=(n+h/30)%12;return Math.round(255*(light-a*Math.max(-1,Math.min(k-3,9-k,1))));};
  return '#'+[channel(0),channel(8),channel(4)].map(v=>v.toString(16).padStart(2,'0')).join('');
}
function iconFor(scope,label){
  const matched=GROUPS.find(([regex])=>regex.test(label));
  return matched?.[1]||({detailer:'car',operations:'calendar',admin:'store',it:'monitor',finance:'chart',daip:'image',socials:'spark',launcher:'monitor',customer:'car'}[scope]||'spark');
}
function svgFor(scope,label){
  const id=hash(scope+'|'+label),hue=(BASE[scope]??36)+(id%23)-11,hue2=(hue+26+(id%37))%360;
  const dark=hslHex(hue,39,19),gold=hslHex(hue,71,66),copper=hslHex(hue2,51,43),glow=hslHex(hue,85,63),shadow=hslHex(hue,55,30),stroke=hslHex(hue,72,72);
  const icon=iconFor(scope,label),secondary=Object.keys(ICON)[Math.floor(id/97)%Object.keys(ICON).length];
  const side=(id%2)?'left':'right',x=side==='left'?48:585,rotation=((id%7)-3)*4;
  const o1=105+(id%70),o2=460+(id%95),d1=15+(id%17),d2=14+((id>>>6)%23);
  const text=label.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" width="640" height="360" role="img" aria-label="Illustrative ${text} artwork">
<title>${text} — original Rosie workflow illustration</title><defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#111925"/><stop offset=".55" stop-color="${dark}"/><stop offset="1" stop-color="#090f19"/></linearGradient>
<linearGradient id="metal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${gold}"/><stop offset="1" stop-color="${copper}"/></linearGradient>
<radialGradient id="glow"><stop stop-color="${glow}" stop-opacity=".36"/><stop offset="1" stop-color="${copper}" stop-opacity="0"/></radialGradient></defs>
<rect width="640" height="360" fill="url(#bg)"/><circle cx="${x}" cy="70" r="280" fill="url(#glow)"/>
<path d="M-15 274 Q${o1} ${170+d1} 312 277T656 240V370H-15Z" fill="${shadow}" opacity=".19"/>
<path d="M0 305 Q${o2} 208 640 298" fill="none" stroke="url(#metal)" stroke-opacity=".33" stroke-width="3"/>
<g stroke="${stroke}" fill="none" opacity=".15"><path d="M${o1} 0 0 160M640 ${d2} 430 360"/><circle cx="548" cy="78" r="${42+(id%36)}"/><circle cx="548" cy="78" r="110"/></g>
<rect x="165" y="54" width="308" height="253" rx="36" fill="#0b1320" fill-opacity=".72" stroke="${gold}" stroke-opacity=".3" stroke-width="2"/>
<rect x="185" y="74" width="268" height="213" rx="29" fill="url(#metal)" fill-opacity=".08"/>
<g transform="translate(229 92) scale(1.08)" stroke="url(#metal)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none">${ICON[icon]}</g>
<g transform="translate(${side==='left'?18:506} 222) rotate(${rotation} 56 56) scale(.68)" stroke="#e5d8b9" stroke-opacity=".65" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none">${ICON[secondary]}</g>
<rect x="${side==='left'?30:522}" y="39" width="72" height="6" rx="3" fill="url(#metal)" opacity=".65"/>
<g fill="${stroke}" opacity=".7"><circle cx="${d1*5}" cy="301" r="5"/><circle cx="${d1*5+23}" cy="301" r="3"/><circle cx="${d1*5+43}" cy="301" r="2"/></g>
</svg>`;
}
function catalogCards(){
  const context={window:{}};
  runInNewContext(readFileSync(resolve(ROOT,'assets/app-core/module-navigation.js'),'utf8'),context);
  const modules=context.window.RosieAppCore.ModuleNavigation.CATALOG.modules;
  return Object.entries(modules).flatMap(([scope,module])=>module.categories.flatMap(cat=>cat.cards.map(card=>({scope,label:card.label}))));
}
const cards=[
  ...catalogCards(),
  ...['Detailer','Operations / Supervisor','Business Administration','I.T. & Reliability','Finance','DAIP','Socials'].map(label=>({scope:'launcher',label})),
  ...['Book','My account','Live progress & messages','Quote response','Gift cards','Website'].map(label=>({scope:'customer',label}))
];
const names=new Set(cards.map(c=>slug(c.scope,c.label)));
if(names.size!==cards.length)throw new Error('Artwork slug collision. Every card must have an individual filename.');
if(!checkOnly)mkdirSync(OUT,{recursive:true});
for(const card of cards){
  const file=resolve(OUT,slug(card.scope,card.label)+'.svg'),content=svgFor(card.scope,card.label);
  if(checkOnly){if(!existsSync(file)||readFileSync(file,'utf8')!==content)throw new Error('Artwork missing/drifted: '+file);}
  else writeFileSync(file,content);
}
console.log(`Build 842 ${checkOnly?'verified':'generated'} ${cards.length} distinct workflow, launcher and customer illustrations.`);
