// Build 911: private client-side control desk, no localStorage/session data caching.
const $=id=>document.getElementById(id);
const str=value=>String(value??'');
const status=(id,message)=>{$(id).textContent=message};
const elt=(tag,txt,cls='')=>{const n=document.createElement(tag);if(txt!=null)n.textContent=str(txt);if(cls)n.className=cls;return n};
const dollar=c=>new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD'}).format(Number(c||0)/100);
async function get(path){const r=await fetch(path,{credentials:'same-origin',cache:'no-store'});
 const d=await r.json().catch(()=>null);if(!r.ok||!d?.ok)throw Error(d?.error||'Original source unavailable');return d}
function item(root,label,value){
 const p=elt('p');const strong=elt('strong',label+': ');p.append(strong,document.createTextNode(str(value)));root.append(p)}
async function finance(){
 status('financeStatus','Reading original payment and accounting source…');$('financeResults').replaceChildren();
 try{
  const d=await get('/api/admin/finance_acceptance_v911'),a=d.acceptance;
  const box=$('financeResults');
  item(box,'Original payment requests',a.counts.payments);
  item(box,'Original refund records',a.counts.refunds);
  item(box,'Original provider callback records',a.counts.events);
  item(box,'Recorded accounting/HST samples',a.counts.accounting);
  item(box,'Application-reported paid (not bank verified)',dollar(a.source_reported_cents.source_reported_paid_cents));
  item(box,'Application-reported refunds (not settled)',dollar(a.source_reported_cents.source_reported_refunded_cents));
  item(box,'Accounting-recorded HST (not remitted)',dollar(a.source_reported_cents.recorded_hst_cents));
  item(box,'Business acceptance',a.states.live_business_acceptance);
  const ul=elt('ul');for(const reason of a.blockers)ul.append(elt('li',reason.replaceAll('_',' ')));
  box.append(ul);status('financeStatus','Original-source evidence read. External provider and accountant acceptance remains HOLD.');
 }catch(e){status('financeStatus',e.message||'Finance unavailable; no GREEN asserted.')}}
async function daip(){
 status('daipStatus','Reading original private DAIP projects…');$('daipResults').replaceChildren();
 try{
  const d=await get('/api/admin/daip_media_workflow');
  const projects=Array.isArray(d.projects)?d.projects:[];
  item($('daipResults'),'Projects returned',projects.length);
  status('daipStatus',projects.length?'Private projects exist; select one in DAIP to inspect its specific consent/media gates.':
   'No original Creative Projects observed in this window. DAIP cannot be certified end-to-end.');
 }catch(e){status('daipStatus',e.message||'DAIP original evidence unavailable')}}
const allowedEmbed=s=>/^https:\/\/www\.youtube-nocookie\.com\/embed\/[\w-]{11}(?:\?rel=0)?$/.test(s)||
 /^https:\/\/www\.instagram\.com\/(p|reel|tv)\/[\w-]{5,32}\/embed\/$/.test(s)||
 /^https:\/\/www\.facebook\.com\/plugins\/video\.php\?href=/.test(s);
function renderReview(item){
 const wrapper=elt('article',null,'review');
 wrapper.append(elt('h3',item.product_name),elt('p','Supplier: '+item.supplier+' · '+item.acquisition_kind+' · PRIVATE DRAFT'));
 if(item.disclosure_required)wrapper.append(elt('p','Disclosure required before any public review.'));
 if(item.review_notes)wrapper.append(elt('p',item.review_notes));
 const link=elt('a','Supplier product source');link.href=item.product_url;link.target='_blank';link.rel='noopener noreferrer';wrapper.append(link);
 if(item.daip_project_id)wrapper.append(elt('p','Linked DAIP project ID: '+item.daip_project_id+' (not approval)'));
 if(item.video_embed_url&&allowedEmbed(item.video_embed_url)){
  const load=elt('button','Load third-party video preview');
  load.type='button';load.style.marginTop='10px';
  load.addEventListener('click',()=>{
   if(wrapper.querySelector('iframe'))return;
   const frame=document.createElement('iframe');
   frame.src=item.video_embed_url;frame.loading='lazy';frame.referrerPolicy='no-referrer';
   frame.title=item.video_platform+' supplier review video';frame.allowFullscreen=true;
   frame.setAttribute('allow','fullscreen; picture-in-picture; encrypted-media');
   frame.setAttribute('sandbox','allow-scripts allow-same-origin allow-presentation');
   wrapper.append(frame);load.disabled=true;
  });
  wrapper.append(elt('p','Click to load '+item.video_platform+' content. External tracking may occur.'));
  wrapper.append(load);
  const social=elt('a','Open original video on '+item.video_platform);social.href=item.video_url;
  social.target='_blank';social.rel='noopener noreferrer';const line=elt('p');line.append(social);wrapper.append(line);
 }
 return wrapper;
}
async function reviews(){
 status('reviewStatus','Loading private review drafts…');$('reviewItems').replaceChildren();
 try{
  const d=await get('/api/admin/supplier_reviews_v911');
  if(!d.items.length){status('reviewStatus','No actual equipment review drafts recorded; VEVOR is a suggested supplier, not a received product.');return}
  for(const item of d.items)$('reviewItems').append(renderReview(item));
  status('reviewStatus',d.items.length+' private drafts loaded; no public posts or sample receipts verified.');
 }catch(e){status('reviewStatus',e.message||'Supplier source unavailable')}}
$('reviewForm').addEventListener('submit',async e=>{
 e.preventDefault();const btn=$('saveReview');btn.disabled=true;status('saveStatus','Saving owner-reviewed source data…');
 const body={supplier:$('supplier').value,product_name:$('productName').value,
  product_url:$('productUrl').value,acquisition_kind:$('acquisition').value,
  video_platform:$('platform').value,video_url:$('videoUrl').value,
  daip_project_id:$('daipId').value,review_notes:$('notes').value};
 try{
  const r=await fetch('/api/admin/supplier_reviews_v911',{credentials:'same-origin',method:'POST',
   cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const d=await r.json().catch(()=>null);if(!r.ok||!d?.ok)throw Error(d?.error||'Original save not verified');
  status('saveStatus','Private draft saved with original source readback. Not publicly posted or verified received.');
  await reviews();
 }catch(err){status('saveStatus',err.message||'Save failed; no success claimed.')}
 finally{btn.disabled=false}
});
$('refreshFinance').addEventListener('click',finance);
$('refreshDaip').addEventListener('click',daip);
$('refreshReviews').addEventListener('click',reviews);
finance();daip();reviews();
