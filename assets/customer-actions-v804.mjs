// Build 804: client-side navigation for existing protected self-service tools.
// No customer record, token, payment or consent is read or changed here.
export const ACCOUNT_ACTIONS_804=Object.freeze([
  {label:'Update contact details',id:'accountProfile804'},
  {label:'See bookings',id:'accountBookings804'},
  {label:'Request an appointment change',id:'build742History'},
  {label:'Manage communication choices',id:'build743CustomerCommunication'},
  {label:'Rebook or ask about maintenance',id:'build744CustomerFollowup'},
  {label:'Manage garage vehicles',id:'accountGarage804'},
  {label:'View gifts',id:'accountGifts804'},
  {label:'Leave a review',id:'accountReviews804'}
]);
export function filterAccountActions804(query,actions=ACCOUNT_ACTIONS_804){
  const term=String(query||'').trim().toLocaleLowerCase();
  return actions.filter(item=>!term||item.label.toLocaleLowerCase().includes(term));
}
export function initCustomerActions804(doc=document){
  const main=doc.querySelector('main.container');
  if(!main||doc.getElementById('accountActions804'))return false;
  // Give established account sections stable, local-only jump targets.
  for(const [headingText,id] of [
    ['Vehicle garage','accountGarage804'],
    ['Gift certificates on file','accountGifts804'],
    ['Reviews','accountReviews804']]){
    const heading=[...main.querySelectorAll('h2')]
      .find(node=>node.textContent.trim()===headingText);
    const host=heading?.closest('.section')||heading?.closest('.panel');
    if(host&&!doc.getElementById(id))host.id=id;
  }
  const section=doc.createElement('section');section.id='accountActions804';
  section.className='section rd-customer-actions-804';
  const card=doc.createElement('div');card.className='panel';
  const title=doc.createElement('h2');title.textContent='What would you like to do?';
  const label=doc.createElement('label');label.htmlFor='accountTaskSearch804';
  label.textContent='Find an account task';
  const search=doc.createElement('input');search.type='search';
  search.id='accountTaskSearch804';search.autocomplete='off';
  search.placeholder='Bookings, vehicles, receipts, changes…';
  label.appendChild(search);
  const nav=doc.createElement('nav');nav.className='rd-account-action-grid-804';
  nav.setAttribute('aria-label','Account shortcuts');
  const rows=ACCOUNT_ACTIONS_804.map(action=>{
    const a=doc.createElement('a');a.href=`#${action.id}`;a.className='btn ghost';
    a.textContent=action.label;
    a.addEventListener('click',()=>{
      const section=doc.getElementById(action.id);
      const heading=section?.querySelector('h2,h3');
      if(heading){heading.tabIndex=-1;setTimeout(()=>heading.focus({preventScroll:true}),0);}
    });
    nav.appendChild(a);return {action,node:a};
  });
  const status=doc.createElement('p');status.className='muted mini';
  status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  function render(){
    const shown=new Set(filterAccountActions804(search.value).map(action=>action.id));
    rows.forEach(row=>{row.node.hidden=!shown.has(row.action.id);});
    status.textContent=`${shown.size} of ${rows.length} account actions available`;
  }
  search.addEventListener('input',render);
  card.append(title,label,nav,status);section.appendChild(card);
  main.insertBefore(section,main.children[1]||null);
  render();return true;
}
if(typeof document!=='undefined'){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>initCustomerActions804(),{once:true});
  else initCustomerActions804();
}
