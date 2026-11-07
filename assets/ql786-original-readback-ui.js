/** Build 786: local-only redacted readback comparison, never a connection test. */
import {inspectOriginalReadback786} from './ql786-original-readback.mjs';
const el=id=>document.getElementById(id);
const maximum=32768;
async function parseFile(id){
  const file=el(id)?.files?.[0];
  if(!file||file.size>maximum)throw Error('Select a sanitized JSON file no larger than 32 KB for each source.');
  return JSON.parse(await file.text());
}
el('inspect786')?.addEventListener('click',async()=>{
  const status=el('status786');
  try{
    const [device,source,owners]=await Promise.all([
      parseFile('device786'),parseFile('source786'),parseFile('owners786')]);
    const result=inspectOriginalReadback786({device,source,owners});
    if(status)status.textContent=result.ok?
      'PUBLIC METADATA PARITY ONLY · Original issuer, source enrollment, both owner authorizations and real broker receipts still NOT INDEPENDENTLY VERIFIED. DISCONNECTED / HOLD.':
      'HOLD / DENY · '+result.state+' · No live GET or trusted enrollment verification.';
    if(el('result786'))el('result786').textContent=JSON.stringify(result,null,2);
  }catch{
    if(status)status.textContent='HOLD · Missing, oversized or invalid redacted JSON. No source authorization established.';
    if(el('result786'))el('result786').textContent='No valid sanitized readback trio.';
  }
});
