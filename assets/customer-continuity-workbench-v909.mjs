// Rosie 909: private account continuity. No cached PII, payment URL or auto acceptance.
const section=document.getElementById('build909Continuity');
const node=id=>document.getElementById(id);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=x=>new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD'}).format(Number(x||0)/100);
const stamp=x=>x&&Number.isFinite(Date.parse(x))?new Date(x).toLocaleDateString('en-CA'):'Not recorded';
const setStatus=(value,bad=false)=>{const el=node('build909Status');el.textContent=value;el.className=bad?'notice bad':'notice';};
let quoted=[];
function render(data){
 const plans=data.plans||{},root=node('build909Plans');
 root.replaceChildren();
 for(const mode of ['smart','manual']){
  const p=plans[mode],a=document.createElement('article');a.className='panel-lite';
  const title=document.createElement('strong');title.textContent=mode==='smart'?'Smart Wizard':'Manual / Custom';
  const desc=document.createElement('p');desc.className='muted';
  desc.textContent=p?'Saved '+stamp(p.updated_at)+' · vehicle '+p.size+' · current quote and availability NOT reserved':
   'No account choices saved for this mode.';
  const link=document.createElement('a');link.className='btn small ghost';
  link.href=mode==='smart'?'/book-smart':'/book-custom';
  link.textContent=p?'Open and explicitly restore choices':'Open '+(mode==='smart'?'Smart Wizard':'Manual booking');
  a.append(title,desc,link);root.append(a);
 }
 quoted=data.quotes||[];
 node('build909Quotes').innerHTML=quoted.length?quoted.map((q,i)=>{
  const s=q.terms;
  const parts=s?'<p>Package '+esc(s.package_code)+' · '+esc(s.vehicle_size)+' · CAD '+esc(money(s.total_cents))+
   ' · deposit '+esc(money(s.deposit_cents))+'</p><p class="muted">Expires: '+esc(stamp(s.expires_at))+
   ' · Extras: '+esc((s.addon_codes||[]).join(', ')||'None')+'</p>':'';
  return '<article class="panel-lite"><strong>'+esc(q.title)+'</strong>'+parts+
   '<p class="muted">'+esc(q.reason)+'</p>'+
   (q.acceptance_ready?'<label class="checkbox"><input type="checkbox" data-quote-confirm="'+i+'"><span>I accept these exact quote terms. I understand that booking and payment are separate.</span></label>'+
    '<button type="button" class="btn small primary" data-quote-accept="'+i+'" disabled>Accept reviewed quote</button>':
    (q.terms&&!q.reviewed?'<p><a href="#build908Work">Record a review receipt for this exact quote first.</a></p>':''))+
   '</article>';
 }).join(''):'<p class="muted">No staff-sent quotes are linked to this verified account yet.</p>';
 const timeline=data.media_timeline||[];
 node('build909Timeline').innerHTML=timeline.length?timeline.map(t=>'<article class="panel-lite"><strong>'+
  esc(t.media_type==='video'?'Private video verified':'Private photo verified')+'</strong><p>'+
  esc(t.context==='booking'?'Booking: ':'Quote: ')+esc(t.context_label)+'</p>'+
  '<p class="muted">Verified '+esc(stamp(t.at))+' · Staff publication approval NOT granted by this event</p></article>').join(''):
  '<p class="muted">No original verified and linked private upload events are available in this account yet.</p>';
}
async function reload(){
 if(!section)return;
 setStatus('Checking original account records…');
 for(const id of ['build909Plans','build909Quotes','build909Timeline'])node(id).replaceChildren();
 try{
  const response=await fetch('/api/client/booking_continuity_v909',{credentials:'same-origin',cache:'no-store'});
  const body=await response.json().catch(()=>null);
  if(!response.ok||!body?.ok)throw Error(body?.error||'Sign in to review account continuity.');
  render(body);setStatus(body.email_verified?'Account-owned choices and verified quote/media summaries loaded.':
    'Verify your email to view and accept staff-sent quotes. You can save service choices now.');
 }catch(error){quoted=[];setStatus(error.message||'Customer source unavailable.',true);}
}
section?.addEventListener('change',e=>{
 const b=e.target.closest('input[data-quote-confirm]');if(!b)return;
 const btn=section.querySelector('button[data-quote-accept="'+b.dataset.quoteConfirm+'"]');
 if(btn)btn.disabled=!b.checked;
});
section?.addEventListener('click',async e=>{
 const btn=e.target.closest('button[data-quote-accept]');
 if(!btn)return;
 const quote=quoted[Number(btn.dataset.quoteAccept)];
 if(!quote?.acceptance_ready)return;
 const confirmBox=section.querySelector('input[data-quote-confirm="'+btn.dataset.quoteAccept+'"]');
 if(!confirmBox?.checked)return;
 btn.disabled=true;setStatus('Verifying source quote version and recording explicit acceptance…');
 try{
  const response=await fetch('/api/client/booking_continuity_v909',{
   credentials:'same-origin',method:'POST',cache:'no-store',
   headers:{'Content-Type':'application/json'},body:JSON.stringify({
    action:'accept_quote',quote_id:quote.id,revision:quote.revision,
    terms_hash:quote.terms_hash,confirmed:true})});
  const data=await response.json().catch(()=>null);
  if(!response.ok||data?.accepted!==true)throw Error(data?.error||'Quote was not accepted.');
  await reload();setStatus('Quote acceptance verified. This did not create a booking, charge or message.');
 }catch(error){btn.disabled=false;setStatus(error.message||'Quote acceptance unavailable; review again.',true);}
});
if(section)reload();
