// Build 827: supervisor-side review of unapproved source requirement drafts.
import {draftRegistry827} from './build827-module-requirements.mjs';

const $=id=>document.getElementById(id);
let registry=draftRegistry827(),historyAvailable=false;
const add=(parent,tag,value)=>{const el=document.createElement(tag);el.textContent=String(value??'—');parent.append(el);return el;};
function render827(){
  const query=$('build827Search').value.trim().toLowerCase();
  const filter=$('build827Filter').value;
  const tbody=$('build827Rows');tbody.textContent='';
  const shown=registry.scopes.filter(x=>{
    const hasReview=!!x.linkedLocalReview;
    return (filter==='all'||(filter==='review'&&hasReview)||(filter==='unknown'&&!hasReview))&&
      (!query||[x.moduleName,x.moduleId,x.requirementId,x.scopeId,x.proposedCriterion,
        x.roleVariant,x.deviceVariant,x.proposedOwnerRole].join(' ').toLowerCase().includes(query));
  });
  for(const row of shown){
    const tr=document.createElement('tr');
    const th=add(tr,'th',row.moduleName);th.scope='row';
    const ids=add(tr,'td',row.requirementId);add(ids,'small', ' / '+row.scopeId);
    add(tr,'td',row.proposedCriterion);
    add(tr,'td',row.proposedOwnerRole+' · '+(row.roleVariant||'role unscoped')+
      ' / '+(row.deviceVariant||'device unscoped'));
    add(tr,'td','Unscoped · weight UNKNOWN · denominator UNKNOWN');
    const source=row.linkedLocalReview;
    add(tr,'td',source?source.evidenceRef+' · local review '+source.eventId.slice(-8)+
      ' · '+source.reviewState+' (operator-reported, NOT independently verified)':
      historyAvailable?'No link in latest 100 records · UNKNOWN':'Private source unavailable · UNKNOWN');
    tbody.append(tr);
  }
  $('build827Count').textContent=shown.length+' / '+registry.scopeDrafts+' module scopes shown · '+
    registry.distinctRequirementDrafts+' deduplicated requirement drafts. '+
    'Approved weight, numerator and denominator: UNKNOWN. No score was calculated.';
}
async function refresh827(){
  const button=$('build827Refresh');button.disabled=true;
  const status=$('build827Status');status.textContent='Reading authorized recent local review references…';
  try{
    const res=await fetch('/api/admin/worksite_field_evidence_v826',{
      credentials:'include',cache:'no-store'});
    const data=await res.json().catch(()=>null);
    if(!res.ok||!data?.ok||data.build!==826||
       data.requirement_registry_draft?.schema!==registry.schema||
       !Array.isArray(data.events))throw Error('Authorized source ledger unavailable.');
    registry=data.requirement_registry_draft;
    historyAvailable=true;
    status.textContent='Authorized local ledger loaded ('+data.events.length+
      ' most recent records at '+data.generated_at+'). Source references are human-reported; '+
      'no owner-approved weight, denominator or independent evidence acceptance is asserted.';
  }catch{
    registry=draftRegistry827();historyAvailable=false;
    status.textContent='Private source ledger unavailable. Registry drafts can be reviewed, '+
      'but evidence references remain UNKNOWN; no failure was counted as a zero.';
  }finally{button.disabled=false;render827();}
}
export function startModuleRegistry827(){
  $('build827Search').addEventListener('input',render827);
  $('build827Filter').addEventListener('change',render827);
  $('build827Refresh').addEventListener('click',refresh827);
  render827();refresh827();
}
