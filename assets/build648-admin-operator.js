/* Build 648 — client-side discovery only. Auth & API permission checks remain server-owned. */
(() => {
  function boot(){
    const cards=[...document.querySelectorAll('#adminWorkspaceCards > article.card')];
    const search=document.getElementById('adminToolSearch');
    const category=document.getElementById('adminToolCategory');
    const clear=document.getElementById('adminToolClear');
    const count=document.getElementById('adminToolCount');
    if(!cards.length||!search||!category||!clear||!count)return;
    const groups={
      customers:/booking|lead|conversion|quote|customer|retention|review/i,
      finance:/payment|webhook|hst|gst|close|accounting|payroll|invoice|refund/i,
      media:/photo|media|gallery|content|seo|marketing|promo|social|visual|ui|website/i,
      operations:/job|staff|incident|inventory|water|blocks|progress|live detail|today|fleet/i
    };
    function cardCategory(card){
      const heading=card.querySelector('h3')?.textContent||'';
      for(const [name,regex] of Object.entries(groups))if(regex.test(heading))return name;
      return 'systems';
    }
    cards.forEach(card=>{card.classList.add('admin-workspace-card');card.dataset.workspace=cardCategory(card)});
    function filter(){
      const query=search.value.trim().toLocaleLowerCase();
      const group=category.value;
      let shown=0;
      for(const card of cards){
        const matchesText=!query||card.textContent.toLocaleLowerCase().includes(query);
        const matchesGroup=group==='all'||card.dataset.workspace===group;
        const navigator=window.RosieAdminNavigation733;
        const href=[...card.querySelectorAll('a[href]')].map(link=>link.getAttribute('href')).find(value=>navigator?.isFavorite?.(value))||null;
        const matchesFavorites=!navigator?.favoritesOnly||Boolean(href);
        card.hidden=!(matchesText&&matchesGroup&&matchesFavorites);
        if(!card.hidden)shown++;
      }
      count.textContent=`${shown} of ${cards.length} tools shown.`+(shown?'':' Try another search or clear filters.');
    }
    search.addEventListener('input',filter);
    category.addEventListener('change',filter);
    window.addEventListener('rosie:admin-filter-733',filter);
    clear.addEventListener('click',()=>{search.value='';category.value='all';filter();search.focus()});
    filter();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
