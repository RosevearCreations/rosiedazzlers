(function(){
  const qs=(s)=>document.querySelector(s);
  let actor=null, inventory=[], movements=[], lowStock=[], savedInventoryItems=[], bundledFallbackItems=[], mediaLibraryRows=[], importPreviewRows=[], amazonMatchRows=[], imagePickerRows=[], imageHealthRows=[], usageActionId=crypto.randomUUID(), editorTargetKey=null, editorSnapshot=null, supplierMetaState={};
  const optionStorageKey='rosie_inventory_dropdown_options_v2';
  function esc(v){ return String(v==null?'':v).replace(/[&<>"']/g,(m)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
  function show(msg,kind=''){ const el=qs('#status'); el.style.display='block'; el.className='notice '+(kind||''); el.textContent=msg; }
  function hide(){ qs('#status').style.display='none'; }
  function cleanText(value){ return String(value == null ? '' : value).trim(); }
  function inventoryOptionDefaults(){ return {
    categories:['cleaning liquids','interior cleaners','paint protection','microfiber towels','pads and polishers','brushes','buckets and wash tools','safety gear','shop supplies','marketing materials'],
    subcategories:['chemicals','linens','scrubbers','sprayers','polishing pads','clay media','glass care','engine bay','interior protection','exterior protection','black','white','grey','blue','red','green','yellow','clear','assorted colours','matte finish','gloss finish'],
    vendors:['Amazon','Canadian Tire','Costco','Home Depot','Princess Auto','Walmart','Uline','Local supplier'],
    units:['bottle','jug','litre','gallon','pad','piece','pack','roll','box','pair','kit','towel','brush'],
    itemTypes:['tool','consumable'],
    imageUrls:[]
  }; }
  function linesToArray(value){ return String(value||'').split(/\r?\n/).map((line)=>line.trim()).filter(Boolean); }
  function mergeOptionArrays(...lists){ const seen=new Set(); const out=[]; lists.flat().map(cleanText).filter(Boolean).forEach((value)=>{ const key=value.toLowerCase(); if(!seen.has(key)){ seen.add(key); out.push(value); } }); return out.sort((a,b)=>a.localeCompare(b)); }
  function readStoredInventoryOptions(){ try { return JSON.parse(localStorage.getItem(optionStorageKey)||'{}') || {}; } catch { return {}; } }
  function normalizeInventoryOptions(value={}){ const d=inventoryOptionDefaults(); return {
    categories: mergeOptionArrays(value.categories||[], d.categories),
    subcategories: mergeOptionArrays(value.subcategories||[], d.subcategories),
    vendors: mergeOptionArrays(value.vendors||[], d.vendors),
    units: mergeOptionArrays(value.units||[], d.units),
    itemTypes: mergeOptionArrays(value.itemTypes||[], d.itemTypes),
    imageUrls: mergeOptionArrays(value.imageUrls||[])
  }; }
  function currentInventoryOptions(){ return normalizeInventoryOptions(readStoredInventoryOptions()); }
  function setInventoryOptionsEditor(value){ const opt=normalizeInventoryOptions(value); const pairs=[['#optCategories','categories'],['#optSubcategories','subcategories'],['#optVendors','vendors'],['#optUnits','units'],['#optItemTypes','itemTypes'],['#optImageUrls','imageUrls']]; pairs.forEach(([sel,key])=>{ const el=qs(sel); if(el) el.value=(opt[key]||[]).join('\n'); }); }
  function readInventoryOptionsEditor(){ return normalizeInventoryOptions({ categories:linesToArray(qs('#optCategories')?.value), subcategories:linesToArray(qs('#optSubcategories')?.value), vendors:linesToArray(qs('#optVendors')?.value), units:linesToArray(qs('#optUnits')?.value), itemTypes:linesToArray(qs('#optItemTypes')?.value), imageUrls:linesToArray(qs('#optImageUrls')?.value) }); }
  function uniqueValues(getter, extras=[]){
    const seen = new Set();
    return [...extras, ...inventory.map(getter)].map(cleanText).filter((value)=>{
      if (!value || seen.has(value.toLowerCase())) return false;
      seen.add(value.toLowerCase());
      return true;
    }).sort((a,b)=>a.localeCompare(b));
  }
  function datalist(id, values){ return `<datalist id="${esc(id)}">${values.map((value)=>`<option value="${esc(value)}"></option>`).join('')}</datalist>`; }
  function cleanImageUrl(value){ return String(value || '').trim(); }
  function normalizeImageMatchText(value){ return String(value || '').toLowerCase().replace(/https?:\/\/[^\s]+/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim(); }
  function collectImageCandidates(item){
    const out=[];
    [item?.image_url, item?.r2_url, item?.media_url, item?.fallback_url, item?.public_url, item?.url].forEach((url)=>{ if(cleanImageUrl(url)) out.push(cleanImageUrl(url)); });
    normalizeGalleryImageUrls(item?.gallery_image_urls || item?.gallery_images).forEach((url)=>{ if(cleanImageUrl(url)) out.push(cleanImageUrl(url)); });
    if(Array.isArray(item?.img_candidates)) item.img_candidates.forEach((url)=>{ if(cleanImageUrl(url)) out.push(cleanImageUrl(url)); });
    return [...new Set(out)];
  }
  function normalizeGalleryImageUrls(value){
    let list=[];
    if(Array.isArray(value)) list=value;
    else if(typeof value==='string' && value.trim()){ try { const parsed=JSON.parse(value); list=Array.isArray(parsed)?parsed:value.split(/[\n,]/); } catch { list=value.split(/[\n,]/); } }
    const seen=new Set(); return list.map(cleanImageUrl).filter((url)=>{ const key=url.toLowerCase(); if(!url||seen.has(key)) return false; seen.add(key); return true; }).slice(0,7);
  }
  function galleryInputs(){ return [...document.querySelectorAll('[data-gallery-input]')]; }
  function galleryValues(){ return galleryInputs().map((input)=>cleanImageUrl(input.value)).filter(Boolean).slice(0,7); }
  function renderGalleryEditor(values){
    const grid=qs('#galleryGrid'); if(!grid) return; const urls=normalizeGalleryImageUrls(values); while(urls.length<7) urls.push('');
    grid.innerHTML=urls.map((url,index)=>`<div class="gallery-slot" draggable="true" data-gallery-slot="${index}"><img src="${esc(url || '/assets/addons/generic_addon.png')}" alt="Gallery image ${index+1} preview" loading="lazy" onerror="this.src='/assets/placeholders/inventory-tools-photo.jpg'"><label>Gallery ${index+1}<input data-gallery-input="${index}" list="inventoryImageOptions" type="url" value="${esc(url)}" placeholder="Paste or select image URL"></label><div class="gallery-slot-actions"><button class="btn ghost small" type="button" data-gallery-up="${index}" aria-label="Move gallery image ${index+1} up">↑</button><button class="btn ghost small" type="button" data-gallery-down="${index}" aria-label="Move gallery image ${index+1} down">↓</button><button class="btn ghost small" type="button" data-gallery-clear="${index}" aria-label="Clear gallery image ${index+1}">×</button></div></div>`).join('');
    bindGalleryEditor(); updateGalleryCount();
  }
  function updateGalleryCount(){ const count=galleryValues().length; const el=qs('#galleryCount'); if(el) el.textContent=`${count} / 7 gallery images`; }
  function moveGallerySlot(index,delta){ const inputs=galleryInputs(),target=index+delta; if(target<0||target>=inputs.length) return; const a=inputs[index].value,b=inputs[target].value; inputs[index].value=b; inputs[target].value=a; renderGalleryEditor(galleryValues()); }
  function bindGalleryEditor(){
    galleryInputs().forEach((input)=>input.addEventListener('input',()=>{ const slot=input.closest('.gallery-slot'),img=slot?.querySelector('img'); if(img) img.src=cleanImageUrl(input.value)||'/assets/addons/generic_addon.png'; updateGalleryCount(); }));
    document.querySelectorAll('[data-gallery-up]').forEach((btn)=>btn.addEventListener('click',()=>moveGallerySlot(Number(btn.dataset.galleryUp),-1)));
    document.querySelectorAll('[data-gallery-down]').forEach((btn)=>btn.addEventListener('click',()=>moveGallerySlot(Number(btn.dataset.galleryDown),1)));
    document.querySelectorAll('[data-gallery-clear]').forEach((btn)=>btn.addEventListener('click',()=>{ const input=qs(`[data-gallery-input="${btn.dataset.galleryClear}"]`); if(input){ input.value=''; input.dispatchEvent(new Event('input')); } }));
    let dragIndex=null; document.querySelectorAll('[data-gallery-slot]').forEach((slot)=>{ slot.addEventListener('dragstart',()=>{dragIndex=Number(slot.dataset.gallerySlot);slot.classList.add('dragging')}); slot.addEventListener('dragend',()=>{dragIndex=null;slot.classList.remove('dragging');document.querySelectorAll('.gallery-slot').forEach(x=>x.classList.remove('drag-over'))}); slot.addEventListener('dragover',(e)=>{e.preventDefault();slot.classList.add('drag-over')}); slot.addEventListener('dragleave',()=>slot.classList.remove('drag-over')); slot.addEventListener('drop',(e)=>{e.preventDefault();const target=Number(slot.dataset.gallerySlot);slot.classList.remove('drag-over');if(dragIndex==null||dragIndex===target)return;const inputs=galleryInputs(),a=inputs[dragIndex].value,b=inputs[target].value;inputs[dragIndex].value=b;inputs[target].value=a;renderGalleryEditor(galleryValues())}) });
  }
  function rebuildImagePickerRows(){
    const rows=[]; const seen=new Set();
    const add=(url, item, source)=>{
      const clean=cleanImageUrl(url);
      if(!clean || seen.has(clean)) return;
      seen.add(clean);
      rows.push({ url: clean, name: cleanText(item?.name || item?.title || item?.item_key || 'Product image'), item_key: cleanText(item?.item_key || makeInventoryKey(item?.name || item?.title || item?.filename || 'inventory_item')), source: source || cleanText(item?._source || item?.source_kind || 'catalog'), type: cleanText(item?.item_type || item?.type || item?.source_kind || ''), search: normalizeImageMatchText(`${item?.name || ''} ${item?.title || ''} ${item?.item_key || ''} ${item?.filename || ''} ${item?.category || ''} ${item?.source_kind || ''} ${clean}`) });
    };
    [...(mediaLibraryRows || []), ...(bundledFallbackItems || []), ...(inventory || [])].forEach((item)=>collectImageCandidates(item).forEach((url)=>add(url, item, item?._source === 'saved' ? 'saved DB' : (item?.source_kind || item?._source || item?.group_key || 'bundled'))));
    currentInventoryOptions().imageUrls.forEach((url)=>add(url, { name:'Saved image helper', item_key:'image_helper' }, 'helper'));
    imagePickerRows=rows.sort((a,b)=>String(a.name||'').localeCompare(String(b.name||'')));
  }
  function allInventoryImageUrls(){ rebuildImagePickerRows(); return imagePickerRows.map((row)=>row.url); }
  function findMatchingBundledImageForItem(itemLike={}){
    const key=cleanText(itemLike.item_key);
    const name=normalizeImageMatchText(itemLike.name);
    let item=(bundledFallbackItems || []).find((row)=>String(row.item_key) === String(key));
    if(!item && name) item=(bundledFallbackItems || []).find((row)=>normalizeImageMatchText(row.name) === name);
    if(!item && name) item=(bundledFallbackItems || []).find((row)=>{ const candidate=normalizeImageMatchText(row.name); return candidate && (candidate.includes(name) || name.includes(candidate)); });
    const url=collectImageCandidates(item || {})[0] || '';
    return url ? { item, url } : null;
  }
  function findMatchingBundledImage(){
    return findMatchingBundledImageForItem({ item_key: qs('#formItemKey')?.value, name: qs('#formName')?.value });
  }
  function updateImagePreview(){
    const url=cleanImageUrl(qs('#formImage')?.value);
    const img=qs('#formImagePreview');
    const title=qs('#imagePreviewTitle');
    const meta=qs('#imagePreviewMeta');
    const match=findMatchingBundledImage();
    if(img){ img.src=url || '/assets/placeholders/inventory-tools-photo.jpg'; img.onerror=()=>{ img.onerror=null; img.src='/assets/placeholders/inventory-tools-photo.jpg'; }; }
    if(title) title.textContent = url ? 'Selected product image' : (match ? 'Matching bundled image found' : 'No product image selected yet');
    if(meta) meta.textContent = url ? url : (match ? `Available: ${match.item?.name || match.item?.item_key || 'bundled catalog image'}` : 'Use the matching bundled image or open the picker to select an uploaded product image.');
  }
  function renderImagePicker(){
    rebuildImagePickerRows();
    const q=normalizeImageMatchText(qs('#imagePickerSearch')?.value || '');
    const rows=imagePickerRows.filter((row)=>!q || row.search.includes(q)).slice(0,80);
    const count=qs('#imagePickerCount'); if(count) count.textContent=`${rows.length} shown · ${imagePickerRows.length} available`;
    const grid=qs('#imagePickerGrid'); if(!grid) return;
    grid.innerHTML=rows.map((row,idx)=>`<button class="image-choice" type="button" data-image-choice="${idx}" title="Use ${esc(row.name)}"><img src="${esc(row.url)}" alt="${esc(row.name)}" loading="lazy" onerror="this.src='/assets/placeholders/inventory-tools-photo.jpg'"><span>${esc(row.name)}</span><span class="image-source">${esc(row.source)} · ${esc(row.type || 'image')}</span></button>`).join('') || '<div class="mini">No matching images found. Try a shorter search term.</div>';
    document.querySelectorAll('[data-image-choice]').forEach((btn)=>btn.addEventListener('click',()=>{ const row=rows[Number(btn.dataset.imageChoice)]; if(!row) return; qs('#formImage').value=row.url; updateImagePreview(); show(`Selected existing image for ${row.name}. Save the inventory item to keep it.`, 'ok'); }));
  }
  function renderInventoryDatalists(){
    const mount = qs('#inventoryDatalists');
    if (!mount) return;
    const opts=currentInventoryOptions();
    mount.innerHTML = [
      datalist('inventoryKeyOptions', uniqueValues((item)=>item.item_key)),
      datalist('inventoryNameOptions', uniqueValues((item)=>item.name)),
      datalist('inventoryCategoryOptions', uniqueValues((item)=>item.category, opts.categories)),
      datalist('inventorySubcategoryOptions', uniqueValues((item)=>item.subcategory, opts.subcategories)),
      datalist('inventoryVendorOptions', uniqueValues((item)=>item.preferred_vendor, opts.vendors)),
      datalist('inventoryVendorSkuOptions', uniqueValues((item)=>item.vendor_sku)),
      datalist('inventoryUnitOptions', uniqueValues((item)=>item.unit_label, opts.units)),
      datalist('inventoryPurchaseUrlOptions', uniqueValues((item)=>item.amazon_url)),
      datalist('inventoryImageOptions', uniqueValues((item)=>item.image_url, mergeOptionArrays(opts.imageUrls, allInventoryImageUrls())))
    ].join('');
  }
  function headers(json=true){ const h = json ? {'Content-Type':'application/json'} : {}; if(actor?.email) h['x-staff-email']=actor.email; return h; }
  async function getJson(url){ const r=await fetch(url,{credentials:'include',headers:headers(false)}); return { ok:r.ok, status:r.status, out:await r.json().catch(()=>null) }; }
  async function postJson(url,payload){ const r=await fetch(url,{method:'POST',credentials:'include',headers:headers(true),body:JSON.stringify(payload)}); return { ok:r.ok, status:r.status, out:await r.json().catch(()=>null) }; }
  async function loadSharedInventoryOptions(){
    const stored = readStoredInventoryOptions();
    let shared = {};
    try {
      const r=await postJson('/api/admin/app_settings_get', {});
      const raw=r?.out?.settings?.catalog_dropdown_options?.value || r?.out?.settings?.catalog_dropdown_options;
      const value=typeof raw==='string' ? JSON.parse(raw) : raw;
      shared={
        categories:value?.inventory_categories || [],
        subcategories:value?.inventory_subcategories || [],
        vendors:value?.inventory_vendors || [],
        units:value?.inventory_units || [],
        itemTypes:value?.inventory_item_types || ['tool','consumable'],
        imageUrls:value?.imageUrls || value?.image_url_helpers || []
      };
    } catch(err){
      console.warn('Could not load DB catalog dropdown options; trying bundled fallback.', err);
    }
    try {
      const fallbackRes = await fetch('/data/admin_option_libraries.json', { credentials:'include', cache:'no-store' });
      const fallback = await fallbackRes.json().catch(()=>null);
      if (fallback && typeof fallback === 'object') {
        shared = {
          categories: mergeOptionArrays(shared.categories || [], fallback.inventory_categories || []),
          subcategories: mergeOptionArrays(shared.subcategories || [], fallback.inventory_subcategories || []),
          vendors: mergeOptionArrays(shared.vendors || [], fallback.inventory_vendors || []),
          units: mergeOptionArrays(shared.units || [], fallback.inventory_units || []),
          itemTypes: mergeOptionArrays(shared.itemTypes || [], ['tool','consumable','system'], fallback.inventory_item_types || []),
          imageUrls: mergeOptionArrays(shared.imageUrls || [], fallback.image_url_helpers || [])
        };
      }
    } catch(err){
      console.warn('Could not load bundled catalog dropdown options; using browser/default options.', err);
    }
    const merged=normalizeInventoryOptions(Object.assign({}, stored, shared));
    localStorage.setItem(optionStorageKey, JSON.stringify(merged));
    setInventoryOptionsEditor(merged);
  }
  async function saveSharedInventoryOptions(value){
    const payload={
      addon_categories:[], addon_types:[],
      inventory_categories:value.categories || [],
      inventory_subcategories:value.subcategories || [],
      inventory_vendors:value.vendors || [],
      inventory_units:value.units || [],
      service_tiers:[], service_zones:[],
      imageUrls:value.imageUrls || []
    };
    return postJson('/api/admin/app_settings_save', { key:'catalog_dropdown_options', value:payload });
  }
  function hardenTextInput(el,name){ if(!el) return; const unlock=()=>{ el.readOnly=false; if(/@/.test(el.value||'')) el.value=''; }; el.value=''; el.setAttribute('autocomplete','off'); if(name) el.setAttribute('name',name); setTimeout(()=>{ if(/@/.test(el.value||'')) el.value=''; },50); el.addEventListener('focus',unlock,{once:true}); el.addEventListener('pointerdown',unlock,{once:true}); }
  function setSupplierMeta(item={}){
    supplierMetaState={
      amazon_asin:cleanText(item?.amazon_asin), amazon_title:cleanText(item?.amazon_title), amazon_brand:cleanText(item?.amazon_brand), amazon_category:cleanText(item?.amazon_category),
      amazon_match_status:cleanText(item?.amazon_match_status), amazon_match_score:item?.amazon_match_score ?? null, amazon_seller_name:cleanText(item?.amazon_seller_name),
      amazon_quantity_total:item?.amazon_quantity_total ?? null, amazon_net_total_cents:item?.amazon_net_total_cents ?? null
    };
    const pairs=[['#formAmazonAsinDisplay',supplierMetaState.amazon_asin],['#formAmazonBrandDisplay',supplierMetaState.amazon_brand],['#formAmazonTitleDisplay',supplierMetaState.amazon_title],['#formAmazonCategoryDisplay',supplierMetaState.amazon_category]];
    pairs.forEach(([selector,value])=>{const el=qs(selector);if(el)el.textContent=value||'—';});
  }
  function updateEditorMode(){
    const mode=qs('#editorModeStatus'),target=qs('#supplierTargetStatus'),visual=qs('#supplierVisualTarget'),keyInput=qs('#formItemKey');
    if(editorTargetKey){
      if(mode)mode.innerHTML=`Repair mode: editing existing inventory key <strong>${esc(editorTargetKey)}</strong>. The key is locked so Amazon refresh cannot create an accidental duplicate.`;
      if(target)target.innerHTML=`Repair target: <strong>${esc(editorSnapshot?.name||editorTargetKey)}</strong> (<code>${esc(editorTargetKey)}</code>). Amazon data will be staged against this row; stock/history fields remain protected.`;
      if(visual)visual.textContent='Existing item';
      if(keyInput){keyInput.readOnly=true;keyInput.title='Existing inventory keys are locked during editing to protect references and history.';}
    }else{
      if(mode)mode.innerHTML='New-item mode. Select <strong>Edit</strong> on an existing row first if we want to repair that exact inventory record.';
      if(target)target.textContent='No existing repair target selected. Importing a link will create a new private review draft.';
      if(visual)visual.textContent='New item';
      if(keyInput){keyInput.readOnly=false;keyInput.removeAttribute('title');}
    }
  }
  function fillForm(item,options={}){
    const explicitTarget=Object.prototype.hasOwnProperty.call(options,'targetKey') ? options.targetKey : (item?._source==='saved' ? item?.item_key : null);
    editorTargetKey=explicitTarget ? String(explicitTarget) : null;
    editorSnapshot=editorTargetKey ? structuredClone(item||{}) : null;
    qs('#formItemType').value=item?.item_type||'tool'; qs('#formItemKey').value=item?.item_key||''; qs('#formName').value=item?.name||'';
    qs('#formCategory').value=item?.category||''; qs('#formSubcategory').value=item?.subcategory||''; qs('#formVendor').value=item?.preferred_vendor||'';
    qs('#formUnit').value=item?.unit_label||''; qs('#formQty').value=item?.qty_on_hand ?? 0; qs('#formReorderPoint').value=item?.reorder_point ?? 0;
    qs('#formReorderQty').value=item?.reorder_qty ?? 0; qs('#formCostCad').value=item?.cost_cents != null ? Number(item.cost_cents || 0) / 100 : ''; qs('#formVendorSku').value=item?.vendor_sku || ''; qs('#formRating').value=item?.rating_value ?? ''; qs('#formRatingCount').value=item?.rating_count ?? 0;
    qs('#formSortKey').value=item?.sort_key ?? 0; qs('#formPurchaseDate').value=(item?.purchase_date||'').slice(0,10); qs('#formEstimatedJobs').value=item?.estimated_jobs_per_unit ?? 0; qs('#formReuse').value=item?.reuse_policy||'reorder'; qs('#formAmazon').value=item?.amazon_url||'';
    qs('#formImage').value=item?.image_url||''; renderGalleryEditor(item?.gallery_image_urls || item?.gallery_images || []); qs('#formReceiptUrl').value=item?.receipt_url || item?.bill_url || ''; qs('#formAssignedStation').value=item?.assigned_station || item?.station_label || ''; qs('#formServiceTags').value=Array.isArray(item?.service_tags) ? item.service_tags.join(', ') : (item?.service_tags || item?.service_link_tags || '');
    qs('#formDescription').value=item?.description||''; qs('#formIsPublic').checked=item?.is_public !== false; qs('#formIsActive').checked=item?.is_active !== false; qs('#formNotes').value=item?.notes||'';
    setSupplierMeta(item||{}); updateEditorMode(); updateImagePreview(); renderImagePicker();
  }
  function supplierRefreshOptions(){return {identity:qs('#supplierOverwriteIdentity')?.checked!==false,classification:qs('#supplierOverwriteClassification')?.checked!==false,description:qs('#supplierOverwriteDescription')?.checked!==false,price:qs('#supplierOverwritePrice')?.checked!==false,image:qs('#supplierOverwriteImage')?.checked!==false};}
  function mergeSupplierDraft(target,draft){
    const opts=supplierRefreshOptions(),base=target?structuredClone(target):{is_public:false,is_active:true,qty_on_hand:1,reorder_point:0,reorder_qty:1,rating_count:0,sort_key:0,gallery_image_urls:[]},next={...base};
    if(!target) next.item_key=draft.item_key;
    next.amazon_url=draft.amazon_url||next.amazon_url||'';
    next.amazon_asin=draft.amazon_asin||next.amazon_asin||null; next.amazon_title=draft.amazon_title||next.amazon_title||null; next.amazon_brand=draft.amazon_brand||next.amazon_brand||null; next.amazon_category=draft.amazon_category||next.amazon_category||null;
    if(opts.identity){next.name=draft.name||next.name;next.preferred_vendor=draft.preferred_vendor||next.preferred_vendor;next.vendor_sku=draft.vendor_sku||draft.amazon_asin||next.vendor_sku;}
    if(opts.classification){next.item_type=draft.item_type||next.item_type;next.category=draft.category||next.category;next.subcategory=draft.subcategory||next.subcategory;next.unit_label=draft.unit_label||next.unit_label;next.reuse_policy=draft.reuse_policy||next.reuse_policy;}
    if(opts.description && draft.description) next.description=draft.description;
    if(opts.price && draft.cost_cad!=null && Number.isFinite(Number(draft.cost_cad))) next.cost_cents=Math.round(Number(draft.cost_cad)*100);
    if(opts.image && draft.image_url) next.image_url=draft.image_url;
    if(!target){next.reorder_point=draft.reorder_point??next.reorder_point;next.reorder_qty=draft.reorder_qty??next.reorder_qty;next.qty_on_hand=draft.qty_on_hand??next.qty_on_hand;}
    return next;
  }
  function supplierDiff(before={},after={}){
    const fields=[['name','Name'],['item_type','Type'],['category','Category'],['subcategory','Subcategory'],['preferred_vendor','Vendor'],['vendor_sku','SKU / ASIN'],['unit_label','Unit'],['reuse_policy','Reuse policy'],['cost_cents','Unit cost'],['description','Description'],['image_url','Featured image'],['amazon_url','Amazon URL'],['amazon_asin','Amazon ASIN'],['amazon_brand','Amazon brand'],['amazon_category','Amazon category']];
    return fields.filter(([key])=>String(before?.[key]??'')!==String(after?.[key]??'')).map(([key,label])=>({key,label,before:key==='cost_cents'&&before?.[key]!=null?`${(Number(before[key])/100).toFixed(2)} CAD`:String(before?.[key]??''),after:key==='cost_cents'&&after?.[key]!=null?`${(Number(after[key])/100).toFixed(2)} CAD`:String(after?.[key]??'')}));
  }
  function fillUsageItems(){
    const options='<option value="">Select inventory item</option>'+inventory.map((item)=>`<option value="${esc(item.item_key)}">${esc(item.name)} (${esc(item.item_type||'')})</option>`).join('');
    const usageSel=qs('#usageItemKey'); if(usageSel) usageSel.innerHTML=options;
    const quickSel=qs('#quickStockItem'); if(quickSel) quickSel.innerHTML=options;
  }

  function itemQualityScore(item){
    let score=0;
    if(item?.image_url) score+=20;
    score+=Math.min(10, normalizeGalleryImageUrls(item?.gallery_image_urls).length * 2);
    if(item?.name && String(item.name).length>=6) score+=10;
    if(item?.category) score+=10;
    if(item?.subcategory) score+=8;
    if(item?.preferred_vendor) score+=8;
    if(item?.cost_cents!=null && Number(item.cost_cents)>0) score+=15;
    if(item?.amazon_url) score+=8;
    if(item?.reorder_point!=null && Number(item.reorder_point)>=0) score+=6;
    if(item?.unit_label) score+=5;
    if(item?.service_tags || item?.service_link_tags) score+=5;
    return Math.max(0, Math.min(100, score));
  }
  function itemQualityClass(score){ return score >= 75 ? 'quality-good' : score >= 45 ? 'quality-warn' : 'quality-bad'; }
  function clientReadiness(item){
    if(item?.publish_readiness) return item.publish_readiness;
    const blockers=[],warnings=[],name=String(item?.name||'').trim(),image=String(item?.image_url||'').trim(),gallery=normalizeGalleryImageUrls(item?.gallery_image_urls);
    if(!item?.item_key) blockers.push('Item key is missing.');
    if(!name) blockers.push('Name is missing.'); else if(/^(unknown product|untitled|item\s*\d*|product\s*\d*|amazon item|B0[A-Z0-9]{8}|[A-Z0-9_-]{8,})$/i.test(name)) blockers.push('Name needs review.');
    if(!['tool','consumable'].includes(String(item?.item_type||''))) blockers.push('Item type is invalid.');
    if(!String(item?.category||'').trim()) blockers.push('Category is missing.');
    if(!String(item?.unit_label||'').trim()) blockers.push('Unit label is missing.');
    if(!image) blockers.push('Featured image is missing.'); else if(/\.svg(?:[?#]|$)/i.test(image)) blockers.push('Featured image is still an SVG placeholder.');
    if(item?.is_active===false) blockers.push('Item is inactive.');
    if(item?.item_type==='consumable' && !(Number(item?.qty_on_hand||0)>0)) blockers.push('Consumable stock is zero.');
    if(!(Number(item?.cost_cents||0)>0)) warnings.push('Unit cost is missing.');
    if(!String(item?.description||'').trim()) warnings.push('Description is missing.');
    if(!gallery.length) warnings.push('Gallery is empty.');
    const score=Math.max(0,Math.min(100,100-blockers.length*20-warnings.length*6));
    return {ready:!blockers.length,score,blockers,warnings,gallery_count:gallery.length};
  }
  function readinessLabel(item){const r=clientReadiness(item);return r.ready?(r.warnings?.length?'Ready · review warnings':'Ready to publish'):`Blocked · ${r.blockers?.length||0}`;}
  function readinessClass(item){const r=clientReadiness(item);return r.ready?(r.warnings?.length?'readiness-review':'readiness-ready'):'readiness-blocked';}

  function duplicateSignature(item){
    const name=String(item?.name||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
    const image=String(item?.image_url||'').toLowerCase().split('?')[0];
    return `${name}::${image}`;
  }
  function selectedInventoryKeys(){
    return [...document.querySelectorAll('.inventory-row-check:checked')].map((el)=>el.value).filter(Boolean);
  }
  function imageUrlKey(url){ return cleanImageUrl(url).toLowerCase().split('?')[0].replace(/^https?:\/\//,''); }
  function duplicateImageGroups(rows=inventory){
    const map=new Map();
    (rows||[]).forEach((item)=>{ const key=imageUrlKey(item?.image_url); if(!key) return; if(!map.has(key)) map.set(key, []); map.get(key).push(item); });
    return [...map.values()].filter((group)=>group.length>1);
  }
  function healthForUrl(url){ const key=imageUrlKey(url); return (imageHealthRows || []).find((row)=>row.key===key) || null; }
  function imageDiagnosticsForItem(item){
    const parts=[];
    const group=(duplicateImageGroups(inventory).find((items)=>items.some((x)=>String(x.item_key)===String(item?.item_key))) || []);
    if(group.length>1) parts.push(`<div class="mini quality-warn">Duplicate image used by ${group.length} items</div>`);
    const health=healthForUrl(item?.image_url);
    if(health && !health.ok) parts.push(`<div class="mini image-health-bad">Image failed browser load check</div>`);
    if(health && health.ok) parts.push(`<div class="mini image-health-good">Image passed browser load check</div>`);
    return parts.join('');
  }
  function refreshQualitySummary(){
    const rows=inventory || [];
    const scores=rows.map(itemQualityScore);
    const avg=scores.length ? Math.round(scores.reduce((a,b)=>a+b,0)/scores.length) : 0;
    const missingImages=rows.filter((item)=>!item.image_url).length;
    const missingCost=rows.filter((item)=>!(Number(item.cost_cents||0)>0)).length;
    const fallbackOnly=rows.filter((item)=>item._source==='fallback').length;
    const duplicates=duplicateImageGroups(rows).length;
    const el=qs('#catalogQualitySummary');
    if(el) el.textContent=`Average completeness ${avg}% · ${missingImages} missing images · ${missingCost} missing cost · ${fallbackOnly} bundled-only rows · ${duplicates} duplicate image groups · ${mediaLibraryRows.length} media-library images`;
    const meter=qs('#catalogQualityMeter'); if(meter) meter.style.width=`${avg}%`;
    const health=qs('#imageHealthSummary');
    if(health && imageHealthRows.length){ const failed=imageHealthRows.filter((row)=>!row.ok).length; health.textContent=`Last image scan: ${imageHealthRows.length} checked · ${failed} failed · ${imageHealthRows.length-failed} passed`; }
  }
  function amazonStatusClass(status){ return status === 'strong' ? 'amazon-status-strong' : status === 'review' ? 'amazon-status-review' : 'amazon-status-unmatched'; }
  async function loadAmazonMatches(){
    try {
      const res = await fetch('/data/amazon_catalog_matches.json', { credentials:'include', cache:'no-store' });
      const out = await res.json().catch(()=>null);
      if(!res.ok || !out || !Array.isArray(out.matches)) throw new Error('Amazon match file was not available.');
      amazonMatchRows = out.matches;
      const summary = out.summary || {};
      const note = qs('#amazonPrivacyNote');
      if(note && summary.privacy_note) note.textContent = summary.privacy_note;
      renderAmazonMatches(summary);
      show(`Amazon CSV matches loaded: ${amazonMatchRows.length} catalog rows, ${summary.auto_apply_count || 0} strong, ${summary.review_count || 0} review.`, 'ok');
    } catch(err) {
      amazonMatchRows = [];
      renderAmazonMatches({});
      show(`Could not load Amazon CSV matches: ${err.message || err}`, 'bad');
    }
  }
  function renderAmazonMatches(summary={}){
    const filter = qs('#amazonMatchStatusFilter')?.value || 'strong';
    const counts = amazonMatchRows.reduce((acc,row)=>{ acc[row.match_status]=(acc[row.match_status]||0)+1; return acc; },{});
    const shown = amazonMatchRows.filter((row)=>filter === 'all' || row.match_status === filter);
    const summaryEl = qs('#amazonMatchSummary');
    if(summaryEl) summaryEl.textContent = amazonMatchRows.length
      ? `${amazonMatchRows.length} rows · ${counts.strong||0} strong · ${counts.review||0} review · ${counts.unmatched||0} unmatched · ${summary.unique_amazon_products || 'many'} unique Amazon products`
      : 'No Amazon match data loaded yet.';
    const box = qs('#amazonMatchBox'); if(box) box.style.display = amazonMatchRows.length ? 'block' : 'none';
    const body = qs('#amazonMatchBody');
    if(!body) return;
    body.innerHTML = shown.map((row)=>{
      const idx = amazonMatchRows.indexOf(row);
      const a = row.amazon || {};
      const checked = row.match_status === 'strong' ? 'checked' : '';
      const disabled = row.match_status === 'unmatched' ? 'disabled title="Unmatched rows need manual review first"' : '';
      const cost = a.purchase_ppu != null ? `${Number(a.purchase_ppu).toFixed(2)} ${esc(a.currency || 'CAD')}` : 'No price';
      const qty = a.quantity_total != null ? esc(a.quantity_total) : '0';
      return `<tr><td class="catalog-select-col"><input class="amazon-row-check" type="checkbox" data-amazon-idx="${idx}" ${checked} ${disabled}></td><td><strong>${esc(row.catalog_name)}</strong><div class="mini">${esc(row.item_key)} · ${esc(row.catalog_type)} · ${esc(row.catalog_category||'')}</div><span class="pill ${amazonStatusClass(row.match_status)}">${esc(row.match_status)} ${esc(row.match_score)}</span></td><td><span class="amazon-title">${esc(a.title || '')}</span><div class="mini">ASIN ${esc(a.asin || '')} · ${esc(a.seller_name || '')} · ${esc(a.brand || '')}</div>${a.amazon_url?`<div class="mini"><a href="${esc(a.amazon_url)}" target="_blank" rel="noopener">Open Amazon link</a></div>`:''}</td><td><strong>${esc(cost)}</strong><div class="mini">CSV qty ${qty} · latest ${esc(a.order_date || '')}</div><div class="mini">Net total ${a.item_net_total != null ? esc(Number(a.item_net_total).toFixed(2)) : '—'}</div></td><td><button class="btn ghost" type="button" data-amazon-edit="${idx}">Open in editor</button></td></tr>`;
    }).join('') || '<tr><td colspan="5">No rows match this filter.</td></tr>';
    document.querySelectorAll('[data-amazon-edit]').forEach((btn)=>btn.addEventListener('click', ()=>openAmazonMatchInEditor(Number(btn.dataset.amazonEdit))));
  }
  function amazonMatchToInventoryPayload(match){
    const existing = inventory.find((item)=>String(item.item_key) === String(match.item_key)) || bundledFallbackItems.find((item)=>String(item.item_key) === String(match.item_key)) || null;
    const base = existing ? makeImportPayload(existing) : { item_key:match.item_key, item_type:match.catalog_type, name:match.catalog_name, category:match.catalog_category || 'general', unit_label:'each', qty_on_hand:0, reorder_point:0, reorder_qty:1, reuse_policy:'reorder', is_public:true, is_active:true };
    const a = match.amazon || {};
    const noteParts = [base.notes || '', `Amazon CSV ${match.match_status} match score ${match.match_score}`, a.asin ? `ASIN ${a.asin}` : '', a.seller_name ? `Seller ${a.seller_name}` : '', a.amazon_category ? `Amazon category ${a.amazon_category}` : ''].filter(Boolean);
    return {
      ...base,
      amazon_url: a.amazon_url || base.amazon_url || '',
      cost_cad: a.purchase_ppu != null ? Number(a.purchase_ppu) : base.cost_cad,
      qty_on_hand: a.quantity_total != null && Number(a.quantity_total) > 0 ? Number(a.quantity_total) : Number(base.qty_on_hand || 0),
      preferred_vendor: 'Amazon',
      vendor_sku: a.asin || base.vendor_sku || a.part_number || a.model_number || '',
      purchase_date: a.order_date ? String(a.order_date).replaceAll('/','-') : base.purchase_date,
      image_url: base.image_url || match.catalog_image_url || '',
      amazon_asin: a.asin || '',
      amazon_title: a.title || '',
      amazon_match_status: match.match_status || '',
      amazon_match_score: match.match_score || 0,
      amazon_seller_name: a.seller_name || '',
      amazon_brand: a.brand || '',
      amazon_category: a.amazon_category || '',
      amazon_quantity_total: a.quantity_total || 0,
      amazon_net_total_cents: a.item_net_total != null ? Math.round(Number(a.item_net_total) * 100) : null,
      notes: noteParts.join(' | ')
    };
  }
  function openAmazonMatchInEditor(index){
    const match = amazonMatchRows[index];
    if(!match) return show('Amazon match row was not found.', 'bad');
    const payload = amazonMatchToInventoryPayload(match);
    fillForm({ ...payload, cost_cents: payload.cost_cad != null ? Math.round(Number(payload.cost_cad)*100) : null });
    qs('#itemForm')?.scrollIntoView({behavior:'smooth', block:'start'});
    show(`Loaded Amazon ${match.match_status} match into the editor. Review before saving.`, match.match_status === 'strong' ? 'ok' : 'bad');
  }
  async function importSelectedAmazonMatches(){
    const selected = [...document.querySelectorAll('.amazon-row-check:checked')].map((el)=>amazonMatchRows[Number(el.dataset.amazonIdx)]).filter(Boolean);
    if(!selected.length) return show('Select at least one Amazon match first.', 'bad');
    const reviewCount = selected.filter((row)=>row.match_status !== 'strong').length;
    if(reviewCount && !confirm(`${reviewCount} selected rows are review/unmatched. Continue after checking them?`)) return;
    let ok=0, failed=0;
    for(const match of selected){
      const res = await postJson('/api/admin/catalog_inventory_save', amazonMatchToInventoryPayload(match));
      if(res.ok && res.out?.ok) ok++; else failed++;
    }
    show(`Amazon match save finished: ${ok} saved, ${failed} failed. Reloading inventory…`, failed ? 'bad' : 'ok');
    await loadInventory();
  }

  function makeImportPayload(item){
    return {
      item_key:item.item_key, item_type:item.item_type, name:item.name, category:item.category || 'general', subcategory:item.subcategory || '',
      preferred_vendor:item.preferred_vendor || '', vendor_sku:item.vendor_sku || '', unit_label:item.unit_label || 'each',
      qty_on_hand:Number(item.qty_on_hand || 0), reorder_point:Number(item.reorder_point || 0), reorder_qty:Number(item.reorder_qty || 1),
      cost_cad:item.cost_cents!=null && Number(item.cost_cents)>0 ? Number(item.cost_cents)/100 : null,
      rating_value:item.rating_value ?? '', rating_count:Number(item.rating_count || 0), sort_key:Number(item.sort_key || 9999),
      purchase_date:item.purchase_date || null, estimated_jobs_per_unit:Number(item.estimated_jobs_per_unit || 0),
      reuse_policy:item.reuse_policy || 'reorder', amazon_url:item.amazon_url || '', image_url:item.image_url || '',
      receipt_url:item.receipt_url || '', assigned_station:item.assigned_station || '', service_tags:item.service_tags || '',
      is_public:item.is_public !== false, is_active:item.is_active !== false, notes:item.notes || ''
    };
  }
  function buildImportPreview(){
    const savedByKey=new Map((savedInventoryItems||[]).map((item)=>[String(item.item_key), item]));
    const savedSignatures=new Map((savedInventoryItems||[]).map((item)=>[duplicateSignature(item), item]));
    importPreviewRows=(bundledFallbackItems||[]).map((item)=>{
      const exact=savedByKey.get(String(item.item_key));
      const duplicate=savedSignatures.get(duplicateSignature(item));
      let decision='create';
      let reason='Bundled item is not saved in DB yet.';
      if(exact){ decision='skip'; reason='Already saved by item key.'; }
      else if(duplicate){ decision='review'; reason=`Possible duplicate of saved item: ${duplicate.name || duplicate.item_key}`; }
      const score=itemQualityScore(item);
      return { ...item, decision, reason, score, selected: decision==='create' };
    });
    return importPreviewRows;
  }
  function renderImportPreview(){
    const rows=buildImportPreview();
    const counts=rows.reduce((acc,row)=>{ acc[row.decision]=(acc[row.decision]||0)+1; return acc; }, {});
    const summary=qs('#importPreviewSummary');
    if(summary) summary.textContent=`${rows.length} bundled rows · ${counts.create||0} create · ${counts.review||0} review · ${counts.skip||0} skip`;
    const box=qs('#importPreviewBox'); if(box) box.style.display='block';
    const body=qs('#importPreviewBody');
    if(body) body.innerHTML=rows.map((row,idx)=>`<tr><td class="catalog-select-col">${row.decision==='skip' ? '' : `<input class="import-row-check" type="checkbox" data-import-idx="${idx}" ${row.selected?'checked':''}>`}</td><td><span class="pill">${esc(row.decision)}</span></td><td><strong>${esc(row.name)}</strong><div class="mini">${esc(row.item_key)} · ${esc(row.item_type)} · ${esc(row.category||'')}</div></td><td><span class="${itemQualityClass(row.score)}">${row.score}%</span><div class="quality-meter"><span style="width:${row.score}%"></span></div></td><td class="mini">${esc(row.reason)}</td></tr>`).join('') || '<tr><td colspan="5">No bundled rows found.</td></tr>';
  }
  async function importSelectedCatalogRows(){
    const checked=[...document.querySelectorAll('.import-row-check:checked')].map((el)=>importPreviewRows[Number(el.dataset.importIdx)]).filter(Boolean);
    if(!checked.length) return show('Select at least one bundled row to import.', 'bad');
    let ok=0, failed=0;
    for(const item of checked){
      const res=await postJson('/api/admin/catalog_inventory_save', makeImportPayload(item));
      if(res.ok && res.out?.ok) ok++; else failed++;
    }
    show(`Import finished: ${ok} saved, ${failed} failed. Reloading inventory…`, failed ? 'bad' : 'ok');
    await loadInventory();
    renderImportPreview();
  }
  function renderPublishReview(out){
    const box=qs('#publishReviewResult'); if(!box)return;
    const rows=Array.isArray(out?.items)?out.items:[];
    box.innerHTML=rows.length?rows.map((row)=>`<div class="publish-review-item"><strong>${esc(row.item_key)}</strong> · <span class="${row.ready?'readiness-ready':'readiness-blocked'}">${row.ready?'Ready':'Blocked'} (${esc(row.score)}%)</span>${(row.blockers||[]).length?`<div class="mini readiness-blocked">${row.blockers.map(esc).join(' · ')}</div>`:''}${(row.warnings||[]).length?`<div class="mini readiness-review">${row.warnings.map(esc).join(' · ')}</div>`:''}</div>`).join(''):`<div class="mini">${esc(out?.message||'No readiness rows returned.')}</div>`;
  }
  async function bulkSetVisibility(values,{dryRun=false}={}){
    const keys=selectedInventoryKeys();
    if(!keys.length) return show('Select at least one visible row first.', 'bad');
    const reason=qs('#publishReason')?.value.trim()||'Reviewed inventory visibility update';
    const x=await postJson('/api/admin/catalog_bulk_visibility', { item_keys: keys, reason, dry_run:dryRun, ...values });
    if(values.is_public===true && x.out) renderPublishReview(x.out);
    if(!x.ok || !x.out?.ok) return show((x.out&&x.out.error)||'Bulk update failed. Save fallback rows first, then try again.', 'bad');
    show(values.is_public===true?(dryRun?x.out.message||'Readiness preview complete.':x.out.message||'Ready selection published.'):`Bulk update complete: ${x.out.updated || 0} rows changed.`, 'ok');
    if(!dryRun) await loadInventory();
  }
  async function applyQuickStock(){
    const item_key=qs('#quickStockItem')?.value || '';
    const action_type=qs('#quickStockAction')?.value || 'adjust_up';
    const qty=Number(qs('#quickStockQty')?.value || 0);
    const note=qs('#quickStockNote')?.value || '';
    if(!item_key || !(qty>0)) return show('Choose an item and quantity first.', 'bad');
    const x=await postJson('/api/admin/catalog_stock_action', { item_key, action_type, qty, note });
    if(!x.ok || !x.out?.ok) return show((x.out&&x.out.error)||'Could not apply stock adjustment. Make sure the item is saved to DB first.', 'bad');
    show('Stock adjustment saved and movement history updated.', 'ok');
    qs('#quickStockNote').value='';
    await loadInventory(); await loadMovements(); await loadLowStock();
  }
  function applyInventoryFilters(items){ const q=(qs('#invSearch').value||'').trim().toLowerCase(); const type=qs('#itemType').value||''; const readiness=qs('#publishReadinessFilter')?.value||''; const mode=qs('#invSort').value; let out=items.filter((item)=>!type || item.item_type===type).filter((item)=>{const r=clientReadiness(item);return !readiness||(readiness==='ready'&&r.ready&&!r.warnings?.length)||(readiness==='warning'&&r.ready&&r.warnings?.length)||(readiness==='blocked'&&!r.ready);}).filter((item)=>!q || `${item.name} ${item.item_key} ${item.category||''} ${item.subcategory||''} ${item.preferred_vendor||''}`.toLowerCase().includes(q)); out=[...out]; if(mode==='name_asc') out.sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''))); if(mode==='stock_asc') out.sort((a,b)=>Number(a.qty_on_hand||0)-Number(b.qty_on_hand||0)); if(mode==='rating_desc') out.sort((a,b)=>Number(b.rating_value||0)-Number(a.rating_value||0)); if(mode==='sort_key_asc') out.sort((a,b)=>Number(a.sort_key||0)-Number(b.sort_key||0)||String(a.name||'').localeCompare(String(b.name||''))); return out; }
  async function createReorder(itemKey){ const item=inventory.find((x)=>String(x.item_key)===String(itemKey)); const reminderAt=new Date(Date.now()+3*24*60*60*1000).toISOString(); const x=await postJson('/api/admin/catalog_reorder_request',{ item_key: itemKey, status:'requested', reminder_at: reminderAt, qty_ordered: item?.reorder_qty || 1, vendor_name: item?.preferred_vendor || '', purchase_url: item?.amazon_url || '' }); if(!x.ok||!x.out?.ok) return show((x.out&&x.out.error)||'Could not create reorder.','bad'); show('Reorder request created.','ok'); loadInventory(); loadLowStock(); loadOrders(); }
  function renderInventory(){
    const items=applyInventoryFilters(inventory);
    const savedCount=items.filter((item)=>item._source==='saved').length;
    const fallbackCount=items.filter((item)=>item._source==='fallback').length;
    const readyCount=items.filter((item)=>clientReadiness(item).ready).length; qs('#invSummary').textContent=`${items.length} items shown · ${savedCount} saved · ${fallbackCount} fallback · ${readyCount} ready · ${items.length-readyCount} blocked`;
    qs('#invBody').innerHTML=items.map((item)=>{
      const score=itemQualityScore(item);
      return `<tr><td class="catalog-select-col"><input class="inventory-row-check" type="checkbox" value="${esc(item.item_key)}" ${item._source==='fallback'?'title="Save/import fallback row before DB-only bulk updates"':''}></td><td><button class="inventory-name-edit" type="button" data-edit="${esc(item.item_key)}" title="Edit ${esc(item.name)}">${esc(item.name)}</button><div class="mini">${esc(item.item_key)} · ${esc(item.item_type||'')} · ${esc(item.category||'')}</div>${item.subcategory?`<div class="mini">Type: ${esc(item.subcategory)}</div>`:''}${item.preferred_vendor?`<div class="mini">Vendor: ${esc(item.preferred_vendor)}</div>`:''}${item.vendor_sku?`<div class="mini">SKU: ${esc(item.vendor_sku)}</div>`:''}<span class="source-pill ${item._source==='saved'?'saved':'fallback'}">${item._source==='saved'?'Saved DB item':'Bundled fallback — save/import to edit stock'}</span>${item.is_public===false?'<span class="source-pill fallback">Hidden from public</span>':'<span class="source-pill saved">Public</span>'}<div class="mini ${readinessClass(item)}">${esc(readinessLabel(item))}</div></td><td>${esc(item.qty_on_hand)} ${esc(item.unit_label||'')}<div class="mini">RP ${esc(item.reorder_point)} / RQ ${esc(item.reorder_qty)}</div>${item.cost_cents!=null&&Number(item.cost_cents)>0?`<div class="mini">Cost: ${esc((Number(item.cost_cents)/100).toFixed(2))} CAD</div>`:`<div class="mini danger-note">Missing unit cost</div>`}${item.purchase_date?`<div class="mini">Bought: ${esc(String(item.purchase_date).slice(0,10))}</div>`:''}${item.estimated_jobs_per_unit?`<div class="mini">Est. jobs/unit: ${esc(item.estimated_jobs_per_unit)}</div>`:''}</td><td><span class="${itemQualityClass(score)}">${score}%</span><div class="quality-meter"><span style="width:${score}%"></span></div>${item.image_url?`<div class="mini quality-good">Image set${item._image_from_fallback?' · fallback matched':''}</div>`:'<div class="mini quality-bad">Missing image</div>'}${imageDiagnosticsForItem(item)}</td><td>${esc(item.reuse_policy||'reorder')}</td><td><div class="row"><button class="btn ghost" data-edit="${esc(item.item_key)}">Edit</button>${String(item.reuse_policy||'reorder')!=='never_reuse' ? `<button class="btn ghost" data-reorder="${esc(item.item_key)}">Reorder</button>` : `<span class="pill">No reorder</span>`}</div></td></tr>`;
    }).join('') || '<tr><td colspan="6">No inventory items found.</td></tr>';
    document.querySelectorAll('[data-edit]').forEach((btn)=>btn.addEventListener('click',()=>{ const item=inventory.find((x)=>String(x.item_key)===String(btn.dataset.edit)) || null; fillForm(item,{targetKey:item?.item_key||null}); qs('#formName')?.focus({preventScroll:true}); document.querySelector('#itemForm')?.scrollIntoView({behavior:'smooth', block:'start'}); }));
    document.querySelectorAll('[data-reorder]').forEach((btn)=>btn.addEventListener('click', ()=>createReorder(btn.dataset.reorder)));
    qs('#selectVisibleInventory')?.addEventListener('change', (event)=>{ document.querySelectorAll('.inventory-row-check').forEach((box)=>{ box.checked=event.target.checked; }); });
    refreshQualitySummary();
  }
  function renderMovements(){ const q=(qs('#moveSearch').value||'').trim().toLowerCase(); const type=qs('#moveType').value||''; const rows=movements.filter((m)=>!type || String(m.movement_type||'')===type).filter((m)=>!q || `${m.item_key||''} ${m.note||''} ${m.actor_name||''} ${m.booking_id||''}`.toLowerCase().includes(q)); qs('#moveSummary').textContent=`${rows.length} movements shown`; qs('#moveBody').innerHTML=rows.map((m)=>`<tr><td>${esc(new Date(m.created_at||Date.now()).toLocaleString())}<div class="mini">${esc(m.movement_type||'')}</div></td><td><strong>${esc(m.item_key||'')}</strong><div class="mini">${esc(m.item_name||'')}</div></td><td>${esc(m.qty_delta)}<div class="mini">${esc(m.previous_qty)} → ${esc(m.new_qty)}</div></td><td>${m.booking_id?`<div class="mini">Booking: ${esc(m.booking_id)}</div>`:''}<div class="mini">${esc(m.actor_name||'')}</div>${m.note?`<div class="mini">${esc(m.note)}</div>`:''}</td></tr>`).join('') || '<tr><td colspan="4">No movement history found.</td></tr>'; }
  function renderLowStock(){ qs('#lowSummary').textContent=`${lowStock.length} low-stock items`; qs('#lowBody').innerHTML=lowStock.map((item)=>`<tr><td><strong>${esc(item.name)}</strong><div class="mini">${esc(item.item_key)} · ${esc(item.item_type||'')} · ${esc(item.category||'')}</div>${item.subcategory?`<div class="mini">Type: ${esc(item.subcategory)}</div>`:''}</td><td>${esc(item.qty_on_hand)} ${esc(item.unit_label||'')}</td><td>${esc(item.reorder_point)}<div class="mini">Suggested reorder ${esc(item.reorder_qty||1)}</div></td><td><div class="row"><button class="btn ghost" data-edit-low="${esc(item.item_key)}">Edit</button>${String(item.reuse_policy||'reorder')!=='never_reuse'?`<button class="btn ghost" data-low-reorder="${esc(item.item_key)}">Create reorder</button>`:`<span class="pill">No reorder</span>`}</div></td></tr>`).join('') || '<tr><td colspan="4">No low-stock items right now.</td></tr>';
    document.querySelectorAll('[data-edit-low]').forEach((btn)=>btn.addEventListener('click',()=>(()=>{const item=inventory.find((x)=>String(x.item_key)===String(btn.dataset.editLow))||null;fillForm(item,{targetKey:item?.item_key||null});})()));
    document.querySelectorAll('[data-low-reorder]').forEach((btn)=>btn.addEventListener('click', ()=>createReorder(btn.dataset.lowReorder)));
  }
  function makeInventoryKey(value){ return String(value||'inventory_item').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'').slice(0,80) || 'inventory_item'; }
  function normalizeCatalogFallbackItem(row, fallbackType){
    const name=cleanText(row?.name || row?.title || row?.filename || 'Catalog item');
    const sourceType=cleanText(row?.type || fallbackType || row?.source_kind || 'consumable').toLowerCase();
    return {
      item_key: makeInventoryKey(row?.item_key || name || row?.filename),
      item_type: sourceType.includes('gear') || sourceType.includes('tool') || fallbackType==='tool' ? 'tool' : 'consumable',
      name,
      category: cleanText(row?.category || 'general'),
      subcategory: cleanText(row?.subcategory || row?.source_kind || ''),
      preferred_vendor: cleanText(row?.preferred_vendor || ''),
      vendor_sku: cleanText(row?.vendor_sku || ''),
      unit_label: cleanText(row?.unit_label || 'each'),
      qty_on_hand: Number(row?.qty_on_hand ?? 0),
      reorder_point: Number(row?.reorder_point ?? 0),
      reorder_qty: Number(row?.reorder_qty ?? 1),
      cost_cents: row?.cost_cents ?? null,
      rating_value: row?.rating_value ?? null,
      rating_count: row?.rating_count ?? 0,
      sort_key: Number(row?.sort_key ?? 9999),
      purchase_date: row?.purchase_date || '',
      estimated_jobs_per_unit: row?.estimated_jobs_per_unit || '',
      reuse_policy: row?.reuse_policy || 'reorder',
      amazon_url: row?.amazon_url || row?.purchase_url || '',
      image_url: row?.image_url || row?.r2_url || (Array.isArray(row?.img_candidates) ? row.img_candidates[0] : '') || '',
      is_public: row?.is_public !== false,
      is_active: row?.is_active !== false,
      receipt_url: row?.receipt_url || row?.bill_url || '',
      assigned_station: row?.assigned_station || '',
      service_tags: Array.isArray(row?.service_tags) ? row.service_tags.join(', ') : (row?.service_tags || row?.service_link_tags || ''),
      notes: row?.notes || '',
      _source: 'fallback'
    };
  }
  function normalizeMediaLibraryRow(row){
    const url=cleanImageUrl(row?.media_url || row?.image_url || row?.url || row?.public_url || row?.fallback_url);
    if(!url) return null;
    const usage=Array.isArray(row?.usage_contexts) ? row.usage_contexts : [];
    return {
      item_key: cleanText(row?.media_key || row?.key || row?.id || makeInventoryKey(row?.label || row?.alt_text || 'media_library_image')),
      name: cleanText(row?.label || row?.alt_text || row?.caption || row?.media_key || 'Media library image'),
      item_type: cleanText(row?.media_type || 'image'),
      category: cleanText(row?.group_key || row?.group || 'media_library'),
      source_kind: `media library${usage.length ? ` · ${usage.join(', ')}` : ''}`,
      image_url: url,
      media_url: url,
      fallback_url: cleanImageUrl(row?.fallback_url),
      group_key: cleanText(row?.group_key || row?.group || ''),
      _source: 'media library'
    };
  }
  async function fetchMediaLibraryRows(){
    const rows=[];
    try {
      const r=await getJson('/api/admin/media_library_list?usage_context=inventory_item');
      if(r.ok && r.out?.ok && Array.isArray(r.out.media)) rows.push(...r.out.media.map(normalizeMediaLibraryRow).filter(Boolean));
    } catch(err){ console.warn('Could not load DB media library for inventory picker.', err); }
    try {
      const seed=await fetch('/data/media_library_seed.json', { credentials:'include', cache:'no-store' }).then((res)=>res.ok ? res.json() : null).catch(()=>null);
      const groups=Array.isArray(seed?.media_groups) ? seed.media_groups : [];
      groups.filter((group)=>String(group.key||'').toLowerCase().includes('product')).forEach((group)=>{
        if(group.base_url) rows.push(normalizeMediaLibraryRow({ media_key:`${group.key}_folder`, label:`${group.label || group.key} folder`, media_url:group.base_url, group_key:group.key, usage_contexts:['inventory_item'] }));
      });
    } catch(err){ console.warn('Could not load media-library seed.', err); }
    const seen=new Set();
    return rows.filter((row)=>{ const key=imageUrlKey(row?.image_url); if(!key || seen.has(key)) return false; seen.add(key); return true; });
  }
  async function repairSelectedImages(){
    const keys=selectedInventoryKeys();
    if(!keys.length) return show('Select inventory rows first, then use Repair selected images.', 'bad');
    const targets=keys.map((key)=>inventory.find((item)=>String(item.item_key)===String(key))).filter(Boolean);
    let repaired=0, skipped=0, failed=0;
    for(const item of targets){
      const match=findMatchingBundledImageForItem(item);
      const imageUrl=cleanImageUrl(item.image_url) || match?.url || '';
      if(!match?.url && !imageUrl){ skipped++; continue; }
      if(item._source === 'saved' && cleanImageUrl(item.image_url) && !item._image_from_fallback){ skipped++; continue; }
      const payload=makeImportPayload({ ...item, image_url:imageUrl || match.url });
      payload.notes=[payload.notes || '', 'Bulk image repair used matching bundled/media image fallback.'].filter(Boolean).join(' | ');
      const res=await postJson('/api/admin/catalog_inventory_save', payload);
      if(res.ok && res.out?.ok) repaired++; else failed++;
    }
    show(`Image repair finished: ${repaired} repaired/imported, ${skipped} skipped, ${failed} failed.`, failed ? 'bad' : 'ok');
    await loadInventory();
  }
  function checkImageLoad(url){
    return new Promise((resolve)=>{
      const key=imageUrlKey(url);
      if(!key) return resolve({ key, url, ok:false, reason:'blank' });
      const img=new Image();
      const timer=setTimeout(()=>resolve({ key, url, ok:false, reason:'timeout' }), 7000);
      img.onload=()=>{ clearTimeout(timer); resolve({ key, url, ok:true, reason:'loaded' }); };
      img.onerror=()=>{ clearTimeout(timer); resolve({ key, url, ok:false, reason:'error' }); };
      img.src=url;
    });
  }
  async function scanVisibleImages(){
    const rows=applyInventoryFilters(inventory).filter((item)=>cleanImageUrl(item.image_url)).slice(0,100);
    if(!rows.length) return show('No visible inventory images to scan.', 'bad');
    show(`Scanning ${rows.length} visible product images in this browser session…`, '');
    const unique=[...new Map(rows.map((item)=>[imageUrlKey(item.image_url), item.image_url])).values()];
    const results=[];
    for(const url of unique){ results.push(await checkImageLoad(url)); }
    imageHealthRows=results;
    const failed=results.filter((row)=>!row.ok);
    renderInventory();
    refreshQualitySummary();
    show(`Image scan complete: ${results.length} checked, ${failed.length} failed.`, failed.length ? 'bad' : 'ok');
  }
  async function fetchLocalInventoryFallback(){
    const sources=[['/data/rosie_products_catalog.json','consumable'],['/data/systems_catalog.json','tool']];
    const rows=[];
    for (const [url,type] of sources){
      try {
        const res=await fetch(url,{credentials:'include',cache:'no-store'});
        const out=await res.json().catch(()=>[]);
        if(res.ok && Array.isArray(out)) rows.push(...out.map((row)=>normalizeCatalogFallbackItem(row,type)));
      } catch(err){ console.warn('Could not load local inventory fallback', url, err); }
    }
    return rows;
  }
  function mergeInventoryWithFallback(savedRows, fallbackRows){
    const byKey=new Map();
    (Array.isArray(fallbackRows)?fallbackRows:[]).forEach((item)=>{ byKey.set(String(item.item_key), item); });
    (Array.isArray(savedRows)?savedRows:[]).forEach((item)=>{
      const fallback=byKey.get(String(item.item_key)) || null;
      const normalized=Object.assign({}, fallback || {}, item, { _source:'saved' });
      const fallbackImage=collectImageCandidates(fallback || {})[0] || '';
      if(!cleanImageUrl(normalized.image_url) && fallbackImage){
        normalized.image_url=fallbackImage;
        normalized._image_from_fallback=true;
      }
      if(!normalized.service_tags && fallback?.service_tags) normalized.service_tags=fallback.service_tags;
      if(!normalized.assigned_station && fallback?.assigned_station) normalized.assigned_station=fallback.assigned_station;
      byKey.set(String(normalized.item_key), normalized);
    });
    return Array.from(byKey.values()).filter((item)=>item.is_active !== false).sort((a,b)=>Number(a.sort_key||9999)-Number(b.sort_key||9999)||String(a.name||'').localeCompare(String(b.name||'')));
  }
  function computeLowStockItems(rows){ return (Array.isArray(rows)?rows:[]).filter((item)=> item._source !== 'fallback' && String(item.reuse_policy || 'reorder') !== 'never_reuse' && Number(item.qty_on_hand || 0) <= Number(item.reorder_point || 0)); }
  async function loadInventory(){
    hide();
    const [r, fallbackRows, mediaRows] = await Promise.all([getJson('/api/admin/catalog_inventory_list'), fetchLocalInventoryFallback(), fetchMediaLibraryRows()]);
    bundledFallbackItems = Array.isArray(fallbackRows) ? fallbackRows : [];
    mediaLibraryRows = Array.isArray(mediaRows) ? mediaRows : [];
    if(!r.ok||!r.out?.ok){
      inventory=mergeInventoryWithFallback([], fallbackRows);
      renderInventoryDatalists(); fillUsageItems(); renderInventory(); refreshQualitySummary(); lowStock=[]; renderLowStock();
      return show(((r.out&&r.out.error)||'Could not load saved inventory from the database.') + ' Showing bundled gear/consumables fallback so we can still edit and save items.', 'bad');
    }
    savedInventoryItems=Array.isArray(r.out.items)?r.out.items:[];
    inventory=mergeInventoryWithFallback(savedInventoryItems, fallbackRows);
    renderInventoryDatalists(); fillUsageItems(); renderInventory(); refreshQualitySummary();
    lowStock=Array.isArray(r.out.low_stock)&&r.out.low_stock.length ? r.out.low_stock : computeLowStockItems(savedInventoryItems);
    renderLowStock();
  }
  async function loadMovements(){ const r=await getJson('/api/admin/catalog_usage_list'); if(!r.ok||!r.out?.ok){ qs('#moveBody').innerHTML=`<tr><td colspan="4">${(r.out&&r.out.error)||'Could not load movement history.'}</td></tr>`; return; } movements=Array.isArray(r.out.movements)?r.out.movements:[]; renderMovements(); }
  async function loadLowStock(){ const r=await getJson('/api/admin/catalog_low_stock_list'); if(!r.ok||!r.out?.ok){ qs('#lowBody').innerHTML=`<tr><td colspan="4">${(r.out&&r.out.error)||'Could not load low-stock list.'}</td></tr>`; return; } lowStock=Array.isArray(r.out.items)?r.out.items:[]; renderLowStock(); }
  async function loadOrders(){ const status=qs('#orderStatus').value; const url='/api/admin/catalog_purchase_orders_list'+(status?`?status=${encodeURIComponent(status)}`:''); const r=await getJson(url); if(!r.ok||!r.out?.ok){ qs('#orderBody').innerHTML=`<tr><td colspan="4">${(r.out&&r.out.error)||'Could not load orders.'}</td></tr>`; return; } const orders=Array.isArray(r.out.orders)?r.out.orders:[]; const due=Array.isArray(r.out.reminder_due)?r.out.reminder_due:[]; qs('#orderSummary').textContent=`${orders.length} orders · ${due.length} reminders due`; qs('#orderBody').innerHTML=orders.map((po)=>`<tr><td><strong>${esc(po.item_name || po.item_key || 'Order')}</strong><div class="mini">${esc(po.vendor_name || '')} · qty ${esc(po.qty_ordered)}</div>${po.purchase_url?`<div class="mini"><a href="${esc(po.purchase_url)}" target="_blank" rel="noopener">Purchase link</a></div>`:''}</td><td>${esc(po.status)}</td><td>${po.reminder_at ? esc(new Date(po.reminder_at).toLocaleString()) : '<span class="mini">None</span>'}</td><td><div class="row">${['requested','ordered'].includes(po.status) ? `<button class="btn ghost" data-status="ordered" data-id="${po.id}">Mark ordered</button>` : ''}${['requested','ordered'].includes(po.status) ? `<button class="btn ghost" data-status="received" data-id="${po.id}">Mark received</button>` : ''}${po.status !== 'cancelled' && po.status !== 'received' ? `<button class="btn ghost" data-status="cancelled" data-id="${po.id}">Cancel</button>` : ''}</div></td></tr>`).join('') || '<tr><td colspan="4">No purchase orders found.</td></tr>';
    document.querySelectorAll('[data-status]').forEach((btn)=>btn.addEventListener('click', async()=>{ const x=await postJson('/api/admin/catalog_purchase_order_update',{ id: btn.dataset.id, status: btn.dataset.status, note: `Updated from admin catalog by ${actor?.full_name || 'staff'}` }); if(!x.ok||!x.out?.ok) return show((x.out&&x.out.error)||'Could not update order.','bad'); show(`Order moved to ${btn.dataset.status}.` + (x.out?.inventory_updated ? ' Inventory was updated too.' : ''),'ok'); loadInventory(); loadLowStock(); loadOrders(); loadMovements(); }));
  }
  hardenTextInput(qs('#invSearch'),'inventory-query'); hardenTextInput(qs('#moveSearch'),'movement-query');
  setInventoryOptionsEditor(currentInventoryOptions());
  qs('#saveInventoryOptionsBtn')?.addEventListener('click', async ()=>{ const value=readInventoryOptionsEditor(); localStorage.setItem(optionStorageKey, JSON.stringify(value)); setInventoryOptionsEditor(value); renderInventoryDatalists(); const saved=await saveSharedInventoryOptions(value).catch(()=>null); show(saved?.ok && saved?.out?.ok ? 'Inventory dropdown suggestions saved to shared app settings and this browser.' : 'Inventory dropdown suggestions saved in this browser. Shared save was not available.', saved?.ok && saved?.out?.ok ? 'ok' : 'bad'); });
  qs('#resetInventoryOptionsBtn')?.addEventListener('click', ()=>{ localStorage.removeItem(optionStorageKey); setInventoryOptionsEditor(inventoryOptionDefaults()); renderInventoryDatalists(); show('Inventory dropdown suggestions reset to detailing defaults.', 'ok'); });
  qs('#reloadBtn').addEventListener('click', loadInventory); qs('#publishReadinessFilter')?.addEventListener('change', renderInventory); qs('#reloadOrdersBtn').addEventListener('click', loadOrders); qs('#reloadMovesBtn').addEventListener('click', loadMovements); qs('#reloadLowBtn').addEventListener('click', loadLowStock); qs('#itemType').addEventListener('change', renderInventory); qs('#invSearch').addEventListener('input', renderInventory); qs('#invSort').addEventListener('change', renderInventory); qs('#moveSearch').addEventListener('input', renderMovements); qs('#moveType').addEventListener('change', renderMovements); qs('#orderStatus').addEventListener('change', loadOrders); qs('#newItemBtn').addEventListener('click', ()=>fillForm(null)); qs('#clearFormBtn').addEventListener('click', ()=>fillForm(null)); qs('#usageResetBtn').addEventListener('click', ()=>{ qs('#usageBookingId').value=''; qs('#usageItemKey').value=''; qs('#usageQty').value='1'; qs('#usageNote').value=''; });
  

  async function importSupplierLinkPreview(){
    const url=qs('#supplierLinkUrl')?.value.trim()||qs('#formAmazon')?.value.trim(),out=qs('#supplierLinkResult'),button=qs('#supplierLinkPreviewBtn');
    if(!url){ show('Paste an Amazon product link in the supplier box or Amazon / purchase URL field first.','bad'); return; }
    if(qs('#supplierLinkUrl')&&!qs('#supplierLinkUrl').value.trim())qs('#supplierLinkUrl').value=url;
    if(button){button.disabled=true;button.textContent='Reading…';}
    if(out){ out.style.display='block'; out.className='notice'; out.textContent='Resolving the Amazon link and reading supplier product details. Nothing is being saved yet…'; }
    try{
      const res=await postJson('/api/admin/catalog_supplier_link_preview',{url,target_item_key:editorTargetKey||null});
      if(!res.ok||!res.out?.ok){const msg=[res.out?.error||'Could not read that supplier link.',res.out?.detail||''].filter(Boolean).join(' ');if(out){out.className='notice bad';out.textContent=msg;}return;}
      const d=res.out.draft||{},duplicate=res.out.duplicate||null;
      let target=editorTargetKey ? inventory.find((x)=>String(x.item_key)===String(editorTargetKey)) || editorSnapshot : null;
      if(!target && duplicate?.item_key){target=inventory.find((x)=>String(x.item_key)===String(duplicate.item_key))||duplicate;editorTargetKey=String(duplicate.item_key);editorSnapshot=structuredClone(target);}
      const before=target?structuredClone(target):{},merged=mergeSupplierDraft(target,d),diff=supplierDiff(before,merged);
      fillForm(merged,{targetKey:target?.item_key||null});
      if(qs('#supplierLinkUrl'))qs('#supplierLinkUrl').value=d.amazon_url||url;
      if(qs('#formAmazon'))qs('#formAmazon').value=d.amazon_url||url;
      const ex=res.out.extracted||{},observed=d.source_price==null?'Price not extracted':`${d.source_currency||'currency'} ${Number(d.source_price).toFixed(2)} observed`,quality=[ex.title?'title':'',ex.image?'image':'',ex.price?'price':'',ex.brand?'brand':''].filter(Boolean).join(', ')||'URL/ASIN only';
      const mode=target?`Repair staged for ${target.name||target.item_key} (${target.item_key}).`:`New private review draft staged as ${d.item_key}.`;
      const protectedMsg=target?'Stock, reorder settings, purchase/receipt history, station, service tags, gallery, ratings, visibility and active state were preserved.':'This is a new item; verify stock and all operational fields before saving.';
      const diffHtml=diff.length?`<div class="supplier-diff"><strong>Staged field changes (${diff.length})</strong>${diff.map(row=>`<div class="supplier-diff-row"><strong>${esc(row.label)}</strong><div><span class="mini">Before: ${esc(row.before||'—')}</span><br><span>After: ${esc(row.after||'—')}</span></div></div>`).join('')}</div>`:'<div class="mini" style="margin-top:8px">No selected supplier field differs from the current editor values.</div>';
      const warning=[res.out.warning||'',d.source_currency&&d.source_currency!=='CAD'?'Observed non-CAD price did not overwrite the current CAD cost.':'',observed,`Metadata available: ${quality}.`].filter(Boolean).join(' ');
      if(out){out.className='notice '+(warning?'':'ok');out.innerHTML=`<strong>${esc(mode)}</strong><div class="mini" style="margin-top:6px">${esc(protectedMsg)} ${esc(warning)} Review the staged values, then press Save inventory item to commit them.</div>${diffHtml}${d.image_url?`<div class="row" style="margin-top:8px;align-items:center"><img src="${esc(d.image_url)}" alt="Imported supplier product preview" style="width:72px;height:72px;object-fit:contain;border-radius:10px;background:#fff" loading="lazy" referrerpolicy="no-referrer"><span class="mini">Supplier image staged only if Featured image is selected above.</span></div>`:''}`;}
      document.querySelector('#itemForm')?.scrollIntoView({behavior:'smooth',block:'start'});
    } finally {if(button){button.disabled=false;button.textContent='Review Amazon update';}}
  }
  qs('#loadAmazonMatchesBtn')?.addEventListener('click', loadAmazonMatches);
  qs('#amazonMatchStatusFilter')?.addEventListener('change', ()=>renderAmazonMatches());
  qs('#toggleAmazonChecks')?.addEventListener('change', (event)=>{ document.querySelectorAll('.amazon-row-check:not(:disabled)').forEach((box)=>{ box.checked=event.target.checked; }); });
  qs('#importAmazonMatchesBtn')?.addEventListener('click', importSelectedAmazonMatches);
  qs('#previewCatalogImportBtn')?.addEventListener('click', renderImportPreview);
  qs('#runCatalogImportBtn')?.addEventListener('click', importSelectedCatalogRows);
  qs('#toggleImportChecks')?.addEventListener('change', (event)=>{ document.querySelectorAll('.import-row-check').forEach((box)=>{ box.checked=event.target.checked; }); });
  qs('#bulkPublicPreviewBtn')?.addEventListener('click', ()=>bulkSetVisibility({ is_public:true },{dryRun:true}));
  qs('#bulkPublicBtn')?.addEventListener('click', ()=>{ if(confirm('Publish the selected rows only if every row passes readiness?')) bulkSetVisibility({ is_public:true },{dryRun:false}); });
  qs('#bulkPrivateBtn')?.addEventListener('click', ()=>bulkSetVisibility({ is_public:false }));
  qs('#bulkActiveBtn')?.addEventListener('click', ()=>bulkSetVisibility({ is_active:true }));
  qs('#bulkInactiveBtn')?.addEventListener('click', ()=>bulkSetVisibility({ is_active:false }));
  qs('#bulkRepairImagesBtn')?.addEventListener('click', repairSelectedImages);
  qs('#scanImageHealthBtn')?.addEventListener('click', scanVisibleImages);
  qs('#quickStockBtn')?.addEventListener('click', applyQuickStock);
  qs('#formImage')?.addEventListener('input', updateImagePreview);
  qs('#formItemKey')?.addEventListener('input', updateImagePreview);
  qs('#formName')?.addEventListener('input', updateImagePreview);
  qs('#imagePickerSearch')?.addEventListener('input', renderImagePicker);
  qs('#openImagePickerBtn')?.addEventListener('click', ()=>{ const box=qs('#inventoryImagePicker'); if(!box) return; box.style.display = box.style.display === 'block' ? 'none' : 'block'; renderImagePicker(); });
  qs('#useMatchingImageBtn')?.addEventListener('click', ()=>{ const match=findMatchingBundledImage(); if(!match) return show('No matching bundled image was found for this item key/name. Open the picker and search manually.', 'bad'); qs('#formImage').value=match.url; updateImagePreview(); show(`Loaded the bundled image for ${match.item?.name || match.item?.item_key || 'this item'}. Save to keep it on the DB row.`, 'ok'); });
  qs('#clearImageBtn')?.addEventListener('click', ()=>{ qs('#formImage').value=''; updateImagePreview(); show('Image cleared from the editor. Save only if this item should have no image.', 'bad'); });
  qs('#supplierLinkPreviewBtn')?.addEventListener('click', importSupplierLinkPreview);
  qs('#supplierUseEditorLinkBtn')?.addEventListener('click',()=>{const url=qs('#formAmazon')?.value.trim();if(!url)return show('The editor Amazon / purchase URL field is blank. Paste a link there or in the supplier box.','bad');qs('#supplierLinkUrl').value=url;importSupplierLinkPreview();});
  qs('#supplierLinkUrl')?.addEventListener('keydown',(e)=>{if(e.key==='Enter'){e.preventDefault();importSupplierLinkPreview();}});
  qs('#copyFeaturedToGalleryBtn')?.addEventListener('click',()=>{ const url=cleanImageUrl(qs('#formImage')?.value); if(!url) return show('Choose a featured image first.', 'bad'); const values=galleryValues(); if(values.includes(url)) return show('The featured image is already in the gallery.', 'bad'); if(values.length>=7) return show('The gallery already has seven images.', 'bad'); values.push(url); renderGalleryEditor(values); show('Featured image copied into the gallery. Save the inventory item to keep it.', 'ok'); });
  qs('#clearGalleryBtn')?.addEventListener('click',()=>{ if(confirm('Clear all seven gallery image slots for this editor?')) renderGalleryEditor([]); });
  qs('#amazonParseBtn').addEventListener('click', ()=>{const url=qs('#formAmazon')?.value.trim();if(!url)return show('Paste the accurate Amazon link in the Amazon / purchase URL field first.','bad');qs('#supplierLinkUrl').value=url;importSupplierLinkPreview();});
  qs('#itemForm').addEventListener('submit', async(e)=>{
    e.preventDefault();
    const payload={ item_key: editorTargetKey || qs('#formItemKey').value.trim(), item_type: qs('#formItemType').value, name: qs('#formName').value.trim(), category: qs('#formCategory').value.trim(), subcategory: qs('#formSubcategory').value.trim(), description:qs('#formDescription').value.trim(), preferred_vendor: qs('#formVendor').value.trim(), vendor_sku: qs('#formVendorSku').value.trim(), unit_label: qs('#formUnit').value.trim(), qty_on_hand: Number(qs('#formQty').value||0), reorder_point: Number(qs('#formReorderPoint').value||0), reorder_qty: Number(qs('#formReorderQty').value||0), cost_cad: qs('#formCostCad').value === '' ? null : Number(qs('#formCostCad').value||0), rating_value: qs('#formRating').value, rating_count: Number(qs('#formRatingCount').value||0), sort_key: Number(qs('#formSortKey').value||0), purchase_date: qs('#formPurchaseDate').value || null, estimated_jobs_per_unit: Number(qs('#formEstimatedJobs').value||0), reuse_policy: qs('#formReuse').value, amazon_url: qs('#formAmazon').value.trim(), image_url: qs('#formImage').value.trim() || (findMatchingBundledImage()?.url || ''), gallery_image_urls: galleryValues(), receipt_url: qs('#formReceiptUrl').value.trim(), assigned_station: qs('#formAssignedStation').value.trim(), service_tags: qs('#formServiceTags').value.trim(), is_public: qs('#formIsPublic').checked, is_active: qs('#formIsActive').checked, notes: qs('#formNotes').value.trim(), ...supplierMetaState };
    const x=await postJson('/api/admin/catalog_inventory_save', payload);
    if(!x.ok||!x.out?.ok){const r=x.out?.publish_readiness;const detail=r?.blockers?.length?` ${r.blockers.join(' ')}`:'';return show(((x.out&&x.out.error)||'Could not save inventory item.')+detail,'bad');}
    const saved=x.out.item||payload;show(editorTargetKey?`Existing inventory item ${editorTargetKey} updated.`:'New inventory item saved.','ok');fillForm(saved,{targetKey:saved.item_key});await loadInventory();loadLowStock();
  });
  qs('#usageForm').addEventListener('submit', async(e)=>{ e.preventDefault(); const button=e.submitter||qs('#usageForm button[type="submit"]'); if(button)button.disabled=true; const payload={ booking_id: qs('#usageBookingId').value.trim(), item_key: qs('#usageItemKey').value, qty_used: Number(qs('#usageQty').value||0), note: qs('#usageNote').value.trim(), client_action_id: usageActionId }; try{ const x=await postJson('/api/admin/catalog_usage_add', payload); if(!x.ok||!x.out?.ok) return show((x.out&&x.out.error)||'Could not record usage. Retry uses the same transaction key to prevent a duplicate deduction.','bad'); usageActionId=crypto.randomUUID(); show('Inventory usage recorded.','ok'); qs('#usageQty').value='1'; qs('#usageNote').value=''; loadInventory(); loadLowStock(); loadMovements(); } finally { if(button)button.disabled=false; } });
  window.AdminShell.boot({ pageKey:'admin-catalog', onReady: async ({actor:current}) => { actor=current||null; const box=qs('#actorBox'); if(actor){ box.style.display='block'; box.textContent=`Signed in as ${actor.full_name || actor.email || 'staff'} (${actor.role_code || 'staff'})`; } await loadSharedInventoryOptions(); fillForm(null); await loadInventory(); const requested=new URLSearchParams(location.search).get('item'); if(requested){const item=inventory.find((x)=>String(x.item_key)===String(requested)); if(item){fillForm(item,{targetKey:item.item_key});qs('#supplierLinkHeading')?.scrollIntoView({behavior:'smooth',block:'start'});show(`Loaded ${item.name||item.item_key} for supplier-link repair. Paste or review its Amazon link before saving changes.`,'ok');}else show(`Inventory item ${requested} was not found in the current live/fallback list.`,'bad');} loadMovements(); loadLowStock(); loadOrders(); } });
})();
