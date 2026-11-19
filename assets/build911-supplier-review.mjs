// Build 911: safe, owner-reviewed supplier item and social video-card contracts.
// VEVOR is a supplier suggestion, never an assertion of sponsorship, inventory receipt or payment.
const validId=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const clean=(v,max=180)=>typeof v==='string'?v.trim().slice(0,max):'';
const HOSTS={vevor:new Set(['vevor.ca','www.vevor.ca']),
 youtube:new Set(['youtube.com','www.youtube.com','m.youtube.com','youtu.be','www.youtu.be']),
 instagram:new Set(['instagram.com','www.instagram.com']),
 facebook:new Set(['facebook.com','www.facebook.com','m.facebook.com'])};
function safeUrl(raw,hosts){
 if(typeof raw!=='string'||raw.length>1000)throw Error('Supplier or social URL is too long');
 let u;try{u=new URL(raw);}catch{throw Error('Valid HTTPS URL required');}
 if(u.protocol!=='https:'||u.username||u.password||u.port||u.hash||!hosts.has(u.hostname.toLowerCase()))
  throw Error('Unapproved supplier/social URL');
 return u;
}
export function normalizeSupplierVideo911(platform,raw){
 if(!raw)return {platform:'none',url:null,embed_url:null};
 if(!['youtube','instagram','facebook'].includes(platform))throw Error('Unknown social platform');
 const url=safeUrl(raw,HOSTS[platform]),path=url.pathname;
 if(platform==='youtube'){
  let id='';
  if(url.hostname.endsWith('youtu.be'))id=path.split('/')[1]||'';
  else if(path==='/watch')id=url.searchParams.get('v')||'';
  else if(/^\/(shorts|live|embed)\//.test(path))id=path.split('/')[2]||'';
  if(!/^[\w-]{11}$/.test(id))throw Error('Invalid YouTube video ID');
  return {platform,url:'https://www.youtube.com/watch?v='+id,
   embed_url:'https://www.youtube-nocookie.com/embed/'+id+'?rel=0'};
 }
 if(platform==='instagram'){
  const m=path.match(/^\/(p|reel|tv)\/([\w-]{5,32})\/?$/);
  if(!m)throw Error('Instagram post or reel URL required');
  const normalized='https://www.instagram.com/'+m[1]+'/'+m[2]+'/';
  return {platform,url:normalized,embed_url:normalized+'embed/'};
 }
 const allowed=/^\/(?:watch\/|[^?#]{1,150}\/videos\/\d+\/?$|videos\/\d+\/?$)/;
 if(!allowed.test(path)||path==='/watch/'&&!/^\d+$/.test(url.searchParams.get('v')||''))
  throw Error('Facebook video link required');
 const normalized='https://www.facebook.com'+path+(path==='/watch/'?'?v='+url.searchParams.get('v'):'');
 return {platform,url:normalized,embed_url:'https://www.facebook.com/plugins/video.php?href='+encodeURIComponent(normalized)};
}
export function normalizeSupplierReview911(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Supplier review object required');
 const allowed=['supplier','product_name','product_url','acquisition_kind','video_platform','video_url','daip_project_id','review_notes'];
 if(Object.keys(raw).some(x=>!allowed.includes(x)))throw Error('Unsupported supplier review fields');
 const supplier=clean(raw.supplier,50).toUpperCase();
 if(supplier!=='VEVOR')throw Error('Build 911 starts with VEVOR.ca only');
 const product_name=clean(raw.product_name,140);
 if(product_name.length<4)throw Error('Product name must be entered and verified by staff');
 const source=safeUrl(raw.product_url,HOSTS.vevor);
 if(source.pathname==='/'||source.pathname.length<4)throw Error('Specific VEVOR product link required');
 const product_url='https://www.vevor.ca'+source.pathname;
 const acquisition_kind=clean(raw.acquisition_kind,20);
 if(!['not_received','purchased','gifted','loaned','review_sample'].includes(acquisition_kind))
  throw Error('Acquisition status must be explicitly selected');
 const video=normalizeSupplierVideo911(clean(raw.video_platform,15)||'none',clean(raw.video_url,1000));
 const daip=clean(raw.daip_project_id,36);
 if(daip&&!validId.test(daip))throw Error('Valid DAIP project UUID required');
 const notes=clean(raw.review_notes,750);
 return {supplier:'VEVOR',product_name,product_url,
  acquisition_kind,video_platform:video.platform,video_url:video.url,
  video_embed_url:video.embed_url,daip_project_id:daip||null,review_notes:notes,
  publication_status:'draft',received_verified:false,third_party_embed_consent_required:true,
  disclosure_required:acquisition_kind==='gifted'||acquisition_kind==='loaned'||acquisition_kind==='review_sample'};
}
export function summarizeSupplierReview911(row){
 const normalized=normalizeSupplierReview911({
  supplier:row.supplier,product_name:row.product_name,product_url:row.product_url,
  acquisition_kind:row.acquisition_kind,video_platform:row.video_platform,
  video_url:row.video_url||'',daip_project_id:row.daip_project_id||'',
  review_notes:row.review_notes||''});
 return {id:row.id,created_at:row.created_at,...normalized,publication_status:'draft',
  actually_received_not_attested:true,public_card_published:false,
  daip_project_link_only:!!normalized.daip_project_id};
}
