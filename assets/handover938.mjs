const labels=['Driver’s footwell','Seat bolster','Cargo area'];
const choices={viewPhotos:'Show the private photos in this booking report',maintenance:'Request a maintenance follow-up',reminders:'Allow maintenance reminders',promotionContact:'Allow Rosie Dazzlers to contact me about possible public use of photos'};
const el=(tag,text)=>Object.assign(document.createElement(tag),{textContent:text||''});
function field(parent,label,control) {
  const wrap=el('label',label+' '); wrap.append(control); parent.append(wrap); return control;
}
function select(options,current) {
  const control=el('select');
  for(const [value,label] of options) control.add(new Option(label,value));
  control.value=current||''; return control;
}
function button(parent,label,action) {
  const b=el('button',label); b.type='button'; b.className='btn ghost'; parent.append(b);
  b.onclick=async()=>{b.disabled=true;try{await action();}finally{b.disabled=false;}};
}
function panel() {
  const root=document.querySelector('#handover938'), content=el('div');
  root.replaceChildren(el('h2','Private before-and-after handover'),content); return content;
}
export function staffHandover(id,request) {
  const box=panel();
  if(!id) return;
  const call=(action,extra={})=>request('/api/admin/handover938',{method:'POST',body:{booking_id:id,action,...extra}});
  button(box,'Prepare or review handover',async()=>{
    try {
      const data=await call('read'); if(!box.isConnected)return;
      const form=el('div'); box.replaceChildren(form);
      const readers=labels.map((name,i)=>{
        const section=el('fieldset'), old=data.views?.[i]||{};
        section.append(el('legend',name));form.append(section);
        const mode=field(section,'Include this view',select([['pair','Before and after'],['skip','Skip with reason']],old.mode||'pair'));
        const photo=(stage,key)=>field(section,key,select([['','Select an original'],...data.media.filter(m=>stage.includes(m.stage)).map(m=>[m.id,[m.stage,m.caption,new Date(m.created_at).toLocaleString(),m.id.slice(-6)].filter(Boolean).join(' · ')])],old[key.toLowerCase()]));
        const before=photo(['arrival','pre_existing'],'Before'),after=photo(['final'],'After');
        const note=field(section,'Observation or reason for skipping',el('textarea')),care=field(section,'Finish-specific care advice',el('textarea'));
        note.value=old.note||'';care.value=old.care||'';note.maxLength=care.maxLength=400;
        mode.onchange=()=>{before.disabled=after.disabled=care.disabled=mode.value==='skip';};mode.onchange();
        return ()=>({mode:mode.value,before:before.value,after:after.value,note:note.value,care:care.value});
      });
      const message=el('p');message.setAttribute('role','status');form.append(message);
      if(data.choices) for(const [key,label] of Object.entries(choices)) form.append(el('p',label+' — '+(data.choices[key]?'Yes':'No')));
      if(data.views) button(form,'Withdraw private report',async()=>{
        try{await call('withdraw');form.replaceChildren(el('p','Report withdrawn.'));}catch(e){message.textContent=e.message;}
      });
      button(form,'Save for private customer review',async()=>{
        try {await call('save',{views:readers.map(read=>read())});message.textContent='Saved. The customer can review this version from their private progress link.';}
        catch(e){message.textContent=e.message;}
      });
    } catch(e){box.append(el('p',e.message));}
  });
}
export function customerHandover(token) {
  const box=panel();
  const call=async(action,extra={})=>{
    const r=await fetch('/api/progress/handover938',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,token,...extra})});
    const d=await r.json();if(!r.ok)throw Error(d.error||'Could not load handover.');return d;
  };
  function show(d) {
    if(!box.isConnected)return;
    box.replaceChildren();
    if(!d.available){box.append(el('p','A handover has not been prepared yet.'));return;}
    for(const v of d.views||[]){
      const card=el('article');card.append(el('h3',v.view));box.append(card);
      if(v.skipped){card.append(el('p','Skipped — '+v.skipped));continue;}
      for(const key of ['before','after']){
        const fig=el('figure'),img=el('img');img.className='img';img.alt=v.view+' '+key;img.src=v[key].url;
        fig.append(img,el('figcaption',key+' · recorded '+new Date(v[key].recorded_at).toLocaleString()));card.append(fig);
      }
      card.append(el('p',v.note),el('p','Care advice — '+v.care));
    }
    if(d.choices.viewPhotos&&!d.views)box.append(el('p','A photo needs staff review. Please check back.'));
    box.append(el('p','Each choice is optional. Clear a choice and save to withdraw it. Public use requires a separate approval.'));
    const inputs=Object.entries(choices).map(([key,label])=>{
      const c=el('input');c.type='checkbox';c.checked=d.choices[key]===true;field(box,label,c);return [key,c];
    });
    button(box,'Save my choices',async()=>{
      try {show(await call('save',{report:d.report,...Object.fromEntries(inputs.map(([k,c])=>[k,c.checked]))}));box.append(el('p','Choices saved.'));}
      catch(e){box.append(el('p',e.message));}
    });
  }
  button(box,'Review my private handover',async()=>{try{show(await call('read'));}catch(e){box.append(el('p',e.message));}});
}
