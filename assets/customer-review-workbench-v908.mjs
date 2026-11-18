// Build 908. Customer-safe readback: no private media, payment URLs or browser-stored PII.
const root=document.getElementById('build908Work');
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=s=>/^\d{4}-\d{2}-\d{2}/.test(String(s||''))?String(s).slice(0,10):'Date not recorded';
const human=s=>String(s||'').replace(/[_-]+/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
const status=(text,fail=false)=>{const el=$('build908Status');el.textContent=text;el.className=fail?'notice bad':'notice';};
let targets=[];
function draw(data){
 const bookings=data.history||[];
 $('build908Bookings').innerHTML=bookings.length?bookings.map(b=>
  '<article class="panel-lite"><strong>'+esc(human(b.package_code||'Detailing'))+'</strong>'+
  '<p>Service '+esc(date(b.service_date))+' · '+esc(b.start_slot||'Time pending')+'</p>'+
  '<p class="muted">Status: '+esc(human(b.job_status||b.status||'Pending'))+'</p>'+
  '<p class="muted">A prior checkout is not automatically reopened. Recheck current availability and price.</p></article>').join(''):
  '<p class="muted">No saved bookings are linked to this account yet.</p>';
 targets=data.review_targets||[];
 $('build908Reviews').innerHTML=targets.length?targets.map((t,i)=>{
  const title=t.kind==='quote'?'Staff-sent quote':t.kind==='media_quote'?'Verified media for sent quote':'Verified media for booking';
  const detail=t.kind==='quote'
   ?esc(t.summary.title||'Detailing quote')+' · sent '+esc(date(t.summary.sent_at))
   :esc(String(t.summary.count))+' private verified upload(s) · '+esc(String(t.summary.images))+' image(s), '+esc(String(t.summary.videos))+' video(s)';
  return '<article class="panel-lite"><strong>'+title+'</strong><p>'+detail+'</p>'+
   (t.reviewed?'<p class="muted">Review receipt recorded for this exact version.</p>':
   '<button type="button" class="btn small" data-build908-review="'+i+'">I reviewed this summary</button>')+
   '<p class="muted">No approval, public media release or charge.</p></article>';
 }).join(''):'<p class="muted">No staff-sent quotes or verified private-media summaries to review yet.</p>';
}
async function load(){
 if(!root)return;
 $('build908Bookings').replaceChildren();$('build908Reviews').replaceChildren();
 status('Loading your signed-in Rosie records…');
 try{
  const res=await fetch('/api/client/booking_reviews_v908',{credentials:'same-origin',cache:'no-store'});
  const data=await res.json().catch(()=>null);
  if(!res.ok||!data?.ok)throw Error(res.status===401?'Sign in to see your saved bookings and review receipts.':data?.error||'Account history unavailable.');
  draw(data);
  status(data.policy?.email_verification_required?'Only profile-owned bookings are shown until your account email is verified.':'Account-owned history loaded. Review receipts do not approve anything.');
 }catch(e){targets=[];status(e.message||'Account history unavailable.',true);}
}
root?.addEventListener('click',async e=>{
 const btn=e.target.closest('button[data-build908-review]');
 if(!btn)return;
 const item=targets[Number(btn.dataset.build908Review)];
 if(!item||item.reviewed)return;
 btn.disabled=true;status('Recording your explicit review of this source version…');
 try{
  const res=await fetch('/api/client/booking_reviews_v908',{method:'POST',credentials:'same-origin',cache:'no-store',
   headers:{'Content-Type':'application/json'},body:JSON.stringify({
    kind:item.kind,subject_id:item.subject_id,revision:item.revision,acknowledged:true})});
  const data=await res.json().catch(()=>null);
  if(!res.ok||data?.reviewed!==true)throw Error(data?.error||'Review not recorded.');
  await load();
 }catch(err){btn.disabled=false;status(err.message||'Unable to confirm review.',true);}
});
if(root)load();
