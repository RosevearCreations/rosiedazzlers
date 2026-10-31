// An accessible, no-polling navigator for existing real-source Admin views.
(() => {
  const body=document.body;
  const route=window.location.pathname.replace(/\/$/,'').replace(/\/index\.html$/,'')||'/';
  const routes={'/admin.html':'management','/admin':'management','/admin-operations.html':'operations',
    '/admin-analytics.html':'statistics','/admin-analytics':'statistics',
    '/admin-runtime-health.html':'it','/admin-runtime-health':'it',
    '/admin-system-health.html':'status',
    '/admin-followup-workload.html':'workload','/admin-followup-workload':'workload'};
  const kind=body.dataset.command712||routes[route];
  if(!kind)return;
  body.dataset.command712=kind;
  const main=document.querySelector('main');
  if(!main)return;
  const target=main.querySelector(':scope > [data-admin-shell-ready]')||main;
  const pages=[
    ['management','/admin.html','Management','▦'],
    ['workload','/admin-followup-workload.html','Follow-Ups','⇄'],
    ['operations','/admin-operations.html','Daily Ops','◷'],
    ['statistics','/admin-analytics.html','Statistics','▥'],
    ['it','/admin-runtime-health.html','I.T.','⚙'],
    ['status','/admin-system-health.html','System Status','◉']
  ];
  const nav=document.createElement('nav');
  nav.className='rd-command-rail';
  nav.setAttribute('aria-label','Rosie Dazzlers command workspaces');
  const title=document.createElement('span');
  title.className='rd-command-rail-label';
  title.textContent='Workspaces';
  nav.append(title);
  for(const [id,href,label,glyph] of pages){
    const a=document.createElement('a');
    a.href=href;
    if(id===kind)a.setAttribute('aria-current','page');
    const icon=document.createElement('span');
    icon.className='rd-command-glyph';
    icon.setAttribute('aria-hidden','true');
    icon.textContent=glyph;
    const caption=document.createElement('span');
    caption.textContent=label;
    a.append(icon,caption);
    nav.append(a);
  }
  const note=document.createElement('p');
  note.className='rd-command-note';
  note.textContent='Build 717 command workspaces · Actual staff absence/shift source checks, bounded workload, server signer custody audit and genuine two-device owner review. No simulated statistics or background polling; no automatic messages, consent grants or fictitious approvals.';
  target.prepend(note);
  target.prepend(nav);
  const headings={management:'Management command',workload:'Staff follow-up workload',operations:'Daily operations',statistics:'Statistical overview',
    it:'I.T. diagnostics',status:'System status'};
  const hero=target.querySelector('.admin-topbar>div:first-child,.topbar .titleblock,.health-hero>div:first-child,.hero-grid>div:first-child,.ops-scope');
  if(hero){const eyebrow=document.createElement('span');eyebrow.className='rd-command-eyebrow';
    eyebrow.textContent=`Rosie Dazzlers · ${headings[kind]||'Command workspace'}`;hero.prepend(eyebrow);}
})();
