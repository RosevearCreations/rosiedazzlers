// Build 800: Search only menu entries already rendered for the authenticated actor.
// This never obtains or reveals a route, role or permission on its own.
export function findAuthorizedTools800(items, query) {
  const term=String(query||'').trim().toLocaleLowerCase();
  return items.filter(item=>!term||String(item.label||'').toLocaleLowerCase().includes(term));
}

export function initAdminWorkspace800(doc=document) {
  const menu=doc.querySelector('.admin-module-menu');
  const bar=doc.querySelector('.admin-return-bar');
  if(!menu||!bar||doc.getElementById('adminQuickFind800'))return false;
  // Capture only navigation entries that are visible after role-based rendering.
  const items=[...menu.querySelectorAll('.admin-module-menu__item')]
    .filter(node=>!node.hidden&&getComputedStyle(node).display!=='none')
    .map(node=>({node,label:node.textContent||''}));
  if(!items.length)return false;
  const wrap=doc.createElement('div');
  wrap.className='rd-admin-find-800';
  const label=doc.createElement('label');
  label.htmlFor='adminQuickFind800';label.textContent='Find a tool';
  const input=doc.createElement('input');
  input.type='search';input.id='adminQuickFind800';
  input.placeholder='Filter available tools';input.autocomplete='off';
  const count=doc.createElement('span');
  count.className='rd-admin-find-count-800';count.setAttribute('role','status');
  count.setAttribute('aria-live','polite');
  const clear=doc.createElement('button');
  clear.type='button';clear.className='btn ghost small';clear.textContent='Clear';
  function render(){
    const matching=new Set(findAuthorizedTools800(items,input.value).map(row=>row.node));
    for(const item of items)item.node.hidden=!matching.has(item.node);
    count.textContent=`${matching.size} of ${items.length} available tools shown`;
    clear.disabled=!input.value;
  }
  input.addEventListener('input',render);
  clear.addEventListener('click',()=>{input.value='';render();input.focus();});
  doc.addEventListener('keydown',event=>{
    const target=event.target;
    const editing=target?.matches?.('input,textarea,select,[contenteditable="true"]');
    if(event.key==='/'&&!editing&&!event.altKey&&!event.ctrlKey&&!event.metaKey){
      event.preventDefault();input.focus();
    }else if(event.key==='Escape'&&doc.activeElement===input){
      input.value='';render();input.blur();
    }
  });
  label.appendChild(input);wrap.append(label,clear,count);bar.appendChild(wrap);
  render();return true;
}
