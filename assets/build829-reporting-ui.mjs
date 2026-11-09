// Private supervisor view of Rosie-to-AI-Data V1 field compatibility only.
import {MODULE_REQUIREMENT_SCOPES_827} from './build827-module-requirements.mjs';
import {REPORTING_SCHEMA_829} from './build829-ai-data-adapter.mjs';

const $=id=>document.getElementById(id);
const names=new Map(MODULE_REQUIREMENT_SCOPES_827.map(x=>[x.moduleId,x.moduleName]));
let report=null,loading=false;
const add=(parent,tag,value)=>{const el=document.createElement(tag);el.textContent=String(value??'UNKNOWN');parent.append(el);return el;};
function render(){
  const tbody=$('build829Rows');tbody.textContent='';
  if(!report){$('build829Count').textContent='Source unavailable. No draft readiness or scoring has been inferred.';return;}
  const search=$('build829Search').value.trim().toLowerCase();
  const filter=$('build829Filter').value;
  const shown=report.scopes.filter(x=>{
    if(filter==='local'&&x.localReviewState==='UNKNOWN')return false;
    if(filter==='due'&&x.localFreshnessAdvisory!=='DRAFT_REVIEW_DUE')return false;
    if(filter==='conflict'&&x.localChainState!=='CONFLICT'&&x.localChainState!=='PARTIAL_RECENT_HISTORY')return false;
    return !search||(names.get(x.moduleId)+' '+x.scopeId+' '+x.requirementDraftId).toLowerCase().includes(search);
  });
  for(const x of shown){
    const tr=document.createElement('tr');const th=add(tr,'th',names.get(x.moduleId));th.scope='row';
    add(th,'small',x.scopeId);add(tr,'td',x.localReviewState+' / '+x.localChainState);
    add(tr,'td',x.localFreshnessAdvisory);
    add(tr,'td',x.readinessState+' / denominator UNKNOWN / percent UNKNOWN');
    add(tr,'td','HOLD: unsigned, unapproved audience, expiry UNKNOWN');
    tbody.append(tr);
  }
  $('build829Count').textContent=shown.length+'/'+report.moduleScopeCount+' source scopes; '+
    report.requirementsDraft+' draft requirements. AI Data signed-event payloads eligible: 0. '+
    'No approved numerator, denominator or consumer permission.';
}
async function refresh(){
  if(loading)return;loading=true;$('build829Refresh').disabled=true;
  $('build829Status').textContent='Checking Rosie-authenticated source compatibility…';
  try{
    const response=await fetch('/api/admin/master_shell_reporting_v829',{
      credentials:'same-origin',cache:'no-store'});
    const data=await response.json().catch(()=>null);
    if(!response.ok||!data?.ok||data.preview?.schema!==REPORTING_SCHEMA_829||
      data.preview.moduleScopeCount!==45||
      data.preview.contractCompatibility?.authorizedForOutbound!==false)
      throw Error('Source preview is not available');
    report=data.preview;
    $('build829Status').textContent='Authenticated local source read only ('+
      report.sourceWindowReturned+'/100 latest rows). AI Data Builds 335/337/338/339 field mapping reviewed; '+
      'consumer grant, original signing and actual evidence approval remain HOLD.';
  }catch{report=null;$('build829Status').textContent='Local source unavailable or access denied. '+
    'Nothing was exported, accepted, scored or published.';}
  finally{loading=false;$('build829Refresh').disabled=false;render();}
}
export function startReporting829(){
  $('build829Search').addEventListener('input',render);
  $('build829Filter').addEventListener('change',render);
  $('build829Refresh').addEventListener('click',refresh);
  render();refresh();
}
