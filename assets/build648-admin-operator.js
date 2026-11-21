/* Build 648 — client-side discovery only. Auth & API permission checks remain server-owned. */
(() => {
  // Build 917 — approved static decorative artwork; never customer proof.
  const ADMIN_ART_917 = Object.freeze({
    "Bookings": "/assets/themes/standard/admin/workspaces-917/bookings.svg",
    "Leads & Photo Estimates": "/assets/themes/standard/admin/workspaces-917/leads-photo-estimates.svg",
    "Conversion Draft Review": "/assets/themes/standard/admin/workspaces-917/conversion-draft-review.svg",
    "Payments & Webhooks": "/assets/themes/standard/admin/workspaces-917/payments-webhooks.svg",
    "Media Health": "/assets/themes/standard/admin/workspaces-917/media-health.svg",
    "Photo Management Studio": "/assets/themes/standard/admin/workspaces-917/photo-management-studio.svg",
    "DAIP Test Lab": "/assets/themes/standard/admin/workspaces-917/daip-test-lab.svg",
    "DAIP Blueprint Review": "/assets/themes/standard/admin/workspaces-917/daip-blueprint-review.svg",
    "Water Restriction Rules": "/assets/themes/standard/admin/workspaces-917/water-restriction-rules.svg",
    "Security Posture": "/assets/themes/standard/admin/workspaces-917/security-posture.svg",
    "Gallery Approvals": "/assets/themes/standard/admin/workspaces-917/gallery-approvals.svg",
    "Quote Pipeline": "/assets/themes/standard/admin/workspaces-917/quote-pipeline.svg",
    "Value-Added Operations": "/assets/themes/standard/admin/workspaces-917/value-added-operations.svg",
    "Workflow Command Center": "/assets/themes/standard/admin/workspaces-917/workflow-command-center.svg",
    "UI & SEO Health": "/assets/themes/standard/admin/workspaces-917/ui-seo-health.svg",
    "Production Readiness": "/assets/themes/standard/admin/workspaces-917/production-readiness.svg",
    "Today Needs Attention": "/assets/themes/standard/admin/workspaces-917/today-needs-attention.svg",
    "Live Detail Interaction": "/assets/themes/standard/admin/workspaces-917/live-detail-interaction.svg",
    "Docs & Sanity Center": "/assets/themes/standard/admin/workspaces-917/docs-sanity-center.svg",
    "Sanity Check & Value Roadmap": "/assets/themes/standard/admin/workspaces-917/sanity-check-value-roadmap.svg",
    "HST/GST Review": "/assets/themes/standard/admin/workspaces-917/hst-gst-review.svg",
    "Month-End Close": "/assets/themes/standard/admin/workspaces-917/month-end-close.svg",
    "Incident Reports": "/assets/themes/standard/admin/workspaces-917/incident-reports.svg",
    "Marketing Tracker": "/assets/themes/standard/admin/workspaces-917/marketing-tracker.svg",
    "Local SEO Tasks": "/assets/themes/standard/admin/workspaces-917/local-seo-tasks.svg",
    "Content Center": "/assets/themes/standard/admin/workspaces-917/content-center.svg",
    "Blocks": "/assets/themes/standard/admin/workspaces-917/blocks.svg",
    "Progress": "/assets/themes/standard/admin/workspaces-917/progress.svg",
    "Social Queue": "/assets/themes/standard/admin/workspaces-917/social-queue.svg",
    "Job Site": "/assets/themes/standard/admin/workspaces-917/job-site.svg",
    "Live Monitor": "/assets/themes/standard/admin/workspaces-917/live-monitor.svg",
    "Staff": "/assets/themes/standard/admin/workspaces-917/staff.svg",
    "Follow-Up Workload Command": "/assets/themes/standard/admin/workspaces-917/follow-up-workload-command.svg",
    "Crew Time & Payroll": "/assets/themes/standard/admin/workspaces-917/crew-time-payroll.svg",
    "Analytics": "/assets/themes/standard/admin/workspaces-917/analytics.svg",
    "Inventory": "/assets/themes/standard/admin/workspaces-917/inventory.svg",
    "Launch Readiness": "/assets/themes/standard/admin/workspaces-917/launch-readiness.svg",
    "Accounting": "/assets/themes/standard/admin/workspaces-917/accounting.svg",
    "Promos": "/assets/themes/standard/admin/workspaces-917/promos.svg",
    "App Management": "/assets/themes/standard/admin/workspaces-917/app-management.svg"
});
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
    cards.forEach(card=>{
      card.classList.add('admin-workspace-card');
      card.dataset.workspace=cardCategory(card);
      const title=card.querySelector('h3')?.textContent?.trim();
      const src=ADMIN_ART_917[title];
      if(src && !card.querySelector('.admin-workspace-art-917')){
        const img=document.createElement('img');
        img.className='admin-workspace-art-917';
        img.src=src+'?v=917';
        img.alt=''; // Decorative only; never substitute actual customer media or consent evidence.
        img.setAttribute('aria-hidden','true');
        img.loading='lazy';img.decoding='async';img.width=640;img.height=360;
        card.insertBefore(img,card.firstChild);
      }
    });
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
